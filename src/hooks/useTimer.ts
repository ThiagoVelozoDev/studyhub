import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "studyhub:activeTimer";

export interface ActiveTimerState {
  planoId: string;
  disciplinaId: string;
  topicoId: string;
  /** Início real da sessão (primeira vez que foi iniciada), usado como `inicio`. */
  originalStartedAt: number;
  /** Início do segmento em execução; `null` quando pausado. */
  segmentStartedAt: number | null;
  /** Tempo já estudado (ms) acumulado dos segmentos anteriores, sem contar pausas. */
  accumulatedMs: number;
}

interface UseTimerResult {
  isRunning: boolean;
  isPaused: boolean;
  elapsedMs: number;
  activeTimer: ActiveTimerState | null;
  start: (context: Pick<ActiveTimerState, "planoId" | "disciplinaId" | "topicoId">) => void;
  pause: () => void;
  resume: () => void;
  stop: () => {
    planoId: string;
    disciplinaId: string;
    topicoId: string;
    startedAt: number;
    endedAt: number;
    durationMs: number;
  };
  discard: () => void;
}

function readStoredTimer(): ActiveTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveTimerState) : null;
  } catch {
    return null;
  }
}

function persist(timer: ActiveTimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

/**
 * Cronômetro baseado em timestamp (Date.now() - segmentStartedAt), nunca em
 * setInterval como fonte da verdade — assim ele permanece correto após
 * minimizar/atualizar a página. Suporta pausar e continuar várias vezes
 * antes de finalizar: o tempo pausado nunca entra em `elapsedMs`.
 */
export function useTimer(): UseTimerResult {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => readStoredTimer());
  const [, forceTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = !!activeTimer?.segmentStartedAt;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => forceTick((n) => n + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback((context: Pick<ActiveTimerState, "planoId" | "disciplinaId" | "topicoId">) => {
    const now = Date.now();
    const timer: ActiveTimerState = {
      ...context,
      originalStartedAt: now,
      segmentStartedAt: now,
      accumulatedMs: 0,
    };
    persist(timer);
    setActiveTimer(timer);
  }, []);

  const pause = useCallback(() => {
    setActiveTimer((current) => {
      const timer = current ?? readStoredTimer();
      if (!timer || !timer.segmentStartedAt) return current;
      const next: ActiveTimerState = {
        ...timer,
        accumulatedMs: timer.accumulatedMs + (Date.now() - timer.segmentStartedAt),
        segmentStartedAt: null,
      };
      persist(next);
      return next;
    });
  }, []);

  const resume = useCallback(() => {
    setActiveTimer((current) => {
      const timer = current ?? readStoredTimer();
      if (!timer || timer.segmentStartedAt) return current;
      const next: ActiveTimerState = { ...timer, segmentStartedAt: Date.now() };
      persist(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    const timer = activeTimer ?? readStoredTimer();
    if (!timer) throw new Error("Nenhum cronômetro ativo para finalizar");
    const endedAt = Date.now();
    const durationMs =
      timer.accumulatedMs + (timer.segmentStartedAt ? endedAt - timer.segmentStartedAt : 0);
    localStorage.removeItem(STORAGE_KEY);
    setActiveTimer(null);
    return {
      planoId: timer.planoId,
      disciplinaId: timer.disciplinaId,
      topicoId: timer.topicoId,
      startedAt: timer.originalStartedAt,
      endedAt,
      durationMs,
    };
  }, [activeTimer]);

  const discard = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveTimer(null);
  }, []);

  const elapsedMs = activeTimer
    ? activeTimer.accumulatedMs + (activeTimer.segmentStartedAt ? Date.now() - activeTimer.segmentStartedAt : 0)
    : 0;

  return {
    isRunning,
    isPaused: !!activeTimer && !isRunning,
    elapsedMs,
    activeTimer,
    start,
    pause,
    resume,
    stop,
    discard,
  };
}
