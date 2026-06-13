import type { Candidate, CandidateId, Party } from "../types";

export const candidates: Candidate[] = [
  {
    id: "blueA",
    party: "blue",
    letter: "A",
    name: "Blue Candidate A",
    effects: [
      { voterGroupId: "corporate-executives", delta: 1 },
      { voterGroupId: "labor-unions", delta: -1 }
    ]
  },
  {
    id: "blueB",
    party: "blue",
    letter: "B",
    name: "Blue Candidate B",
    effects: [
      { voterGroupId: "labor-unions", delta: 1 },
      { voterGroupId: "retirees", delta: 1 }
    ]
  },
  {
    id: "blueC",
    party: "blue",
    letter: "C",
    name: "Blue Candidate C",
    effects: [
      { voterGroupId: "urban-professionals", delta: 2 },
      { voterGroupId: "suburban-professionals", delta: 2 }
    ]
  },
  {
    id: "redA",
    party: "red",
    letter: "A",
    name: "Red Candidate A",
    effects: [
      { voterGroupId: "african-americans", delta: 1 },
      { voterGroupId: "small-business-owners", delta: 2 }
    ]
  },
  {
    id: "redB",
    party: "red",
    letter: "B",
    name: "Red Candidate B",
    effects: [
      { voterGroupId: "youth-voters", delta: 1 },
      { voterGroupId: "military-veterans", delta: -1 }
    ]
  },
  {
    id: "redC",
    party: "red",
    letter: "C",
    name: "Red Candidate C",
    effects: [
      { voterGroupId: "evangelical-christians", delta: 2 },
      { voterGroupId: "rural-farmers", delta: 1 }
    ]
  }
];

export const candidateIds = candidates.map((candidate) => candidate.id) as CandidateId[];

export const candidateById = Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate])) as Record<
  CandidateId,
  Candidate
>;

export const partyCandidateIds: Record<Party, CandidateId[]> = {
  blue: ["blueA", "blueB", "blueC"],
  red: ["redA", "redB", "redC"]
};
