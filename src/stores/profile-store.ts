import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, register as apiRegister } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";

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
  token: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
      token: null,
      signIn: async (email, password) => {
        set({ isSigningIn: true });
        try {
          const res = await apiLogin(email, password);
          set({ email, token: res.access_token, isSignedIn: true, isSigningIn: false });
          return { success: true };
        } catch (err) {
          set({ isSigningIn: false });
          return { success: false, error: getErrorMessage(err) };
        }
      },
      register: async (email, password) => {
        set({ isSigningIn: true });
        try {
          const res = await apiRegister(email, password);
          set({ email, token: res.access_token, isSignedIn: true, isSigningIn: false });
          return { success: true };
        } catch (err) {
          set({ isSigningIn: false });
          return { success: false, error: getErrorMessage(err) };
        }
      },
      signOut: () => set({ email: "", token: null, isSignedIn: false }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
    }),
    {
      name: "essay-grader-profile",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const state = persisted as Record<string, unknown>;
          return { ...state, isSignedIn: false, token: null, email: "" };
        }
        return persisted;
      },
      partialize: (state) => ({
        email: state.email,
        gradeLevel: state.gradeLevel,
        isSignedIn: state.isSignedIn,
        token: state.token,
      }),
    }
  )
);
