import { describe, expect, it } from "vitest";
import { hasPermission, permissionsByRole } from "../lib/permissions";

describe("permissions", () => {
  it("gives teacher access to all controls", () => {
    expect(Object.values(permissionsByRole.teacher).every(Boolean)).toBe(true);
  });

  it("allows scorekeeper token edits but not destructive tools", () => {
    expect(hasPermission("scorekeeper", "canEditTokens")).toBe(true);
    expect(hasPermission("scorekeeper", "canApplyCards")).toBe(true);
    expect(hasPermission("scorekeeper", "canResetGame")).toBe(false);
    expect(hasPermission("scorekeeper", "canImportExport")).toBe(false);
  });

  it("keeps student and monitor read-only", () => {
    expect(hasPermission("student", "canEditTokens")).toBe(false);
    expect(hasPermission("student", "canApplyCards")).toBe(false);
    expect(hasPermission("monitor", "canEditTokens")).toBe(false);
    expect(hasPermission("monitor", "canRunElectionNight")).toBe(false);
  });
});
