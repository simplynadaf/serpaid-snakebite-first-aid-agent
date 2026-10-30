# SerpAID submission kit

Everything you need to paste when you submit. No em dashes anywhere.

---

## 1. Article title (pick one)

Primary:
> SerpAID: the sixty seconds that save a life after a snakebite (Strands SDK: Workshop to Ship)

Alternates:
> I built a WHO-grounded snakebite first-aid agent so the model never decides the dangerous part (Strands SDK: Workshop to Ship)
> SerpAID: a Strands multi-agent that coaches a bystander through a snakebite, in their own language (Strands SDK: Workshop to Ship)

The article body is ready in `docs/builder-center-article.md`. Paste it as is.

---

## 2. Links to include in the article

- Public repo: https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent
- Live site: https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/
- Public video: (your YouTube or Vimeo link once uploaded)
- Live demo endpoint: (AgentCore agent ARN or invoke URL once you run deploy.py)

---

## 3. YouTube video title (pick one)

> SerpAID: an AI agent that saves lives in the first 60 seconds of a snakebite
> SerpAID: WHO-grounded snakebite first aid with Strands Agents SDK and Amazon Nova

## 3b. Builder Center cover image

Upload `demo/builder-cover.png` (1200x675, under 2 MB, minimal text as AWS recommends)
as the article cover on Builder Center. Futuristic dark finish, brand serpent current,
the agent node-ring, and a play marker that reads as a clickable video cover.

## 4. YouTube description (paste as is)

```
SerpAID is a WHO-grounded, multilingual snakebite first-aid agent built with the
Strands Agents SDK and Amazon Nova. In a snakebite, the first minutes decide who
lives. SerpAID coaches the frightened person beside the victim through exactly
the right actions, in their own language, before the ambulance arrives.

The key idea: the language model never decides anything medical. A tested,
deterministic WHO protocol engine owns every instruction, so SerpAID can never
recommend a tourniquet, a cut, suction, or ice. The model only phrases the plan
and translates it.

Why it matters: WHO estimates 5.4 million snakebites a year and up to 137,880
deaths, mostly farmers and children in poor rural communities. Many deaths come
from harmful first aid and delay, not the venom alone. Those deaths are
preventable.

Architecture: a Strands multi-agent graph (intake, protocol, communicator) on
Amazon Nova, with Amazon Translate for mother-tongue output, Amazon Polly for
spoken guidance, Amazon Location Service for nearest care, and Amazon Bedrock
AgentCore Runtime for a live endpoint.

Code (MIT, open source): https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent

Built for the Strands SDK: Workshop to Ship hackathon. Focus area: Health.

Important: SerpAID gives first-aid guidance grounded in the WHO protocol. It does
not diagnose the snake, does not identify venom type, and does not replace a
hospital. Every path ends in reaching a facility with antivenom now.
```

Tags: strands agents, amazon nova, aws bedrock, agentcore, amazon polly, amazon
translate, snakebite, neglected tropical disease, ai agent, social good

---

## 5. Submission checklist

- [ ] Completed the free Strands workshop in-window (Oct 28 to Nov 4). MANDATORY.
- [ ] Repo is public with MIT license visible (done).
- [ ] Video uploaded as a public link, under 3 minutes (file is demo/serpaid-demo.mp4, 2:31).
- [ ] Article published on Builder Center with the hackathon name in the title.
- [ ] Live AgentCore endpoint linked in the article (run deploy.py).
- [ ] Repo link, video link, and live link all pasted into the submission form.
- [ ] Submit before Nov 4, 11:59 PM PST.

---

## 6. Deploy the live endpoint (AgentCore)

```bash
cd ~/serpaid-snakebite-first-aid-agent
. .venv/bin/activate
pip install bedrock-agentcore bedrock-agentcore-starter-toolkit
python deploy.py
```

deploy.py prints the agent ARN on success. Add it to the article and README.
Capturing a short CloudWatch trace of a live invoke is a strong extra signal for
the Technical Execution score.
