// Guide state is browser-only and never changes learning or reward records.
export type GuideState = { phase: "overview"; step: 0 | 1 | 2 } | { phase: "hint" | "done" | "dismissed" };
type StorageAccess = Pick<Storage, "getItem" | "setItem">;
const fallback = new Map<string, GuideState>();
export function guideStorageKey(learnerId?: string) {
 return `maths:guide:v1:${learnerId ? `child:${encodeURIComponent(learnerId)}` : "anonymous"}`;
}
export function loadGuide(key: string, storage?: StorageAccess): GuideState | undefined {
 if (fallback.has(key)) return fallback.get(key);
 try {
  if (!storage) return undefined;
  const raw = storage.getItem(key);
  if (!raw) return undefined;
  const value = JSON.parse(raw) as Partial<GuideState>;
  if (value.phase === "overview" && "step" in value && [0, 1, 2].includes(value.step as number)) return value as GuideState;
  if (["hint", "done", "dismissed"].includes(value.phase ?? "")) return { phase: value.phase } as GuideState;
 } catch { return fallback.get(key); }
}
export function saveGuide(key: string, value: GuideState, storage?: StorageAccess) {
 fallback.set(key, value);
 try { storage?.setItem(key, JSON.stringify(value)); } catch { /* Session memory keeps dismissal effective when storage is blocked. */ }
}
export function initialGuide(hasActivity: boolean): GuideState {
 return hasActivity ? { phase: "done" } : { phase: "overview", step: 0 };
}
export const guideCopy = [
 { title: "Избери състезание.", body: "Оттук можеш да сменяш състезанието, за което се подготвяш." },
 { title: "Започни оттук.", body: "Ще получиш задачи за следващото си занимание." },
 { title: "Избери остров.", body: "Ако искаш да упражняваш определена тема, отвори нейния остров." },
 { title: "Нужна ти е помощ?", body: "Подсказките показват решението на части. Първите две запазват златото за задачата, а след третата няма ново злато за този опит." },
] as const;
