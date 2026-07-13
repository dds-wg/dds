/** Major version of the DDS lexicon this client is generated against. */
export const LEXICON_MAJOR = 1 as const;

/** Full semver of the DDS lexicon this client is generated against. */
export const LEXICON_VERSION = "1.0.0" as const;

/** NSID prefix for the current major. */
export const LEXICON_NS = `org.dds-wg.v${LEXICON_MAJOR}` as const;

/** Collection NSIDs that this client knows how to author. */
export const COLLECTIONS = {
  algorithm: `${LEXICON_NS}.algorithm`,
  classification: `${LEXICON_NS}.classification`,
  decision: `${LEXICON_NS}.decision`,
  event: `${LEXICON_NS}.event`,
  group: `${LEXICON_NS}.group`,
  metric: `${LEXICON_NS}.metric`,
  project: `${LEXICON_NS}.project`,
  proposal: `${LEXICON_NS}.proposal`,
  reaction: `${LEXICON_NS}.reaction`,
  response: `${LEXICON_NS}.response`,
  statement: `${LEXICON_NS}.statement`,
  summary: `${LEXICON_NS}.summary`,
  vote: `${LEXICON_NS}.vote`,
  workflowTransition: `${LEXICON_NS}.workflowTransition`,
} as const;

export type DDSCollection = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
