interface TokenStepperProps {
  value: number;
  onChange: (delta: number) => void;
  tone?: "blue" | "red" | "neutral";
  disabled?: boolean;
}

export default function TokenStepper({ value, onChange, tone = "neutral", disabled = false }: TokenStepperProps) {
  const color =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : tone === "red"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-slate-200 bg-slate-50 text-slate-900";
  return (
    <div className={`inline-grid grid-cols-[32px_42px_32px] items-center border ${color}`} style={{ borderRadius: 6 }}>
      <button className="h-9 font-bold hover:bg-white/60 disabled:opacity-40" onClick={() => onChange(-1)} aria-label="remove token" disabled={disabled}>
        -
      </button>
      <span className="text-center text-lg font-black">{value}</span>
      <button className="h-9 font-bold hover:bg-white/60 disabled:opacity-40" onClick={() => onChange(1)} aria-label="add token" disabled={disabled}>
        +
      </button>
    </div>
  );
}
