import type { Month } from "../types";

export interface ScheduleItem {
  month: Month;
  instructions: string;
  primaryStateCount?: number;
  fixedStates?: string[];
}

export type PrimaryMonth = "January" | "February" | "March" | "April" | "May" | "June";
export const primaryMonths: PrimaryMonth[] = ["January", "February", "March", "April", "May", "June"];
export const defaultPrimarySchedule: Record<PrimaryMonth, string[]> = {
  January: ["IA", "NH", "SC"],
  February: ["AL", "AK", "AR", "CA", "CO", "GA", "MA", "MN", "NC", "OK", "TN", "TX", "UT", "VA"],
  March: ["AZ", "FL", "ID", "IL", "KS", "LA", "ME", "MI", "MS"],
  April: ["CT", "DE", "HI", "IN", "KY", "MD", "MO", "ND", "OH"],
  May: ["MT", "NE", "NV", "NJ", "NM", "OR", "PA", "RI"],
  June: ["DC", "NY", "SD", "VT", "WA", "WV", "WI", "WY"]
};
export const allMonths: Month[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "Convention",
  "July",
  "August",
  "September",
  "October",
  "November",
  "Election Day"
];

export const schedule: ScheduleItem[] = [
  {
    month: "January",
    instructions: "Early primary month: Iowa, New Hampshire, and South Carolina.",
    fixedStates: defaultPrimarySchedule.January,
    primaryStateCount: 3
  },
  {
    month: "February",
    instructions: "Super Tuesday: draw or manually select 14 states, then hold primaries.",
    fixedStates: defaultPrimarySchedule.February,
    primaryStateCount: 14
  },
  { month: "March", instructions: "Draw or select 9 states, then hold primaries.", fixedStates: defaultPrimarySchedule.March, primaryStateCount: 9 },
  { month: "April", instructions: "Draw or select 9 states, then hold primaries.", fixedStates: defaultPrimarySchedule.April, primaryStateCount: 9 },
  { month: "May", instructions: "Draw or select 8 states, then hold primaries.", fixedStates: defaultPrimarySchedule.May, primaryStateCount: 8 },
  { month: "June", instructions: "Draw or select 8 states, then hold the final primaries.", fixedStates: defaultPrimarySchedule.June, primaryStateCount: 8 },
  {
    month: "Convention",
    instructions: "Count delegates, nominate candidates, choose platform cards, and convert to the general election board."
  },
  { month: "July", instructions: "General election begins. Each player takes one turn." },
  { month: "August", instructions: "One general election turn per player." },
  { month: "September", instructions: "One general election turn per player." },
  { month: "October", instructions: "October Surprise: two turns per player." },
  { month: "November", instructions: "One final turn per player, then calculate Election Day." },
  { month: "Election Day", instructions: "Calculate Electoral College results and export the final summary." }
];
