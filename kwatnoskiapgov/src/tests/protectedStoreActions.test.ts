import { beforeEach, describe, expect, it } from "vitest";
import { createInitialGameState, useGameStore } from "../store/gameStore";
import type { GameSessionRecord } from "../types";

function resetStore(role: "teacher" | "scorekeeper" | "student" | "monitor" | null) {
  const state = createInitialGameState();
  const session: GameSessionRecord = {
    id: "test-session",
    name: "Test Game",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    state
  };
  useGameStore.setState({
    ...state,
    activeRole: role,
    activeSessionId: session.id,
    sessions: [session],
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

  it("starts with the full primary calendar populated", () => {
    resetStore("teacher");
    const selected = useGameStore.getState().selectedStatesByMonth;
    expect(selected.January).toHaveLength(3);
    expect(selected.February).toHaveLength(14);
    expect(selected.March).toHaveLength(9);
    expect(selected.April).toHaveLength(9);
    expect(selected.May).toHaveLength(8);
    expect(selected.June).toHaveLength(8);
  });

  it("supports multiple classroom sessions", () => {
    resetStore("teacher");
    useGameStore.getState().createSession("Period 2 Group 1");
    expect(useGameStore.getState().sessions).toHaveLength(2);
    expect(useGameStore.getState().sessions.at(-1)?.name).toBe("Period 2 Group 1");
  });

  it("locked games prevent gameplay edits until unlocked", () => {
    resetStore("teacher");
    useGameStore.getState().setAllGamesLocked(true);
    useGameStore.getState().adjustPrimaryToken("youth-voters", "blueA", 1);
    expect(useGameStore.getState().primaryTokens["youth-voters"].blueA).toBe(0);
    useGameStore.getState().setAllGamesLocked(false);
    useGameStore.getState().adjustPrimaryToken("youth-voters", "blueA", 1);
    expect(useGameStore.getState().primaryTokens["youth-voters"].blueA).toBe(1);
  });
});
