import path from "node:path";
import {createKidsStore} from "../store/kids.ts";
import {createKidsCourseStore} from "../store/kids-course.ts";
import {DEFAULT_COMPETITION_ID,requireAvailableCompetition} from "./competitions.ts";
import {mode} from "./config.ts";
function localDirectory(){if(mode()!=="local")throw new Error("Local storage is disabled in hosted mode");return path.resolve(/* turbopackIgnore: true */ process.env.MATHS_DATA_DIR||path.join(process.cwd(),"data"));}
export function localStores(competitionId:string = DEFAULT_COMPETITION_ID){
 requireAvailableCompetition(competitionId);
 const directory=path.join(localDirectory(),"kids");
 const courseDirectory=competitionId===DEFAULT_COMPETITION_ID?directory:path.join(directory,"competitions",competitionId);
 return {kidsStore:createKidsStore(directory),kidsCourseStore:createKidsCourseStore(courseDirectory,directory)};
}
