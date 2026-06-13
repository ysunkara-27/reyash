import { useMemo, useState } from "react";
import { candidateById, candidateIds, partyCandidateIds } from "../data/candidates";
import { states } from "../data/states";
import { voterGroups } from "../data/voterGroups";
import { getPartyController } from "../lib/rules/generalElectionRules";
import { useGameStore } from "../store/gameStore";
import type { CandidateId, Party, VoterGroupId } from "../types";

type StudentChoice = CandidateId | "blueNominee" | "redNominee";

export default function StudentHub({ onSwitchRole }: { onSwitchRole: () => void }) {
  const store = useGameStore();
  const [choice, setChoice] = useState<StudentChoice>("blueA");
  const [note, setNote] = useState(() => localStorage.getItem(`student-note-${choice}`) ?? "");

  const resolved = resolveChoice(choice, store.nominees);
  const party = resolved.startsWith("blue") ? "blue" : "red";
  const generalMode = store.phase === "general" || store.phase === "electionNight" || store.phase === "complete";

  const groupRows = voterGroups.map((group) => {
    if (generalMode) {
      const counts = store.generalTokens[group.id];
      return {
        id: group.id,
        name: group.name,
        mine: counts[party],
        other: counts[party === "blue" ? "red" : "blue"],
        controller: getPartyController(store.generalTokens, group.id)
      };
    }
    const counts = store.primaryTokens[group.id];
    const candidateCount = counts[resolved];
    const top = Math.max(...candidateIds.map((id) => counts[id]));
    return {
      id: group.id,
      name: group.name,
      mine: candidateCount,
      other: top,
      controller: top > 0 && candidateCount === top ? resolved : null
    };
  });

  const stateStrengths = useMemo(
    () =>
      states
        .map((state) => {
          const score = state.voterGroups.reduce((sum, group) => {
            if (generalMode) {
              return sum + (getPartyController(store.generalTokens, group.voterGroupId) === party ? group.percentage : 0);
            }
            const counts = store.primaryTokens[group.voterGroupId];
            const max = Math.max(...candidateIds.map((id) => counts[id]));
            return sum + (max > 0 && counts[resolved] === max ? group.percentage : 0);
          }, 0);
          return { state, score };
        })
        .sort((a, b) => b.score - a.score),
    [generalMode, party, resolved, store.generalTokens, store.primaryTokens]
  );

  const partyRank = partyCandidateIds[party]
    .map((id) => ({ id, delegates: store.delegateTotals[id] }))
    .sort((a, b) => b.delegates - a.delegates)
    .findIndex((item) => item.id === resolved);

  const targetGroups = groupRows
    .filter((group) => group.mine < 3)
    .sort((a, b) => a.mine - b.mine)
    .slice(0, 5);

  const recentCards = store.playedCards
    .filter((card) => card.target === resolved || card.target === party)
    .slice(-8)
    .reverse();

  return (
    <main className="min-h-screen bg-classroom px-4 py-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Student Candidate View</h1>
            <p className="text-sm font-semibold text-slate-600">
              Current class status: {phaseLabel(store.phase)} / {store.currentMonth}
            </p>
          </div>
          <button className="btn" onClick={onSwitchRole}>
            Switch Role
          </button>
        </header>

        <section className="panel mb-4">
          <label>
            <span className="mb-1 block text-sm font-bold">My candidate or nominee team</span>
            <select
              className="input max-w-sm"
              value={choice}
              onChange={(event) => {
                const nextChoice = event.target.value as StudentChoice;
                setChoice(nextChoice);
                setNote(localStorage.getItem(`student-note-${nextChoice}`) ?? "");
              }}
            >
              {candidateIds.map((id) => (
                <option key={id} value={id}>
                  {candidateById[id].name}
                </option>
              ))}
              <option value="blueNominee">Blue Nominee</option>
              <option value="redNominee">Red Nominee</option>
            </select>
          </label>
        </section>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="grid gap-4">
            <div className="panel">
              <h2 className="text-2xl font-black">My Candidate</h2>
              <div className={`mt-3 border p-4 ${party === "blue" ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`} style={{ borderRadius: 8 }}>
                <div className="text-sm font-bold uppercase">{party} team</div>
                <div className="text-3xl font-black">{candidateById[resolved].name}</div>
                <div className="mt-2 text-sm font-semibold">
                  {generalMode ? "General election mode: showing party-level tokens." : `Delegate total: ${store.delegateTotals[resolved]}. Party rank: #${partyRank + 1}.`}
                </div>
              </div>
            </div>

            <div className="panel">
              <h2 className="mb-2 text-2xl font-black">My Best States</h2>
              <p className="mb-2 text-sm text-slate-700">Strong states are where you control a high share of that state’s listed voter groups.</p>
              {stateStrengths.slice(0, 5).map(({ state, score }) => (
                <div key={state.id} className="border-b border-slate-100 py-2 text-sm">
                  <span className="font-bold">{state.name}</span>: {score}% strength
                </div>
              ))}
            </div>

            <div className="panel">
              <h2 className="mb-2 text-2xl font-black">My Weak States</h2>
              {stateStrengths.slice(-5).reverse().map(({ state, score }) => (
                <div key={state.id} className="border-b border-slate-100 py-2 text-sm">
                  <span className="font-bold">{state.name}</span>: {score}% strength
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <div className="panel">
              <h2 className="mb-2 text-2xl font-black">My Voter Groups</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {groupRows.map((group) => (
                  <div key={group.id} className="border border-slate-200 p-3 text-sm" style={{ borderRadius: 8 }}>
                    <div className="font-black">{group.name}</div>
                    <div>My tokens: {group.mine}</div>
                    <div className="text-slate-600">Controller: {String(group.controller ?? "No control")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="panel">
                <h2 className="mb-2 text-2xl font-black">Voter Groups To Target</h2>
                {targetGroups.map((group) => (
                  <div key={group.id} className="border-b border-slate-100 py-2 text-sm">
                    <span className="font-bold">{group.name}</span>: {group.mine} token(s)
                  </div>
                ))}
              </div>
              <div className="panel">
                <h2 className="mb-2 text-2xl font-black">What Changed Recently</h2>
                {recentCards.length === 0 ? (
                  <div className="text-sm text-slate-700">No recent cards played on this candidate or party.</div>
                ) : (
                  recentCards.map((card) => (
                    <div key={`${card.id}-${card.playedAt}`} className="border-b border-slate-100 py-2 text-sm">
                      <span className="font-bold">{card.title}</span> to {card.target}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <h2 className="mb-2 text-2xl font-black">Current Class Scoreboard</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {candidateIds.map((id) => (
                  <div key={id} className="border border-slate-200 p-3" style={{ borderRadius: 8 }}>
                    <div className="font-bold">{id}</div>
                    <div className="text-2xl font-black">{store.delegateTotals[id]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2 className="mb-2 text-2xl font-black">Personal Notes</h2>
              <textarea
                className="input min-h-28"
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  localStorage.setItem(`student-note-${choice}`, event.target.value);
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function resolveChoice(choice: StudentChoice, nominees: Record<Party, CandidateId | null>): CandidateId {
  if (choice === "blueNominee") return nominees.blue ?? "blueA";
  if (choice === "redNominee") return nominees.red ?? "redA";
  return choice;
}

function phaseLabel(phase: string): string {
  if (phase === "primary") return "Primary Season";
  if (phase === "convention") return "Convention";
  if (phase === "general") return "General Election";
  if (phase === "electionNight") return "Election Night";
  if (phase === "complete") return "Game Complete";
  return "Setup";
}
