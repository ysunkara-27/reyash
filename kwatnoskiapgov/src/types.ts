export type Party = "blue" | "red";
export type CandidateLetter = "A" | "B" | "C";
export type CandidateId = "blueA" | "blueB" | "blueC" | "redA" | "redB" | "redC";
export type PrimaryType = "open" | "closed" | "semiClosed" | "jungle" | "unknown";
export type SafeColor = "blue" | "red" | "purple" | "unknown";
export type Phase = "setup" | "primary" | "convention" | "general" | "electionNight" | "complete";
export type Month =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "Convention"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "Election Day";

export type VoterGroupId =
  | "asian-americans"
  | "african-americans"
  | "retirees"
  | "rural-farmers"
  | "corporate-executives"
  | "environmental-activists"
  | "evangelical-christians"
  | "gun-owners"
  | "hispanic-latino"
  | "indigenous-voters"
  | "labor-unions"
  | "military-veterans"
  | "secular-non-religious"
  | "small-business-owners"
  | "suburban-professionals"
  | "suburban-women"
  | "urban-professionals"
  | "white-non-college"
  | "youth-voters";

export interface VoterGroup {
  id: VoterGroupId;
  name: string;
  description?: string;
  maxTokens: number;
}

export interface Effect {
  voterGroupId: VoterGroupId;
  delta: number;
}

export interface Candidate {
  id: CandidateId;
  party: Party;
  letter: CandidateLetter;
  name: string;
  effects: Effect[];
}

export interface StateVoterGroup {
  voterGroupId: VoterGroupId;
  percentage: number;
}

export interface StateData {
  id: string;
  name: string;
  electoralVotes: number;
  primaryType: PrimaryType;
  safeColor: SafeColor;
  voterGroups: StateVoterGroup[];
  sourceNote?: string;
}

export type CardType =
  | "Endorsement"
  | "Platform Idea"
  | "Important Event"
  | "Scandal"
  | "Debate"
  | "Speech"
  | "Campaign Cover-Up";

export interface GameCard {
  id: string;
  title: string;
  type: CardType;
  description: string;
  effects: Effect[];
}

export interface Player {
  id: string;
  name: string;
  party: Party;
  candidateId: CandidateId;
}

export type CandidateTokenBoard = Record<VoterGroupId, Record<CandidateId, number>>;
export type PartyTokenBoard = Record<VoterGroupId, Record<Party, number>>;
export type NotesByVoterGroup = Record<VoterGroupId, string>;
export type LockedGroups = Record<VoterGroupId, boolean>;
export type DelegateTotals = Record<CandidateId, number>;

export interface PlayedCard {
  id: string;
  title: string;
  type: CardType;
  target: CandidateId | Party;
  effects: Effect[];
  playedAt: string;
}

export interface ElectionStateResult {
  stateId: string;
  stateName: string;
  electoralVotes: number;
  bluePercentage: number;
  redPercentage: number;
  winner: Party | "tie" | "unassigned";
  explanation: string;
  controlledGroups: {
    blue: string[];
    red: string[];
  };
}

export interface ElectionResults {
  mode: "fullMap" | "legacy";
  blueElectoralVotes: number;
  redElectoralVotes: number;
  stateResults: ElectionStateResult[];
  winner: Party | "tie" | null;
  calculatedAt: string;
}

export interface ActionLogEntry {
  id: string;
  at: string;
  message: string;
}

export interface DataIssue {
  severity: "error" | "warning";
  message: string;
}

export interface SerializableGameState {
  phase: Phase;
  currentMonth: Month;
  players: Player[];
  incumbentCandidateId: CandidateId | null;
  primaryTokens: CandidateTokenBoard;
  generalTokens: PartyTokenBoard;
  lockedGroups: LockedGroups;
  notes: NotesByVoterGroup;
  delegateTotals: DelegateTotals;
  selectedStatesByMonth: Partial<Record<Month, string[]>>;
  completedPrimaryStates: string[];
  playedCards: PlayedCard[];
  nominees: Record<Party, CandidateId | null>;
  platformCards: Record<Party, string[]>;
  electionOverrides: Record<string, Party | "tie" | "unassigned">;
  electionResults: ElectionResults | null;
  actionLog: ActionLogEntry[];
}
