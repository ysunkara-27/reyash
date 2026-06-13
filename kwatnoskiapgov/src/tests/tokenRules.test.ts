import { describe, expect, it } from "vitest";
import { createBaseGeneralBoard, createEmptyPrimaryBoard } from "../lib/rules/conventionRules";
import { adjustCandidateToken, adjustPartyToken } from "../lib/rules/tokenRules";

describe("token rules", () => {
  it("does not allow candidate tokens below zero", () => {
    const board = adjustCandidateToken(createEmptyPrimaryBoard(), "youth-voters", "blueA", -5);
    expect(board["youth-voters"].blueA).toBe(0);
  });

  it("adds and removes party tokens", () => {
    let board = createBaseGeneralBoard();
    board = adjustPartyToken(board, "labor-unions", "blue", 2);
    board = adjustPartyToken(board, "labor-unions", "blue", -1);
    expect(board["labor-unions"].blue).toBe(4);
  });
});
