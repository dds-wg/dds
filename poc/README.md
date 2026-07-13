# Proof-of-Concepts

This directory contains experimental DDS implementations and focused exploration
tracks.

The long-term DDS specification is intended to be transport-agnostic. It should
define the deliberation model, lifecycle, interoperability expectations, and
verification requirements without depending on one network or storage substrate.

Exploration tracks can be protocol-specific, such as an AT Protocol binding, or
cross-cutting, such as shared ontology, data models, verification methods,
governance patterns, or other work that may need a dedicated sub-community
group. Those tracks can test concrete bindings, lexicons, implementation
constraints, deployment assumptions, and shared vocabularies before stable ideas
are folded back into the transport-agnostic specification.

## Current Focus

The current proof-of-concept focus is [AT Protocol](./atproto/). This is the
first attempt at implementing DDS against a concrete transport and identity
stack, not the only kind of exploration this directory can contain.

## Licence

Proof-of-concept software is licensed under [MPL-2.0](./COPYING), unless a more
specific file-level notice says otherwise.
