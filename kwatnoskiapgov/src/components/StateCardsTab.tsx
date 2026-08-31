import { useMemo, useState } from "react";
import { MapPinned } from "lucide-react";
import { states } from "../data/states";
import { voterGroupNameById } from "../data/voterGroups";
import type { SafeColor } from "../types";

export default function StateCardsTab() {
  const [query, setQuery] = useState("");
  const [lean, setLean] = useState<SafeColor | "all">("all");
  const filtered = useMemo(
    () =>
      states.filter((state) => {
        const matchesQuery = state.name.toLowerCase().includes(query.toLowerCase()) || state.id.toLowerCase().includes(query.toLowerCase());
        const matchesLean = lean === "all" || state.safeColor === lean;
        return matchesQuery && matchesLean;
      }),
    [query, lean]
  );

  return (
    <div className="grid gap-4">
      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <MapPinned size={24} /> State Cards
            </h2>
            <p className="text-sm text-slate-600">Inline state-card information for primary type, party lean, electoral votes, and voter-group percentages.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input className="input w-56" placeholder="Search state" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="input w-44" value={lean} onChange={(event) => setLean(event.target.value as SafeColor | "all")}>
              <option value="all">All leans</option>
              <option value="blue">Blue lean</option>
              <option value="red">Red lean</option>
              <option value="purple">Purple</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((state) => (
          <article key={state.id} className="panel">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-black">{state.name}</div>
                <div className="text-sm font-semibold text-slate-600">{state.id}</div>
              </div>
              <div className={`px-3 py-1 text-sm font-black capitalize text-white ${state.safeColor === "blue" ? "bg-blue-700" : state.safeColor === "red" ? "bg-red-700" : "bg-slate-700"}`} style={{ borderRadius: 999 }}>
                {state.safeColor}
              </div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
              <div className="stat-card">
                <div className="text-xs font-black uppercase text-slate-500">Electoral votes</div>
                <div className="text-2xl font-black">{state.electoralVotes}</div>
              </div>
              <div className="stat-card">
                <div className="text-xs font-black uppercase text-slate-500">Primary</div>
                <div className="text-lg font-black capitalize">{state.primaryType}</div>
              </div>
            </div>
            <div className="space-y-2">
              {state.voterGroups
                .filter((group) => group.percentage > 0)
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 8)
                .map((group) => (
                  <div key={group.voterGroupId}>
                    <div className="flex justify-between text-xs font-bold">
                      <span>{voterGroupNameById[group.voterGroupId]}</span>
                      <span>{group.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100" style={{ borderRadius: 999 }}>
                      <div className="h-2 bg-blue-700" style={{ width: `${group.percentage}%`, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
