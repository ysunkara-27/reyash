import type { GameCard, VoterGroupId } from "../types";

const groupAliases: Record<string, VoterGroupId> = {
  Asian: "asian-americans",
  "Asian Americans": "asian-americans",
  Black: "african-americans",
  "African Americans": "african-americans",
  Retirees: "retirees",
  "Rural Farmers": "rural-farmers",
  "Corp Execs": "corporate-executives",
  "Corporate Executives": "corporate-executives",
  Enviro: "environmental-activists",
  "Environmental Activists": "environmental-activists",
  Evangelical: "evangelical-christians",
  "Evangelical Christians": "evangelical-christians",
  "Gun Owners": "gun-owners",
  Hispanic: "hispanic-latino",
  "Hispanic/Latino": "hispanic-latino",
  Indigenous: "indigenous-voters",
  Labor: "labor-unions",
  "Labor Unions": "labor-unions",
  Veterans: "military-veterans",
  "Military Veterans": "military-veterans",
  Secular: "secular-non-religious",
  "Small Biz": "small-business-owners",
  "Small Business Owners": "small-business-owners",
  "Suburb Prof": "suburban-professionals",
  "Suburban Professionals": "suburban-professionals",
  "Suburban Women": "suburban-women",
  "Urban Prof": "urban-professionals",
  "Urban Professionals": "urban-professionals",
  "White Non-Coll": "white-non-college",
  "White Non-College": "white-non-college",
  Youth: "youth-voters",
  "Youth Voters": "youth-voters"
};

function effect(alias: string, delta: number) {
  return { voterGroupId: groupAliases[alias], delta };
}

