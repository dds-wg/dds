---
title: "From ZK-first to AT Protocol: The Origin of DDS"
description: "How the Decentralized Deliberation Standard evolved from zero-knowledge proofs through AT Protocol to become a vendor-neutral protocol for public deliberation."
author: "Nicolas Gimenez"
date: "2026-02-16"
---

The Decentralized Deliberation Standard (DDS) didn't start here. It grew out of work on [Agora Citizen Network](https://github.com/nicobao/agora), where early exploration focused on building secure, censorship-resistant public deliberation.

The effort started with zero-knowledge proofs. [Racine](https://github.com/zkorum/racine) was built as a meta-protocol for verifiable provenance designed to be transport-agnostic. Technically sound, but users wanted to sign up with their email -- not scan passports or manage cryptographic keys.

AT Protocol solved the infrastructure problems that kept surfacing: portable identity via `did:plc`, composable architecture, schema enforcement via Lexicons, a complete data stream via the Firehose, and an existing social graph.

DDS is now its own project, maintained by the DDS Working Group. The protocol is vendor-neutral, designed so that any team can build deliberation tools that interoperate permissionlessly via shared lexicons on AT Protocol. Contributions are open to anyone.

Read the full origin story on WhiteWind: [From ZK-first to AT Protocol](https://whtwnd.com/agoracitizen.network/3meq2b36rw42s)

Read the [DDS specification](/spec/dds-protocol) for the full protocol design.
