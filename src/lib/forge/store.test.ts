import { describe, it, expect, beforeEach } from "vitest";
import { useForge } from "./store";

beforeEach(() => {
  // Reset the store between tests.
  useForge.setState({ view: "dashboard" });
});

describe("useForge — top-level view switching", () => {
  it("starts on the dashboard", () => {
    expect(useForge.getState().view).toBe("dashboard");
  });

  it("switches to each tool view and back", () => {
    useForge.getState().setView("sites");
    expect(useForge.getState().view).toBe("sites");
    useForge.getState().setView("auditor");
    expect(useForge.getState().view).toBe("auditor");
    useForge.getState().setView("dashboard");
    expect(useForge.getState().view).toBe("dashboard");
  });

  it("accepts only the two-tool view set (compile-time contract)", () => {
    // v2.0.0: builder/templates views retired with the legacy Page Builder.
    const views = ["dashboard", "auditor", "sites"] as const;
    for (const v of views) {
      useForge.getState().setView(v);
      expect(useForge.getState().view).toBe(v);
    }
  });
});
