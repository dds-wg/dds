/**
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
