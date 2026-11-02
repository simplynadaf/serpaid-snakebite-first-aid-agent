# SerpAID Builder Center submission (copy-paste each field)

Everything below maps one-to-one to the Builder Center form fields. No em dashes anywhere.

Shared links to paste where asked:
- GitHub repository: https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent
- Endpoint or live demo: https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/
- Live agent runtime (Bedrock AgentCore ARN): arn:aws:bedrock-agentcore:us-east-1:175662053988:runtime/serpaid-G2FMzKGEoy
- Video: (your public YouTube or Vimeo link once uploaded)
- Cover image: demo/builder-cover.png (1200x675, under 2 MB)

===============================================================================
PART 1 : CREATE A PROJECT
===============================================================================

------------------------------------------------------------------- TITLE
(max 255 chars. Keyword-front-loaded for search. Paste one.)

SerpAID: a WHO-grounded snakebite first-aid AI agent built with Strands SDK and Amazon Nova

Alternate:
SerpAID: the sixty seconds that save a life, a snakebite first-aid agent on Strands SDK and Amazon Nova

------------------------------------------------------------------- DESCRIPTION
(max 512 chars. One or two sentences, does not repeat the title.)

Every five minutes a snake kills someone, and most of those deaths come from harmful first aid and delay, not the venom. SerpAID is a multilingual AI agent that coaches the person beside the victim through the correct WHO first aid, catching fatal myths like the tourniquet and answering in the caller's own language. A deterministic engine owns every medical decision so the model can never advise something dangerous.

------------------------------------------------------------------- BODY (Markdown)
(Paste everything between the lines below.)

-------------------------------------------------------------------
## It stopped being a statistic the day it was my cousin

When a snake bit my cousin, nobody around us knew what to do. People who loved him shouted to tie a cloth tight and rush him to a local healer. We spent the minutes that mattered most on exactly the things that make it worse. He was lucky. Tens of thousands of people every year are not.

That day taught me something the data later confirmed. In a snakebite, the venom is only half the danger. The other half is what frightened people do in the first minutes.

---

## The problem, in numbers

The World Health Organization estimates 5.4 million snakebites a year, with 81,410 to 137,880 deaths and about three times as many amputations and permanent disabilities. The victims are overwhelmingly farmers and children in poor rural communities across Africa, Asia, and Latin America. WHO lists snakebite envenoming as a highest-priority Neglected Tropical Disease with a goal to halve deaths and disability by 2030.

Antivenom works. What kills people is delay and harmful folklore in the first minutes: a tight tourniquet, cutting the wound, sucking the venom, packing it in ice, a detour to a traditional healer. Those are preventable, and that is the opening for an agent.

---

## What SerpAID does

A bystander sends one panicked message. SerpAID reads it and, in a single pass, catches any dangerous action and corrects it with the WHO reason, gives the WHO first-aid steps in order, escalates critical danger signs to an emergency, and delivers all of it in the caller's mother tongue, ending with the local ambulance number and one instruction: reach antivenom now.

Real use cases it handles:
- A boy bitten while sleeping, with a relative sucking the venom out. SerpAID stops the suction, flags the swallowing trouble as a neurotoxic emergency, and answers in Telugu.
- A farm worker hours from a clinic, bite packed in ice while the family waits. SerpAID ends the wait, says remove the ice and move now, and answers in Portuguese.
- A pregnant woman bitten near a river, the wound still bleeding. No myth to correct, but SerpAID keeps the family calm and treats it as the emergency it is, in Bengali.

---

## The key decision: the model never decides the dangerous part

Every medical instruction lives in a WHO protocol file and flows through a deterministic Python rule engine. That engine decides which steps to give, whether a symptom is a critical emergency, and which myth the rescuer stated. It carries a guarantee, proven by tests: it can never output a tourniquet, a cut, suction, or ice as advice. Amazon Nova is only allowed to understand a messy frightened message, phrase the engine's plan as calm short lines, and translate it. It never adds or invents a medical step. Grounding here is not a nice to have. It is the safety mechanism.

---

## How it works

SerpAID is a Strands multi-agent graph with a fixed order, so it behaves the same way every time. An intake agent understands the panic and extracts the country, language, symptoms, and the action the rescuer is about to take. A protocol agent calls the deterministic engine. A communicator agent speaks the plan and translates it with Amazon Translate. The whole thing runs on Amazon Nova and deploys to Amazon Bedrock AgentCore Runtime for a live endpoint. Amazon Polly then gives the translated answer a live spoken voice in the caller's own language, demonstrated across Hindi, Spanish, French, and Portuguese, so it reaches someone who cannot read.

