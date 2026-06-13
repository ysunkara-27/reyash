import { candidateById, candidateIds } from "../data/candidates";
import { cards } from "../data/cards";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";
import type { CandidateId, Party } from "../types";
import { detectNominee } from "../lib/rules/conventionRules";

export default function ConventionTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const platformCards = cards.filter((card) => card.type === "Platform Idea");
  const suggestedBlue = detectNominee(store.delegateTotals, "blue");
  const suggestedRed = detectNominee(store.delegateTotals, "red");

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="panel space-y-4">
        <h2 className="text-2xl font-black">Delegate Count</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {candidateIds.map((id) => (
            <div key={id} className={`border p-3 ${id.startsWith("blue") ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`} style={{ borderRadius: 8 }}>
              <div className="font-bold">{candidateById[id].name}</div>
              <div className="text-3xl font-black">{store.delegateTotals[id]}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-3">
          <NomineeSelect
            party="blue"
            value={store.nominees.blue ?? suggestedBlue}
            disabled={!permissions.canRunConvention}
            onChange={(candidateId) => store.setNominee("blue", candidateId)}
          />
          <NomineeSelect
            party="red"
            value={store.nominees.red ?? suggestedRed}
            disabled={!permissions.canRunConvention}
            onChange={(candidateId) => store.setNominee("red", candidateId)}
          />
        </div>
        <button className="btn btn-primary" onClick={store.startGeneralElection} disabled={!permissions.canRunConvention}>
          Start general election
        </button>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-2xl font-black">Platform Picker</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(["blue", "red"] as Party[]).map((party) => (
            <div key={party} className="space-y-2">
              <h3 className={`text-lg font-black ${party === "blue" ? "text-blue-800" : "text-red-800"}`}>
                {party === "blue" ? "Blue" : "Red"} platform cards ({store.platformCards[party].length}/5)
              </h3>
              <div className="max-h-[480px] overflow-y-auto border border-slate-200">
                {platformCards.map((card) => {
                  const checked = store.platformCards[party].includes(card.id);
                  return (
                    <label key={`${party}-${card.id}`} className="flex gap-2 border-b border-slate-100 p-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const current = store.platformCards[party];
                          const next = event.target.checked ? [...current, card.id].slice(0, 5) : current.filter((id) => id !== card.id);
                          store.setPlatformCards(party, next);
                        }}
                        disabled={!permissions.canRunConvention}
                      />
                      <span>
                        <span className="font-bold">{card.title}</span>
                        <br />
                        <span className="text-slate-600">{card.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NomineeSelect({
  party,
  value,
  disabled,
  onChange
}: {
  party: Party;
  value: CandidateId;
  disabled: boolean;
  onChange: (candidateId: CandidateId) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-sm font-bold capitalize">{party} nominee</span>
      <select className="input" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as CandidateId)}>
        {candidateIds
          .filter((id) => candidateById[id].party === party)
          .map((id) => (
            <option key={id} value={id}>
              {candidateById[id].name}
            </option>
          ))}
      </select>
    </label>
  );
}
