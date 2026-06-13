import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState, useGameStore } from "../store/gameStore";

function resetStore(role: "teacher" | "scorekeeper" | "student" | "monitor" | null) {
  useGameStore.setState({
    ...createInitialGameState(),
    activeRole: role,
    undoStack: [],
    autosaveAt: null
  });
}

describe("protected store actions", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore(null);
  });

  it("prevents student role from mutating tokens", () => {
    resetStore("student");
    useGameStore.getState().adjustPrimaryToken("youth-voters", "blueA", 1);
    expect(useGameStore.getState().primaryTokens["youth-voters"].blueA).toBe(0);
  });

  it("prevents monitor role from resetting the game", () => {
    resetStore("monitor");
    useGameStore.setState({ phase: "primary" });
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().phase).toBe("primary");
  });

  it("lets scorekeeper edit tokens but not reset the game", () => {
    resetStore("scorekeeper");
    useGameStore.setState({ phase: "primary" });
    useGameStore.getState().adjustPrimaryToken("youth-voters", "blueA", 1);
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().primaryTokens["youth-voters"].blueA).toBe(1);
    expect(useGameStore.getState().phase).toBe("primary");
  });

  it("lets teacher use protected controls", () => {
    resetStore("teacher");
    useGameStore.getState().adjustPrimaryToken("youth-voters", "blueA", 1);
    expect(useGameStore.getState().primaryTokens["youth-voters"].blueA).toBe(1);
    useGameStore.getState().resetGame();
    expect(useGameStore.getState().primaryTokens["youth-voters"].blueA).toBe(0);
    expect(useGameStore.getState().activeRole).toBe("teacher");
  });

  it("persists active classroom games in session storage instead of local storage", () => {
    resetStore("teacher");
    useGameStore.getState().adjustPrimaryToken("youth-voters", "blueA", 1);
    expect(sessionStorage.getItem("election-control-center")).toContain("youth-voters");
    expect(localStorage.getItem("election-control-center")).toBeNull();
  });
});
