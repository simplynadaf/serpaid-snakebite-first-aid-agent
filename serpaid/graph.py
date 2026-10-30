"""
SerpAID multi-agent graph.

Architecture: a deterministic Strands Graph with three specialist agents wired in
a fixed order so the demo is reproducible and judge-legible.

    intake  ->  protocol  ->  communicator

  intake        understands the panicked message: language, country, what was
                bitten and when, reported symptoms, and what the caller is about
                to do. It calls check_myth early so a dangerous action is caught
                immediately.
  protocol      calls assess_snakebite. This is where the deterministic engine
                decides severity, the WHO do-steps, and any myth correction. The
                model adds nothing medical of its own.
  communicator  turns the structured plan into a calm, short, spoken-style
                message and translates it into the caller's language. It always
                ends with the emergency number and reach antivenom now.

The model is Amazon Nova. Sponsored AWS credits cover Nova, not Claude.
"""

from __future__ import annotations

from strands import Agent
from strands.models import BedrockModel
from strands.multiagent import GraphBuilder

from .tools import assess_snakebite, check_myth, find_nearest_care, translate_message

MODEL_ID = "amazon.nova-pro-v1:0"

_SHARED_RULES = (
    "You are part of SerpAID, a snakebite first-aid assistant grounded strictly in "
    "the World Health Organization snakebite protocol. Absolute rules you must never "
    "break: 1) Never invent a medical instruction. Only relay what the assess_snakebite "
    "tool returns. 2) Never tell anyone to apply a tourniquet, cut the wound, suck the "
    "venom, apply ice, give alcohol, chase the snake, or visit a traditional healer. "
    "3) You do not diagnose the snake or the venom type. 4) Every reply must end by "
    "telling the person to reach a health facility with antivenom now and give the "
    "emergency number. Keep language calm, simple, and short. Lives depend on clarity."
)


def _model() -> BedrockModel:
    return BedrockModel(model_id=MODEL_ID, region_name="us-east-1")


def build_intake_agent() -> Agent:
    return Agent(
        name="intake",
        model=_model(),
        tools=[check_myth],
        system_prompt=(
            _SHARED_RULES
            + " Your job is intake. From the caller's message, extract: the two-letter "
            "country code, the Amazon Translate language code they wrote in, any danger "
            "signs they describe, and exactly what they are doing or about to do. If they "
            "mention a harmful action, call check_myth right away. Summarize these facts "
            "clearly for the next agent. Do not give the full first-aid plan yourself."
        ),
    )


def build_protocol_agent() -> Agent:
    return Agent(
        name="protocol",
        model=_model(),
        tools=[assess_snakebite, find_nearest_care],
        system_prompt=(
            _SHARED_RULES
            + " Your job is to call assess_snakebite with the reported danger signs, the "
            "caller's words, and the country code, then pass the returned plan onward "
            "unchanged in meaning. The plan from the tool is the single source of truth. "
            "Do not add or remove medical steps."
        ),
    )


def build_communicator_agent() -> Agent:
    return Agent(
        name="communicator",
        model=_model(),
        tools=[translate_message],
        system_prompt=(
            _SHARED_RULES
            + " Your job is to deliver the plan to a frightened person. Write it as a calm, "
            "numbered, spoken-style set of short lines: first any myth correction if present, "
            "then the ordered do-steps, then the danger signs to watch, then the emergency "
            "number and reach antivenom now. Then call translate_message to render the whole "
            "message in the caller's language code and present both."
        ),
    )


def build_graph():
    """Build and return the deterministic SerpAID graph: intake -> protocol -> communicator."""
    builder = GraphBuilder()
    builder.add_node(build_intake_agent(), "intake")
    builder.add_node(build_protocol_agent(), "protocol")
    builder.add_node(build_communicator_agent(), "communicator")
    builder.add_edge("intake", "protocol")
    builder.add_edge("protocol", "communicator")
    builder.set_entry_point("intake")
    # Bound execution: a safety harness should never loop unbounded in an emergency.
    try:
        builder.set_max_node_executions(6)
        builder.set_execution_timeout(90)
    except Exception:
        pass
    return builder.build()


if __name__ == "__main__":
    graph = build_graph()
    sample = (
        "Please help, my cousin was just bitten by a snake on the ankle in a field near "
        "Pune, India. He is scared. Should I tie a tight cloth above the bite and take him "
        "to the village healer? He says his eyelids feel heavy. Reply in Marathi, code mr."
    )
    result = graph(sample)
    print(result)
