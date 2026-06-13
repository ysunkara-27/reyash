import type { VoterGroup } from "../types";

export const voterGroups: VoterGroup[] = [
  { id: "asian-americans", name: "Asian Americans", maxTokens: 5 },
  { id: "african-americans", name: "African Americans", maxTokens: 5 },
  { id: "retirees", name: "Retirees", maxTokens: 5 },
  { id: "rural-farmers", name: "Rural Farmers", maxTokens: 5 },
  { id: "corporate-executives", name: "Corporate Executives", maxTokens: 5 },
  { id: "environmental-activists", name: "Environmental Activists", maxTokens: 5 },
  { id: "evangelical-christians", name: "Evangelical Christians", maxTokens: 5 },
  { id: "gun-owners", name: "Gun Owners", maxTokens: 5 },
  { id: "hispanic-latino", name: "Hispanic/Latino", maxTokens: 5 },
  { id: "indigenous-voters", name: "Indigenous Voters", maxTokens: 5 },
  { id: "labor-unions", name: "Labor Unions", maxTokens: 5 },
  { id: "military-veterans", name: "Military Veterans", maxTokens: 5 },
  { id: "secular-non-religious", name: "Secular/Non-Religious", maxTokens: 5 },
  { id: "small-business-owners", name: "Small Business Owners", maxTokens: 5 },
  { id: "suburban-professionals", name: "Suburban Professionals", maxTokens: 5 },
  { id: "suburban-women", name: "Suburban Women", maxTokens: 5 },
  { id: "urban-professionals", name: "Urban Professionals", maxTokens: 5 },
  { id: "white-non-college", name: "White Non-College", maxTokens: 5 },
  { id: "youth-voters", name: "Youth Voters", maxTokens: 5 }
];

export const voterGroupNameById = Object.fromEntries(voterGroups.map((group) => [group.id, group.name])) as Record<
  (typeof voterGroups)[number]["id"],
  string
>;
