import { Agent } from "@atproto/api";
import type {
  OrgDdsWgV1Algorithm,
  OrgDdsWgV1Classification,
  OrgDdsWgV1Decision,
  OrgDdsWgV1Group,
  OrgDdsWgV1Metric,
  OrgDdsWgV1Project,
  OrgDdsWgV1Proposal,
  OrgDdsWgV1Response,
  OrgDdsWgV1Statement,
  OrgDdsWgV1Summary,
  OrgDdsWgV1Vote,
} from "./lexicon/index.js";
import type * as Defs from "./lexicon/types/org/dds-wg/v1/defs.js";
import type * as StrongRef from "./lexicon/types/com/atproto/repo/strongRef.js";
import { resolveDidPds } from "./identity.js";
import { COLLECTIONS, LEXICON_VERSION } from "./version.js";

const DEFAULT_PDS_FALLBACK = "https://bsky.social";

/**
 * Anything that can be turned into an @atproto/api Agent: an Agent itself,
 * a `service` URL string, or an OAuth session object that the Agent constructor accepts.
 */
export type AgentLike = Agent | ConstructorParameters<typeof Agent>[0];

export interface CreateRecordResult {
  uri: string;
  cid: string;
}

/**
 * Wraps an authenticated @atproto/api Agent with typed convenience methods for the
 * DDS lexicon. All write methods set `createdAt` to now and `schemaVersion` to the
 * current lexicon version unless overridden.
 *
 * Mutations are scoped to the authenticated repo (the session's DID). Reads either
 * accept an explicit `repo` or default to the session's DID. When reading from another
 * user's repo, the client resolves their DID to their PDS endpoint and dispatches the
 * read there (the authenticated session can only see records on its own PDS).
 */
export class DDSClient {
  readonly agent: Agent;
  /** Per-PDS unauthenticated agents used for cross-repo reads. */
  private readonly readAgents = new Map<string, Agent>();

  constructor(input: AgentLike) {
    this.agent = input instanceof Agent ? input : new Agent(input);
  }

  /** Get (or build) an unauthenticated agent pointed at the PDS hosting `did`. */
  private async readAgentFor(did: string): Promise<Agent> {
    if (this.did && did === this.did) return this.agent;
    const cached = this.readAgents.get(did);
    if (cached) return cached;
    const pds = (await resolveDidPds(did)) ?? DEFAULT_PDS_FALLBACK;
    const agent = new Agent(pds);
    this.readAgents.set(did, agent);
    return agent;
  }

  /** The DID of the authenticated session, if any. */
  get did(): string | undefined {
    return this.agent.did;
  }

  private requireDid(): string {
    const did = this.did;
    if (!did) {
      throw new Error("DDSClient: no authenticated session (agent.did is undefined)");
    }
    return did;
  }

  private now(): string {
    return new Date().toISOString();
  }

  private userAgentSelf(): Defs.UserAgent & { $type: "org.dds-wg.v1.defs#userAgent" } {
    return { $type: "org.dds-wg.v1.defs#userAgent", did: this.requireDid() };
  }

  private async createRecord(
    collection: string,
    record: Record<string, unknown>,
  ): Promise<CreateRecordResult> {
    const repo = this.requireDid();
    const res = await this.agent.com.atproto.repo.createRecord({
      repo,
      collection,
      record: { schemaVersion: LEXICON_VERSION, createdAt: this.now(), ...record },
    });
    return { uri: res.data.uri, cid: res.data.cid };
  }

  // ----- Records -----

