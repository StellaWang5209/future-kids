"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Kid progress store.
 *
 * Two layers:
 *  - Demo mode: everything lives in localStorage — zero wallet needed. This IS
 *    the child-friendly default experience.
 *  - On-chain mode: when a guardian's wallet is connected and contracts are
 *    configured, chapter completions and badges are also written to Ethereum
 *    and their tx hashes are remembered here.
 */

export type ChapterProgress = {
  completedAt: string;
  demo: boolean;
  proofTx?: string;
  badgeTx?: string;
};

export type Identity = {
  pseudonym: string;
  avatar: string;
  createdAt: string;
  demo: boolean;
};

export type Progress = {
  identity: Identity | null;
  chapters: Record<number, ChapterProgress>;
};

const STORAGE_KEY = "fk-progress-v1";

const EMPTY: Progress = { identity: null, chapters: {} };

function load(): Progress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Progress;
    return { identity: parsed.identity ?? null, chapters: parsed.chapters ?? {} };
  } catch {
    return EMPTY;
  }
}

type Ctx = {
  progress: Progress;
  hydrated: boolean;
  setIdentity: (id: Identity) => void;
  completeChapter: (chapterId: number, opts?: { proofTx?: string; badgeTx?: string; demo?: boolean }) => void;
  markBadgeTx: (chapterId: number, badgeTx: string) => void;
  resetAll: () => void;
};

const ProgressCtx = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, hydrated]);

  const setIdentity = useCallback((id: Identity) => {
    setProgress((p) => ({ ...p, identity: id }));
  }, []);

  const completeChapter = useCallback((chapterId: number, opts?: { proofTx?: string; badgeTx?: string; demo?: boolean }) => {
    setProgress((p) => {
      const existing = p.chapters[chapterId];
      return {
        ...p,
        chapters: {
          ...p.chapters,
          [chapterId]: {
            completedAt: existing?.completedAt ?? new Date().toISOString(),
            demo: opts?.demo ?? existing?.demo ?? true,
            proofTx: opts?.proofTx ?? existing?.proofTx,
            badgeTx: opts?.badgeTx ?? existing?.badgeTx,
          },
        },
      };
    });
  }, []);

  const markBadgeTx = useCallback((chapterId: number, badgeTx: string) => {
    setProgress((p) => {
      const ch = p.chapters[chapterId];
      if (!ch) return p;
      return { ...p, chapters: { ...p.chapters, [chapterId]: { ...ch, badgeTx } } };
    });
  }, []);

  const resetAll = useCallback(() => {
    setProgress(EMPTY);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ progress, hydrated, setIdentity, completeChapter, markBadgeTx, resetAll }),
    [progress, hydrated, setIdentity, completeChapter, markBadgeTx, resetAll]
  );

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
