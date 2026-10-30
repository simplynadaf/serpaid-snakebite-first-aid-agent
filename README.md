# SerpAID

**A WHO-grounded, multilingual snakebite first-aid agent built with the Strands Agents SDK and Amazon Nova.**

> In a snakebite, the first sixty seconds decide who lives. SerpAID coaches the frightened person standing over the victim through exactly the right actions, in their own language, before the ambulance ever arrives.

Submission for the **Strands SDK: Workshop to Ship** hackathon. Focus area: **Health**.

---

## The problem

The World Health Organization estimates **5.4 million** snakebites a year, with **81,410 to 137,880 deaths** and about three times as many amputations and permanent disabilities. The victims are overwhelmingly **farmers and children in poor rural communities** across Africa, Asia, and Latin America. WHO lists snakebite envenoming as a highest-priority Neglected Tropical Disease with a roadmap goal to halve deaths and disability by 2030.

The venom is only half the danger. The other half is **what frightened people do in the first minutes**: a tight tourniquet, cutting the wound, sucking the venom, or a detour to a traditional healer. Every one of those wastes the time that antivenom needs, and some cause the amputation directly. The deaths are, in large part, **behavioral and preventable**.

## What SerpAID does

A bystander sends one panicked message. SerpAID:

1. **Catches the dangerous action immediately** (tourniquet, cut, suction, ice, alcohol, chasing the snake, going to a healer) and corrects it with the WHO reason.
2. **Gives the WHO first-aid steps in order** (keep calm and still, immobilise, remove constrictions, transport by vehicle, watch breathing).
3. **Escalates critical danger signs** (difficulty breathing or swallowing, spreading weakness, uncontrolled bleeding, collapse) to EMERGENCY.
4. **Speaks it in the caller's mother tongue** and ends every path with one instruction: **reach a health facility with antivenom now**.

## Why you can trust it: the model never decides the dangerous part

This is the core design principle, and the safety mechanism.

```
                 what the DETERMINISTIC ENGINE owns          what the MODEL may do
  ----------------------------------------------------   --------------------------------
  which first-aid steps, and their order                 understand a messy, scared message
  whether a symptom is a critical emergency              phrase the plan as calm short lines
  which myth was stated, and the exact correction        translate into the mother tongue
  the guarantee: never outputs tourniquet / cut /        never adds or invents a medical step
    suck / ice as advice (enforced by tests)             always ends with reach antivenom now
```

Every medical instruction comes from `serpaid/data/protocol.json`, which reproduces WHO snakebite first-aid guidance, through the tested rule engine in `serpaid/engine.py`. Amazon Nova only phrases and translates. A runtime guardrail and a test invariant both assert that no forbidden action can ever appear as advice.

## Architecture

A deterministic Strands multi-agent **Graph** (fixed order, reproducible):

```
intake  ->  protocol  ->  communicator

intake        extracts country, language, danger signs, and the rescuer's intended action
              (calls check_myth early)
protocol      calls assess_snakebite -> the deterministic WHO engine decides everything
communicator  phrases the plan calmly and calls translate_message (Amazon Translate)
```

**AWS services:** Amazon Nova Pro (reasoning and language) · Amazon Translate (mother-tongue output) · Amazon Polly (spoken guidance in the demo) · Amazon Location Service (nearest care, with graceful fallback) · Amazon Bedrock AgentCore Runtime (live serverless deployment).

## Measurable result

From the test suite: SerpAID delivers WHO-grounded first aid, rebuts eight documented fatal myths, escalates every critical danger sign to EMERGENCY, and across the full test matrix recommends **zero harmful actions** (no tourniquet, cut, suction, or ice ever appears as advice).

## Run it

```bash
python3.11 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
pip install pytest

# prove the safety core (no AWS needed)
python -m pytest tests/ -q

# run the full multilingual agent (needs AWS creds + Bedrock Nova access)
python -m serpaid.graph
```

Deploy to a live AgentCore endpoint:

```bash
python deploy.py   # prints the agent ARN
```

## Repository layout

```
serpaid-snakebite-first-aid-agent/
├── serpaid/
│   ├── data/protocol.json   WHO-grounded do-steps, danger signs, myths, emergency numbers
│   ├── engine.py            deterministic rule engine (no model, fully tested)
│   ├── tools.py             Strands tools: assess, myth-check, translate, locate
│   └── graph.py             the intake -> protocol -> communicator graph on Nova
├── api.py                   AgentCore entrypoint
├── deploy.py                AgentCore launch
├── tests/test_engine.py     safety invariants incl. zero-harmful-action
├── web/                     the ultra-premium 3D landing page (Three.js)
├── demo/                    narration script, final video, screenshots
├── scripts/                 audio generation, screenshot, recording
├── requirements.txt
└── LICENSE                  MIT
```

## Important

SerpAID gives **first-aid guidance** grounded in the WHO snakebite protocol. It does **not** diagnose the snake, does **not** identify venom type, and does **not** replace a hospital. Every pathway ends in one instruction: reach a health facility that stocks antivenom now.

## Grounding sources

World Health Organization snakebite envenoming fact sheet and guidance; WHO SEARO snakebite first-aid webinar materials (July 2025); WHO Control of Neglected Tropical Diseases snakebite treatment page; ANZCOR First Aid Guideline 9.4.1.

## License

MIT. See `LICENSE`.