  createStatement(input: {
    text: string;
    replyTo?: StrongRef.Main;
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Statement.Main = {
      $type: COLLECTIONS.statement,
      text: input.text,
      author: this.userAgentSelf(),
      replyTo: input.replyTo,
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.statement, record as unknown as Record<string, unknown>);
  }

  createOrdinalVote(input: {
    target: StrongRef.Main;
    value: -1 | 0 | 1;
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Vote.Main = {
      $type: COLLECTIONS.vote,
      author: this.userAgentSelf(),
      target: input.target,
      value: { $type: "org.dds-wg.v1.vote#ordinal", value: input.value },
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.vote, record as unknown as Record<string, unknown>);
  }

  createProposal(input: {
    name: string;
    description?: string;
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Proposal.Main = {
      $type: COLLECTIONS.proposal,
      name: input.name,
      description: input.description,
      creator: this.userAgentSelf(),
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.proposal, record as unknown as Record<string, unknown>);
  }

  createDecision(input: {
    name: string;
    summary: string;
    acceptedProposals?: StrongRef.Main[];
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Decision.Main = {
      $type: COLLECTIONS.decision,
      name: input.name,
      summary: input.summary,
      creator: this.userAgentSelf(),
      acceptedProposals: input.acceptedProposals,
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.decision, record as unknown as Record<string, unknown>);
  }

  createSummary(input: {
    name: string;
    description: string;
    subject: StrongRef.Main;
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Summary.Main = {
      $type: COLLECTIONS.summary,
      name: input.name,
      description: input.description,
      creator: this.userAgentSelf(),
      subject: input.subject,
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.summary, record as unknown as Record<string, unknown>);
  }

  createResponse(input: {
    text: string;
    target: StrongRef.Main;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Response.Main = {
      $type: COLLECTIONS.response,
      text: input.text,
      target: input.target,
      author: this.userAgentSelf(),
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.response, record as unknown as Record<string, unknown>);
  }

  createGroup(input: {
    name?: string;
    description?: string;
    members: OrgDdsWgV1Group.Main["members"];
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Group.Main = {
      $type: COLLECTIONS.group,
      name: input.name,
      description: input.description,
      creator: this.userAgentSelf(),
      members: input.members,
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.group, record as unknown as Record<string, unknown>);
  }

  createMetric(input: {
    name: string;
    metricType: string;
    subject: StrongRef.Main;
    value: OrgDdsWgV1Metric.Main["value"];
    step?: Defs.ProjectStepRef;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Metric.Main = {
      $type: COLLECTIONS.metric,
      name: input.name,
      creator: this.userAgentSelf(),
      metricType: input.metricType,
      value: input.value,
      subject: input.subject,
      step: input.step,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.metric, record as unknown as Record<string, unknown>);
  }

  createClassification(input: {
    subject: StrongRef.Main;
    label: string;
    /** 0-10000 fixed-point, where 10000 = 100% confidence */
    confidence?: number;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Classification.Main = {
      $type: COLLECTIONS.classification,
      creator: this.userAgentSelf(),
      subject: input.subject,
      label: input.label,
      confidence: input.confidence,
      createdAt: this.now(),
    };
    return this.createRecord(
      COLLECTIONS.classification,
      record as unknown as Record<string, unknown>,
    );
  }

  createAlgorithm(input: {
    name: string;
    description?: string;
    metadata?: unknown;
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Algorithm.Main = {
      $type: COLLECTIONS.algorithm,
      name: input.name,
      description: input.description,
      creator: this.requireDid(),
      metadata: input.metadata !== undefined ? JSON.stringify(input.metadata) : undefined,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.algorithm, record as unknown as Record<string, unknown>);
  }

  createProject(input: {
    name: string;
    description?: string;
    phases: OrgDdsWgV1Project.Phase[];
  }): Promise<CreateRecordResult> {
    const record: OrgDdsWgV1Project.Main = {
      $type: COLLECTIONS.project,
      name: input.name,
      description: input.description,
      creator: this.userAgentSelf(),
      phases: input.phases,
      createdAt: this.now(),
    };
    return this.createRecord(COLLECTIONS.project, record as unknown as Record<string, unknown>);
  }

  // ----- Queries -----

  /** List records in a DDS collection for a given repo (defaults to the session's DID). */
  async listRecords(input: {
    collection: string;
    repo?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ cursor?: string; records: Array<{ uri: string; cid: string; value: unknown }> }> {
    const repo = input.repo ?? this.requireDid();
    const agent = await this.readAgentFor(repo);
    const res = await agent.com.atproto.repo.listRecords({
      repo,
      collection: input.collection,
      limit: input.limit,
      cursor: input.cursor,
    });
    return { cursor: res.data.cursor, records: res.data.records };
  }

  /** Fetch a single record by AT-URI. The repo and collection are parsed from the URI. */
  async getRecord(uri: string): Promise<{ uri: string; cid: string; value: unknown }> {
    const parsed = parseAtUri(uri);
    const agent = await this.readAgentFor(parsed.repo);
    const res = await agent.com.atproto.repo.getRecord({
      repo: parsed.repo,
      collection: parsed.collection,
      rkey: parsed.rkey,
    });
    return { uri: res.data.uri, cid: res.data.cid ?? "", value: res.data.value };
  }

  /** List projects in a repo (defaults to the session's DID). */
  listProjects(input?: { repo?: string; limit?: number; cursor?: string }) {
    return this.listRecords({ ...input, collection: COLLECTIONS.project });
  }

  /** List statements in a repo. */
  listStatements(input?: { repo?: string; limit?: number; cursor?: string }) {
    return this.listRecords({ ...input, collection: COLLECTIONS.statement });
  }

  /** List votes in a repo. */
  listVotes(input?: { repo?: string; limit?: number; cursor?: string }) {
    return this.listRecords({ ...input, collection: COLLECTIONS.vote });
  }
}

interface ParsedAtUri {
  repo: string;
  collection: string;
  rkey: string;
}

export function parseAtUri(uri: string): ParsedAtUri {
  if (!uri.startsWith("at://")) {
    throw new Error(`Not an at:// URI: ${uri}`);
  }
  const [repo, collection, rkey, ...rest] = uri.slice(5).split("/");
  if (!repo || !collection || !rkey || rest.length > 0) {
    throw new Error(`Malformed AT-URI: ${uri}`);
  }
  return { repo, collection, rkey };
}
