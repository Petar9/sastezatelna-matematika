import { KidsError } from "../../src/core/kids.ts";
export const state = {
  deployment: "hosted",
  role: "parent" as "parent" | "child",
  rpcCall: undefined as unknown,
  deleteFilters: [] as [string, unknown][],
  children: [] as { id: string; nickname: string }[],
  parentError: undefined as unknown,
  authError: false,
  exchangeError: false,
  throws: false,
  signedOut: false,
  oauthOptions: undefined as unknown,
  inserted: undefined as unknown,
  updated: undefined as unknown,
  updateFilters: [] as [string, unknown][],
  updateMissing: false,
  databaseError: null as null | { code: string; message: string },
};
export function reset() {
  Object.assign(state, { deployment: "hosted", role: "parent", rpcCall: undefined, deleteFilters: [], children: [], parentError: undefined, authError: false, exchangeError: false,
    throws: false, signedOut: false, oauthOptions: undefined, inserted: undefined, updated: undefined, updateFilters: [], updateMissing: false, databaseError: null });
}
export const childCookie = "maths_child";
export function mode() { return state.deployment; }
export function appOrigin() { return "https://maths.example"; }
export async function authClient() {
  if (state.throws) throw new Error("Test connection failure");
  return { auth: {
    async signInWithOAuth(options: unknown) { state.oauthOptions = options; return { data: { url: "https://accounts.google.com/test" }, error: state.authError }; },
    async exchangeCodeForSession() { return { error: state.exchangeError }; },
    async signOut() { state.signedOut = true; },
  } };
}
export async function accountContext() {
  if (state.parentError) throw state.parentError;
  const db = {
    rpc(name: string, args: unknown) {
      state.rpcCall = { name, args };
      return Promise.resolve({ error: state.databaseError });
    },
    from(table: string) {
      if (table === "child_profiles") return { insert(value: unknown) {
        state.inserted = value;
        return { select() { return { async single() { return { data: { id: "created-child" }, error: state.databaseError }; } }; } };
      }, update(value: unknown) {
        state.updated = value;
        state.updateFilters = [];
        const chain = {
          eq(key: string, value: unknown) { state.updateFilters.push([key, value]); return chain; },
          select() { return chain; },
          async maybeSingle() { return { data: state.updateMissing ? null : { id: "child-a" }, error: state.databaseError }; },
        };
        return chain;
      } };
      if (table === "child_profile_logins") return { delete() {
        state.deleteFilters = [];
        return { eq(key: string, value: unknown) {
          state.deleteFilters.push([key, value]);
          return { async eq(key: string, value: unknown) {
            state.deleteFilters.push([key, value]);
            return { error: state.databaseError };
          } };
        } };
      } };
      throw new Error("Unexpected table");
    },
  };
  return { role: state.role, parentId: "parent-a", children: state.children, db };
}
export async function parentContext() {
  const account = await accountContext();
  if (account.role !== "parent") throw new KidsError("Parent only", 403);
  return account;
}
