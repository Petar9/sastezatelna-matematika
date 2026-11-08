import assert from "node:assert/strict";

type User = { id: string; email?: string; email_confirmed_at?: string; app_metadata: { provider?: string } };
type Row = Record<string, unknown>;
export const verifiedChild: User = { id: "verified-google-user", email: "CHILD@Example.COM", email_confirmed_at: "2026-11-04T10:00:00Z", app_metadata: { provider: "google" } };
export const state = {
  user: { ...verifiedChild } as User | null,
  authError: null as unknown,
  getUserCalls: 0,
  databaseCalls: 0,
  selectedCookie: undefined as string | undefined,
  tables: {} as Record<string, Row[]>,
  errors: {} as Record<string, unknown>,
  links: [{ parent_id: "owning-parent", child_id: "mapped-child", nickname: "Моряк" }] as Row[],
  shared: [] as Row[],
  sharedError: null as unknown,
  resolverError: null as unknown,
  queries: [] as { table: string; filters: [string, unknown][] }[],
  upserts: [] as { table: string; value: Row; options: unknown }[],
  rpcCalls: [] as { name: string; args: unknown }[],
};
export function reset() {
  Object.assign(state, {
    user: { ...verifiedChild }, authError: null, getUserCalls: 0, databaseCalls: 0,
    selectedCookie: undefined, tables: {}, errors: {}, resolverError: null, shared: [], sharedError: null,
    links: [{ parent_id: "owning-parent", child_id: "mapped-child", nickname: "Моряк" }],
    queries: [], upserts: [], rpcCalls: [],
  });
}
const client = { auth: { async getUser() {
  state.getUserCalls++;
  return { data: { user: state.user }, error: state.authError };
} } };
export async function authClient() { return client; }
export const db = {
  from(table: string) {
    const filters: [string, unknown][] = [];
    const result = () => {
      state.queries.push({ table, filters: [...filters] });
      return { data: (state.tables[table] ?? []).filter(row => filters.every(([key, value]) => row[key] === value)), error: state.errors[table] ?? null };
    };
    const chain = {
      select() { return chain; },
      eq(key: string, value: unknown) { filters.push([key, value]); return chain; },
      order() { return chain; },
      async maybeSingle() { const value = result(); return { ...value, data: value.data[0] ?? null }; },
      async upsert(value: Row, options: unknown) {
        state.upserts.push({ table, value, options });
        return { error: state.errors[table] ?? null };
      },
      then(resolve: (value: ReturnType<typeof result>) => unknown) { return Promise.resolve(result()).then(resolve); },
    };
    return chain;
  },
  async rpc(name: string, args: unknown) {
    assert.equal(name, "resolve_child_access");
    state.rpcCalls.push({ name, args });
    return {data:[...state.shared,...state.links],error:state.sharedError??state.resolverError};
  },
};
export function database() { state.databaseCalls++; return db; }
export function mode() { return "hosted"; }
export function isLoopbackHost() { return false; }
export async function cookies() { return { get(name: string) {
  if (name === "maths_competition_mapped-child") return undefined;
  assert.equal(name, "maths_child");
  return state.selectedCookie === undefined ? undefined : { value: state.selectedCookie };
} }; }
export async function headers() { throw new Error("Hosted context must not use local Host authorization"); }
