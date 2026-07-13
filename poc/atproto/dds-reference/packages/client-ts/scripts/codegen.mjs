#!/usr/bin/env node
// Run @atproto/lex-cli over the DDS v1 lexicons to produce typed client code at
// packages/client-ts/src/lexicon/. Invoked via `pnpm codegen` from this package.

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const repoRoot = resolve(pkgRoot, "..", "..");
const lexiconRoot = join(repoRoot, "lexicons");
const outDir = join(pkgRoot, "src", "lexicon");

const lexiconFiles = readdirSync(lexiconRoot, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith(".json"))
  .map((d) => join(d.parentPath ?? d.path, d.name));

if (lexiconFiles.length === 0) {
  console.error(`No lexicon JSON files found under ${lexiconRoot}`);
  process.exit(1);
}

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const args = ["gen-api", outDir, ...lexiconFiles];
console.log(`lex ${args.slice(0, 2).join(" ")} (${lexiconFiles.length} lexicons)`);
execSync(`yes | pnpm exec lex ${args.map((a) => JSON.stringify(a)).join(" ")}`, {
  cwd: pkgRoot,
  stdio: "inherit"
});

// lex-cli emits relative imports to external lexicons it wasn't asked to generate.
// Drop in stubs for com.atproto.repo.strongRef so the generated tree typechecks standalone.
const strongRefDir = join(outDir, "types", "com", "atproto", "repo");
mkdirSync(strongRefDir, { recursive: true });
writeFileSync(
  join(strongRefDir, "strongRef.ts"),
  `/**
 * Stub for com.atproto.repo.strongRef. The official lexicon ships with @atproto/api,
 * but lex-cli emits relative imports to it from generated DDS types. This file lets
 * the generated tree compile standalone.
 */
export interface Main {
  uri: string;
  cid: string;
  [k: string]: unknown;
}

export function isMain(v: unknown): v is Main {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Main).uri === "string" &&
    typeof (v as Main).cid === "string"
  );
}
`,
);

// Replace the generated top-level index.ts (an XrpcClient that depends on com.atproto.* types we
// don't generate) with a types-only re-export. Real XRPC calls go through @atproto/api's Agent.
writeFileSync(
  join(outDir, "index.ts"),
  `/**
 * GENERATED CODE - DO NOT MODIFY
 * (post-processed by scripts/codegen.mjs to be types-only)
 *
 * The original lex-cli output here builds an XrpcClient that depends on com.atproto.* lexicons
 * we don't bundle. The DDSClient in this package wraps @atproto/api's Agent instead, which
 * already provides full ATProto coverage. Consumers should import types from here.
 */
export * as OrgDdsWgV1Algorithm from "./types/org/dds-wg/v1/algorithm.js";
export * as OrgDdsWgV1Classification from "./types/org/dds-wg/v1/classification.js";
export * as OrgDdsWgV1Decision from "./types/org/dds-wg/v1/decision.js";
export * as OrgDdsWgV1Defs from "./types/org/dds-wg/v1/defs.js";
export * as OrgDdsWgV1Event from "./types/org/dds-wg/v1/event.js";
export * as OrgDdsWgV1GetProject from "./types/org/dds-wg/v1/getProject.js";
export * as OrgDdsWgV1Group from "./types/org/dds-wg/v1/group.js";
export * as OrgDdsWgV1ListProjects from "./types/org/dds-wg/v1/listProjects.js";
export * as OrgDdsWgV1Metric from "./types/org/dds-wg/v1/metric.js";
export * as OrgDdsWgV1Project from "./types/org/dds-wg/v1/project.js";
export * as OrgDdsWgV1Proposal from "./types/org/dds-wg/v1/proposal.js";
export * as OrgDdsWgV1Reaction from "./types/org/dds-wg/v1/reaction.js";
export * as OrgDdsWgV1Response from "./types/org/dds-wg/v1/response.js";
export * as OrgDdsWgV1Statement from "./types/org/dds-wg/v1/statement.js";
export * as OrgDdsWgV1Summary from "./types/org/dds-wg/v1/summary.js";
export * as OrgDdsWgV1Vote from "./types/org/dds-wg/v1/vote.js";
export * as OrgDdsWgV1WorkflowTransition from "./types/org/dds-wg/v1/workflowTransition.js";
export * as ComAtprotoRepoStrongRef from "./types/com/atproto/repo/strongRef.js";
export { schemas as LEXICON_SCHEMAS, lexicons as LEXICON_RUNTIME } from "./lexicons.js";
`,
);

console.log(`Generated lexicon client into ${outDir}`);
