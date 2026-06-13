import { describe, expect, it } from "vitest";
import { states } from "../data/states";
import { createEmptyPrimaryBoard } from "../lib/rules/conventionRules";
import { calculatePrimaryForState, emptyDelegateTotals, addDelegateTotals } from "../lib/rules/primaryRules";
import { adjustCandidateToken } from "../lib/rules/tokenRules";
import type { StateData } from "../types";

const testState: StateData = {
  ...states[0],
  id: "TS",
  name: "Test State",
  primaryType: "open",
  voterGroups: [
    { voterGroupId: "youth-voters", percentage: 60 },
    { voterGroupId: "labor-unions", percentage: 40 }
  ]
};

describe("primary rules", () => {
  it("calculates open primary winners with a three-token threshold", () => {
    let board = createEmptyPrimaryBoard();
    board = adjustCandidateToken(board, "youth-voters", "blueA", 3);
    board = adjustCandidateToken(board, "labor-unions", "redC", 2);
    const result = calculatePrimaryForState(testState, board);
    expect(result.delegateTotals.blueA).toBe(60);
    expect(result.delegateTotals.redC).toBe(0);
  });

  it("calculates closed primary winners inside each party", () => {
    let board = createEmptyPrimaryBoard();
    board = adjustCandidateToken(board, "youth-voters", "blueA", 2);
    board = adjustCandidateToken(board, "youth-voters", "blueB", 1);
    board = adjustCandidateToken(board, "youth-voters", "redA", 3);
    const result = calculatePrimaryForState({ ...testState, primaryType: "closed" }, board);
    expect(result.delegateTotals.blueA).toBe(60);
    expect(result.delegateTotals.redA).toBe(60);
  });

  it("adds delegate totals", () => {
    const totals = addDelegateTotals(emptyDelegateTotals(), { ...emptyDelegateTotals(), blueC: 25 });
    expect(totals.blueC).toBe(25);
  });

  it("marks exact ties for teacher decision", () => {
    let board = createEmptyPrimaryBoard();
    board = adjustCandidateToken(board, "youth-voters", "blueA", 3);
    board = adjustCandidateToken(board, "youth-voters", "redA", 3);
    const result = calculatePrimaryForState(testState, board);
    expect(result.needsTeacherDecision).toBe(true);
  });
});
