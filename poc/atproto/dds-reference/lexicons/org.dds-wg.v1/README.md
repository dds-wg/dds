# `org.dds-wg.v1.*` Lexicons

Canonical, formal AT Protocol lexicon for the DDS reference implementation, **major version 1**.

See [`../VERSIONING.md`](../VERSIONING.md) for the versioning policy that governs this directory.

## Record types

| NSID | Purpose |
| --- | --- |
| `org.dds-wg.v1.defs` | Shared definitions (`agentRef`, `subjectRef`, `projectStepRef`) |
| `org.dds-wg.v1.statement` | A textual contribution |
| `org.dds-wg.v1.vote` | A vote with one of several value-shapes |
| `org.dds-wg.v1.response` | Free-form textual response |
| `org.dds-wg.v1.reaction` | Wraps a vote or response |
| `org.dds-wg.v1.group` | A group of statements/users/groups |
| `org.dds-wg.v1.proposal` | A named proposal |
| `org.dds-wg.v1.decision` | A decision, optionally accepting proposals |
| `org.dds-wg.v1.summary` | Summary of a subject |
| `org.dds-wg.v1.metric` | A named, typed metric on a subject |
| `org.dds-wg.v1.classification` | A label + confidence on a subject |
| `org.dds-wg.v1.algorithm` | A registered algorithm instance |
| `org.dds-wg.v1.project` | A project with embedded phases |
| `org.dds-wg.v1.workflowTransition` | A transition between phases |
| `org.dds-wg.v1.event` | Generic actor/subject/timestamp event |

## App-view queries (not yet implemented server-side)

| NSID | Purpose |
| --- | --- |
| `org.dds-wg.v1.getProject` | Fetch a project by AT-URI |
| `org.dds-wg.v1.listProjects` | List project records, optionally scoped to a repo |

## Conventions

- All records have a `createdAt` ISO-8601 datetime.
- All records have an optional `schemaVersion` semver string. Reference libraries set it on write.
- `creator` / `author` / `actor` use the `org.dds-wg.v1.defs#agentRef` union with `$type`
  discriminating between `#userAgent` (`did` only) and `#algorithmAgent` (`strongRef` to an
  algorithm record).
- Cross-record pointers use `com.atproto.repo.strongRef` (`uri` + `cid`).
- Records that belong to a project step embed an optional `step` field of
  `org.dds-wg.v1.defs#projectStepRef` so consumers can filter without resolving the parent project.

## Note: AT Protocol Binding

These lexicons are the machine-readable AT Protocol binding used for codegen
and on-the-wire validation in the reference implementation. The main DDS
specification is expected to evolve toward a transport-agnostic core with
protocol-specific bindings, starting with this AT Protocol track.
