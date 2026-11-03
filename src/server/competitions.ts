import {KidsError} from "../core/kids.ts";
import {competitions, DEFAULT_COMPETITION_ID} from "../core/competitions.ts";
import {kidsCourseContent} from "./kids-course-content.ts";
import type {KidsCourseContent} from "../core/kids-course.ts";
export {DEFAULT_COMPETITION_ID, publishedCompetitions} from "../core/competitions.ts";
const content: Readonly<Record<string, KidsCourseContent>> = {
 [DEFAULT_COMPETITION_ID]: kidsCourseContent,
};
export function requirePublishedCompetition(id: string = DEFAULT_COMPETITION_ID) {
 const competition = competitions.find(item => item.id === id && item.published);
 if (!competition || !Object.hasOwn(content, id)) throw new KidsError("Това състезание още не е достъпно.", 404);
 return competition;
}
export function competitionContent(id: string = DEFAULT_COMPETITION_ID): KidsCourseContent {
 return content[requirePublishedCompetition(id).id]!;
}
