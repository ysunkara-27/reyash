import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { candidates, candidateIds } from "../data/candidates";
import { cards } from "../data/cards";
import { allMonths } from "../data/schedule";
import { stateById, states } from "../data/states";
import { voterGroups } from "../data/voterGroups";
import type {
  CandidateId,
  CandidateTokenBoard,
  ElectionResults,
  Month,
  Party,
  PartyTokenBoard,
  Player,
  SerializableGameState,
  VoterGroupId
} from "../types";
import { calculateFullMapElection, calculateLegacyElection } from "../lib/rules/generalElectionRules";
import { addDelegateTotals, calculatePrimaryForState, emptyDelegateTotals } from "../lib/rules/primaryRules";
import {
  applyNomineeEffects,
  createBaseGeneralBoard,
  createEmptyPrimaryBoard,
  detectNominee
} from "../lib/rules/conventionRules";
import { adjustCandidateToken, adjustPartyToken, applyCandidateEffects, applyPartyEffects } from "../lib/rules/tokenRules";
import { validateData } from "../lib/validation";
import { hasPermission, type PermissionName, type UserRole } from "../lib/permissions";

interface GameStore extends SerializableGameState {
  activeRole: UserRole | null;
  undoStack: SerializableGameState[];
  autosaveAt: string | null;
  commit: (recipe: (draft: SerializableGameState) => SerializableGameState, message: string) => void;
  recordAction: (message: string, permission?: PermissionName) => void;
  setActiveRole: (role: UserRole | null) => void;
  undo: () => void;
  resetGame: () => void;
  loadSampleGame: () => void;
  importGame: (state: SerializableGameState) => void;
  setPlayer: (index: number, player: Player) => void;
  setIncumbent: (candidateId: CandidateId | null) => void;
  applySetupCandidateEffects: () => void;
  applyIncumbencyRule: () => void;
  startGame: () => void;
  adjustPrimaryToken: (voterGroupId: VoterGroupId, candidateId: CandidateId, delta: number) => void;
  adjustGeneralToken: (voterGroupId: VoterGroupId, party: Party, delta: number) => void;
  setNote: (voterGroupId: VoterGroupId, note: string) => void;
  setSelectedStates: (month: Month, stateIds: string[]) => void;
  drawStatesForMonth: (month: Month, count: number, fixedStates?: string[]) => void;
  advanceMonth: () => void;
  finalizePrimaryStates: (stateIds: string[]) => void;
  applyCard: (cardId: string, target: CandidateId | Party) => void;
  addManualCard: (title: string, target: CandidateId | Party, effects: Array<{ voterGroupId: VoterGroupId; delta: number }>) => void;
  setNominee: (party: Party, candidateId: CandidateId) => void;
  startGeneralElection: () => void;
  setPlatformCards: (party: Party, cardIds: string[]) => void;
  toggleLock: (voterGroupId: VoterGroupId) => void;
  runElection: (mode: "fullMap" | "legacy") => void;
  resetElection: () => void;
  overrideStateWinner: (stateId: string, winner: Party | "tie" | "unassigned") => void;
  clearActionLog: () => void;
  serializable: () => SerializableGameState;
}

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyGeneralBoard(): PartyTokenBoard {
  return Object.fromEntries(voterGroups.map((group) => [group.id, { blue: 0, red: 0 }])) as PartyTokenBoard;
}

function emptyNotes(): Record<VoterGroupId, string> {
  return Object.fromEntries(voterGroups.map((group) => [group.id, ""])) as Record<VoterGroupId, string>;
}

function emptyLocks(): Record<VoterGroupId, boolean> {
  return Object.fromEntries(voterGroups.map((group) => [group.id, false])) as Record<VoterGroupId, boolean>;
}

