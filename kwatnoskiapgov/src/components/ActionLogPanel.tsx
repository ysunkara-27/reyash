import { useGameStore } from "../store/gameStore";

export default function ActionLogPanel({ large = false }: { large?: boolean }) {
  const actionLog = useGameStore((state) => state.actionLog);

  if (actionLog.length === 0) {
    return <div className="panel text-slate-700">No actions logged yet.</div>;
  }

  return (
    <section className="panel">
      <h2 className={`${large ? "text-3xl" : "text-2xl"} mb-3 font-black`}>Recent Actions</h2>
      <div className="max-h-[620px] overflow-y-auto">
        {[...actionLog].reverse().map((entry) => (
          <div key={entry.id} className="border-b border-slate-100 py-2">
            <div className={`${large ? "text-xl" : "text-sm"} font-bold`}>{entry.message}</div>
            <div className="text-sm text-slate-600">{new Date(entry.at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
