---
title: "Anonymity Addendum"
status: "Discussion"
created: "2026-02-05"
order: 2
---

**Related:** [DDS: Verifiable Deliberation on AT Protocol](./0001-dds-protocol.md)
**Date:** 2026-02-05
**Status:** Discussion notes

---

## Executive Summary

This addendum explores the anonymity challenges inherent in any decentralized deliberation system. The key finding is that **achieving strong cross-deliberation unlinkability is fundamentally difficult**, regardless of which underlying protocol (AT Protocol, custom federation, pure P2P) is chosen.

> **Scope**: This addendum covers **participant anonymity**: pseudonymity, cross-deliberation unlinkability, correlation resistance, and metadata leakage. Deliberation access (restricting who can participate) is a separate concern addressed in the [main spec §6](./0001-dds-protocol.md) and [Implementation Addendum §7](./0001-implementation-addendum.md#7-deliberation-access).

This is not a limitation of AT Protocol specifically. It's a property of any system that:

1. Allows users to participate across multiple deliberations
2. Uses **public or semi-public** infrastructure for data distribution
3. Adopts a **trust-minimized mindset**: doesn't want to trust third-party server operators

The tension is between **sovereignty** (not trusting operators) and **privacy** (hiding activity from observers). Achieving both simultaneously is the hard problem.

---

## 1. The Core Tension

Deliberation platforms face a fundamental tension:

```
USABILITY                              PRIVACY
─────────                              ───────
• See my voting history                • Votes unlinkable across deliberations
• Sync across devices                  • No correlation of my activity
• One login for everything             • Different identity per context
• Fast, responsive UX                  • No metadata leakage

TRUST-MINIMIZATION                     PRIVACY (from operators)
──────────────────                     ───────────────────────
• Don't trust PDS operator             • Operator can't see my activity
• Don't trust relay operators          • Operators can't correlate my DIDs
• Verifiable, not trustworthy          • No single point of surveillance

These goals conflict. Any design must choose trade-offs.
```

---

## 2. The Trust-Minimization Problem

DDS aims to minimize trust in operators (walkaway capability). But this creates a privacy paradox:

```
CENTRALIZED (trust operator):
  • Operator sees everything
  • But: Only ONE entity to trust
  • Privacy = trusting that one entity

DECENTRALIZED (trust-minimized):
  • Multiple operators (PDS, Relay, AppView)
  • Data flows through public infrastructure
  • MORE entities see your activity
  • Privacy = hiding from ALL of them (harder)
```

**Key insight:** Decentralization increases sovereignty but can reduce privacy, because data must flow through observable public channels.

---

## 3. Correlation Vectors (Protocol-Agnostic)

Regardless of the underlying protocol, these correlation vectors exist:

### 3.1 Identity Linkage

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **Same identifier** | Email/phone used across deliberations | Per-deliberation pseudonyms | UX complexity |
| **Same DID** | DID used across deliberations | Per-deliberation DIDs | Architecture complexity |
| **Same PDS origin** | All DIDs from same server visible on Firehose | Large multi-tenant PDS (crowd) | Must trust PDS crowd |

### 3.2 Network Linkage

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **IP address** | Same IP makes requests for multiple DIDs | Tor/VPN/Mixnet | Latency, complexity |
| **Timing** | Requests for multiple DIDs at similar times | Randomized delays | Latency |
| **Session** | Same auth session queries multiple DIDs | Separate sessions | UX friction |

### 3.3 Behavioral Linkage

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **Activity patterns** | User active at same times across deliberations | Activity noise | Unnatural UX |
| **Writing style** | Stylometry on opinions | Style obfuscation | Unnatural writing |
| **Voting patterns** | Statistical correlation of voting behavior | None practical | Fundamental limit |

### 3.4 Infrastructure Linkage (Trust-Minimization Specific)

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **Firehose/Relay** | Public observer sees all commits from same PDS | Hide in crowd OR encrypt | Trust crowd OR complex crypto |
| **AppView queries** | History view reveals DID linkage | No cross-deliberation history | Terrible UX |
| **Self-hosted PDS** | Trivially links all your DIDs (you're the only user) | Don't self-host for privacy | Ironic: self-host = less privacy |

---

## 4. The History View Problem

The most fundamental challenge: **users want to see their participation history**.

```
USER EXPECTATION:
  "Show me all deliberations I've participated in"
  "Show me my votes across all topics"

TECHNICAL REQUIREMENT:
  System must know: {DID_1, DID_2, DID_3} belong to same user

OPTIONS:
  1. Server knows (queries reveal linkage) → Defeats trust-minimization
  2. Client knows (local storage only) → See note on sync below
  3. Encrypted on server → Access patterns still reveal linkage
  4. No history view → Unacceptable UX
```

**Note on cross-device sync:** Privacy-preserving sync IS possible via local-first / device-to-device direct sync (similar to the Type B device sync in DDS RFC). However:
- Must ensure any relay/proxy server doesn't learn the DID linkage
- Non-trivial to implement correctly
- Adds significant complexity to achieve both privacy AND sync

**Conclusion:** Any system that provides cross-deliberation history while minimizing trust in operators faces a fundamental challenge. Solutions exist but require careful design.

---

## 5. Self-Hosted PDS: Sovereignty ≠ Privacy

A counterintuitive finding:

```
SELF-HOSTED PDS:
  ✅ Maximum sovereignty (you control everything)
  ✅ Trust-minimized (you are the operator)
  ❌ WORSE for privacy

WHY:
  • Your PDS has only YOUR accounts
  • Firehose sees: "pds.alice.com committed for did:plc:a1, b2, c3"
  • Trivial correlation: All DIDs belong to Alice
  • No crowd to hide in

MANAGED PDS (many users):
  • Your DIDs mixed with thousands of others
  • Firehose sees: "bigpds.example.com committed for 50,000 DIDs"
  • Harder to correlate which are yours
  • BUT: Must trust the managed PDS operator

TRADE-OFF:
  Self-hosted = sovereignty without privacy
  Managed = privacy (crowd) without full sovereignty
```

---

## 6. Privacy Levels (Realistic Assessment)

Given the constraints above, here are the achievable privacy levels:

### Level 0: Identified Participation
```
• Credentials attached to DID reveal real-world identity (name, email, organization)
• Fully linkable across deliberations
• Other participants and observers can see who said what
• Appropriate for: Public civic discourse, company town halls, formal consultations
• Trade-off: Maximum accountability, minimum privacy
```

### Level 1: Pseudonymous Participation (DDS Default)
```
• DID is pseudonymous (not trivially linked to real name)
• Same DID used across deliberations (linkable by DID)
• Trust-minimized: Can walkaway from any operator
• Appropriate for: Most deliberation use cases
• Threat model: Protects against casual deanonymization
• Note: Guest accounts may operate at Level 1 (managed did:plc) or at Level 1c
  (per-deliberation identifier for ticket-gated anonymity).
  See [Implementation Addendum §5](./0001-implementation-addendum.md#5-guest-identity-and-account-upgrade) for design exploration.
```

### Level 1b: Anonymous Participation (Nullifier-based)

```
• Persistent DID across the network, associated with a ZK nullifier
• Proves uniqueness (one-person-one-identity) without revealing who you are
• No strong identifiers (email, phone, wallet) attached
• Same DID used across deliberations (linkable by DID) but no deanonymization path via credentials
• Appropriate for: Participation where accountability is not required but sybil resistance is needed
• Threat model: Same as Level 1, but with no credential-based deanonymization path. The DID itself is still linkable across deliberations, so behavioral correlation remains possible.
```

### Level 1c: Per-deliberation Anonymous
```
• Fresh ephemeral identifier per deliberation (DID method TBD — see Implementation Addendum §5)
• Unlinkable across deliberations: participation in deliberation A cannot be correlated
  with deliberation B
• ZK nullifiers scoped per deliberation ensure one-person-one-vote per context
• Appropriate for: Ticket-gated events, sensitive consultations, any context requiring unlinkability
• Trade-off: User must RE-PROVE ELIGIBILITY for each deliberation (e.g., re-present ticket,
  re-do ZK proof). This is the core UX cost compared to persistent anonymous (Level 1b),
  where a single verification is reused across contexts.
• Note: This is distinct from Level 2 (Crowd Anonymity), which also uses per-deliberation
  identifiers but adds infrastructure-level protections (large multi-tenant PDS to hide
  among other users).
```

### Level 2: Crowd Anonymity
```
• Per-deliberation DIDs on large multi-tenant PDS
• DIDs hidden among thousands of others
• Correlation requires traffic analysis
• Trade-off: Must trust PDS operator won't correlate
• Appropriate for: Sensitive topics, casual linkage concern
• Threat model: Resists public observation, not operator collusion
```

### Level 3: Strong Anonymity
```
• Per-deliberation DIDs
• Tor for all network requests
• Local-first sync only (device-to-device, no server proxy learning)
• No server-side history aggregation
• Fully trust-minimized
• Appropriate for: Whistleblowing, political dissent
• Practical: Challenging UX, but achievable with significant engineering effort
```

**The gap between Level 2 and Level 3 is significant.** Level 2 requires trusting the PDS operator (crowd anonymity). Level 3 is achievable but requires substantial engineering investment in local-first sync, Tor integration, and careful protocol design.

---

## 7. Recommendation for DDS

### 7.1 Default: Level 1 (Pseudonymous, Trust-Minimized)

For the standard DDS implementation:

```
• One DID per user
• Pseudonymous (DID ≠ real name)
• Linkable across deliberations (by DID)
• Trust-minimized: Walkaway capability via did:plc Rotation Keys (optionally enhanced by Encrypted Vault)
• Honest about privacy model
```

**Rationale:**
- Achieves the sovereignty goal (walkaway)
- Matches user expectations (one account, full history)
- Simple architecture
- Honest about privacy limitations
- Sufficient for most deliberation use cases

### 7.2 Future: "Hardcore Anonymity" App/Mode

For users who require stronger privacy, a **separate application or mode** could be developed:

```
HARDCORE ANONYMITY APP (Future Work)

Characteristics:
• Separate app (not just a setting)
• Per-deliberation DIDs
• Tor integration for all network requests
• Local-first sync (device-to-device, no server learning)
• Careful design to prevent proxy/relay correlation
• Clear warnings about complexity
• Accepts usability trade-offs for privacy

Target users:
• Journalists protecting sources
• Dissidents in authoritarian regimes
• Whistleblowers
• Users with specific, serious threat models

Engineering requirements:
• Local-first sync protocol (non-trivial)
• Tor/mixnet integration
• Careful audit of all network paths
• Significant development investment
```

This would be a distinct product with different architecture, not a configuration toggle.

---

## 8. Protocol Independence

**Key point:** These privacy challenges are not specific to AT Protocol.

| Protocol | Same Challenges? | Notes |
|----------|------------------|-------|
| **AT Protocol** | Yes | Firehose is public, PDS origin visible |
| **ActivityPub** | Yes | Server origin visible, federation leaks metadata |
| **Custom P2P** | Yes | DHT queries reveal interest, timing correlation |
| **Blockchain-based** | Yes (worse) | All data permanently public, immutable |
| **Pure IPFS** | Yes | Request patterns observable, no crowd |
| **Centralized** | Different | Single trust point, but simpler threat model |

The choice of AT Protocol vs. alternatives should be made on **other criteria**:
- Usability and interoperability ✅
- Ecosystem and tooling maturity ✅
- Sovereignty guarantees (walkaway) ✅

**Not** based on privacy, because privacy challenges are inherent to the trust-minimized public infrastructure model, not to any specific protocol.

---

## Appendix: The Irony of Decentralization and Privacy

```
CENTRALIZED SYSTEM:
  • Trust one operator
  • Operator sees everything
  • Privacy = operator's policy
  • Simple threat model

DECENTRALIZED SYSTEM:
  • Don't trust any single operator
  • Data flows through public channels
  • Many entities can observe
  • Privacy = hiding from everyone (hard)

IRONY:
  Decentralization increases sovereignty
  But can decrease privacy
  Unless you add careful cryptographic/protocol design
  Which requires significant engineering investment

This is why privacy + sovereignty + usability together is a hard problem in decentralized systems.
```

DDS chooses usability over strong anonymity for the default mode. This is the right choice for mainstream deliberation. Users with high-threat models can be served by a future hardcore anonymity mode with appropriate engineering investment.