export function createInitialGameState(): SerializableGameState {
  return {
    phase: "setup",
    currentMonth: "January",
    players: candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      candidateId: candidate.id
    })),
    incumbentCandidateId: null,
    primaryTokens: createEmptyPrimaryBoard(),
    generalTokens: emptyGeneralBoard(),
    lockedGroups: emptyLocks(),
    notes: emptyNotes(),
    delegateTotals: emptyDelegateTotals(),
    selectedStatesByMonth: { January: ["IA", "NH", "SC"] },
    completedPrimaryStates: [],
    playedCards: [],
    nominees: { blue: null, red: null },
    platformCards: { blue: [], red: [] },
    electionOverrides: {},
    electionResults: null,
    actionLog: []
  };
}

function getSerializable(store: GameStore): SerializableGameState {
  return {
    phase: store.phase,
    currentMonth: store.currentMonth,
    players: store.players,
    incumbentCandidateId: store.incumbentCandidateId,
    primaryTokens: store.primaryTokens,
    generalTokens: store.generalTokens,
    lockedGroups: store.lockedGroups,
    notes: store.notes,
    delegateTotals: store.delegateTotals,
    selectedStatesByMonth: store.selectedStatesByMonth,
    completedPrimaryStates: store.completedPrimaryStates,
    playedCards: store.playedCards,
    nominees: store.nominees,
    platformCards: store.platformCards,
    electionOverrides: store.electionOverrides,
    electionResults: store.electionResults,
    actionLog: store.actionLog
  };
}

function ensureState(state: SerializableGameState): SerializableGameState {
  const nominees = state.nominees ?? { blue: null, red: null };
  const platformCards = state.platformCards ?? { blue: [], red: [] };
  return {
    ...createInitialGameState(),
    ...state,
    primaryTokens: { ...createEmptyPrimaryBoard(), ...state.primaryTokens },
    generalTokens: { ...emptyGeneralBoard(), ...state.generalTokens },
    lockedGroups: { ...emptyLocks(), ...state.lockedGroups },
    notes: { ...emptyNotes(), ...state.notes },
    delegateTotals: { ...emptyDelegateTotals(), ...state.delegateTotals },
    nominees: { blue: nominees.blue, red: nominees.red },
    platformCards: { blue: platformCards.blue ?? [], red: platformCards.red ?? [] },
    electionOverrides: state.electionOverrides ?? {},
    actionLog: state.actionLog ?? []
  };
}

