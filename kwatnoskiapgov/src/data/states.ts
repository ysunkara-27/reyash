import type { PrimaryType, SafeColor, StateData, StateVoterGroup, VoterGroupId } from "../types";

type Profile = "national" | "urbanBlue" | "southern" | "sunbelt" | "ruralRed" | "industrial" | "mountain" | "newEngland";

const groupOrder: VoterGroupId[] = [
  "asian-americans",
  "african-americans",
  "retirees",
  "rural-farmers",
  "corporate-executives",
  "environmental-activists",
  "evangelical-christians",
  "gun-owners",
  "hispanic-latino",
  "indigenous-voters",
  "labor-unions",
  "military-veterans",
  "secular-non-religious",
  "small-business-owners",
  "suburban-professionals",
  "suburban-women",
  "urban-professionals",
  "white-non-college",
  "youth-voters"
];

const profiles: Record<Profile, number[]> = {
  national: [4, 12, 17, 5, 4, 5, 14, 8, 13, 1, 8, 6, 10, 6, 10, 11, 12, 20, 13],
  urbanBlue: [9, 18, 13, 1, 6, 8, 5, 3, 18, 1, 11, 4, 17, 6, 16, 14, 22, 8, 16],
  southern: [3, 23, 18, 8, 4, 3, 22, 12, 10, 1, 6, 9, 6, 7, 8, 10, 8, 24, 12],
  sunbelt: [5, 10, 18, 5, 5, 5, 14, 9, 24, 2, 6, 8, 8, 9, 11, 12, 13, 18, 13],
  ruralRed: [2, 5, 20, 16, 4, 3, 24, 16, 7, 4, 5, 10, 5, 10, 6, 8, 5, 34, 10],
  industrial: [4, 12, 19, 6, 4, 4, 12, 9, 8, 1, 15, 8, 8, 7, 10, 12, 11, 27, 11],
  mountain: [4, 4, 17, 12, 5, 8, 13, 14, 14, 6, 5, 9, 10, 8, 9, 10, 9, 24, 12],
  newEngland: [6, 6, 20, 4, 5, 9, 5, 5, 9, 2, 9, 6, 18, 7, 14, 13, 16, 16, 13]
};

function normalizeProfile(profile: Profile): StateVoterGroup[] {
  const weights = profiles[profile];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight, index) => ({
    voterGroupId: groupOrder[index],
    exact: (weight / total) * 100,
    percentage: Math.floor((weight / total) * 100)
  }));
  let remainder = 100 - raw.reduce((sum, item) => sum + item.percentage, 0);
  return raw
    .sort((a, b) => b.exact - b.percentage - (a.exact - a.percentage))
    .map((item) => ({ ...item, percentage: item.percentage + (remainder-- > 0 ? 1 : 0) }))
    .sort((a, b) => groupOrder.indexOf(a.voterGroupId) - groupOrder.indexOf(b.voterGroupId))
    .map(({ voterGroupId, percentage }) => ({ voterGroupId, percentage }));
}

interface StateSeed {
  id: string;
  name: string;
  electoralVotes: number;
  primaryType: PrimaryType;
  safeColor: SafeColor;
  profile: Profile;
}

