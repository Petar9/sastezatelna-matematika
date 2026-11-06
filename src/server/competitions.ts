import {mode} from "./config.ts";
import {KidsError} from "../core/kids.ts";
import {competitions, DEFAULT_COMPETITION_ID} from "../core/competitions.ts";
import {olympiadCourseContent} from "./olimpiada-course-content.ts";
import {regionalOlympiadCourseContent} from "./olimpiada-oblasten-course-content.ts";
import {proletnoCourseContent} from "./proletno-course-content.ts";
import {nvoCourseContent} from "./nvo-course-content.ts";
import {kidsCourseContent} from "./kids-course-content.ts";
import type {KidsCourseContent} from "../core/kids-course.ts";
export {DEFAULT_COMPETITION_ID, publishedCompetitions} from "../core/competitions.ts";
const content: Readonly<Record<string, KidsCourseContent>> = {
 [DEFAULT_COMPETITION_ID]: kidsCourseContent,
 olimpiada: olympiadCourseContent,
 nvo: nvoCourseContent,
 proletno: proletnoCourseContent,
 "olimpiada-oblasten": regionalOlympiadCourseContent,
};
export function requirePublishedCompetition(id: string = DEFAULT_COMPETITION_ID) {
 const competition = competitions.find(item => item.id === id && item.published);
 if (!competition || !Object.hasOwn(content, id)) throw new KidsError("Това състезание още не е достъпно.", 404);
 return competition;
}
export function availableCompetitions() {
 const localReview = process.env.MATHS_MODE === "local" && mode() === "local";
 return competitions.filter(item => Object.hasOwn(content, item.id) && (item.published || (localReview && ["proletno", "olimpiada-oblasten"].includes(item.id))));
}
export function requireAvailableCompetition(id: string = DEFAULT_COMPETITION_ID) {
 const competition = availableCompetitions().find(item => item.id === id);
 if (!competition) throw new KidsError("Това състезание още не е достъпно.", 404);
 return competition;
}
export function competitionContent(id: string = DEFAULT_COMPETITION_ID): KidsCourseContent {
 return content[requireAvailableCompetition(id).id]!;
}
