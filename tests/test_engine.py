"""
Tests for the SerpAID deterministic engine.

These prove the safety invariants without calling any model or network. They are
the evidence that SerpAID is safe: the engine can never recommend a harmful
action, it always escalates critical danger signs, and it always ends in
transport to care.
"""

import pytest

from serpaid.engine import (
    FORBIDDEN_ACTIONS,
    build_plan,
    detect_myth,
    emergency_number,
    first_aid_steps,
    grade_severity,
)


# --- Myth detection -------------------------------------------------------

@pytest.mark.parametrize(
    "text,expected_id",
    [
        ("should I tie a tight cloth above the bite", "tourniquet"),
        ("can I cut the wound to drain it", "cut"),
        ("my uncle is trying to suck the venom out", "suck"),
        ("we are taking him to the village healer first", "black_stone"),
        ("put some ice on it right", "ice"),
        ("give him some whisky to calm down", "alcohol"),
        ("let me catch the snake to show the doctor", "catch_snake"),
    ],
)
def test_detect_myth_catches_harmful_actions(text, expected_id):
    result = detect_myth(text)
    assert result.detected is True
    assert result.myth_id == expected_id
    assert result.correction  # a grounded correction is always present
    assert result.source      # and a WHO source


def test_detect_myth_ignores_safe_text():
    result = detect_myth("he was bitten on the ankle and is lying still")
    assert result.detected is False


def test_detect_myth_word_boundary_no_false_positive():
    # "cute" must not trigger the "cut" myth
    assert detect_myth("the dog is cute").detected is False


# --- Severity grading -----------------------------------------------------

def test_critical_sign_escalates_to_emergency():
    sev = grade_severity(["trouble_breathing"])
    assert sev.level == "emergency"
    assert "trouble_breathing" in sev.matched_signs


def test_noncritical_sign_is_urgent():
    sev = grade_severity(["severe_swelling"])
    assert sev.level == "urgent"


def test_no_signs_still_urgent_never_safe():
    # WHO: treat every bite as potentially venomous. We never return "safe".
    sev = grade_severity([])
    assert sev.level in ("urgent", "emergency")
    assert sev.level != "safe"


# --- Do-steps and plan ----------------------------------------------------

def test_first_aid_steps_are_ordered_and_end_in_transport():
    steps = first_aid_steps()
    orders = [s["order"] for s in steps]
    assert orders == sorted(orders)
    ids = [s["id"] for s in steps]
    assert "transport" in ids


def test_plan_always_contains_transport_and_closing():
    plan = build_plan([], "he was bitten", "IN")
    assert any(s["id"] == "transport" for s in plan["steps"])
    assert "antivenom" in plan["closing"].lower()


def test_plan_with_myth_includes_correction():
    plan = build_plan([], "should I tie a tourniquet", "IN")
    assert plan["myth_correction"] is not None
    assert "do not" in plan["myth_correction"]["correction"].lower()


# --- The core safety guarantee -------------------------------------------

@pytest.mark.parametrize(
    "signs,text,region",
    [
        ([], "he was bitten on the leg", "IN"),
        (["trouble_breathing"], "should I tie a tourniquet", "KE"),
        (["persistent_bleeding"], "can I cut it open", "NG"),
        (["severe_swelling"], "putting ice on it", "US"),
        (["limb_weakness", "drowsy_collapse"], "taking him to the healer", "LK"),
    ],
)
def test_engine_never_recommends_a_forbidden_action_as_advice(signs, text, region):
    """The single most important test: advice text never tells you to harm the patient."""
    plan = build_plan(signs, text, region)
    advice = " ".join(s["detail"].lower() for s in plan["steps"]) + " " + plan["closing"].lower()
    banned_phrases = [
        "apply a tourniquet", "tie a tourniquet", "tie a tight",
        "cut the wound open", "suck the venom", "pack the bite in ice",
        "go to the healer", "go to a traditional healer",
    ]
    for phrase in banned_phrases:
        assert phrase not in advice, f"advice should never contain: {phrase}"


# --- Emergency numbers ----------------------------------------------------

def test_known_region_returns_local_number():
    assert "108" in emergency_number("IN")
    assert emergency_number("US") == "911"


def test_unknown_region_returns_default():
    assert emergency_number("ZZ") == "your local emergency number"
    assert emergency_number(None) == "your local emergency number"
