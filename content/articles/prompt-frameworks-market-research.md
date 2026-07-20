---
title: Prompt Frameworks for Market Research: A Starter Guide
slug: prompt-frameworks-market-research
description: Three practical prompt frameworks for market researchers: role-based prompts, reasoning prompts, and structured outputs, with examples to adapt today.
teaser: Three practical patterns with prompts you can adapt today.
datePublished: 2026-07-19
dateModified: 2026-07-19
order: 5
---

The most useful prompt frameworks for market researchers are role-based prompts, chain-of-thought prompts, and structured output prompts. Master these three and you can handle about 90 percent of what research teams actually use AI for. You don't need to learn 20 different frameworks with clever acronyms.

I teach these frameworks in my workshops, and they're the ones participants actually use afterward. Here's the practical version. No theory. Just the patterns that work.

## What's a role-based prompt and when do I use it?

You tell the AI who to be, what context it has, and what you need.

Use this for role playing - seriously. The magic is in the context. "You're a chief marketing officer" is too vague. "You're a chief marketing officer of a global CPG company needing to decide the direction of the next global ad campaign" is much stronger for reviewing your report to find the gaps and weaknesses.

The format: role, context, task, format, constraints. Like this:

> You are a chief marketing officer of a global technology company listening to a recommendation on the messaging for the next global ad campaign that will run as part of the launch of a new service. The goal of the campaign is to increase purchase likelihood of the new service. The meeting is only 30 minutes, and my presentation should only be 10-15 of those minutes, with the rest of the time left for discussion. Identify where in the report the language and recommendations could be tighter, and list questions I could expect the CMO to raise during the meeting.

## What's chain-of-thought prompting?

You ask the AI to show its reasoning before giving the answer. This matters for analysis tasks where the logic matters as much as the conclusion.

Use this for segmentation analysis, competitive positioning, and anything where you need to audit how the AI got to its answer. The prompt structure is simple: present the data or scenario, then say "Think through this step by step" before asking your question.

For example:

> Here are verbatim responses from 50 consumers about why they switched coffee brands. Think through this step by step: first identify the main themes, then group the responses by theme, then identify which themes appear most frequently. After that, tell me the top three reasons for brand switching with example quotes for each.

This catches errors faster because you can see where the reasoning went wrong instead of just seeing a wrong conclusion.

## What's a structured output prompt?

You define exactly what the output should look like. Format, length, section headers, everything.

Use this for reporting, slide outlines, and anything that needs to fit into an existing deliverable format. The more specific you are, the less editing you'll do afterward. In fact, if you have a template or an example of a previous output that fits the structure you need (and that doesn't have business sensitive information), add it into the context for the AI to follow.

Instead of "summarize these findings," try:

> Create a three-slide summary of these research findings. Slide one: key numbers (3-5 statistics, one sentence of context each). Slide two: three strategic implications (one paragraph each). Slide three: two recommended actions with rationale.

## What about the other frameworks?

Most of the acronym-based frameworks (RACE, CARE, and the rest) are repackaged versions of these three patterns. You don't need to memorize them. You need to understand what each element does.

## How do I get better at this?

Keep a prompt journal.

Every time you write a prompt that works well, save it. Note what the task was, what the prompt was, and what made the output good. Every time a prompt fails, save that too and note what went wrong. After a month, you'll have a personal library that's more useful than any generic prompt collection because it's calibrated to your actual work.

Share prompts with your team. The teams that get the most out of AI are the ones where prompt-sharing is part of the culture. Ethan Mollick's work at Wharton on practical AI adoption and prompt craftsmanship is a useful external reference. His One Useful Thing blog is one of the best resources out there for understanding how to actually work with AI, not just read about it.

## Where's a good starting set?

Here are four prompts you can adapt today:

1. For discussion guides: "I'm preparing for focus groups about [topic] with [audience]. The research objective is [objective]. Draft a 90-minute discussion guide with timing, key questions, and suggested probes."
2. For open-end coding: "Here are [number] open-ended responses to the question '[question].' Group these into 5-8 themes. For each theme, provide a label, a one-sentence description, the count of responses in that theme, and two representative quotes. Quotes must be verbatim from what is provided; do not summarize or combine quotes."
3. For report outlines: "Based on these findings [paste summary], create an outline for a 15-slide research report. Include a recommended slide title and 2-3 bullet points for each slide. The audience is [audience] and they care most about [priority]."
4. For survey critique: "Here is a draft survey about [topic] to be fielded with [audience]. Review it for leading questions, double-barreled questions, missing answer options, and logical flow issues. List each problem with the question number and a suggested fix."
