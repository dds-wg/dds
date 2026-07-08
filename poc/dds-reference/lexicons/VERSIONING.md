# Lexicon Versioning Policy

ATProto has no built-in lexicon version; the network treats NSIDs as opaque identifiers and assumes
they evolve only additively. This is too narrow for the DDS lexicon, which we expect to evolve over
years. The DDS WG uses the following two-tier policy.

## Tier 1: major version baked into the NSID

Every record collection lives under `org.dds-wg.v<MAJOR>`:

```
org.dds-wg.v1.statement
org.dds-wg.v1.vote
org.dds-wg.v1.project
...
```

A new **major version** is minted when a change is breaking, meaning at least one of:

- A required field is removed
- An existing field's type changes incompatibly (string -> object, enum value removed, etc.)
- The semantics of a field change in a way consumers cannot detect from the value alone
- A union member is removed

Minting a new major (e.g. `org.dds-wg.v2.statement`) produces a **parallel namespace**. The previous
major remains a fully functional read+write collection (see [Deprecation](#deprecation)).

## Tier 2: `schemaVersion` field on every record

Every record type carries an optional `schemaVersion: string` (semver, e.g. `"1.2.0"`). It tracks
**non-breaking** evolution within a single major:

- New optional fields
- New union members
- Loosened constraints (e.g. raised `maxLength`)

The version number is `MAJOR.MINOR.PATCH`. The `MAJOR` part always equals the NSID's major; minor
and patch increment per change. Records emitted by libraries should set this field; consumers that
encounter an absent value may assume `<MAJOR>.0.0`.

Consumers MAY gate behavior on this field, e.g.:

- "Only render the new optional field if `schemaVersion >= 1.2.0`"
- "Reject the record if `schemaVersion >= 2.0.0` and we only understand v1"

## Deprecation

Old major versions are **soft-deprecated**: they remain readable AND writable indefinitely. Clients
may continue to author new records against them, and the network must continue to surface them.

The DDS WG publishes a migration guide alongside each new major (e.g. `MIGRATION-v1-to-v2.md`) so
that operators of long-running services can convert at their own pace.

Removing a major version requires explicit DDS WG decision and a published timeline. As of v1, no
deprecation is planned.

## Authoring rules for libraries

The reference client libraries (`@dds/client`, `dds_client`) enforce:

1. They will only **write** records against the highest major version they were generated for.
2. They will **read** any major version they have generated types for, and report unknown majors
   as a typed error to the caller.
3. They set `schemaVersion` on every record they author, defaulting to the version of the lexicon
   they were generated against.
4. Both libraries expose a `LEXICON_MAJOR` and `LEXICON_VERSION` constant (e.g. `1` and `"1.0.0"`).

## Today

- `org.dds-wg.v1.*` is the only published major.
- `schemaVersion` defaults to `"1.0.0"` for records authored by the reference libraries.
- No deprecations.
