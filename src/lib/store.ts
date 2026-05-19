import { useState, useEffect } from 'react';

export interface JournalEntry {
  mood?: number;
  pain?: {
    level: number; // 0-5
    locations: string[];
  };
  note?: string;
  mode?: 'healing' | 'resonance';
}

export interface LetterRecord {
  createdAt: string;
  scope: 'week' | 'fortnight' | 'month' | 'cycle-end';
  rangeStart: string;
  rangeEnd: string;
  body: string;
  source: 'deepseek' | 'fallback';
}

export interface DietPrefs {
  allergies: string[];
  religion: string[];
  dietMode: string;
  healthGoals: string[];
  spicy: string;
  oil: string;
  avoid: string[];
}

export interface ExercisePrefs {
  conditions: string[];
  goals: string[];
  environment: string[];
  avoiding: string[];
}

interface State {
  nickname: string | null;
  lastPeriodStart: string | null;
  cycleLength: number;
  ttsEnabled: boolean;
  appMode: 'healing' | 'resonance';
  journal: Record<string, JournalEntry>;
  letters: Record<string, LetterRecord>;
  persona: "bestie" | "mother" | "tide";
  dietPreferences: DietPrefs;
  exercisePreferences: ExercisePrefs;
}

let globalStore: State = {
  nickname: null,
  lastPeriodStart: new Date().toISOString(),
  cycleLength: 28,
  ttsEnabled: false,
  appMode: 'healing',
  journal: {},
  letters: {},
  persona: "tide",
  dietPreferences: {
    allergies: [],
    religion: [],
    dietMode: "无限制",
    healthGoals: [],
    spicy: "微辣",
    oil: "正常",
    avoid: [],
  },
  exercisePreferences: {
    conditions: [],
    goals: [],
    environment: [],
    avoiding: [],
  },
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => l());
}

export function useInnertideStore() {
  const [loaded, setLoaded] = useState(false);
  const [store, setStore] = useState<State>(globalStore);

  useEffect(() => {
    // Basic mock of localStorage hydration
    try {
      const stored = localStorage.getItem('innertide-store');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: Ensure dietPreferences is the correct object shape
        if (!parsed.dietPreferences || Array.isArray(parsed.dietPreferences)) {
          parsed.dietPreferences = { ...globalStore.dietPreferences };
        } else {
          parsed.dietPreferences = { ...globalStore.dietPreferences, ...parsed.dietPreferences };
        }

        // Migration: Ensure exercisePreferences is the correct object shape
        if (!parsed.exercisePreferences || Array.isArray(parsed.exercisePreferences)) {
          parsed.exercisePreferences = { ...globalStore.exercisePreferences };
        } else {
          parsed.exercisePreferences = { ...globalStore.exercisePreferences, ...parsed.exercisePreferences };
        }
        globalStore = { ...globalStore, ...parsed };
        setStore(globalStore);
      }
    } catch {}
    setLoaded(true);

    const listener = () => setStore(globalStore);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const updateGlobal = (updates: Partial<State> | ((s: State) => Partial<State>)) => {
    const patch = typeof updates === 'function' ? updates(globalStore) : updates;
    globalStore = { ...globalStore, ...patch };
    try { localStorage.setItem('innertide-store', JSON.stringify(globalStore)); } catch {}
    notify();
  };

  return {
    store,
    loaded,
    update: updateGlobal,
    setMoodToday: (mood: number) => {
      const key = todayKey();
      updateGlobal({
        journal: {
          ...globalStore.journal,
          [key]: { 
            ...globalStore.journal[key], 
            mood,
            mode: globalStore.appMode 
          }
        }
      });
    },
    setJournalNote: (date: string, note: string) => {
      updateGlobal({
        journal: { ...globalStore.journal, [date]: { ...globalStore.journal[date], note } }
      });
    },
    setPainToday: (level: number, locations: string[]) => {
      const key = todayKey();
      updateGlobal({
        journal: {
          ...globalStore.journal,
          [key]: { 
            ...globalStore.journal[key], 
            pain: { level, locations },
            mode: globalStore.appMode 
          }
        }
      });
    },
    saveLetter: (letter: LetterRecord) => {
      updateGlobal({
        letters: { ...globalStore.letters, [letter.createdAt]: letter }
      });
    }
  };
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