Proven safety, from the test suite: SerpAID rebuts eight documented fatal myths, escalates every critical danger sign to an emergency, treats every bite as potentially venomous, and across the full test matrix recommends zero harmful actions.

---

## Built with

Strands Agents SDK, a three-node multi-agent graph. Amazon Nova Pro for reasoning and language. Amazon Translate for mother-tongue output. Amazon Polly for spoken guidance. Amazon Location Service for nearest care, with a graceful fallback. Amazon Bedrock AgentCore Runtime for live serverless hosting with observability. Open source under the MIT license.

---

## What I would improve next

Myth detection is keyword based and runs on English today; translating the input before the scan is the next step. First aid is a safe universal step set; region-specific technique is a planned extension. Nearest care is a safe fallback to the local emergency number, not live routing, because no clean global antivenom-facility dataset exists. And the real proof is a field pilot measuring time from bite to antivenom.

---

## Honest limits

SerpAID gives first-aid guidance grounded in the WHO protocol. It does not diagnose the snake, does not identify venom type, and does not replace a hospital. Every path it gives ends in reaching a facility with antivenom now. For a neglected disease that kills the world's poorest, a calm and correct voice in the first sixty seconds can be the difference between a scare and a funeral.

Repo: https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent
Live site: https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/
-------------------------------------------------------------------

------------------------------------------------------------------- COVER IMAGE
Upload: demo/builder-cover.png  (1200 x 675, 724 KB, minimal text as AWS recommends)

------------------------------------------------------------------- TAGS
(5 maximum. Paste these.)

strands-agents
amazon-nova
agentcore
social-good
health

------------------------------------------------------------------- GITHUB OR GITLAB REPOSITORY
https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent

------------------------------------------------------------------- ENDPOINT OR LIVE DEMO
https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/

------------------------------------------------------------------- JUPYTER OR SAGEMAKER NOTEBOOK
(leave blank, this project has no notebook)

===============================================================================
PART 2 : CREATE A POST  (Post to: the Strands hackathon space)
===============================================================================

------------------------------------------------------------------- TITLE
(max 150 chars. Paste one.)

SerpAID: a WHO-grounded snakebite first-aid agent that coaches you in your own language, built on Strands and Nova

Alternate (shorter):
I built SerpAID, a snakebite first-aid agent where the model never decides anything dangerous

------------------------------------------------------------------- BODY (Markdown)
(Paste everything between the lines below.)

-------------------------------------------------------------------
A snake kills someone every five minutes, and most of those deaths are preventable. They come from harmful first aid and delay, not the venom alone.

I built **SerpAID** for the Strands SDK: Workshop to Ship hackathon. It reads a panicked message from the person beside the victim and coaches them through the correct WHO first aid, in their own language, in the first decisive minutes. It catches fatal myths like the tourniquet, the cut, and the suction, and ends every reply with one instruction: reach antivenom now.

The part I care about most: **the language model never decides anything medical.** A tested, deterministic engine owns every instruction and can never recommend a tourniquet, a cut, or suction. Amazon Nova only phrases the plan and translates it. Grounding is the safety mechanism, not a feature.

It is a Strands multi-agent graph (intake, protocol, communicator) on Amazon Nova, with Amazon Translate and Polly for multilingual spoken guidance, deployed live on Bedrock AgentCore. Open source under MIT.

This one is personal. A snake bit my cousin and nobody around us knew what to do. SerpAID is the calm, correct voice I wish we had that day.

- Repo: https://github.com/simplynadaf/serpaid-snakebite-first-aid-agent
- Live site: https://simplynadaf.github.io/serpaid-snakebite-first-aid-agent/
- Demo video: (your public link)

I would love feedback, especially on the line between what the model decides and what deterministic code decides in a safety agent.
-------------------------------------------------------------------

===============================================================================
NOTES
- Complete the free Strands workshop in-window first (mandatory to qualify).
- Upload the video to a public host (YouTube or Vimeo) and drop the link into both
  the project body and the post body where marked.
- The post space shown ("Weekend Challenge: Map it") in your screenshot is a different
  challenge. Post to the Strands SDK: Workshop to Ship space for this submission.
===============================================================================
