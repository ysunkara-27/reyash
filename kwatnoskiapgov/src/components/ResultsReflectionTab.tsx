import { candidateById, candidateIds } from "../data/candidates";
import { voterGroups } from "../data/voterGroups";
import { useGameStore } from "../store/gameStore";
import { downloadTextFile } from "../lib/storage";
import { gameSummaryToCsv } from "../lib/exportCsv";

const questions = [
  "How did being the incumbent help the player who had the incumbent card? How does this translate into real life?",
  "How did the schedule of the primary election system differ from the schedule of the general election?",
  "What impact did open or closed primaries have on the outcome of those primaries?",
  "How did the electoral college system affect the interests of the different voter groups?",
  "What worked about this game? What could be improved? How could it be more accurate?"
];

export default function ResultsReflectionTab() {
  const store = useGameStore();
  const results = store.electionResults;
  const closest = [...(results?.stateResults ?? [])].sort(
    (a, b) => Math.abs(a.bluePercentage - a.redPercentage) - Math.abs(b.bluePercentage - b.redPercentage)
  );
  const landslides = [...(results?.stateResults ?? [])].sort(
    (a, b) => Math.abs(b.bluePercentage - b.redPercentage) - Math.abs(a.bluePercentage - a.redPercentage)
  );

  return (
    <div className="grid gap-4">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Final Summary</h2>
            <p className="text-sm text-slate-700">
              Blue nominee: <span className="font-bold">{store.nominees.blue ? candidateById[store.nominees.blue].name : "Unset"}</span>.
              Red nominee: <span className="font-bold"> {store.nominees.red ? candidateById[store.nominees.red].name : "Unset"}</span>.
            </p>
          </div>
          <button className="btn" onClick={() => downloadTextFile("post-game-summary.csv", gameSummaryToCsv(store.serializable()), "text/csv")}>
            Export post-game summary
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric title="Winner" value={results?.winner ?? "Pending"} />
          <Metric title="Blue EV" value={results?.blueElectoralVotes ?? 0} />
          <Metric title="Red EV" value={results?.redElectoralVotes ?? 0} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h3 className="mb-2 text-xl font-black">Closest States</h3>
          {closest.slice(0, 8).map((state) => (
            <div key={state.stateId} className="border-b border-slate-100 py-2 text-sm">
              <span className="font-bold">{state.stateName}</span>: {state.bluePercentage}-{state.redPercentage}, {state.winner}
            </div>
          ))}
        </div>
        <div className="panel">
          <h3 className="mb-2 text-xl font-black">Biggest Landslides</h3>
          {landslides.slice(0, 8).map((state) => (
            <div key={state.stateId} className="border-b border-slate-100 py-2 text-sm">
              <span className="font-bold">{state.stateName}</span>: {state.bluePercentage}-{state.redPercentage}, {state.winner}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-3 text-xl font-black">Delegate Winners</h3>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {candidateIds.map((id) => (
            <div key={id} className="border border-slate-200 p-3" style={{ borderRadius: 8 }}>
              <div className="text-sm font-bold">{candidateById[id].name}</div>
              <div className="text-2xl font-black">{store.delegateTotals[id]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-3 text-xl font-black">Key Voter Groups</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {voterGroups.map((group) => {
            const counts = store.generalTokens[group.id];
            const controller = counts.blue === counts.red ? "Tie" : counts.blue > counts.red ? "Blue" : "Red";
            return (
              <div key={group.id} className="border border-slate-200 p-2 text-sm" style={{ borderRadius: 6 }}>
                <span className="font-bold">{group.name}</span>: {controller} ({counts.blue}-{counts.red})
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-3 text-xl font-black">Post-Game Questions</h3>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <label key={question} className="block">
              <span className="mb-1 block font-bold">
                {index + 1}. {question}
              </span>
              <textarea className="input min-h-24" />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4" style={{ borderRadius: 8 }}>
      <div className="text-sm font-bold text-slate-600">{title}</div>
      <div className="text-3xl font-black capitalize">{value}</div>
    </div>
  );
}
