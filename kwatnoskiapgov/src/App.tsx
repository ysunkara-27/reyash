import { useState } from "react";
import ActionLogPanel from "./components/ActionLogPanel";
import CardsEffectsTab from "./components/CardsEffectsTab";
import CalendarTab from "./components/CalendarTab";
import ClassMonitorView from "./components/ClassMonitorView";
import ConventionTab from "./components/ConventionTab";
import DataIssuesPanel from "./components/DataIssuesPanel";
import ElectionNightTab from "./components/ElectionNightTab";
import GeneralElectionTab from "./components/GeneralElectionTab";
import Layout, { type TabName } from "./components/Layout";
import PrimaryCounterTab from "./components/PrimaryCounterTab";
import ResultsReflectionTab from "./components/ResultsReflectionTab";
import RoleSelection from "./components/RoleSelection";
import SetupTab from "./components/SetupTab";
import StudentHub from "./components/StudentHub";
import TeacherLogin from "./components/TeacherLogin";
import TeacherToolsTab from "./components/TeacherToolsTab";
import VoterGroupsTab from "./components/VoterGroupsTab";
import { isTeacherUnlocked, lockTeacher } from "./lib/teacherAuth";
import { roleLabel, type UserRole } from "./lib/permissions";
import { dataIssues, useGameStore } from "./store/gameStore";

const teacherTabs = [
  "Setup",
  "Game Board",
  "Calendar",
  "Cards & Effects",
  "Primaries",
  "Convention",
  "General Election",
  "Election Night",
  "Results",
  "Teacher Tools"
] as const;

const scorekeeperTabs = ["Quick Token Board", "Apply Card", "Primary Counter", "General Election Board", "Action Log"] as const;

export default function App() {
  const activeRole = useGameStore((state) => state.activeRole);
  const setActiveRole = useGameStore((state) => state.setActiveRole);
  const [activeTab, setActiveTab] = useState<TabName>("Setup");
  const [teacherLoginOpen, setTeacherLoginOpen] = useState(false);

  const switchRole = () => {
    setActiveRole(null);
    setTeacherLoginOpen(false);
  };

  const chooseRole = (role: UserRole) => {
    if (role === "teacher") {
      if (isTeacherUnlocked()) {
        setActiveRole("teacher");
        setActiveTab("Setup");
      } else {
        setTeacherLoginOpen(true);
      }
      return;
    }
    setActiveRole(role);
    setActiveTab(role === "scorekeeper" ? "Quick Token Board" : "Setup");
  };

  if (teacherLoginOpen && activeRole !== "teacher") {
    return (
      <TeacherLogin
        onUnlocked={() => {
          setTeacherLoginOpen(false);
          setActiveRole("teacher");
          setActiveTab("Setup");
        }}
        onSwitchRole={switchRole}
      />
    );
  }

  if (!activeRole) {
    return <RoleSelection onChooseRole={chooseRole} />;
  }

  if (activeRole === "student") {
    return <StudentHub onSwitchRole={switchRole} />;
  }

  if (activeRole === "monitor") {
    return <ClassMonitorView onSwitchRole={switchRole} />;
  }

  if (activeRole === "scorekeeper") {
    return (
      <Layout tabs={scorekeeperTabs} activeTab={activeTab} onTabChange={setActiveTab} roleLabel={roleLabel(activeRole)} onSwitchRole={switchRole}>
        {activeTab === "Quick Token Board" && <VoterGroupsTab />}
        {activeTab === "Apply Card" && <CardsEffectsTab />}
        {activeTab === "Primary Counter" && <PrimaryCounterTab />}
        {activeTab === "General Election Board" && <GeneralElectionTab />}
        {activeTab === "Action Log" && <ActionLogPanel />}
      </Layout>
    );
  }

  return (
    <Layout
      tabs={teacherTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleLabel={roleLabel(activeRole)}
      onSwitchRole={switchRole}
      onLockTeacher={() => {
        lockTeacher();
        setActiveRole(null);
        setTeacherLoginOpen(true);
      }}
    >
      {dataIssues.some((issue) => issue.severity === "error") && activeTab !== "Teacher Tools" && (
        <div className="mb-4">
          <DataIssuesPanel issues={dataIssues.filter((issue) => issue.severity === "error")} />
        </div>
      )}
      {activeTab === "Setup" && <SetupTab />}
      {activeTab === "Game Board" && <VoterGroupsTab />}
      {activeTab === "Calendar" && <CalendarTab goToPrimaryCounter={() => setActiveTab("Primaries")} />}
      {activeTab === "Cards & Effects" && <CardsEffectsTab />}
      {activeTab === "Primaries" && <PrimaryCounterTab />}
      {activeTab === "Convention" && <ConventionTab />}
      {activeTab === "General Election" && <GeneralElectionTab />}
      {activeTab === "Election Night" && <ElectionNightTab />}
      {activeTab === "Results" && <ResultsReflectionTab />}
      {activeTab === "Teacher Tools" && <TeacherToolsTab />}
    </Layout>
  );
}
