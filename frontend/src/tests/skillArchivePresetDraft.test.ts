import { describe, expect, it, vi } from "vitest";
import { createSkillArchivePresetDraft, extractSkillArchiveDocs } from "../services/skillArchivePresetDraft";
import { zipFile } from "./zipTestUtils";

const skillMarkdown = `---
name: Product Coach
description: Helps teams sharpen product judgement.
---

<Purpose>
Coach product decisions by focusing on users, constraints, and validation.
</Purpose>

<Use_When>
Use when prioritizing product bets and reducing launch risk.
</Use_When>
`;

describe("skill archive preset draft", () => {
  it("extracts SKILL.md and drafts a local preset preview", async () => {
    const file = zipFile({ "coach/SKILL.md": skillMarkdown });

    const draft = await createSkillArchivePresetDraft(file);

    expect(draft.docs.evidenceRefs).toEqual(["coach/SKILL.md"]);
    expect(draft.preset.name).toBe("Product Coach");
    expect(draft.preset.domainTags).toContain("产品");
    expect(draft.preset.evidenceNote).toBe("auto-drafted-from-local-skill-archive");
    expect(draft.notice).toMatch(/本地自动草拟/);
  });

  it("uses README.md as secondary evidence when present", async () => {
    const file = zipFile({
      "SKILL.md": skillMarkdown,
      "README.md": "# Product Coach\n\nA practical product strategy skill."
    });

    const docs = await extractSkillArchiveDocs(file);

    expect(docs.evidenceRefs).toEqual(["SKILL.md", "README.md"]);
    expect(docs.readmeMarkdown).toContain("product strategy");
  });

  it("rejects archives without SKILL.md", async () => {
    await expect(extractSkillArchiveDocs(zipFile({ "README.md": "# Missing" }))).rejects.toThrow(/SKILL\.md/);
  });

  it("rejects unsupported archive formats", async () => {
    await expect(extractSkillArchiveDocs({ name: "skill.tar.gz", size: 4 } as File)).rejects.toThrow(/仅支持 \.zip/);
  });

  it("rejects corrupt zip files", async () => {
    await expect(
      extractSkillArchiveDocs({ name: "skill.zip", size: 4, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) } as File)
    ).rejects.toThrow(/无法读取/);
  });

  it("rejects archive size, entry count, and text size limit violations", async () => {
    await expect(extractSkillArchiveDocs({ name: "big.zip", size: 2 * 1024 * 1024 + 1 } as File)).rejects.toThrow(
      /过大/
    );

    const manyEntries = Object.fromEntries(
      Array.from({ length: 81 }, (_, index) => [`file-${index}.txt`, "x"]).concat([["SKILL.md", skillMarkdown]])
    );
    await expect(extractSkillArchiveDocs(zipFile(manyEntries))).rejects.toThrow(/文件过多/);

    await expect(extractSkillArchiveDocs(zipFile({ "SKILL.md": "x".repeat(80 * 1024 + 1) }))).rejects.toThrow(
      /文本过长/
    );
  });

  it("does not call fetch or backend routes while parsing and drafting", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await createSkillArchivePresetDraft(zipFile({ "SKILL.md": skillMarkdown }));

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
