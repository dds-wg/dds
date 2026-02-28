---
title: "Anonymity Addendum"
status: "Discussion"
created: "2026-02-05"
order: 3
---

**Related:** [DDS: Verifiable Deliberation on AT Protocol](./dds-protocol.md)
**Date:** 2026-02-05
**Status:** Discussion notes

---

## Executive Summary

This addendum explores the anonymity challenges inherent in any decentralized deliberation system. The key finding is that **achieving strong cross-deliberation unlinkability is fundamentally difficult**, regardless of which underlying protocol (AT Protocol, custom federation, pure P2P) is chosen. These challenges are not specific to AT Protocol. They are inherent to any system that uses public infrastructure and aims to minimize trust in operators.

> **Scope**: This addendum covers **participant anonymity**: pseudonymity, cross-deliberation unlinkability, correlation resistance, and metadata leakage. Deliberation access (restricting who can participate) is a separate concern addressed in the [main spec, Deliberation Access](./dds-protocol.md#9-deliberation-access) and [Implementation Addendum, Deliberation Access](./implementation-addendum.md#7-deliberation-access).

Two distinct concerns are often conflated:
1. **Participant identity**: what other participants learn about you (Levels 0-3, see [§4](#4-participant-identity-levels))
2. **Metadata privacy**: what infrastructure operators can infer about you from traffic, timing, and PDS origin (see [§5](#5-metadata-privacy))

These are orthogonal. Solving one does not solve the other. True anonymity requires both, which leads to two fundamentally different implementation paths (see [§6](#6-recommendation-for-implementers)).

---

## 1. The Core Problem

Deliberation platforms face a fundamental tension:

```
USABILITY                              PRIVACY
---------                              -------
* See my voting history                * Votes unlinkable across deliberations
* Sync across devices                  * No correlation of my activity
* One login for everything             * Different identity per context
* Fast, responsive UX                  * No metadata leakage

TRUST-MINIMIZATION                     PRIVACY (from operators)
------------------                     -----------------------
* Don't trust PDS operator             * Operator can't see my activity
* Don't trust relay operators          * Operators can't correlate my DIDs
* Verifiable, not trustworthy          * No single point of surveillance

These goals conflict. Any design must choose trade-offs.
```

Decentralization increases sovereignty but can reduce privacy. In a centralized system, you trust one operator with everything: simple threat model, one entity to trust. In a decentralized system, data flows through public infrastructure (PDS, Relay, AppView). Multiple entities observe your activity. Privacy requires hiding from all of them, which is harder.

This is not specific to AT Protocol:

| Protocol | Same Challenges? | Notes |
|----------|------------------|-------|
| **AT Protocol** | Yes | Firehose is public, PDS origin visible |
| **ActivityPub** | Yes | Server origin visible, federation leaks metadata |
| **Custom P2P** | Yes | DHT queries reveal interest, timing correlation |
| **Blockchain-based** | Yes (worse) | All data permanently public, immutable |
| **Pure IPFS** | Yes | Request patterns observable, no crowd |
| **Centralized** | Different | Single trust point, but simpler threat model |

The choice of AT Protocol vs. alternatives should be made on **other criteria** (usability, interoperability, ecosystem maturity, sovereignty guarantees), **not** on privacy, because privacy challenges are inherent to the trust-minimized public infrastructure model itself.

---

## 2. Correlation Vectors (Protocol-Agnostic)

Regardless of the underlying protocol, these correlation vectors exist:

### 2.1 Identity Linkage

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **Same identifier** | Email/phone used across deliberations | Per-deliberation pseudonyms | UX complexity |
| **Same DID** | DID used across deliberations | Per-deliberation DIDs | Architecture complexity |
| **Same PDS origin** | All DIDs from same server visible on Firehose | Large multi-tenant PDS (crowd) | Must trust PDS crowd |

### 2.2 Network Linkage

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **IP address** | Same IP makes requests for multiple DIDs | Tor/VPN/Mixnet | Latency, complexity |
| **Timing** | Requests for multiple DIDs at similar times | Randomized delays | Latency |
| **Session** | Same auth session queries multiple DIDs | Separate sessions | UX friction |

### 2.3 Behavioral Linkage

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **Activity patterns** | User active at same times across deliberations | Activity noise | Unnatural UX |
| **Writing style** | Stylometry on opinions | Style obfuscation | Unnatural writing |
| **Voting patterns** | Statistical correlation of voting behavior | None practical | Fundamental limit |

### 2.4 Infrastructure Linkage (Trust-Minimization Specific)

| Vector | Attack | Mitigation | Cost |
|--------|--------|------------|------|
| **Firehose/Relay** | Public observer sees all commits from same PDS | Hide in crowd OR encrypt | Trust crowd OR complex crypto |
| **AppView queries** | History view reveals DID linkage | No cross-deliberation history | Terrible UX |
| **Self-hosted PDS** | Trivially links all your DIDs (you're the only user) | Don't self-host for privacy | Ironic: self-host = less privacy |

---

## 3. Specific Challenges

### 3.1 The History View Problem

The most fundamental challenge: **users want to see their participation history**.

```
USER EXPECTATION:
  "Show me all deliberations I've participated in"
  "Show me my votes across all topics"

TECHNICAL REQUIREMENT:
  System must know: {DID_1, DID_2, DID_3} belong to same user

OPTIONS:
  1. Server knows (queries reveal linkage) -> Defeats trust-minimization
  2. Client knows (local storage only) -> See note on sync below
  3. Encrypted on server -> Access patterns still reveal linkage
  4. No history view -> Unacceptable UX
```

**Note on cross-device sync:** Privacy-preserving sync IS possible via local-first / device-to-device direct sync (similar to the Type B device sync in the Implementation Addendum). However:
- Must ensure any relay/proxy server doesn't learn the DID linkage
- Non-trivial to implement correctly
- Adds significant complexity to achieve both privacy AND sync

**Conclusion:** Any system that provides cross-deliberation history while minimizing trust in operators faces a fundamental challenge. Solutions exist but require careful design.

### 3.2 Self-Hosted PDS: Sovereignty ≠ Privacy

A counterintuitive finding:

```
SELF-HOSTED PDS:
  + Maximum sovereignty (you control everything)
  + Trust-minimized (you are the operator)
  - WORSE for privacy

WHY:
  * Your PDS has only YOUR accounts
  * Firehose sees: "pds.alice.com committed for did:plc:a1, b2, c3"
  * Trivial correlation: All DIDs belong to Alice
  * No crowd to hide in

MANAGED PDS (many users):
  * Your DIDs mixed with thousands of others
  * Firehose sees: "bigpds.example.com committed for 50,000 DIDs"
  * Harder to correlate which are yours
  * BUT: Must trust the managed PDS operator

TRADE-OFF:
  Self-hosted = sovereignty without privacy
  Managed = privacy (crowd) without full sovereignty
```

---

## 4. Participant Identity Levels

> **Note**: The canonical summary of identity levels (0-3) is in the [main specification, Terminology](./dds-protocol.md#participant-identity-levels). This section provides extended discussion, threat models, and implementation guidance for each level.

These levels describe **what other participants see about you**. This is independent of metadata privacy (what infrastructure operators can infer); see [§5](#5-metadata-privacy) for that concern.

### Level 0: Identified Participation
```
* Credentials attached to DID reveal real-world identity (name, email, organization)
* Fully linkable across deliberations
* Other participants and observers can see who said what
* Appropriate for: Public civic discourse, company town halls, formal consultations
* Trade-off: Maximum accountability, minimum privacy
```

### Level 1: Pseudonymous Participation (DDS Default)
```
* User authenticates with identifiers (e.g., email, phone, social login) or
  linkable credentials (e.g., [EUDI wallet](https://eudi.dev/2.4.0/architecture-and-reference-framework-main/), [W3C VC](https://www.w3.org/TR/vc-data-model-2.0/) without ZK), but the AppView
  does not expose them to other participants
* Other participants see only the DID
* Same DID used across deliberations (linkable by DID)
* Trust-minimized: Can walkaway from any operator
* Appropriate for: Most deliberation use cases
* Threat model: Protects against casual deanonymization by peers. The PDS
  operator knows the user's identifiers; pseudonymity is from the
  participant perspective, not from the operator perspective.
* Note: "Guest" describes an account status (no hard credentials), not a single
  identity level. Guest participation spans a spectrum:
  - Unverified guests (no credentials at all, device-bound identity) operate
    outside Levels 0-3, since they have no form of verification. They participate
    in open deliberations without sybil resistance.
  - Soft-verified guests (e.g., Zupass ticket holders with ZK proofs) operate at
    Level 2 (persistent identifier) or Level 3 (per-deliberation identifier).
    No hard personal data is associated with their account.
  See [Implementation Addendum §5](./implementation-addendum.md#5-guest-identity-and-account-upgrade) for design exploration.
```

### Level 2: Anonymous, ZK-verified Participation (Persistent)

```
* Persistent DID across the network, associated with a ZK nullifier
* Proves eligibility (e.g., one-person-one-identity, event ticket, membership)
  without revealing who you are
* No strong identifiers (e.g., email, phone, wallet) attached
* Same DID used across deliberations (linkable by DID) but no deanonymization
  path via credentials
* Appropriate for: Participation where accountability is not required but
  sybil resistance is needed
* Threat model: Same as Level 1, but with no credential-based deanonymization
  path. However, "anonymous" here refers narrowly to credential opacity.
  The persistent DID is a correlation anchor: an observer who sees the same
  DID across deliberations can trivially apply the correlation vectors
  from [§2](#2-correlation-vectors-protocol-agnostic) (activity timing, writing style, voting patterns) to build a
  behavioral profile and potentially deanonymize the participant. In
  practice, this level is closer to pseudonymity with credential hiding
  than true anonymity. For unlinkability, Level 3 (per-deliberation
  identity) is required.
```

### Level 3: Anonymous, ZK-verified (Per-deliberation)
```
* Fresh ephemeral identifier per deliberation
  (DID method TBD; see [Implementation Addendum §5](./implementation-addendum.md#5-guest-identity-and-account-upgrade))
* Unlinkable across deliberations: participation in deliberation A cannot
  be correlated with deliberation B
* ZK nullifiers scoped per deliberation ensure eligibility per context
  (e.g., one-person-one-vote, event ticket, membership)
* Appropriate for: Sensitive consultations, whistleblower platforms, political
  dissent, any context requiring unlinkability
* Trade-off: Because each deliberation uses a fresh identity, no prior
  eligibility proof carries over. The user must re-present their credential
  (e.g., re-scan ticket, re-do ZK proof) for every deliberation they join.
  This is the core UX cost compared to Level 2, where a single verification
  persists across contexts.
* Limitation: Protects against other participants and public observers, but
  NOT against infrastructure operators (PDS, relay) who can correlate via IP,
  timing, and session metadata. For protection from operators, metadata
  privacy measures are needed (see [§5](#5-metadata-privacy)).
```

---

## 5. Metadata Privacy

Metadata privacy is **orthogonal to participant identity levels**. It addresses what infrastructure operators and network observers can learn about you, regardless of what identity level you use.

A user at Level 3 (per-deliberation anonymous) with no metadata protection is still visible to their PDS operator, who can correlate fresh DIDs by IP address, session timing, and request patterns. The ZK proof hides the user's identity from other participants; it does not hide anything from infrastructure.

### Protection tiers

These can be combined with any identity level (0-3):

**No protection (default):**
Standard AT Protocol infrastructure. PDS origin visible on the Firehose. IP address visible to the PDS operator. Sufficient for most use cases where the threat model is casual deanonymization by other participants, not operator-level surveillance.

**Crowd hiding:**
Large multi-tenant PDS where your DIDs are mixed with thousands of others. Correlation requires traffic analysis rather than trivial PDS-origin matching. Trade-off: must trust the PDS operator not to correlate internally. Resists public observation, not operator collusion.

**Strong metadata privacy:**
Tor for all network requests. Local-first sync only (device-to-device, no server-side history). No server learns which DIDs belong to the same user. Resists all observers, including operators. Trade-off: significant engineering effort, challenging UX, substantial development investment.

### The honest assessment

Per-deliberation anonymity (Level 3) without metadata protection is useful but partial. It hides you from other participants and public Firehose observers. But the same operators you are hiding from at the identity level can infer the same linkage from traffic metadata. Identity-level anonymity alone does not deliver full anonymity. True anonymity requires both identity-level protection (Level 3) and strong metadata privacy, which is a fundamentally different architecture (see [§6](#6-recommendation-for-implementers)).

The gap between crowd hiding and strong metadata privacy is significant. Crowd hiding trusts the PDS operator. Strong metadata privacy trusts no one, but requires Tor integration, local-first sync, and careful audit of all network paths.

---

## 6. Recommendation for Implementers

### 6.1 Two Paths, Not One

DDS defines two architecturally distinct implementation paths:

```
PSEUDONYMITY PATH:
  * Levels 0-2: persistent identity, honest about linkability
  * Simple architecture, standard AT Protocol infrastructure
  * In practice, most deliberation use cases lean towards this path
  * DDS prioritizes tooling for this path first (SDK, best practices,
    reference implementations)

STRONG ANONYMITY PATH:
  * Level 3 + strong metadata privacy (Tor, local-first sync)
  * Per-deliberation identity, crowd hiding or Tor routing
  * Fundamentally different architecture
  * Separate best-practice guides and SDK recommendations may follow later
```

DDS does not prescribe which path is "better." The choice depends on the product's use case and threat model. DDS provides guidance for both, with recommendations tailored to product goals.

### 6.2 Why Not Both in One App?

The two paths make opposing architectural choices. They should not be mixed in the same application:

```
                     PSEUDONYMITY          STRONG ANONYMITY
                     -------------         ----------------
Identity:            Persistent DID        Ephemeral DID per deliberation
Infrastructure:      Standard PDS          Tor-routed, crowd hiding
History:             Server-side sync      Local-first only
Auth:                Standard AT OAuth     Separate mechanism
Credential reuse:    Verify once           Re-verify every deliberation
Complexity:          Standard              Significant engineering effort
```

Mixing them in one app means neither works well. The infrastructure choices for pseudonymity (standard PDS, server sync, persistent DID) actively undermine anonymity. The infrastructure choices for anonymity (Tor, local-first, ephemeral DIDs) sacrifice the usability that makes pseudonymity practical.

Implementers should choose one path and commit to it.
