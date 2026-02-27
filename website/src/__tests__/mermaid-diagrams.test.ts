// @vitest-environment jsdom
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import mermaid from "mermaid";

const SPEC_DIR = resolve(import.meta.dirname, "../../../spec");

function extractMermaidBlocks(
  filePath: string,
): { code: string; index: number }[] {
  const content = readFileSync(filePath, "utf-8");
  const blocks: { code: string; index: number }[] = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ code: match[1], index: index++ });
  }
  return blocks;
}

function getSpecFiles(): string[] {
  return globSync("**/*.md", { cwd: SPEC_DIR }).map((f) =>
    resolve(SPEC_DIR, f),
  );
}

beforeAll(() => {
  mermaid.initialize({ startOnLoad: false });
});

describe("Mermaid diagram syntax validation", () => {
  const specFiles = getSpecFiles();

  for (const filePath of specFiles) {
    const fileName = filePath.split("/").pop()!;
    const blocks = extractMermaidBlocks(filePath);

    if (blocks.length === 0) continue;

    describe(fileName, () => {
      for (const { code, index } of blocks) {
        it(`diagram ${index + 1} has valid syntax`, async () => {
          const result = await mermaid.parse(code);
          expect(result).toBeTruthy();
        });
      }
    });
  }
});
