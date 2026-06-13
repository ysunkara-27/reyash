import type { UserRole } from "../lib/permissions";
import { ArrowRight, ClipboardCheck, GraduationCap, Landmark, MonitorUp, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const roles: Array<{ role: UserRole; title: string; description: string; Icon: LucideIcon; tone: string }> = [
  {
    role: "teacher",
    title: "Teacher Mode",
    description: "Setup, convention, election night, imports, exports, and teacher-only decisions.",
    Icon: Landmark,
    tone: "bg-blue-700 text-white"
  },
  {
    role: "scorekeeper",
    title: "Scorekeeper Mode",
    description: "Fast token updates, card effects, primary previews, notes, and action logging.",
    Icon: ClipboardCheck,
    tone: "bg-red-700 text-white"
  },
  {
    role: "student",
    title: "Student Candidate View",
    description: "Candidate strengths, delegate totals, target groups, and recent changes.",
    Icon: GraduationCap,
    tone: "bg-slate-900 text-white"
  },
  {
    role: "monitor",
    title: "Class Monitor View",
    description: "Projector scoreboard for phase, month, delegates, voter groups, and results.",
    Icon: MonitorUp,
    tone: "bg-white text-blue-900 border border-blue-200"
  }
];

export default function RoleSelection({ onChooseRole }: { onChooseRole: (role: UserRole) => void }) {
  return (
    <main className="min-h-screen bg-classroom px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="mode-badge mb-4">
            <Landmark size={18} /> AP Government Simulation
          </div>
          <h1 className="text-5xl font-black text-ink">Election Control Center</h1>
          <p className="mt-2 text-xl font-semibold text-slate-700">Choose the classroom view you need.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((item) => (
            <button
              key={item.role}
              className="role-card"
              onClick={() => onChooseRole(item.role)}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center ${item.tone}`} style={{ borderRadius: 8 }}>
                <item.Icon size={26} />
              </div>
              <div className="text-2xl font-black text-slate-950">{item.title}</div>
              <div className="mt-2 text-base text-slate-700">{item.description}</div>
            </button>
          ))}
        </div>
        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel">
            <div className="mb-3 flex items-center gap-2 text-xl font-black">
              <Route size={22} /> First-Time Guide
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-700">
              <p>
                Start by choosing the role that matches what you are doing in class. You can switch roles at any time with
                the <span className="font-bold">Switch Role</span> button.
              </p>
              <p>
                The usual game path is <span className="font-bold">Setup</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">Primaries</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">Convention</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">General Election</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">Election Night</span>.
              </p>
              <p>
                Use the physical board, cards, and tokens as normal. This app mirrors the classroom game and does the math
                for delegates, voter-group control, and Electoral College results.
              </p>
            </div>
          </div>
          <div className="panel">
            <div className="mb-3 text-xl font-black">Which Role Should I Pick?</div>
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <GuideItem title="Teacher" text="Unlocks setup, final decisions, overrides, imports, exports, and reset controls." />
              <GuideItem title="Scorekeeper" text="Best for the student entering tokens, cards, notes, and primary previews during play." />
              <GuideItem title="Student Candidate" text="Read-only candidate dashboard for strengths, weak states, delegate totals, and target groups." />
              <GuideItem title="Class Monitor" text="Projector-safe scoreboard for the whole room. Use Presentation Mode for a larger display." />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function GuideItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3" style={{ borderRadius: 8 }}>
      <div className="font-black text-slate-950">{title}</div>
      <div>{text}</div>
    </div>
  );
}
