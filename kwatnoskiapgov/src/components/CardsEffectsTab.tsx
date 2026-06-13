import { useMemo, useState } from "react";
import { cards } from "../data/cards";
import { candidateIds } from "../data/candidates";
import { voterGroups } from "../data/voterGroups";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";
import type { CandidateId, Party, VoterGroupId } from "../types";

type Target = CandidateId | Party;

export default function CardsEffectsTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [query, setQuery] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id ?? "");
  const [target, setTarget] = useState<Target>("blueA");
  const [manualTitle, setManualTitle] = useState("");
  const [manualGroup, setManualGroup] = useState<VoterGroupId>(voterGroups[0].id);
  const [manualDelta, setManualDelta] = useState(1);

  const filteredCards = useMemo(
    () => cards.filter((card) => `${card.title} ${card.type} ${card.description}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="panel space-y-3">
        <h2 className="text-2xl font-black">Card Search & Apply</h2>
        <input className="input" placeholder="Search cards" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="input" value={selectedCardId} onChange={(event) => setSelectedCardId(event.target.value)}>
          {filteredCards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.title} ({card.type})
            </option>
          ))}
        </select>
        <TargetPicker value={target} onChange={setTarget} />
        <button className="btn btn-primary" onClick={() => store.applyCard(selectedCardId, target)} disabled={!selectedCardId || !permissions.canApplyCards}>
          Apply selected card
        </button>
        <div className="max-h-72 overflow-y-auto border-t border-slate-200 pt-3">
          {filteredCards.map((card) => (
            <div key={card.id} className="border-b border-slate-100 py-2 text-sm">
              <div className="font-black">{card.title}</div>
              <div className="font-semibold text-slate-600">{card.type}</div>
              <div className="text-slate-700">{card.description}</div>
              <div className="mt-1 text-slate-600">
                {card.effects.length ? card.effects.map((effect) => `${effect.voterGroupId} ${effect.delta > 0 ? "+" : ""}${effect.delta}`).join(", ") : "No automatic token effects"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel space-y-3">
        <h2 className="text-2xl font-black">Manual Effect</h2>
        <input className="input" placeholder="Card title" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} />
        <select className="input" value={manualGroup} onChange={(event) => setManualGroup(event.target.value as VoterGroupId)}>
          {voterGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          value={manualDelta}
          onChange={(event) => setManualDelta(Number(event.target.value))}
        />
        <TargetPicker value={target} onChange={setTarget} />
        <button
          className="btn btn-primary"
          disabled={!permissions.canApplyCards}
          onClick={() => store.addManualCard(manualTitle || "Manual card", target, [{ voterGroupId: manualGroup, delta: manualDelta }])}
        >
          Apply manual effect
        </button>
        <h3 className="pt-3 text-lg font-black">Played Cards</h3>
        <div className="max-h-72 overflow-y-auto">
          {store.playedCards.map((card) => (
            <div key={`${card.id}-${card.playedAt}`} className="border-b border-slate-100 py-2 text-sm">
              <div className="font-bold">{card.title}</div>
              <div className="text-slate-600">
                {card.type} to {card.target}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TargetPicker({ value, onChange }: { value: Target; onChange: (value: Target) => void }) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value as Target)}>
      {candidateIds.map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
      <option value="blue">Blue Party</option>
      <option value="red">Red Party</option>
    </select>
  );
}
