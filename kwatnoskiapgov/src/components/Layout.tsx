import type { ReactNode } from "react";
import { Landmark, Lock, Repeat2 } from "lucide-react";

export type TabName = string;

export default function Layout({
  tabs,
  activeTab,
  onTabChange,
  roleLabel,
  onSwitchRole,
  onLockTeacher,
  children
}: {
  tabs: readonly string[];
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  roleLabel: string;
  onSwitchRole: () => void;
  onLockTeacher?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-classroom">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-blue-900 text-white" style={{ borderRadius: 8 }}>
                <Landmark size={28} />
              </div>
              <div>
              <h1 className="text-3xl font-black text-ink">Election Control Center</h1>
                <p className="text-sm font-semibold text-slate-600">You are in: {roleLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {onLockTeacher && (
                <button className="btn border-amber-300 text-amber-900" onClick={onLockTeacher}>
                  <Lock size={16} /> Lock Teacher Mode
                </button>
              )}
              <button className="btn" onClick={onSwitchRole}>
                <Repeat2 size={16} /> Switch Role
              </button>
              <div className="flex overflow-hidden border border-slate-300 text-sm font-black" style={{ borderRadius: 8 }}>
                <div className="bg-blue-700 px-4 py-2 text-white">Blue</div>
                <div className="bg-red-700 px-4 py-2 text-white">Red</div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-600">
            <span className="font-bold">Location:</span> {roleLabel} / {activeTab}
          </div>
          <div className="mt-2 border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-950" style={{ borderRadius: 8 }}>
            Use the tabs below from left to right for the normal game flow. Use <span className="font-bold">Switch Role</span>{" "}
            when a different classroom user needs a simpler view.
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`whitespace-nowrap border px-3 py-2 text-sm font-bold ${
                  activeTab === tab ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"
                }`}
                style={{ borderRadius: 6 }}
                onClick={() => onTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">{children}</main>
    </div>
  );
}
