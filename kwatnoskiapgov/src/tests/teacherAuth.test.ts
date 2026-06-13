import { beforeEach, describe, expect, it } from "vitest";
import {
  getTeacherPassword,
  isDefaultTeacherPasswordActive,
  isTeacherUnlocked,
  lockTeacher,
  setTeacherPassword,
  unlockTeacher
} from "../lib/teacherAuth";

describe("teacher auth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("uses the default password until changed", () => {
    expect(getTeacherPassword()).toBe("pine");
    expect(isDefaultTeacherPasswordActive()).toBe(true);
  });

  it("unlocks and locks teacher mode in session storage", () => {
    expect(unlockTeacher("wrong")).toBe(false);
    expect(isTeacherUnlocked()).toBe(false);
    expect(unlockTeacher("pine")).toBe(true);
    expect(isTeacherUnlocked()).toBe(true);
    lockTeacher();
    expect(isTeacherUnlocked()).toBe(false);
  });

  it("changes the teacher password", () => {
    setTeacherPassword("newpass");
    expect(getTeacherPassword()).toBe("newpass");
    expect(unlockTeacher("pine")).toBe(false);
    expect(unlockTeacher("newpass")).toBe(true);
  });

  it("migrates the old classroom default password", () => {
    localStorage.setItem("election-control-center-teacher-password", "teacher123");
    expect(getTeacherPassword()).toBe("pine");
    expect(unlockTeacher("teacher123")).toBe(false);
    expect(unlockTeacher("pine")).toBe(true);
  });
});
