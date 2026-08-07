# W3C DDS Community Group August Open Call

## Slide 1

# Decentralized Deliberation Stack

DDS helps deliberation tools and communities work together without imposing one system. It defines product- and protocol-independent profiles, then recommends tested implementation profiles for specific use cases.

## Slide 2

# Deliberation prepares decisions.

People consider information and different perspectives.

They make agreement, disagreement, and trade-offs visible.

They develop collective understanding.

Deliberation may use polls or rankings. A formal vote can follow as a separate step.

## Slide 3

# The work is fragmented.

Researchers, facilitators, builders, and technical experts often work separately.

Their tools use incompatible concepts and formats.

Communities become dependent on providers.

Teams keep solving the same problems.

## Slide 4

# We started DDS with AT Protocol.

It was our concrete starting point.

The community brought other protocols, tools, and perspectives.

We expanded the scope.

DDS is now protocol-agnostic.

## Slide 5

# DDS is a public interoperability effort.

DDS develops specifications, profiles, validation methods, tests, and reusable open-source building blocks. The group may recommend a complete implementation profile when the evidence is sufficient.

DDS does not develop or certify products. Products can implement the work, test it in context, and return evidence to the group.

DDS is not a company, cooperative, or business partnership.

DDS does not prescribe one political or governance model.

DDS does not require one protocol or architecture.

