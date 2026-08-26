/**
 * Tests for the Forge Studio → Build Ledger bridge (Tier 3).
 *
 * The payload must pass Build Ledger's `isProject` guard:
 * id + name + aiUsed[] + storageLocation + clientStatus (all required),
 * everything else optional. The import parser is tolerant — invalid entries
 * are dropped — so the contract here is "every field we emit is accepted".
 */

import { describe, it, expect } from "vitest";
import { buildLedgerImportPayload } from "./build-ledger";

describe("buildLedgerImportPayload", () => {
  it("emits a single project with all required Build Ledger fields", () => {
    const payload = buildLedgerImportPayload({
      name: "Acme Landing",
      description: "Built for Acme",
      clientName: "Acme Corp",
      liveUrl: "https://acme.example.com",
      notes: "Score 92/100",
      tags: ["forge-studio", "audited"],
    });

    expect(payload.projects).toHaveLength(1);
    const p = payload.projects[0]!;
    expect(typeof p.id).toBe("string");
    expect(p.id.length).toBeGreaterThan(0);
    expect(p.name).toBe("Acme Landing");
    expect(Array.isArray(p.aiUsed)).toBe(true);
    expect(typeof p.storageLocation).toBe("string");
    expect(["local", "sandbox", "cloud", "github"]).toContain(p.storageLocation);
    expect(typeof p.clientStatus).toBe("string");
    expect(["personal", "client", "in-progress", "delivered"]).toContain(p.clientStatus);
    expect(Array.isArray(p.tags)).toBe(true);
    expect(typeof p.createdAt).toBe("string");
    expect(typeof p.updatedAt).toBe("string");
  });

  it("maps a client-bound draft to client status and carries clientName", () => {
    const payload = buildLedgerImportPayload({ name: "X", clientName: "Initech" });
    expect(payload.projects[0]!.clientStatus).toBe("client");
    expect(payload.projects[0]!.clientName).toBe("Initech");
  });

  it("maps a solo draft to personal status without clientName", () => {
    const payload = buildLedgerImportPayload({ name: "Solo" });
    expect(payload.projects[0]!.clientStatus).toBe("personal");
    expect(payload.projects[0]!.clientName).toBeUndefined();
  });

  it("defaults tags when none provided and keeps custom tags", () => {
    expect(buildLedgerImportPayload({ name: "A" }).projects[0]!.tags).toEqual(["forge-studio"]);
    expect(buildLedgerImportPayload({ name: "A", tags: ["x", "y"] }).projects[0]!.tags).toEqual(["x", "y"]);
  });

  it("omits optional URL fields when absent (undefined, not null/empty)", () => {
    const p = buildLedgerImportPayload({ name: "A" }).projects[0]!;
    expect(p.liveUrl).toBeUndefined();
    expect(p.repoUrl).toBeUndefined();
    expect(p.notes).toBeUndefined();
  });

  it("generates unique ids per call", () => {
    const a = buildLedgerImportPayload({ name: "A" }).projects[0]!.id;
    const b = buildLedgerImportPayload({ name: "A" }).projects[0]!.id;
    expect(a).not.toBe(b);
  });

  it("emits empty campaigns/posts/clients arrays (importer expects them)", () => {
    const payload = buildLedgerImportPayload({ name: "A" });
    expect(payload.campaigns).toEqual([]);
    expect(payload.posts).toEqual([]);
    expect(payload.clients).toEqual([]);
  });

  it("falls back to a project name when the draft name is empty", () => {
    expect(buildLedgerImportPayload({ name: "" }).projects[0]!.name).toBe("Untitled project");
  });
});
