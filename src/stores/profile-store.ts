import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GradeLevel = "elementary" | "middle-school" | "high-school" | "college";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  elementary: "Elementary",
  "middle-school": "Middle School",
  "high-school": "High School",
  college: "College",
};

interface ProfileState {
  email: string;
  gradeLevel: GradeLevel;
  isSignedIn: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
  setGradeLevel: (level: GradeLevel) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      email: "",
      gradeLevel: "high-school",
      isSignedIn: false,
      signIn: (email) => set({ email, isSignedIn: true }),
      signOut: () => set({ email: "", isSignedIn: false }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
    }),
    { name: "essay-grader-profile" }
  )
);