const stateSeeds: StateSeed[] = [
  { id: "AL", name: "Alabama", electoralVotes: 9, primaryType: "open", safeColor: "red", profile: "southern" },
  { id: "AK", name: "Alaska", electoralVotes: 3, primaryType: "jungle", safeColor: "red", profile: "mountain" },
  { id: "AZ", name: "Arizona", electoralVotes: 11, primaryType: "semiClosed", safeColor: "purple", profile: "sunbelt" },
  { id: "AR", name: "Arkansas", electoralVotes: 6, primaryType: "open", safeColor: "red", profile: "southern" },
  { id: "CA", name: "California", electoralVotes: 54, primaryType: "jungle", safeColor: "blue", profile: "urbanBlue" },
  { id: "CO", name: "Colorado", electoralVotes: 10, primaryType: "semiClosed", safeColor: "blue", profile: "mountain" },
  { id: "CT", name: "Connecticut", electoralVotes: 7, primaryType: "closed", safeColor: "blue", profile: "newEngland" },
  { id: "DE", name: "Delaware", electoralVotes: 3, primaryType: "closed", safeColor: "blue", profile: "newEngland" },
  { id: "DC", name: "Washington DC", electoralVotes: 3, primaryType: "closed", safeColor: "blue", profile: "urbanBlue" },
  { id: "FL", name: "Florida", electoralVotes: 30, primaryType: "closed", safeColor: "red", profile: "sunbelt" },
  { id: "GA", name: "Georgia", electoralVotes: 16, primaryType: "open", safeColor: "purple", profile: "southern" },
  { id: "HI", name: "Hawaii", electoralVotes: 4, primaryType: "open", safeColor: "blue", profile: "urbanBlue" },
  { id: "ID", name: "Idaho", electoralVotes: 4, primaryType: "semiClosed", safeColor: "red", profile: "ruralRed" },
  { id: "IL", name: "Illinois", electoralVotes: 19, primaryType: "open", safeColor: "blue", profile: "industrial" },
  { id: "IN", name: "Indiana", electoralVotes: 11, primaryType: "open", safeColor: "red", profile: "industrial" },
  { id: "IA", name: "Iowa", electoralVotes: 6, primaryType: "closed", safeColor: "red", profile: "ruralRed" },
  { id: "KS", name: "Kansas", electoralVotes: 6, primaryType: "semiClosed", safeColor: "red", profile: "ruralRed" },
  { id: "KY", name: "Kentucky", electoralVotes: 8, primaryType: "closed", safeColor: "red", profile: "southern" },
  { id: "LA", name: "Louisiana", electoralVotes: 8, primaryType: "closed", safeColor: "red", profile: "southern" },
  { id: "ME", name: "Maine", electoralVotes: 4, primaryType: "semiClosed", safeColor: "blue", profile: "newEngland" },
  { id: "MD", name: "Maryland", electoralVotes: 10, primaryType: "closed", safeColor: "blue", profile: "urbanBlue" },
  { id: "MA", name: "Massachusetts", electoralVotes: 11, primaryType: "semiClosed", safeColor: "blue", profile: "newEngland" },
  { id: "MI", name: "Michigan", electoralVotes: 15, primaryType: "open", safeColor: "purple", profile: "industrial" },
  { id: "MN", name: "Minnesota", electoralVotes: 10, primaryType: "open", safeColor: "blue", profile: "industrial" },
  { id: "MS", name: "Mississippi", electoralVotes: 6, primaryType: "open", safeColor: "red", profile: "southern" },
  { id: "MO", name: "Missouri", electoralVotes: 10, primaryType: "open", safeColor: "red", profile: "industrial" },
  { id: "MT", name: "Montana", electoralVotes: 4, primaryType: "open", safeColor: "red", profile: "ruralRed" },
  { id: "NE", name: "Nebraska", electoralVotes: 5, primaryType: "semiClosed", safeColor: "red", profile: "ruralRed" },
  { id: "NV", name: "Nevada", electoralVotes: 6, primaryType: "closed", safeColor: "purple", profile: "sunbelt" },
  { id: "NH", name: "New Hampshire", electoralVotes: 4, primaryType: "semiClosed", safeColor: "blue", profile: "newEngland" },
  { id: "NJ", name: "New Jersey", electoralVotes: 14, primaryType: "closed", safeColor: "blue", profile: "urbanBlue" },
  { id: "NM", name: "New Mexico", electoralVotes: 5, primaryType: "semiClosed", safeColor: "blue", profile: "sunbelt" },
  { id: "NY", name: "New York", electoralVotes: 28, primaryType: "closed", safeColor: "blue", profile: "urbanBlue" },
  { id: "NC", name: "North Carolina", electoralVotes: 16, primaryType: "semiClosed", safeColor: "purple", profile: "southern" },
  { id: "ND", name: "North Dakota", electoralVotes: 3, primaryType: "open", safeColor: "red", profile: "ruralRed" },
  { id: "OH", name: "Ohio", electoralVotes: 17, primaryType: "open", safeColor: "red", profile: "industrial" },
  { id: "OK", name: "Oklahoma", electoralVotes: 7, primaryType: "semiClosed", safeColor: "red", profile: "ruralRed" },
  { id: "OR", name: "Oregon", electoralVotes: 8, primaryType: "closed", safeColor: "blue", profile: "mountain" },
  { id: "PA", name: "Pennsylvania", electoralVotes: 19, primaryType: "closed", safeColor: "purple", profile: "industrial" },
  { id: "RI", name: "Rhode Island", electoralVotes: 4, primaryType: "semiClosed", safeColor: "blue", profile: "newEngland" },
  { id: "SC", name: "South Carolina", electoralVotes: 9, primaryType: "open", safeColor: "red", profile: "southern" },
  { id: "SD", name: "South Dakota", electoralVotes: 3, primaryType: "semiClosed", safeColor: "red", profile: "ruralRed" },
  { id: "TN", name: "Tennessee", electoralVotes: 11, primaryType: "open", safeColor: "red", profile: "southern" },
  { id: "TX", name: "Texas", electoralVotes: 40, primaryType: "open", safeColor: "red", profile: "sunbelt" },
  { id: "UT", name: "Utah", electoralVotes: 6, primaryType: "semiClosed", safeColor: "red", profile: "mountain" },
  { id: "VT", name: "Vermont", electoralVotes: 3, primaryType: "open", safeColor: "blue", profile: "newEngland" },
  { id: "VA", name: "Virginia", electoralVotes: 13, primaryType: "open", safeColor: "blue", profile: "southern" },
  { id: "WA", name: "Washington", electoralVotes: 12, primaryType: "jungle", safeColor: "blue", profile: "urbanBlue" },
  { id: "WV", name: "West Virginia", electoralVotes: 4, primaryType: "semiClosed", safeColor: "red", profile: "ruralRed" },
  { id: "WI", name: "Wisconsin", electoralVotes: 10, primaryType: "open", safeColor: "purple", profile: "industrial" },
  { id: "WY", name: "Wyoming", electoralVotes: 3, primaryType: "closed", safeColor: "red", profile: "ruralRed" }
];

export const states: StateData[] = stateSeeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  electoralVotes: seed.electoralVotes,
  primaryType: seed.primaryType,
  safeColor: seed.safeColor,
  voterGroups: normalizeProfile(seed.profile),
  sourceNote:
    "Primary type seeded from US State Primary Types Explained.xlsx. Electoral votes are current 2024/2028 values. Voter-group percentages are manually normalized classroom approximations because State Cards.pdf was not cleanly machine-readable."
}));

export const stateById = Object.fromEntries(states.map((state) => [state.id, state])) as Record<string, StateData>;
