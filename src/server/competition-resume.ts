import {DEFAULT_COMPETITION_ID} from "../core/competitions.ts";
import type {CourseAction, KidsCourse} from "../core/kids-course.ts";

export function competitionCookieName(childId?: string) {
 return `maths_competition_${childId ?? "local"}`;
}
export function resumedCompetition(explicit: string | undefined, remembered: string | undefined, available: readonly string[]) {
 return explicit ?? (remembered && available.includes(remembered) ? remembered : DEFAULT_COMPETITION_ID);
}
export function competitionCookie(childId: string | undefined, competitionId: string, secure: boolean) {
 return `${competitionCookieName(childId)}=${encodeURIComponent(competitionId)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
export function completedLearningAction(action: CourseAction, before: KidsCourse, next: KidsCourse) {
 // A graded partial answer also counts as work; hints and draft/map changes do not.
 return action.type === "answer" || ((action.type === "reveal" || action.type === "dontKnow") && next.attempts.length > before.attempts.length);
}
