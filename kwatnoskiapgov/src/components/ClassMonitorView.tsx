import { useState } from "react";
import { candidateById, candidateIds } from "../data/candidates";
import { states } from "../data/states";
import { voterGroups } from "../data/voterGroups";
import { getPartyController } from "../lib/rules/generalElectionRules";
import { useGameStore } from "../store/gameStore";
import StateResultTable from "./StateResultTable";

export default function ClassMonitorView({ onSwitchRole }: { onSwitchRole: () => void }) {
  const store = useGameStore();
  const [presentationMode, setPresentationMode] = useState(false);
  const selectedStates = store.selectedStatesByMonth[store.currentMonth] ?? [];
  const blueControlled = voterGroups.filter((group) => getPartyController(store.generalTokens, group.id) === "blue").length;
  const redControlled = voterGroups.filter((group) => getPartyController(store.generalTokens, group.id) === "red").length;
  const primaryMode = store.phase === "setup" || store.phase === "primary" || store.phase === "convention";

  return (
    <main className={`min-h-screen bg-classroom ${presentationMode ? "p-6" : "px-4 py-5"}`}>
      <div className={presentationMode ? "mx-auto max-w-[1600px]" : "mx-auto max-w-7xl"}>
        {!presentationMode && (
          <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black">Class Monitor View</h1>
              <p className="text-lg font-semibold text-slate-700">Safe projector dashboard</p>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => setPresentationMode(true)}>
                Presentation Mode
              </button>
              <button className="btn" onClick={onSwitchRole}>
                Switch Role
              </button>
            </div>
          </header>
        )}
        {presentationMode && (
          <div className="mb-4 flex justify-end">
            <button className="btn" onClick={() => setPresentationMode(false)}>
              Exit Presentation Mode
            </button>
          </div>
        )}

        <section className="mb-4 grid gap-3 lg:grid-cols-4">
          <BigCard title="Phase" value={phaseLabel(store.phase)} />
          <BigCard title="Month" value={store.currentMonth} />
          <BigCard title="Blue Groups" value={blueControlled} tone="blue" />
          <BigCard title="Red Groups" value={redControlled} tone="red" />
        </section>

        {primaryMode ? (
          <section className="panel mb-4">
            <h2 className="mb-3 text-3xl font-black">Delegate Scoreboard</h2>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {candidateIds.map((id) => (
                <div key={id} className={`border p-4 ${id.startsWith("blue") ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`} style={{ borderRadius: 8 }}>
                  <div className="text-xl font-black">{id}</div>
                  <div className="text-5xl font-black">{store.delegateTotals[id]}</div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-4 grid gap-3 md:grid-cols-3">
            <BigCard title="Blue EV" value={store.electionResults?.blueElectoralVotes ?? 0} tone="blue" />
            <BigCard title="Red EV" value={store.electionResults?.redElectoralVotes ?? 0} tone="red" />
            <BigCard title="Winner" value={store.electionResults?.winner ?? "Pending"} />
          </section>
        )}

        <section className="mb-4 grid gap-4 lg:grid-cols-2">
          <div className="panel">
            <h2 className="mb-3 text-3xl font-black">Current Selected States</h2>
            {selectedStates.length === 0 ? (
              <div className="text-xl text-slate-700">No states selected for this month.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedStates.map((id) => {
                  const state = states.find((item) => item.id === id);
                  return (
                    <div key={id} className="border border-slate-200 p-3 text-xl font-bold" style={{ borderRadius: 8 }}>
                      {state?.name ?? id}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="panel">
            <h2 className="mb-3 text-3xl font-black">Nominees</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-blue-200 bg-blue-50 p-4" style={{ borderRadius: 8 }}>
                <div className="text-lg font-bold text-blue-900">Blue</div>
                <div className="text-2xl font-black text-blue-900">
                  {store.nominees.blue ? candidateById[store.nominees.blue].name : "Not chosen"}
                </div>
              </div>
              <div className="border border-red-200 bg-red-50 p-4" style={{ borderRadius: 8 }}>
                <div className="text-lg font-bold text-red-900">Red</div>
                <div className="text-2xl font-black text-red-900">
                  {store.nominees.red ? candidateById[store.nominees.red].name : "Not chosen"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel mb-4">
          <h2 className="mb-3 text-3xl font-black">Voter Group Control Summary</h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {voterGroups.map((group) => {
              const controller = getPartyController(store.generalTokens, group.id);
              return (
                <div key={group.id} className="border border-slate-200 p-3 text-lg" style={{ borderRadius: 8 }}>
                  <span className="font-black">{group.name}</span>: {controller ?? "No control"}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel mb-4">
          <h2 className="mb-3 text-3xl font-black">Recent Actions</h2>
          {store.actionLog.length === 0 ? (
            <div className="text-xl text-slate-700">No actions logged yet.</div>
          ) : (
            [...store.actionLog]
              .reverse()
              .slice(0, 8)
              .map((entry) => (
                <div key={entry.id} className="border-b border-slate-100 py-2 text-xl font-bold">
                  {entry.message}
                </div>
              ))
          )}
        </section>

        {store.electionResults && (
          <section className="panel">
            <h2 className="mb-3 text-3xl font-black">State Results</h2>
            <StateResultTable results={store.electionResults.stateResults} showExplanations={false} onOverride={() => undefined} readOnly />
          </section>
        )}
      </div>
    </main>
  );
}

function BigCard({ title, value, tone }: { title: string; value: string | number; tone?: "blue" | "red" }) {
  const color =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : tone === "red"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-slate-200 bg-white text-slate-950";
  return (
    <div className={`border p-5 ${color}`} style={{ borderRadius: 8 }}>
      <div className="text-lg font-bold">{title}</div>
      <div className="text-4xl font-black capitalize">{value}</div>
    </div>
  );
}

function phaseLabel(phase: string): string {
  if (phase === "primary") return "Primary Season";
  if (phase === "convention") return "Convention";
  if (phase === "general") return "General Election";
  if (phase === "electionNight") return "Election Night";
  if (phase === "complete") return "Game Complete";
  return "Setup";
}