export const cards: GameCard[] = [
  {
    id: "union-boss-handshake",
    title: "Union Boss Handshake",
    type: "Endorsement",
    description: "A major manufacturing union backs your campaign.",
    effects: [effect("Labor", 3)]
  },
  {
    id: "silicon-endorsement",
    title: "The Silicon Endorsement",
    type: "Endorsement",
    description: "A tech titan declares your tax plan the future.",
    effects: [effect("Corp Execs", 3)]
  },
  {
    id: "a-list-star-power",
    title: "A-List Star Power",
    type: "Endorsement",
    description: "A pop star joins your rally.",
    effects: [effect("Youth", 3), effect("Black", 1)]
  },
  {
    id: "generals-nod",
    title: "The General's Nod",
    type: "Endorsement",
    description: "A retired general vouches for your character.",
    effects: [effect("Veterans", 3)]
  },
  {
    id: "faith-leader-support",
    title: "Faith Leader Support",
    type: "Endorsement",
    description: "A prominent pastor endorses your family values.",
    effects: [effect("Evangelical", 3)]
  },
  {
    id: "conservationist-pact",
    title: "Conservationist Pact",
    type: "Endorsement",
    description: "A leading climate group calls you their top pick.",
    effects: [effect("Enviro", 3)]
  },
  {
    id: "small-business-alliance",
    title: "Small Business Alliance",
    type: "Endorsement",
    description: "Small business owners back your economic plan.",
    effects: [effect("Small Biz", 3)]
  },
  {
    id: "grey-lady-editorial",
    title: "The Grey Lady Editorial",
    type: "Endorsement",
    description: "A prestigious national paper writes a glowing lead.",
    effects: [effect("Urban Prof", 3)]
  },
  {
    id: "grade-a-2a",
    title: "Grade A+ From 2A Group",
    type: "Endorsement",
    description: "A major gun-rights lobby funds your ad blitz.",
    effects: [effect("Gun Owners", 3)]
  },
  {
    id: "green-new-deal",
    title: "The Green New Deal",
    type: "Platform Idea",
    description: "Climate-heavy jobs platform with business backlash.",
    effects: [effect("Enviro", 4), effect("Youth", 1), effect("Corp Execs", -3), effect("White Non-Coll", -2)]
  },
  {
    id: "border-wall-fund",
    title: "Border Wall Fund",
    type: "Platform Idea",
    description: "Border-security funding.",
    effects: [effect("White Non-Coll", 3), effect("Hispanic", -3)]
  },
  {
    id: "student-debt-eraser",
    title: "Student Debt Eraser",
    type: "Platform Idea",
    description: "Student loan forgiveness pledge.",
    effects: [effect("Youth", 4), effect("White Non-Coll", -2)]
  },
  {
    id: "school-vouchers",
    title: "School Vouchers",
    type: "Platform Idea",
    description: "Voucher plan for private and religious schools.",
    effects: [effect("Evangelical", 2), effect("Hispanic", 1), effect("Urban Prof", -1)]
  },
  {
    id: "fracking-ban",
    title: "Fracking Ban",
    type: "Platform Idea",
    description: "Aggressive anti-fracking position.",
    effects: [effect("Enviro", 3), effect("Corp Execs", -4), effect("White Non-Coll", -3)]
  },
  {
    id: "universal-pre-school",
    title: "Universal Pre-School",
    type: "Platform Idea",
    description: "Childcare and early education expansion.",
    effects: [effect("Suburb Prof", 2), effect("Hispanic", 2)]
  },
  {
    id: "corporate-tax-hike",
    title: "Corporate Tax Hike",
    type: "Platform Idea",
    description: "Raise corporate taxes to fund worker programs.",
    effects: [effect("Labor", 2), effect("Youth", 1), effect("Corp Execs", -4)]
  },
  {
    id: "concealed-carry-law",
    title: "Concealed Carry Law",
    type: "Platform Idea",
    description: "National concealed carry expansion.",
    effects: [effect("Gun Owners", 4), effect("Urban Prof", -2)]
  },
  {
    id: "english-only-mandate",
    title: "English-Only Mandate",
    type: "Platform Idea",
    description: "English-only federal services mandate.",
    effects: [effect("White Non-Coll", 3), effect("Hispanic", -4)]
  },
  {
    id: "free-trade-agreement",
    title: "Free Trade Agreement",
    type: "Platform Idea",
    description: "Pro-trade economic platform.",
    effects: [effect("Corp Execs", 2), effect("Urban Prof", 1), effect("Labor", -3)]
  },
  {
    id: "path-to-citizenship",
    title: "Path to Citizenship",
    type: "Platform Idea",
    description: "Immigration reform and citizenship pathway.",
    effects: [effect("Hispanic", 4), effect("Youth", 2), effect("White Non-Coll", -2)]
  },
  {
    id: "clean-air-standards",
    title: "Clean Air Standards",
    type: "Platform Idea",
    description: "Tougher air-quality standards.",
    effects: [effect("Enviro", 3), effect("Corp Execs", -2)]
  },
  {
    id: "right-to-work-bill",
    title: "Right-to-Work Bill",
    type: "Platform Idea",
    description: "Limits union power.",
    effects: [effect("Corp Execs", 2), effect("Labor", -4)]
  },
  {
    id: "rural-broadband-act",
    title: "Rural Broadband Act",
    type: "Platform Idea",
    description: "Internet infrastructure for rural communities.",
    effects: [effect("Rural Farmers", 4)]
  },
  {
    id: "federal-gun-buyback",
    title: "Federal Gun Buyback",
    type: "Platform Idea",
    description: "Federal buyback program.",
    effects: [effect("Urban Prof", 2), effect("Gun Owners", -5)]
  },
  {
    id: "traditional-values-bill",
    title: "Traditional Values Bill",
    type: "Platform Idea",
    description: "Socially conservative values bill.",
    effects: [effect("Evangelical", 3), effect("Secular", -3)]
  },
  {
    id: "drug-legalization",
    title: "Drug Legalization",
    type: "Platform Idea",
    description: "Legalization and criminal justice reform.",
    effects: [effect("Youth", 3), effect("Secular", 2), effect("Evangelical", -2)]
  },
  {
    id: "infrastructure-rail",
    title: "Infrastructure Rail",
    type: "Platform Idea",
    description: "Rail and transportation investment.",
    effects: [effect("Labor", 3), effect("Urban Prof", 1)]
  },
  {
    id: "military-spending-hike",
    title: "Military Spending Hike",
    type: "Platform Idea",
    description: "Defense budget expansion.",
    effects: [effect("Veterans", 3), effect("Corp Execs", 1), effect("Youth", -2)]
  },
  {
    id: "affordable-housing",
    title: "Affordable Housing",
    type: "Platform Idea",
    description: "Affordable housing construction plan.",
    effects: [effect("Black", 2), effect("Hispanic", 2), effect("Suburb Prof", -1)]
  },
  {
    id: "healthcare-for-all",
    title: "Healthcare for All",
    type: "Platform Idea",
    description: "Universal healthcare plan.",
    effects: [effect("Black", 3), effect("Youth", 2), effect("Corp Execs", -2), effect("Small Biz", -1)]
  },
  {
    id: "inflation-spike",
    title: "Inflation Spike",
    type: "Important Event",
    description: "Voters react to rising prices.",
    effects: [effect("White Non-Coll", -3), effect("Suburb Prof", -2)]
  },
  {
    id: "debate-zinger",
    title: "The Knockout Zinger",
    type: "Debate",
    description: "A strong debate moment. Teacher may also mark one swing state as leaning this way.",
    effects: [effect("Suburb Prof", 2), effect("Urban Prof", 1)]
  },
  {
    id: "tax-returns-leaked",
    title: "Tax Returns Leaked",
    type: "Scandal",
    description: "It turns out the campaign's finances look bad.",
    effects: [effect("Labor", -2), effect("Small Biz", -2)]
  },
  {
    id: "campaign-cover-up",
    title: "Campaign Cover-Up",
    type: "Campaign Cover-Up",
    description: "Cancel or soften another card's effect at teacher discretion.",
    effects: []
  }
];
