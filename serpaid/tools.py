"""
SerpAID Strands tools.

These are the functions the agents are allowed to call. Each one is a thin,
well-documented wrapper. The protocol tools delegate to the deterministic engine
so the model can never bypass the WHO rules. The translate tool uses Amazon
Translate. The locate tool uses Amazon Location Service when a place index is
configured, and otherwise degrades gracefully to the local emergency number.
"""

from __future__ import annotations

from typing import Any

import boto3
from strands import tool

from .engine import build_plan, detect_myth, grade_severity

_REGION = "us-east-1"


@tool
def assess_snakebite(reported_signs: list[str], what_user_is_doing: str, region_code: str) -> dict[str, Any]:
    """Return the deterministic WHO first-aid plan for a snakebite.

    Use this as the single source of truth for every snakebite reply. The plan
    includes the severity level, the ordered WHO do-steps, a correction if the
    user mentioned a harmful action, the local emergency number, and the closing
    instruction to reach antivenom now.

    Args:
        reported_signs: danger-sign ids the caller reports. Valid ids include
            drooping_eyelids, trouble_breathing, trouble_swallowing, limb_weakness,
            persistent_bleeding, severe_swelling, drowsy_collapse, little_urine.
            Pass an empty list if none are reported yet.
        what_user_is_doing: the caller's own words about what they are doing or
            about to do, so harmful actions can be caught and corrected.
        region_code: two-letter country code such as IN, KE, NG, US. Pass an
            empty string if unknown.

    Returns:
        A dict with severity, severity_reason, steps, myth_correction,
        emergency_number, closing, and disclaimer.
    """
    return build_plan(reported_signs, what_user_is_doing, region_code or None)


@tool
def check_myth(user_text: str) -> dict[str, Any]:
    """Check whether the caller is about to do something harmful and return the WHO correction.

    Args:
        user_text: the caller's own words.

    Returns:
        A dict with detected (bool) and, when detected is true, the myth, the
        grounded correction, and the WHO source.
    """
    result = detect_myth(user_text)
    return {
        "detected": result.detected,
        "myth": result.myth,
        "correction": result.correction,
        "source": result.source,
    }


@tool
def translate_message(text: str, target_language_code: str) -> str:
    """Translate guidance into the caller's language using Amazon Translate.

    Args:
        text: the English guidance to translate.
        target_language_code: an Amazon Translate code such as hi, mr, ta, te,
            bn, sw, fr, es, pt. Pass en to return the text unchanged.

    Returns:
        The translated string. On any error the original English text is
        returned so the caller still receives life-saving guidance.
    """
    if not text or target_language_code in ("", "en"):
        return text
    try:
        client = boto3.client("translate", region_name=_REGION)
        resp = client.translate_text(
            Text=text, SourceLanguageCode="en", TargetLanguageCode=target_language_code
        )
        return resp["TranslatedText"]
    except Exception:
        return text


@tool
def find_nearest_care(latitude: float, longitude: float, region_code: str) -> dict[str, Any]:
    """Find the nearest health facility and the local emergency number.

    Uses Amazon Location Service when a place index named serpaid-places exists.
    If location lookup is unavailable, it still returns the correct local
    emergency number so the caller is never left without a way to get help.

    Args:
        latitude: caller latitude, or 0 if unknown.
        longitude: caller longitude, or 0 if unknown.
        region_code: two-letter country code for the emergency number.

    Returns:
        A dict with emergency_number and, when available, nearest_facility.
    """
    from .engine import emergency_number

    result: dict[str, Any] = {"emergency_number": emergency_number(region_code or None)}
    if not latitude and not longitude:
        result["nearest_facility"] = None
        result["note"] = "Location not provided. Call the emergency number and ask for the nearest hospital with antivenom."
        return result
    try:
        client = boto3.client("location", region_name=_REGION)
        resp = client.search_place_index_for_text(
            IndexName="serpaid-places",
            Text="hospital",
            BiasPosition=[longitude, latitude],
            MaxResults=1,
        )
        results = resp.get("Results", [])
        if results:
            place = results[0]["Place"]
            result["nearest_facility"] = {
                "label": place.get("Label"),
                "coordinates": place.get("Geometry", {}).get("Point"),
            }
        else:
            result["nearest_facility"] = None
    except Exception:
        result["nearest_facility"] = None
        result["note"] = "Facility search unavailable. Call the emergency number and ask for the nearest hospital with antivenom."
    return result
