# YouTube Metadata - SerpAID: a snakebite first-aid AI agent

Video: demo/serpaid-demo-under3min.mp4 (2560x1440, 2:26, H.264 + AAC, ambient bed)
Long cut: demo/serpaid-demo.mp4 (3:52, 4 languages) - extended version, optional
S3: s3://sarvars-youtube-videos/serpaid/
Current upload: https://youtu.be/fnZB7-OdAuw
House rule: no em dashes.

---

## TITLE (pick one; A is the primary)

A. SerpAID: an AI Agent That Saves a Life in the First 60 Seconds of a Snakebite
B. I Built a WHO-Grounded Snakebite Agent Where the Model Never Decides the Dangerous Part
C. Snakebite First Aid in Any Language: a Strands + Amazon Nova AI Agent

---

## DESCRIPTION (copy-paste)

```
A snake kills someone every five minutes, and most of those deaths are preventable. They
come from harmful first aid and delay, not the venom alone: a tight tourniquet, a cut, a
suction, a detour to a healer. I built SerpAID, an AI agent that reads one panicked message
from the person beside the victim and coaches them through the correct WHO first aid, in
their own language, in those first decisive minutes. It catches the fatal myths, escalates
the real danger signs, and ends every reply with one instruction: reach antivenom now.

The key idea: the language model never decides anything medical. A tested, deterministic WHO
protocol engine owns every instruction, so SerpAID can never recommend a tourniquet, a cut,
suction, or ice. Amazon Nova only understands the message, phrases the plan, and translates
it. Grounding is the safety mechanism, not a feature.

Architecture: a Strands multi-agent graph (intake, protocol, communicator) on Amazon Nova,
with Amazon Translate for mother-tongue text and Amazon Location Service for nearest care,
deployed on Amazon Bedrock AgentCore Runtime for a live endpoint. Amazon Polly gives each
answer a live spoken voice in the caller's own language, shown here across Hindi, Spanish,
French, and Portuguese.

Why it matters: WHO estimates 5.4 million snakebites a year and up to 137,880 deaths, mostly
farmers and children in poor rural communities. WHO lists it as a highest-priority Neglected
Tropical Disease. Those deaths are preventable, and a calm, correct voice in the first sixty
seconds can be the difference.

Chapters:
0:00 The first sixty seconds
0:03 The code, open source on GitHub
0:19 Use case 1: tourniquet myth, answered in Hindi
1:27 Use case 2: suction and trouble breathing, answered in Spanish
2:12 Reach antivenom now

What makes it safe:
- A deterministic WHO protocol engine decides every medical step, proven by 22 passing tests.
- A tested invariant: the advice can never contain a tourniquet, a cut, suction, or ice.
- Every danger sign escalates to an emergency; every path ends in reaching a hospital.

Code, the exact prompts, and the WHO protocol engine (MIT, open source):
https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent

Live site: https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/

Built for the Strands SDK: Workshop to Ship hackathon. Focus area: Health.

Important: SerpAID gives first-aid guidance grounded in the WHO protocol. It does not diagnose
the snake, does not identify venom type, and does not replace a hospital. Every path ends in
reaching a facility with antivenom now.

Music: original ambient bed (no copyright).

---

🔗 Connect with me:
🌐 Portfolio: https://sarvarnadaf.com
💼 LinkedIn: https://www.linkedin.com/in/sarvar04/
✍️ Dev.to: https://dev.to/sarvar_04
💻 GitHub: https://github.com/simplynadaf
📧 Email: simplynadaf@gmail.com
☁️ AWS Builder Center: https://builder.aws.com/community/@sarvar
🐦 X (Twitter): https://x.com/SarvarN_04
📺 YouTube: https://www.youtube.com/@sarvar-nadaf

---

👨💻 About Me:
Cloud Architect at a Big 4 consulting firm | 10+ years in Cloud & DevOps | 7x AWS Certified | 200+ technical articles

---

🔔 Subscribe for more on AWS architecture, DevOps, and AI Infrastructure.

#AWS #AIAgents #StrandsAgents #AmazonNova #Bedrock #AgentCore #AmazonPolly #AmazonTranslate #Snakebite #AIforGood
```

---

## TAGS (YouTube keyword box)
strands agents, strands agents sdk, amazon nova, amazon nova pro, aws bedrock, bedrock agentcore,
amazon polly, amazon translate, amazon location service, aws ai, ai agent, ai agents, agentic ai,
multi agent, snakebite, snakebite first aid, antivenom, neglected tropical disease, who protocol,
first aid, health tech, ai for good, social good, python, open source, generative ai, aws hackathon,
workshop to ship, serpaid, voice ai, multilingual ai, grounded ai

## PLAYLIST
AWS AI Agents | Demos & Builds

## PINNED COMMENT (optional)
The language model never decides the dangerous part. A tested, deterministic WHO engine owns
every instruction, so SerpAID can never tell you to tie a tourniquet, cut, or suck the venom.
It only phrases and translates. Code + the exact engine are in the description. Not medical
advice; always reach a hospital with antivenom.

## THUMBNAIL
Idea (anime style, 1280x720): a rescuer holding a glowing phone over a snakebite victim at
dusk, teal AI glow; bold text "60 SECONDS / TO SAVE A LIFE", small pill "AI in YOUR language".
Full prompt in chat history. Keep text under ~5 words, high contrast, mobile-first.

## UPLOAD-DAY CHECKLIST
- [ ] Use the UNDER-3-MINUTE cut (serpaid-demo-under3min.mp4, 2:26) for the hackathon submission.
- [ ] Title A, description pasted, tags added.
- [ ] Chapter timestamps checked against the final cut (first is 0:00, each >= 10s apart).
- [ ] Thumbnail uploaded.
- [ ] Added to the playlist.
- [ ] Link pasted into the Builder Center project + post.
