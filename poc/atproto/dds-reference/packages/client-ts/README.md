# `@dds/client`

TypeScript client library for the DDS reference implementation.

## What it gives you

- **Generated types + clients** for every `org.dds-wg.v1.*` lexicon (via `@atproto/lex-cli`)
- **Bluesky OAuth helpers** for both browser (`@dds/client/auth/browser`) and node
  (`@dds/client/auth/node`) consumers
- **Typed convenience methods** for creating, reading, and listing DDS records scoped to an
  authenticated session
- **Feed consumer** (`@dds/client/feed`) built on Jetstream with catch-up via PDS `listRecords`
  whenever the consumer falls behind or restarts

## Lexicon constants

```ts
import { LEXICON_MAJOR, LEXICON_VERSION } from "@dds/client";
// 1, "1.0.0"
```

Every record authored through `@dds/client` carries the matching `schemaVersion` field.

## Usage sketch

```ts
import { createBrowserAuth, DDSClient } from "@dds/client";

const auth = await createBrowserAuth({ clientId: "..." });
const session = await auth.signIn("alice.bsky.social");
const client = new DDSClient(session);

const project = await client.createProject({
  name: "Climate Assembly",
  phases: [{ name: "Ideation", order: 0, status: "active" }]
});

for await (const ev of client.subscribeToProjectStep(project.uri, "Ideation")) {
  console.log(ev.collection, ev.uri);
}
```

## Build

```sh
pnpm install            # at workspace root
pnpm --filter @dds/client codegen   # regenerate lexicon client
pnpm --filter @dds/client build
```
