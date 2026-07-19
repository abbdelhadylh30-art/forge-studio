import { describe, it, expect, beforeEach, vi } from "vitest";
import { useForge, TRANSFER_TTL_MS } from "./store";

beforeEach(() => {
  // Reset the store between tests.
  useForge.setState({ view: "dashboard", pendingTransfer: null });
  // Restore real timers (in case a test stubbed them).
  vi.useRealTimers();
});

describe("useForge — transfer bridge", () => {
  it("transferToAuditor sets view + payload with a fresh timestamp", () => {
    useForge.getState().transferToAuditor("<h1>hi</h1>", "My Page");
    const p = useForge.getState().pendingTransfer;
    expect(p).not.toBeNull();
    expect(p!.source).toBe("builder");
    expect(p!.html).toBe("<h1>hi</h1>");
    expect(p!.name).toBe("My Page");
    expect(p!.timestamp).toBeGreaterThan(0);
    expect(useForge.getState().view).toBe("auditor");
  });

  it("transferToBuilder sets view + payload with auditor source", () => {
    useForge.getState().transferToBuilder("<h1>hi</h1>", "Audited");
    const p = useForge.getState().pendingTransfer;
    expect(p!.source).toBe("auditor");
    expect(useForge.getState().view).toBe("builder");
  });

  it("consumeTransfer returns the payload and clears it", () => {
    useForge.getState().transferToAuditor("<h1>hi</h1>", "P");
    const p = useForge.getState().consumeTransfer();
    expect(p).not.toBeNull();
    expect(p!.html).toBe("<h1>hi</h1>");
    expect(useForge.getState().pendingTransfer).toBeNull();
    // Second consume returns null.
    expect(useForge.getState().consumeTransfer()).toBeNull();
  });

  it("consumeTransfer returns null when no payload exists", () => {
    expect(useForge.getState().consumeTransfer()).toBeNull();
  });
});

describe("useForge — stale-transfer guard (KA 2 §4.1)", () => {
  // Regression: if the user navigates away before the receiving tool mounts,
  // the pendingTransfer sat in memory indefinitely. Now discarded after TTL.
  it("discards a payload older than TRANSFER_TTL_MS", () => {
    useForge.getState().transferToAuditor("<h1>stale</h1>", "Old");
    // Manually backdate the timestamp past the TTL.
    const p = useForge.getState().pendingTransfer!;
    useForge.setState({
      pendingTransfer: { ...p, timestamp: Date.now() - TRANSFER_TTL_MS - 1000 },
    });
    expect(useForge.getState().consumeTransfer()).toBeNull();
    expect(useForge.getState().pendingTransfer).toBeNull();
  });

  it("returns a payload that is just under the TTL", () => {
    useForge.getState().transferToAuditor("<h1>fresh</h1>", "New");
    const p = useForge.getState().pendingTransfer!;
    // Backdate to just inside the TTL window.
    useForge.setState({
      pendingTransfer: { ...p, timestamp: Date.now() - TRANSFER_TTL_MS + 1000 },
    });
    const consumed = useForge.getState().consumeTransfer();
    expect(consumed).not.toBeNull();
    expect(consumed!.html).toBe("<h1>fresh</h1>");
  });

  it("does NOT discard a payload that is 1ms old", () => {
    useForge.getState().transferToAuditor("<h1>brand new</h1>", "X");
    // The payload was just created; consume immediately.
    const consumed = useForge.getState().consumeTransfer();
    expect(consumed).not.toBeNull();
    expect(consumed!.html).toBe("<h1>brand new</h1>");
  });
});
