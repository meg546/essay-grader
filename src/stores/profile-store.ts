import { create } from "zustand";
import { persist } from "zustand/middleware";
import { delay } from "@/api/delay";

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
  isSigningIn: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  setGradeLevel: (level: GradeLevel) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      email: "",
      gradeLevel: "high-school",
      isSignedIn: false,
      isSigningIn: false,
      signIn: async (email, password) => {
        set({ isSigningIn: true });
        await delay(1000);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          set({ isSigningIn: false });
          return { success: false, error: "Invalid email format" };
        }

        if (password.length < 6) {
          set({ isSigningIn: false });
          return { success: false, error: "Password must be at least 6 characters" };
        }

        set({ email, isSignedIn: true, isSigningIn: false });
        return { success: true };
      },
      signOut: () => set({ email: "", isSignedIn: false }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
    }),
    {
      name: "essay-grader-profile",
      partialize: (state) => ({
        email: state.email,
        gradeLevel: state.gradeLevel,
        isSignedIn: state.isSignedIn,
      }),
    }
  )
);
