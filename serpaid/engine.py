"""
SerpAID deterministic protocol engine.

This module is the safety core of SerpAID. It contains no language model and no
network calls. Every decision here is a plain, testable rule grounded in the WHO
snakebite first-aid protocol stored in data/protocol.json.

Design principle borrowed from the hackathon winning pattern: the model never
decides anything dangerous. The engine decides. The model only phrases what the
engine returns, in the user's language.

Invariants enforced by tests in tests/:
  1. The engine never recommends a tourniquet, cutting, suction, ice, or a
     traditional healer. These only ever appear as corrections.
  2. Any critical danger sign escalates the situation to EMERGENCY.
  3. Every pathway returns a transport-to-hospital instruction.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

_DATA_PATH = Path(__file__).parent / "data" / "protocol.json"

# Actions the engine must never emit as advice. Used by a guardrail test.
FORBIDDEN_ACTIONS = ("tourniquet", "cut the wound", "suck the venom", "apply ice", "traditional healer")


def _load_protocol() -> dict[str, Any]:
    with open(_DATA_PATH, encoding="utf-8") as handle:
        return json.load(handle)


PROTOCOL: dict[str, Any] = _load_protocol()


@dataclass
class Severity:
    """Result of grading the situation. EMERGENCY means do not wait."""

    level: str  # "emergency" | "urgent"
    matched_signs: list[str] = field(default_factory=list)
    reason: str = ""


@dataclass
class MythCheck:
    """Result of scanning the user's words for a harmful intended action."""

    detected: bool
    myth_id: str | None = None
    myth: str | None = None
    correction: str | None = None
    source: str | None = None


def grade_severity(reported_signs: list[str]) -> Severity:
    """Grade the situation from a list of danger-sign ids the user reports.

    Rule: every snakebite is treated as potentially venomous and always needs a
    hospital (WHO). If any critical sign is present, we escalate to EMERGENCY.
    Otherwise it is URGENT, which still means reach care now.
    """
    sign_lookup = {s["id"]: s for s in PROTOCOL["danger_signs"]}
    matched = [s for s in reported_signs if s in sign_lookup]
    critical = [s for s in matched if sign_lookup[s].get("critical")]

    if critical:
        labels = ", ".join(sign_lookup[s]["label"] for s in critical)
        return Severity(level="emergency", matched_signs=matched,
                        reason=f"Critical danger sign present: {labels}")
    if matched:
        labels = ", ".join(sign_lookup[s]["label"] for s in matched)
        return Severity(level="urgent", matched_signs=matched,
                        reason=f"Danger sign present: {labels}")
    return Severity(level="urgent", matched_signs=[],
                    reason="No danger sign reported yet, but envenoming can be delayed. Treat as urgent.")


def detect_myth(user_text: str) -> MythCheck:
    """Scan free text for a harmful action the user is about to take.

    Deterministic keyword match against the WHO myth table. Returns the first
    matching myth with its grounded correction. No model involved.
    """
    if not user_text:
        return MythCheck(detected=False)
    text = user_text.lower()
    for myth in PROTOCOL["myths"]:
        for trigger in myth["triggers"]:
            # word-boundary-ish match so "cut" does not fire inside "cute"
            if re.search(r"(?<![a-z])" + re.escape(trigger.lower()) + r"(?![a-z])", text):
                return MythCheck(
                    detected=True,
                    myth_id=myth["id"],
                    myth=myth["myth"],
                    correction=myth["correction"],
                    source=myth["source"],
                )
    return MythCheck(detected=False)


def first_aid_steps() -> list[dict[str, Any]]:
    """Return the ordered WHO do-steps. Always identical, always from the data file."""
    return sorted(PROTOCOL["do_steps"], key=lambda s: s["order"])


def emergency_number(region_code: str | None) -> str:
    table = PROTOCOL["emergency_numbers_by_region"]
    if region_code and region_code.upper() in table:
        return table[region_code.upper()]
    return table["default"]


def build_plan(reported_signs: list[str] | None, user_text: str, region_code: str | None) -> dict[str, Any]:
    """Assemble the full deterministic first-aid plan.

    This is the single source of truth the agents translate and speak. It never
    contains a forbidden action as advice, and it always ends in transport.
    """
    reported_signs = reported_signs or []
    severity = grade_severity(reported_signs)
    myth = detect_myth(user_text)

    plan = {
        "severity": severity.level,
        "severity_reason": severity.reason,
        "steps": first_aid_steps(),
        "myth_correction": None,
        "emergency_number": emergency_number(region_code),
        "closing": (
            "Reach a health facility that stocks antivenom now. Antivenom is the "
            "only real treatment and it works. Do not wait to see if symptoms appear."
        ),
        "disclaimer": PROTOCOL["_disclaimer"],
    }
    if myth.detected:
        plan["myth_correction"] = {
            "myth": myth.myth,
            "correction": myth.correction,
            "source": myth.source,
        }

    _assert_safe(plan)
    return plan


def _assert_safe(plan: dict[str, Any]) -> None:
    """Runtime guardrail: no forbidden action may appear in advice text.

    Myth corrections are allowed to mention forbidden actions because they tell
    the user NOT to do them. We only scan the do-steps and the closing.
    """
    advice_blob = " ".join(s["detail"].lower() for s in plan["steps"]) + " " + plan["closing"].lower()
    banned = ("apply a tourniquet", "tie a tourniquet", "cut the wound open", "suck the venom", "pack the bite in ice")
    for phrase in banned:
        if phrase in advice_blob:
            raise AssertionError(f"Guardrail violation: advice contained forbidden action '{phrase}'")
