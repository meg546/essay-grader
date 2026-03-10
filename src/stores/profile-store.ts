import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, register as apiRegister, getMe } from "@/api/auth";
import { getErrorMessage } from "@/api/errors";

export type GradeLevel = "elementary" | "middle-school" | "high-school" | "college";
export type WritingPurpose = "work" | "school" | "other";

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  elementary: "Elementary",
  "middle-school": "Middle School",
  "high-school": "High School",
  college: "College",
};

export const WRITING_PURPOSE_LABELS: Record<WritingPurpose, string> = {
  work: "Work",
  school: "School",
  other: "Other",
};

interface ProfileState {
  email: string;
  gradeLevel: GradeLevel | null;
  writingPurpose: WritingPurpose | null;
  isSignedIn: boolean;
  isSigningIn: boolean;
  token: string | null;
  needsOnboarding: () => boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  setGradeLevel: (level: GradeLevel) => void;
  setWritingPurpose: (purpose: WritingPurpose) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      email: "",
      gradeLevel: null,
      writingPurpose: null,
      isSignedIn: false,
      isSigningIn: false,
      token: null,
      needsOnboarding: () => get().isSignedIn && get().gradeLevel === null,
      signIn: async (email, password) => {
        set({ isSigningIn: true });
        try {
          const res = await apiLogin(email, password);
          set({ email, token: res.access_token, isSignedIn: true, isSigningIn: false });
          try {
            const profile = await getMe();
            set({
              gradeLevel: profile.gradeLevel as GradeLevel | null,
              writingPurpose: profile.writingPurpose as WritingPurpose | null,
            });
          } catch {
            // If getMe fails, keep local state — preferences will sync later
          }
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
          set({
            email,
            token: res.access_token,
            isSignedIn: true,
            isSigningIn: false,
            gradeLevel: null,
            writingPurpose: null,
          });
          return { success: true };
        } catch (err) {
          set({ isSigningIn: false });
          return { success: false, error: getErrorMessage(err) };
        }
      },
      signOut: () => set({ email: "", token: null, isSignedIn: false, gradeLevel: null, writingPurpose: null }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
      setWritingPurpose: (writingPurpose) => set({ writingPurpose }),
    }),
    {
      name: "essay-grader-profile",
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, isSignedIn: false, token: null, email: "", writingPurpose: null };
        }
        if (version < 3) {
          return { ...state, writingPurpose: null };
        }
        return persisted;
      },
      partialize: (state) => ({
        email: state.email,
        gradeLevel: state.gradeLevel,
        writingPurpose: state.writingPurpose,
        isSignedIn: state.isSignedIn,
        token: state.token,
      }),
    }
  )
);
