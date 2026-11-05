import { KidsError } from "../../src/core/kids.ts";
export { failure } from "../../src/server/kids-course.ts";
export const state = {
 role: "parent" as "parent" | "child", deployment: "hosted", authError: undefined as unknown,
 course: undefined as unknown, writes: [] as Record<string, unknown>[], reads: [] as [string, unknown][][],
 databaseError: false,
};
export function reset() { Object.assign(state, { role: "parent", deployment: "hosted", authError: undefined,
 course: undefined, writes: [], reads: [], databaseError: false }); }
export function mode() { return state.deployment; }
export async function accountContext() {
 if (state.authError) throw state.authError;
 const db = { from(table: string) {
  if (table === "problem_reports") return { async insert(value: Record<string, unknown>) {
   if (!state.databaseError) state.writes.push(value);
   return { error: state.databaseError ? new KidsError("Записът не успя.", 503) : null };
  } };
  if (table !== "course_progress") throw new Error("Unexpected table " + table);
  const filters: [string, unknown][] = []; state.reads.push(filters);
  const result = () => ({ data: state.course === undefined ? [] : [{ child_id: "child-a", competition_id: "matematika-za-vseki", course: state.course }], error: null });
  const query = { select() { return query; }, eq(key: string, value: unknown) { filters.push([key, value]); return query; },
   async maybeSingle() { return { data: state.course === undefined ? null : { course: state.course }, error: null }; },
   then(resolve: (value: ReturnType<typeof result>) => unknown) { return Promise.resolve(result()).then(resolve); },
  };
  return query;
 } };
 return { role: state.role, parentId: "parent-a", children: [{ id: "child-a", nickname: "Лисиче" }], db };
}
export async function parentContext() { const account = await accountContext();
 if (account.role !== "parent") throw new KidsError("Parent only", 403); return account;
}
