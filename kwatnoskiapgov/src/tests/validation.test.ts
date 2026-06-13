import { describe, expect, it } from "vitest";
import { validateData } from "../lib/validation";

describe("data validation", () => {
  it("does not report fatal seeded data errors", () => {
    const issues = validateData();
    expect(issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
  });
});
