export const state = {
  deployment: "hosted",
  children: [] as { id: string; nickname: string }[],
  parentError: undefined as unknown,
  authError: false,
  exchangeError: false,
  throws: false,
  signedOut: false,
  oauthOptions: undefined as unknown,
  inserted: undefined as unknown,
  databaseError: null as null | { code: string; message: string },
};
export function reset() {
  Object.assign(state, { deployment: "hosted", children: [], parentError: undefined, authError: false, exchangeError: false,
    throws: false, signedOut: false, oauthOptions: undefined, inserted: undefined, databaseError: null });
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
export async function parentContext() {
  if (state.parentError) throw state.parentError;
  return { parentId: "parent-a", children: state.children, db: { from(table: string) {
    if (table !== "child_profiles") throw new Error("Unexpected table");
    return { insert(value: unknown) {
      state.inserted = value;
      return { select() { return { async single() { return { data: { id: "created-child" }, error: state.databaseError }; } }; } };
    } };
  } } };
}
