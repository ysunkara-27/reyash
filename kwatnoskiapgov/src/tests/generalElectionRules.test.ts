import { describe, expect, it } from "vitest";
import { createBaseGeneralBoard } from "../lib/rules/conventionRules";
import { calculateStateWinner } from "../lib/rules/generalElectionRules";
import { adjustPartyToken } from "../lib/rules/tokenRules";
import type { StateData } from "../types";

const state: StateData = {
  id: "TS",
  name: "Test State",
  electoralVotes: 10,
  primaryType: "open",
  safeColor: "purple",
  voterGroups: [
    { voterGroupId: "labor-unions", percentage: 55 },
    { voterGroupId: "evangelical-christians", percentage: 45 }
  ]
};

describe("general election rules", () => {
  it("calculates a state winner from controlled voter groups", () => {
    let board = createBaseGeneralBoard();
    board = adjustPartyToken(board, "labor-unions", "blue", 2);
    const result = calculateStateWinner(state, board);
    expect(result.winner).toBe("blue");
    expect(result.bluePercentage).toBe(55);
  });

  it("returns tie behavior", () => {
    let board = createBaseGeneralBoard();
    board = adjustPartyToken(board, "asian-americans", "red", 3);
    const result = calculateStateWinner(
      { ...state, voterGroups: [{ voterGroupId: "asian-americans", percentage: 100 }] },
      board
    );
    expect(result.winner).toBe("tie");
  });
});
