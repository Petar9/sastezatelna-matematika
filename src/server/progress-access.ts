import { KidsError } from "../core/kids.ts";

export function progressChild<T extends { id: string; nickname: string }>(children: T[], requested?: string, selected?: string): T {
 const child = requested !== undefined ? children.find(child => child.id === requested)
  : children.find(child => child.id === selected) ?? (children.length === 1 ? children[0] : undefined);
 if (!child) throw new KidsError(requested !== undefined ? "Този профил не е достъпен." : "Избери детски профил.", requested !== undefined ? 404 : 428);
 return child;
}

export async function readProgressRows(db: import("@supabase/supabase-js").SupabaseClient, parentId: string, childId: string) {
 const { data, error } = await db.from("course_progress").select("competition_id,course").eq("parent_id", parentId).eq("child_id", childId);
 if (error) throw error;
 return data ?? [];
}
