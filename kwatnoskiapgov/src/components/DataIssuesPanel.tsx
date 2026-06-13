import type { DataIssue } from "../types";

export default function DataIssuesPanel({ issues }: { issues: DataIssue[] }) {
  if (issues.length === 0) {
    return <div className="panel border-emerald-200 bg-emerald-50 text-emerald-900">Data check passed.</div>;
  }
  return (
    <div className="panel border-amber-200 bg-amber-50">
      <div className="mb-2 text-lg font-black text-amber-950">Data Issues</div>
      <div className="space-y-2">
        {issues.map((issue, index) => (
          <div key={`${issue.message}-${index}`} className="text-sm text-amber-950">
            <span className="font-bold uppercase">{issue.severity}</span>: {issue.message}
          </div>
        ))}
      </div>
    </div>
  );
}
