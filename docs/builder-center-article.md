# SerpAID: the sixty seconds that save a life after a snakebite

*My submission for the Strands SDK: Workshop to Ship hackathon. Focus area: Health.*

## It stopped being a statistic the day it was my cousin

When a snake bit my cousin, nobody around us knew what to do. People who loved him shouted to tie a cloth tight above the bite, and to rush him to a local healer. We spent the minutes that mattered most on exactly the things that make it worse. He was lucky. Tens of thousands of people every year are not.

That day taught me something the data later confirmed. In a snakebite, the venom is only half the danger. The other half is what frightened people do in the first minutes.

## The problem, in numbers

The World Health Organization estimates **5.4 million** snakebites every year, with **81,410 to 137,880 deaths** and about three times as many amputations and permanent disabilities. The victims are overwhelmingly farmers and children in poor rural communities across Africa, Asia, and Latin America. Children often suffer faster and worse because of their smaller body mass. WHO classifies snakebite envenoming as a highest-priority Neglected Tropical Disease, with a roadmap goal to halve death and disability by 2030.

Highly effective treatment exists: antivenom. The tragedy is that so many deaths are driven by delay and by harmful first aid, not by a lack of medicine. A tight tourniquet can cost the limb. Cutting and suction do nothing useful and add injury. A detour to a traditional healer burns the hours antivenom needs. These are preventable, and that is the opening for an agent.

## What I built

SerpAID is an AI agent that coaches the person standing over the victim through exactly the right actions, in their own language, in those first decisive minutes. A bystander sends one panicked message. SerpAID catches any dangerous action immediately and corrects it, gives the WHO first-aid steps in order, escalates critical danger signs to an emergency, and delivers all of it in the caller's mother tongue, ending with the local ambulance number and one instruction: reach antivenom now.

## The key decision: the model never decides the dangerous part

The lesson I kept reading from past winners is that the strongest agents do not let the language model do everything. SerpAID takes that seriously. Every medical instruction lives in a WHO protocol data file and flows through a deterministic Python rule engine. That engine decides which steps to give, whether a symptom is a critical emergency, and which myth the rescuer stated. It carries a guarantee, proven by tests: it can never output a tourniquet, a cut, suction, or ice as advice. Amazon Nova is only allowed to understand a messy frightened message, phrase the engine's plan as calm short lines, and translate it. It never adds or invents a medical step.

Grounding here is not a nice-to-have. It is the safety mechanism.

## How it works

SerpAID is a Strands multi-agent graph with a fixed order, so it behaves the same way every time. An intake agent understands the panic and extracts the country, language, symptoms, and the action the rescuer is about to take. A protocol agent calls the deterministic engine. A communicator agent speaks the plan and translates it with Amazon Translate. The whole thing runs on Amazon Nova, deploys to Amazon Bedrock AgentCore Runtime for a live endpoint, and uses Amazon Polly to speak the guidance aloud for someone who cannot read.

The project site carries an interactive Live demo of exactly this: you type a panicked message or pick an example, SerpAID catches the dangerous action and answers in the caller's language, and Amazon Polly speaks the response aloud, demonstrated across Hindi, Spanish, French, and Portuguese. Run the repo locally and the same panel calls the live agent for real.

## A real exchange

A caller writes: a snake bit my cousin on the ankle near Pune, should I tie a tight cloth and take him to the village healer, his eyelids feel heavy. SerpAID instantly flags the tourniquet and the healer as dangerous and explains why. It gives the five WHO steps in order. It treats the drooping eyelids as a neurotoxic emergency. Then it delivers the entire message in Marathi, spoken by Polly, ending with 108.

## What I would improve next

I want to be honest about where the current build stops, because naming the limits is part of building something trustworthy in health.

**Myth detection is keyword based and runs on English.** The deterministic engine catches a harmful action by matching WHO myth triggers in the caller's words. That is fast and transparent, but a caller who writes the same intent in Hindi or Marathi may not trigger it yet. The fix is to translate the incoming message to English before the myth scan, so the safety net works regardless of input language. I would add that next.

**First aid is currently one universal step set.** The correct pre-hospital technique can differ by snake family, for example pressure immobilisation for some neurotoxic elapid bites versus not for tissue-destroying viper bites. SerpAID gives the safe, universal WHO core today. I would extend the engine to branch on region and reported effects, grounded in the regional annexes of the WHO guidance, without ever letting the model make that call.

**Nearest care is a safe fallback, not live routing.** There is no clean global dataset of which facilities actually stock antivenom, so the locate tool returns the correct local emergency number and asks the caller to request the nearest hospital with antivenom. I would build a curated, country-level directory of antivenom-stocking facilities so the routing becomes exact.

**And the measurement that matters.** The agent's safety today is proven by a test suite. The real proof is a field pilot with a community health program measuring the one number that decides outcomes: time from bite to antivenom. That is the metric I would instrument next.

## Honest limits

SerpAID gives first-aid guidance grounded in the WHO protocol. It does not diagnose the snake, does not identify venom type, and does not replace a hospital. Every path it gives ends in reaching a facility with antivenom now. For a neglected disease that kills the world's poorest, a calm and correct voice in the first sixty seconds can be the difference between a scare and a funeral.

Code is open source under the MIT License. Built with the Strands Agents SDK, Amazon Nova, Amazon Translate, Amazon Polly, Amazon Location Service, and Amazon Bedrock AgentCore.
