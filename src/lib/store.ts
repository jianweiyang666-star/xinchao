import { useState, useEffect } from 'react';

export interface JournalEntry {
  mood?: number;
  pain?: {
    level: number; // 0-5
    locations: string[];
  };
  exerciseMinutes?: number;
  statusTags?: Partial<Record<StatusTagCategory, string[]>>;
  periodStarted?: boolean;
  sexualActivity?: {
    recordedAt: string;
  };
  note?: string;
  mode?: 'healing' | 'resonance';
}

export type StatusTagCategory = 'mood' | 'symptom' | 'period' | 'diet' | 'exercise' | 'sexual';

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

export interface PeriodReminderPrefs {
  enabled: boolean;
  daysBefore: number;
  browserNotification: boolean;
  lastNotifiedPeriodKey: string | null;
}

export interface OnboardingAnswers {
  concerns: string[];
  painLevel: string;
  suspectedTriggers: string[];
  observationGoal: string;
  customObservationGoal?: string;
  cycleRegularity?: string;
  periodDuration?: string;
  painTiming?: string;
}

export interface ObservationGoal {
  title: string;
  createdAt: string;
  source: "onboarding";
}

interface State {
  nickname: string | null;
  lastPeriodStart: string | null;
  cycleLength: number;
  onboardingCompleted: boolean;
  onboardingAnswers: OnboardingAnswers | null;
  observationGoal: ObservationGoal | null;
  periodReminder: PeriodReminderPrefs;
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
  lastPeriodStart: null,
  cycleLength: 28,
  onboardingCompleted: false,
  onboardingAnswers: null,
  observationGoal: null,
  periodReminder: {
    enabled: false,
    daysBefore: 3,
    browserNotification: false,
    lastNotifiedPeriodKey: null,
  },
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
    spicy: "不辣",
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

        parsed.periodReminder = {
          ...globalStore.periodReminder,
          ...(parsed.periodReminder || {})
        };
        parsed.onboardingCompleted = Boolean(parsed.onboardingCompleted);
        parsed.onboardingAnswers = parsed.onboardingAnswers || null;
        parsed.observationGoal = parsed.observationGoal || null;
        parsed.journal = migrateJournalEntries(parsed.journal || {});
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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function migrateJournalEntries(journal: Record<string, JournalEntry>) {
  return Object.fromEntries(
    Object.entries(journal).map(([date, entry]) => {
      const statusTags = entry.statusTags ?? {};
      const periodTags = [
        ...(statusTags.period ?? []),
        ...(statusTags.symptom ?? []).filter((tag) =>
          ["经量少", "经量中", "经量多", "担心侧漏"].includes(tag)
        ),
      ];

      return [date, {
        ...entry,
        statusTags: {
          ...statusTags,
          mood: mapTags(statusTags.mood, {
            感到平静: "平静",
            感到开心: "快乐",
            精力不错: "有活力",
            有情绪波动: "情绪波动",
            感到焦虑: "焦虑",
            情绪低落: "抑郁",
            容易生气: "恼怒",
            感到疲惫: "精神不振",
          }),
          symptom: mapTags(
            (statusTags.symptom ?? []).filter((tag) =>
              ![
                "经量少", "经量中", "经量多", "担心侧漏",
                "热敷", "止痛药", "热饮", "躺着", "按摩", "硬撑", "拉伸", "吐槽", "都没用",
              ].includes(tag)
            ),
            {
              没有不适: "一切正常",
              出现腹痛: "腹痛",
              出现腰酸: "背痛",
              出现头痛: "头痛",
              乳房胀痛: "乳房压痛",
              感到疲倦: "疲倦",
              出现水肿: "水肿",
              昨晚失眠: "失眠",
            }
          ),
          period: mapTags(periodTags, {
            经量少: "量少",
            经量中: "中量",
            经量多: "量多",
            担心侧漏: "发生侧漏",
          }),
          diet: (statusTags.diet ?? []).filter((tag) => tag !== "吃了外卖"),
          exercise: mapTags(statusTags.exercise, {
            今天没有运动: "没有锻炼",
            散步了: "散步",
            做了拉伸: "瑜伽",
            做了瑜伽: "瑜伽",
            完成力量训练: "健身",
            今天休息了: "没有锻炼",
          }),
        },
      }];
    })
  ) as Record<string, JournalEntry>;
}

function mapTags(tags: string[] | undefined, replacement: Record<string, string>) {
  return [...new Set((tags ?? []).map((tag) => replacement[tag] ?? tag))];
}
