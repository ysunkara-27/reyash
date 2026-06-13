import { candidateIds } from "../data/candidates";
import { states } from "../data/states";
import { voterGroups } from "../data/voterGroups";
import type { DataIssue } from "../types";

export function validateData(): DataIssue[] {
  const issues: DataIssue[] = [];
  const groupIds = new Set(voterGroups.map((group) => group.id));

  if (voterGroups.length !== 19) {
    issues.push({ severity: "error", message: `Expected 19 voter groups, found ${voterGroups.length}.` });
  }
  if (candidateIds.length !== 6) {
    issues.push({ severity: "error", message: `Expected 6 candidates, found ${candidateIds.length}.` });
  }
  if (states.length !== 51) {
    issues.push({ severity: "error", message: `Expected 50 states plus DC, found ${states.length}.` });
  }

  states.forEach((state) => {
    const total = state.voterGroups.reduce((sum, group) => sum + group.percentage, 0);
    if (total !== 100) {
      issues.push({ severity: "error", message: `${state.name} voter-group percentages total ${total}, not 100.` });
    }
    state.voterGroups.forEach((group) => {
      if (!groupIds.has(group.voterGroupId)) {
        issues.push({ severity: "error", message: `${state.name} references missing voter group ${group.voterGroupId}.` });
      }
      if (group.percentage < 0) {
        issues.push({ severity: "error", message: `${state.name} has a negative percentage for ${group.voterGroupId}.` });
      }
    });
    if (state.primaryType === "unknown") {
      issues.push({ severity: "warning", message: `${state.name} has unknown primary type.` });
    }
  });

  return issues;
}