function canUse(store: GameStore, permission: PermissionName): boolean {
  return hasPermission(store.activeRole, permission);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialGameState(),
      activeRole: null,
      undoStack: [],
      autosaveAt: null,
      serializable: () => getSerializable(get()),
      setActiveRole: (role) => set({ activeRole: role }),
      commit: (recipe, message) => {
        const before = getSerializable(get());
        const after = ensureState(recipe(structuredClone(before)));
        const entry = { id: nowId(), at: new Date().toISOString(), message };
        set({
          ...after,
          actionLog: [...after.actionLog, entry],
          undoStack: [...get().undoStack, before].slice(-60),
          autosaveAt: new Date().toLocaleTimeString()
        });
      },
      recordAction: (message, permission = "canViewActionLog") => {
        if (!canUse(get(), permission)) return;
        get().commit((draft) => draft, message);
      },
      undo: () => {
        if (!canUse(get(), "canUndo")) return;
        const undoStack = get().undoStack;
        const previous = undoStack.at(-1);
        if (!previous) return;
        set({
          ...ensureState(previous),
          undoStack: undoStack.slice(0, -1),
          autosaveAt: new Date().toLocaleTimeString()
        });
      },
      resetGame: () =>
        {
          if (!canUse(get(), "canResetGame")) return;
          set({
            ...createInitialGameState(),
            activeRole: get().activeRole,
            undoStack: [],
            autosaveAt: new Date().toLocaleTimeString()
          });
        },
      loadSampleGame: () => {
        if (!canUse(get(), "canEditSetup")) return;
        const sample = createInitialGameState();
        let primaryTokens = sample.primaryTokens;
        primaryTokens = adjustCandidateToken(primaryTokens, "labor-unions", "blueB", 3);
        primaryTokens = adjustCandidateToken(primaryTokens, "urban-professionals", "blueC", 3);
        primaryTokens = adjustCandidateToken(primaryTokens, "evangelical-christians", "redC", 3);
        primaryTokens = adjustCandidateToken(primaryTokens, "small-business-owners", "redA", 3);
        primaryTokens = adjustCandidateToken(primaryTokens, "youth-voters", "redB", 3);
        sample.primaryTokens = primaryTokens;
        sample.incumbentCandidateId = "blueA";
        sample.phase = "primary";
        sample.actionLog = [{ id: nowId(), at: new Date().toISOString(), message: "Loaded sample game." }];
        set({ ...sample, activeRole: get().activeRole, undoStack: [], autosaveAt: new Date().toLocaleTimeString() });
      },
      importGame: (state) => {
        if (!canUse(get(), "canImportExport")) return;
        set({
          ...ensureState(state),
          activeRole: get().activeRole,
          undoStack: [],
          autosaveAt: new Date().toLocaleTimeString()
        });
      },
      setPlayer: (index, player) => {
        if (!canUse(get(), "canEditSetup")) return;
        get().commit((draft) => {
          const players = [...draft.players];
          players[index] = player;
          return { ...draft, players };
        }, `Updated player ${index + 1}.`);
      },
      setIncumbent: (candidateId) => {
        if (!canUse(get(), "canEditSetup")) return;
        get().commit((draft) => ({ ...draft, incumbentCandidateId: candidateId }), "Set incumbent candidate.");
      },
      applySetupCandidateEffects: () => {
        if (!canUse(get(), "canEditSetup")) return;
        get().commit((draft) => {
          const board = candidates.reduce(
            (nextBoard, candidate) => applyCandidateEffects(nextBoard, candidate.id, candidate.effects),
            draft.primaryTokens
          );
          return { ...draft, primaryTokens: board };
        }, "Applied candidate card effects.");
      },
      applyIncumbencyRule: () => {
        if (!canUse(get(), "canEditSetup")) return;
        get().commit((draft) => {
          if (!draft.incumbentCandidateId) return draft;
          const incumbentParty = draft.incumbentCandidateId.startsWith("blue") ? "blue" : "red";
          const base = createBaseGeneralBoard();
          let board = draft.primaryTokens;
          voterGroups.forEach((group) => {
            const amount = base[group.id][incumbentParty];
            if (amount > 0) {
              board = adjustCandidateToken(board, group.id, draft.incumbentCandidateId!, amount);
            }
          });
          return { ...draft, primaryTokens: board };
        }, "Applied incumbency rule to party-controlled voter groups.");
      },
      startGame: () => {
        if (!canUse(get(), "canEditSetup")) return;
        get().commit((draft) => ({ ...draft, phase: "primary", currentMonth: "January" }), "Started primary election.");
      },
      adjustPrimaryToken: (voterGroupId, candidateId, delta) => {
        if (!canUse(get(), "canEditTokens")) return;
        get().commit(
          (draft) => ({ ...draft, primaryTokens: adjustCandidateToken(draft.primaryTokens, voterGroupId, candidateId, delta) }),
          `${delta > 0 ? "Added" : "Removed"} primary token for ${candidateId}.`
        );
      },
      adjustGeneralToken: (voterGroupId, party, delta) => {
        if (!canUse(get(), "canEditTokens")) return;
        get().commit(
          (draft) => ({ ...draft, generalTokens: adjustPartyToken(draft.generalTokens, voterGroupId, party, delta) }),
          `${delta > 0 ? "Added" : "Removed"} general election token for ${party}.`
        );
      },
      setNote: (voterGroupId, note) => {
        if (!canUse(get(), "canEditTokens")) return;
        get().commit((draft) => ({ ...draft, notes: { ...draft.notes, [voterGroupId]: note } }), "Updated voter group note.");
      },
      setSelectedStates: (month, stateIds) => {
        if (!canUse(get(), "canManageCalendar")) return;
        get().commit(
          (draft) => ({ ...draft, selectedStatesByMonth: { ...draft.selectedStatesByMonth, [month]: stateIds } }),
          `Selected states for ${month}.`
        );
      },
      drawStatesForMonth: (month, count, fixedStates = []) => {
        if (!canUse(get(), "canManageCalendar")) return;
        get().commit((draft) => {
          const alreadySelected = new Set(Object.values(draft.selectedStatesByMonth).flat());
          const completed = new Set(draft.completedPrimaryStates);
          const available = states
            .map((state) => state.id)
            .filter((id) => !alreadySelected.has(id) && !completed.has(id) && !fixedStates.includes(id));
          const shuffled = [...available].sort(() => Math.random() - 0.5);
          const selected = [...fixedStates, ...shuffled.slice(0, Math.max(0, count - fixedStates.length))];
          return { ...draft, selectedStatesByMonth: { ...draft.selectedStatesByMonth, [month]: selected } };
        }, `Drew states for ${month}.`);
      },
      advanceMonth: () => {
        if (!canUse(get(), "canManageCalendar")) return;
        get().commit((draft) => {
          const index = allMonths.indexOf(draft.currentMonth);
          const nextMonth = allMonths[Math.min(index + 1, allMonths.length - 1)];
          const nextPhase =
            nextMonth === "Convention"
              ? "convention"
              : nextMonth === "July"
                ? "general"
                : nextMonth === "Election Day"
                  ? "electionNight"
                  : draft.phase;
          return { ...draft, currentMonth: nextMonth, phase: nextPhase };
        }, "Advanced month.");
      },
      finalizePrimaryStates: (stateIds) => {
        if (!canUse(get(), "canFinalizePrimaries")) return;
        get().commit((draft) => {
          const results = stateIds
            .map((id) => stateById[id])
            .filter(Boolean)
            .map((state) => calculatePrimaryForState(state, draft.primaryTokens));
          const delegateTotals = results.reduce((totals, result) => addDelegateTotals(totals, result.delegateTotals), draft.delegateTotals);
          return {
            ...draft,
            delegateTotals,
            completedPrimaryStates: Array.from(new Set([...draft.completedPrimaryStates, ...stateIds]))
          };
        }, `Finalized primary results for ${stateIds.length} state(s).`);
      },
      applyCard: (cardId, target) => {
        if (!canUse(get(), "canApplyCards")) return;
        get().commit((draft) => {
          const card = cards.find((item) => item.id === cardId);
          if (!card) return draft;
          const isPartyTarget = target === "blue" || target === "red";
          return {
            ...draft,
            primaryTokens: isPartyTarget
              ? draft.primaryTokens
              : applyCandidateEffects(draft.primaryTokens, target as CandidateId, card.effects),
            generalTokens: isPartyTarget ? applyPartyEffects(draft.generalTokens, target as Party, card.effects) : draft.generalTokens,
            playedCards: [
              ...draft.playedCards,
              { id: card.id, title: card.title, type: card.type, target, effects: card.effects, playedAt: new Date().toISOString() }
            ]
          };
        }, `Applied card ${cardId}.`);
      },
      addManualCard: (title, target, effects) => {
        if (!canUse(get(), "canApplyCards")) return;
        get().commit((draft) => {
          const isPartyTarget = target === "blue" || target === "red";
          return {
            ...draft,
            primaryTokens: isPartyTarget ? draft.primaryTokens : applyCandidateEffects(draft.primaryTokens, target as CandidateId, effects),
            generalTokens: isPartyTarget ? applyPartyEffects(draft.generalTokens, target as Party, effects) : draft.generalTokens,
            playedCards: [
              ...draft.playedCards,
              { id: nowId(), title, type: "Important Event", target, effects, playedAt: new Date().toISOString() }
            ]
          };
        }, `Applied manual card: ${title}.`);
      },
      setNominee: (party, candidateId) => {
        if (!canUse(get(), "canRunConvention")) return;
        get().commit((draft) => ({ ...draft, nominees: { ...draft.nominees, [party]: candidateId } }), `Set ${party} nominee.`);
      },
      setPlatformCards: (party, cardIds) => {
        if (!canUse(get(), "canRunConvention")) return;
        get().commit(
          (draft) => ({ ...draft, platformCards: { ...draft.platformCards, [party]: cardIds.slice(0, 5) } }),
          `Selected ${party} platform cards.`
        );
      },
      startGeneralElection: () => {
        if (!canUse(get(), "canRunConvention")) return;
        get().commit((draft) => {
          const blueNominee = draft.nominees.blue ?? detectNominee(draft.delegateTotals, "blue");
          const redNominee = draft.nominees.red ?? detectNominee(draft.delegateTotals, "red");
          let generalTokens = createBaseGeneralBoard();
          draft.platformCards.blue
            .map((id) => cards.find((card) => card.id === id))
            .filter(Boolean)
            .forEach((card) => {
              generalTokens = applyPartyEffects(generalTokens, "blue", card!.effects);
            });
          draft.platformCards.red
            .map((id) => cards.find((card) => card.id === id))
            .filter(Boolean)
            .forEach((card) => {
              generalTokens = applyPartyEffects(generalTokens, "red", card!.effects);
            });
          generalTokens = applyNomineeEffects(generalTokens, blueNominee);
          generalTokens = applyNomineeEffects(generalTokens, redNominee);
          return {
            ...draft,
            phase: "general",
            currentMonth: "July",
            nominees: { blue: blueNominee, red: redNominee },
            primaryTokens: createEmptyPrimaryBoard(),
            generalTokens
          };
        }, "Started general election.");
      },
      toggleLock: (voterGroupId) => {
        if (!canUse(get(), "canEditTokens")) return;
        get().commit(
          (draft) => ({ ...draft, lockedGroups: { ...draft.lockedGroups, [voterGroupId]: !draft.lockedGroups[voterGroupId] } }),
          "Toggled voter group lock."
        );
      },
      runElection: (mode) => {
        if (!canUse(get(), "canRunElectionNight")) return;
        get().commit((draft) => {
          const results: ElectionResults =
            mode === "fullMap"
              ? calculateFullMapElection(draft.generalTokens, draft.electionOverrides)
              : calculateLegacyElection(draft.generalTokens, draft.electionOverrides);
          return { ...draft, phase: "complete", currentMonth: "Election Day", electionResults: results };
        }, `Calculated ${mode === "fullMap" ? "full map" : "classroom legacy"} election.`);
      },
      resetElection: () => {
        if (!canUse(get(), "canRunElectionNight")) return;
        get().commit((draft) => ({ ...draft, electionResults: null, electionOverrides: {} }), "Reset election calculation.");
      },
      overrideStateWinner: (stateId, winner) => {
        if (!canUse(get(), "canOverrideResults")) return;
        get().commit(
          (draft) => {
            const electionOverrides = { ...draft.electionOverrides, [stateId]: winner };
            const electionResults = draft.electionResults
              ? draft.electionResults.mode === "fullMap"
                ? calculateFullMapElection(draft.generalTokens, electionOverrides)
                : calculateLegacyElection(draft.generalTokens, electionOverrides)
              : null;
            return { ...draft, electionOverrides, electionResults };
          },
          `Overrode ${stateId} result.`
        );
      },
      clearActionLog: () => {
        if (!canUse(get(), "canViewTeacherTools")) return;
        get().commit((draft) => ({ ...draft, actionLog: [] }), "Cleared action log.");
      }
    }),
    {
      name: "election-control-center",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        ...getSerializable(state as GameStore),
        undoStack: (state as GameStore).undoStack,
        autosaveAt: (state as GameStore).autosaveAt
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameStore>;
        return {
          ...current,
          ...ensureState(saved as SerializableGameState),
          undoStack: saved.undoStack ?? [],
          autosaveAt: saved.autosaveAt ?? null
        };
      }
    }
  )
);

export const dataIssues = validateData();
