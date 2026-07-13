# DDS on AT Protocol

This directory contains the AT Protocol proof-of-concept track for DDS.

DDS is expected to evolve toward a transport-agnostic core specification. The
core spec should describe the deliberation stack independently from any one
network. AT Protocol is the current focus because it provides a concrete identity,
record, lexicon, and feed substrate that lets the community test the model in
running software.

This work is intentionally protocol-specific. It explores how DDS concepts map to
AT Protocol lexicons, repositories, authentication, indexing, and client
interfaces. Other protocols can have their own tracks or sub-community groups
with their own bindings. Cross-cutting topics, such as shared ontology, can also
have their own exploration tracks when they need focused work outside one
transport binding.

The main DDS specification is expected to be rewritten in this direction: a
transport-agnostic core with protocol-specific bindings, starting with AT
Protocol.

## Projects

| Path | Description |
| --- | --- |
| [`dds-reference`](./dds-reference/) | Current AT Protocol reference implementation and main proof-of-concept. |
| [`guest-in-atproto`](./guest-in-atproto/) | Earlier experiment for guest-oriented AT Protocol flows. |

## Licence

AT Protocol proof-of-concept software is licensed under [MPL-2.0](../COPYING),
unless a more specific file-level notice says otherwise.
