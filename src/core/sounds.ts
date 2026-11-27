import type { KidsCourseView } from "./kids-course.ts";

export type AchievementSound = "record" | "milestone";

// Sound marks a rare achievement from a newly accepted answer, never ordinary
// progress, a restored view or a repeat. A record outranks a learning milestone.
export function achievementSound(previous: KidsCourseView["task"], next: KidsCourseView, taskKey: string): AchievementSound | undefined {
 if (!previous || previous.key !== taskKey || previous.outcome || next.task?.key !== taskKey) return;
 const kinds = new Set((next.appreciations ?? []).map(appreciation => appreciation.kind));
 if (kinds.has("daily-tasks") || kinds.has("daily-gold")) return "record";
 if (kinds.size || next.task.personalProgress || next.reward) return "milestone";
}