DDS is not currently a W3C Standard. Our long-term goal is to incubate the work in this Community Group, charter a W3C Working Group, and advance mature specifications through the [W3C Recommendation Track](https://www.w3.org/policies/process/#rec-track).

## Slide 6

# Principles.

**Interoperability.** Tools exchange information without losing meaning.

**Sovereignty.** People and communities retain agency over their data and process.

**Verifiability.** Processes and results can be inspected.

**Resilience.** DDS favors credible exit: where relevant, communities should be able to recover identity and data, then continue elsewhere if a provider disappears.

**Usability. New.** People should not need specialist knowledge or accept worse UX than they expect from the best everyday apps.

**Plurality. New.** Different use cases and contexts have different needs.

**Fairness. New.** Who pays, benefits, bears burdens, and holds power should be transparent and fair while the ecosystem remains economically sustainable.

These are ideals we uphold. Different use cases will make different trade-offs.

## Slide 7

# From a use case to a tested implementation profile.

**Use case.** Describes the context, participants, deliberation flow, and intended outcomes.

**Draft Profile.** A product- and protocol-independent proposal for required features, flow, ontology, broad UX, safety, and other expectations.

**Profile Validation.** Research, stakeholder review, scenarios, and pilots ask whether the profile specifies the right thing.

**Recommended Profile.** The reviewed, product- and protocol-independent profile and its implementation-validation criteria.

**Draft Implementation Profile.** Maps the Recommended Profile to real products, protocols, versions, and configurations.

**Implementation Validation.** Tests features and configurations through audits, research, and real-world use.

**Recommended Implementation Profile.** A feature-centered package with tested products, mappings, evidence, limitations, and trade-offs.

"Recommended" is a DDS maturity status. It is not product certification, endorsement, or a W3C Recommendation.

## Slide 8

# Tracks separate concerns.

**Track.** Groups contributors around one related area of work.

**Scope.** Defines which work belongs in the track.

**Work item.** One concrete task, such as recruitment guidance for a city consultation.

**Output.** The result of a work item, such as a recommendation or test.

**Plenary.** Reconnects the tracks and decides shared DDS work.

Contributors can work deeply in one track without mastering every field.

## Slide 9

# Track 1: Deliberation Processes.

**Intended contributors.** Facilitators, deliberation researchers, civic organizers, accessibility experts, and public-interest practitioners.

**Proposed scope.** Use cases; deliberation flows; digital and non-digital steps; participation rules; facilitation; rounds; moderation; accessibility; decision handoff.

**Example work item.** Map a multi-round city consultation flow: what happens in person, what happens digitally, who participates, and how the rounds connect.

**Possible outputs.** A use-case brief, flow map, facilitation pattern, or feature requirements that inform a Draft Profile.

**Plenary connection.** Share participant, organizer, and process requirements that inform the profile.

## Slide 10

# Track 2: Economics, Incentives, and Ethics.

**Intended contributors.** Economists, political scientists, legal scholars, game theorists, ethicists, community-currency designers, open-source maintainers, and funders.

**Proposed scope.** Institutional design; legal constraints; participation incentives; game theory; community currencies; economic sustainability and fairness; open-source funding; business models; distribution of costs, benefits, burdens, and power.

**Example work item.** Compare funding and incentive models for sustaining an open-source deliberation ecosystem without provider lock-in.

**Possible outputs.** Economic and institutional criteria, an incentive analysis, funding pattern, fairness assessment, or ethical risk assessment.

**Plenary connection.** Add viability, fairness, incentive, power, legal, and ethical constraints to the profile.

## Slide 11

# Track 3: Ontology.

**Intended contributors.** Ontologists, knowledge-graph and linked-data experts, and domain modelers.

**Proposed scope.** Core concepts; deliberation lifecycle; participation; provenance; mappings.

**Example work item.** Define a shared ontology for a city consultation, then map it to JSON-LD and AT Protocol Lexicons.

**Possible outputs.** A glossary, ontology, schema, mapping, or example dataset.

**Plenary connection.** Add formal concepts and mappings to the profile.

## Slide 12

# Track 4: Infrastructure.

**Intended contributors.** Protocol, identity, storage, infrastructure, and application developers.

**Proposed scope.** Protocol bindings; identity; portability; archival and recovery; applications; bridges.

**Example work item.** Build a draft ActivityPub implementation profile, archive its records independently, shut down the original provider, and recover through another implementation.

**Possible outputs.** A draft implementation profile, export format, protocol binding, archival adapter, migration tool, recovery test, or reference application.

**Plenary connection.** Submit draft implementation profiles and infrastructure constraints for validation.

## Slide 13

# Track 5: Analysis.

**Intended contributors.** Deliberation analysts, data scientists, ML and qualitative researchers, facilitators, and evaluation researchers.

**Proposed scope.** Clustering; summarization; sensemaking; metrics; bias; human review; ML evaluation.

**Example work item.** Compare clustering and summarization methods on the same dataset, then evaluate the results with facilitators and users.

**Possible outputs.** An analysis method, open pipeline, benchmark, result schema, or evaluation report.

**Plenary connection.** Provide analysis methods and results that implementation profiles must expose and evaluate.

## Slide 14

# Track 6: Verification.

**Intended contributors.** Cryptographers, reproducibility researchers, security engineers, auditors, and formal-methods researchers.

**Proposed scope.** Deterministic re-execution; provenance; result commitments; audits; proof systems; zkML.

**Example work item.** Verify a clustering result by deterministic re-execution, then test a zkML proof of the same computation.

**Possible outputs.** A validation plan, test suite, audit method, commitment format, evidence report, or proof-of-concept verifier.

**Plenary connection.** Report whether a draft implementation profile has enough evidence to be recommended.

## Slide 15

# Governance.

**Contributors.** Contribute needs, research, specifications, code, and review.

**Maintainers.** Trusted Contributors who steward repositories, documents, tools, and operations.

**Chairs.** Facilitate plenary and track work, public consensus, and the W3C process.

**BDFL.** Protects project continuity in operations, not specification authority.

**Review requested.** [Review the public governance agreement on GitHub](https://github.com/dds-wg/.github/blob/main/GOVERNANCE.md). Propose changes there or discuss them in the [DDS Matrix room](https://matrix.to/#/#dds-wg:matrix.org).

Specifications, profile recommendations, and publication follow Community Group consensus and W3C process.

## Slide 16

# Join. Then self-organize.

**Join.** [Join the W3C DDS Community Group](https://www.w3.org/community/dds/join).

**Start.** Open a [GitHub issue](https://github.com/dds-wg) or a [Matrix thread](https://matrix.to/#/#dds-wg:matrix.org) for a specific need.

**Meet.** Chairs can help Contributors and Maintainers create track-specific or work-item-specific open calls on the [shared Luma calendar](https://luma.com/dds-wg) when needed. Contributors may also meet in their existing communities.

**Return.** Bring learning back through GitHub and plenary calls. Shared specifications emerge through public consensus and the W3C Community Group process.
