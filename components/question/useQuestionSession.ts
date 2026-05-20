"use client";

import { useState, useRef, useCallback } from "react";
import { checkPracticeAnswer } from "@/app/dashboard/practice/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionState = {
  selectedId: string | null;
  isPending: boolean;
  correctId: string | null; // null in mock for entire session
  explanation: string | null;
  kotAiExplanation: string | null;
  isFlagged: boolean;
};

export type InitialQuestionState = {
  selectedId?: string | null;
  correctId?: string | null;
  explanation?: string | null;
};

type UseQuestionSessionOptions = {
  mode: "practice" | "mock";
  /** Called after selectedId + correctId are committed to state */
  onAnswered?: (
    questionId: string,
    selectedId: string,
    elapsed: number
  ) => void;
};

type UseQuestionSessionReturn = {
  states: QuestionState[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  /** Call once after async question load to populate states */
  initialize: (
    questionIds: string[],
    initialStates?: InitialQuestionState[],
    startIndex?: number
  ) => void;
  handleSelect: (optionId: string) => void;
  toggleFlag: (index?: number) => void;
  advance: () => void;
  goPrev: () => void;
  setAiExplanation: (index: number, text: string) => void;
};

function blankState(): QuestionState {
  return {
    selectedId: null,
    isPending: false,
    correctId: null,
    explanation: null,
    kotAiExplanation: null,
    isFlagged: false,
  };
}

function mergeInitial(
  override: InitialQuestionState | undefined
): QuestionState {
  return {
    ...blankState(),
    selectedId: override?.selectedId ?? null,
    correctId: override?.correctId ?? null,
    explanation: override?.explanation ?? null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuestionSession({
  mode,
  onAnswered,
}: UseQuestionSessionOptions): UseQuestionSessionReturn {
  const [states, setStates] = useState<QuestionState[]>([]);
  const [currentIndex, setCurrentIndexState] = useState(0);

  // Refs that mirror the latest committed values — used inside async callbacks
  // to avoid stale closures without depending on state values in useCallback.
  const currentIndexRef = useRef(0);
  const questionIdsRef = useRef<string[]>([]);
  const statesRef = useRef<QuestionState[]>([]);

  // Track which optionId was in-flight per question index (stale-response guard).
  const inFlightRef = useRef<Map<number, string>>(new Map());

  // Per-question timer — reset on navigation.
  const questionStartTime = useRef<number>(Date.now());

  // ── Sync refs whenever state changes ─────────────────────────────────────
  // We piggyback on setStates to keep statesRef up to date.

  function updateStates(
    updater: (prev: QuestionState[]) => QuestionState[]
  ) {
    setStates((prev) => {
      const next = updater(prev);
      statesRef.current = next;
      return next;
    });
  }

  function goToIndex(index: number) {
    questionStartTime.current = Date.now();
    currentIndexRef.current = index;
    setCurrentIndexState(index);
  }

  // ── initialize ────────────────────────────────────────────────────────────

  const initialize = useCallback(
    (
      questionIds: string[],
      initialStates?: InitialQuestionState[],
      startIndex?: number
    ) => {
      questionIdsRef.current = questionIds;
      inFlightRef.current.clear();
      questionStartTime.current = Date.now();

      const built = questionIds.map((_, i) =>
        mergeInitial(initialStates?.[i])
      );
      statesRef.current = built;
      setStates(built);

      const idx = startIndex ?? 0;
      currentIndexRef.current = idx;
      setCurrentIndexState(idx);
    },
    []
  );

  // ── setCurrentIndex (public) ──────────────────────────────────────────────

  const setCurrentIndex = useCallback((index: number) => {
    goToIndex(index);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── handleSelect ──────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    async (optionId: string) => {
      const idx = currentIndexRef.current;
      const questionIds = questionIdsRef.current;
      const current = statesRef.current[idx];

      if (!current || !questionIds[idx]) return;

      // Mock mode: store selection locally, never call the server.
      if (mode === "mock") {
        updateStates((prev) => {
          const next = [...prev];
          if (!next[idx]) return prev;
          next[idx] = { ...next[idx], selectedId: optionId };
          return next;
        });
        return;
      }

      // Practice mode: lock if already confirmed.
      if (current.correctId !== null) return;

      const elapsed = Math.max(
        0,
        Math.round((Date.now() - questionStartTime.current) / 1000)
      );

      // Register in-flight.
      inFlightRef.current.set(idx, optionId);

      // Optimistic: show pending/selected treatment immediately.
      updateStates((prev) => {
        const next = [...prev];
        if (!next[idx]) return prev;
        // Guard again in case correctId was set by a racing response.
        if (next[idx].correctId !== null) return prev;
        next[idx] = { ...next[idx], selectedId: optionId, isPending: true };
        return next;
      });

      // Dispatch to server.
      const result = await checkPracticeAnswer(questionIds[idx]);

      // Stale-response guard.
      if (inFlightRef.current.get(idx) !== optionId) return;
      inFlightRef.current.delete(idx);

      if ("error" in result) {
        // Clear pending but keep selectedId — let the user retry.
        updateStates((prev) => {
          const next = [...prev];
          if (!next[idx]) return prev;
          next[idx] = { ...next[idx], isPending: false };
          return next;
        });
        return;
      }

      // Commit confirmed answer.
      updateStates((prev) => {
        const next = [...prev];
        if (!next[idx]) return prev;
        next[idx] = {
          ...next[idx],
          selectedId: optionId,
          isPending: false,
          correctId: result.correctId,
          explanation: result.explanation,
        };
        return next;
      });

      onAnswered?.(questionIds[idx], optionId, elapsed);
    },
    [mode, onAnswered]
  );

  // ── toggleFlag ────────────────────────────────────────────────────────────

  const toggleFlag = useCallback((index?: number) => {
    const idx = index ?? currentIndexRef.current;
    updateStates((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      next[idx] = { ...next[idx], isFlagged: !next[idx].isFlagged };
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── advance / goPrev ─────────────────────────────────────────────────────

  const advance = useCallback(() => {
    const next = Math.min(
      currentIndexRef.current + 1,
      questionIdsRef.current.length - 1
    );
    goToIndex(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goPrev = useCallback(() => {
    const next = Math.max(currentIndexRef.current - 1, 0);
    goToIndex(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── setAiExplanation ──────────────────────────────────────────────────────

  const setAiExplanation = useCallback((index: number, text: string) => {
    updateStates((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], kotAiExplanation: text };
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    states,
    currentIndex,
    setCurrentIndex,
    initialize,
    handleSelect,
    toggleFlag,
    advance,
    goPrev,
    setAiExplanation,
  };
}
