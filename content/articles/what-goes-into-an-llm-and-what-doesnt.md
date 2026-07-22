---
title: What Goes Into an LLM — and What Doesn't
slug: what-goes-into-an-llm-and-what-doesnt
description: A practical guide to what data enters large language models, how privacy toggles work, what you should never upload, and why enterprise accounts aren't automatically safe.
teaser: Practical data privacy for researchers — toggles, PII, and enterprise gotchas.
datePublished: 2026-07-22
dateModified: 2026-07-22
order: 6
---

I've given the advice before. "Don't put the company name in the prompt. Say 'global CPG brand' instead."

It's good advice. It's also, let's be honest, not very realistic.

Turnaround times keep shrinking. You're juggling three projects at once. Nobody is carefully scrubbing every prompt before it hits the LLM. So let's talk about what actually matters when it comes to data privacy and AI in market research.

## The Setting Most Researchers Miss

Every major LLM platform has a privacy toggle buried in its settings. And by default, it's probably set to the wrong position.

A 2025 analysis of six major AI developers — including OpenAI, Anthropic, Google, and others — found that all six train on user chat data by default (arXiv, September 2025). That means unless you've actively gone into settings and turned something off, your prompts, your uploaded files, and your project context may all be feeding back into the model.

The fix takes about thirty seconds:

ChatGPT: Settings → Data controls → "Improve the model for everyone" → toggle off

Claude: Settings → Privacy → toggle off "Use my content to train Claude"

Gemini: Activity controls → toggle off Gemini Apps Activity

Copilot: Privacy settings → toggle off model training

Do this once per account. Do it now, before the next project lands.

The FTC has been explicit about this: companies that promise not to use customer data for training — then do it anyway, even through workarounds — may face enforcement action (FTC, January 2024). But enforcement doesn't undo the data that's already been absorbed. The toggle is your first and best line of defense.

## What Data Should Never Touch an LLM

Some things are non-negotiable. Personally Identifiable Information — names, email addresses, phone numbers, IP addresses — should never go into a consumer-grade LLM interface. Not because the model will "leak" it in the next response (though that's a separate concern). Because once data enters a system that trains on user inputs by default, you've lost control of where it ends up.

This goes beyond PII. Think about what else lives in a typical research dataset: verbatim responses that mention specific towns, employers, or medical conditions. Crosstabs with small cell sizes that make individuals identifiable. Audio transcripts where a respondent mentions their kid's school.

Scrub before you prompt. It's tedious. But it's less tedious than explaining a privacy breach to a client.

## Don't Ask the LLM to Do the Scrubbing for You

I see this one a lot. A researcher uploads a raw dataset and says, "Remove all personally identifiable information from this file."

Don't do this.

The data has already entered the system. If training is enabled, the raw version — names, emails, and all — has been ingested before the model even processes your anonymization request. Anonymize first, on your own machine, then upload.

## Enterprise and Education Accounts Are Different (But Still Check)

If your organization has an Enterprise agreement with OpenAI or Anthropic, or an Education agreement with Google, your prompts and data are not used for training by default. It's written into the contract.

But here's the thing: tools built on top of those models don't always inherit those protections.

When you're using a market research platform that runs on Claude or GPT behind the scenes, look for a specific clause in the privacy policy. You want to see language like: "We do not use your prompts or your data to train Anthropic or OpenAI models."

If the language is vague — "we take your privacy seriously" without specifics — treat it like a consumer account. Toggle off whatever you can and limit what you enter.

Secure Privacy's governance framework for enterprise AI puts it well: the gap isn't malicious intent, it's the speed of AI adoption outpacing governance maturity (Secure Privacy, 2025). Most tools aren't trying to misuse your data. They just haven't built the guardrails yet.

## The Bottom Line

Three things to do this week:

1. Open every LLM tool you use for research. Find the model training toggle. Turn it off.

2. Build a five-minute PII scrub into your workflow before anything touches an AI interface.

3. Read the privacy policy of any research platform that uses AI under the hood. Look for the word "train." If you don't find a clear denial, proceed accordingly.

A little intentionality goes a long way. The goal isn't paranoia — it's keeping your respondents' data and your clients' trust exactly where they belong.
