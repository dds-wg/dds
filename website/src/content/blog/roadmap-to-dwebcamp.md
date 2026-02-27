---
title: "Roadmap to DWebCamp: Building DDS in the Open"
description: "The DDS Working Group has set its governance, technical direction, and a phased roadmap toward a first public presentation at DWebCamp in July 2026."
author: "Nicolas Gimenez"
date: "2026-02-22"
---

The DDS Working Group aims for [DWebCamp](https://dwebcamp.org/) in July 2026 as its first public milestone. Here's the roadmap.

## Phase 1: Foundation (February -- March)

- Launch the website and publish the [specification](/spec/dds-protocol) as a working draft.
- Set up governance: community consensus, mutual agreement, vendor-neutral [GitHub organization](https://github.com/dds-wg/dds) owned by individuals.
- Onboard early maintainers and contributors.

This phase is underway.

## Phase 2: Exploration (March -- May)

Proof-of-concept implementations built on AT Protocol. Three focus areas:

**Deliberation lifecycle lexicon.** Formalize the Plan, Collect, Analyze loop into concrete AT Protocol lexicon definitions. Test the full cycle end-to-end.

**Guest and non-standard login.** Lightweight login for guests (DID method TBD), persistent `did:plc` for committed participants, merge paths between the two. Zero-knowledge-based authentication for anonymous participation.

**Privacy models.** Loosely private deliberations shared via links among invited participants.

Each PoC validates a design direction -- not a commitment. Collectively, these explorations will prepare the ground for a developer SDK and shape the future roadmap: what we learn from building will determine the priorities, sequencing, and scope of what comes next.

## Phase 3: Convergence (May -- July)

- Consolidate PoC learnings into spec revisions and a concrete future roadmap.
- Build working demonstrations.
- Aim for a public presentation at DWebCamp.

## Beyond July

Not the immediate focus, but part of the broader vision:

- A developer SDK for building on the DDS lifecycle.
- Verifiable analysis via zero-knowledge machine learning (zkML).
- On-chain verification on Ethereum.
- Archival strategies for long-term data preservation.
- Vouching-based verification graphs for participant trust networks.

## Get Involved

The [specification](/spec/dds-protocol) is a working draft -- feedback is welcome. Development happens on [GitHub](https://github.com/dds-wg/dds). If you're headed to [DWebCamp](https://dwebcamp.org/) in July, we hope to see you there.
