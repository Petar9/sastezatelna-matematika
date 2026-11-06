import Link from "next/link";
import {competitionCalendar,competitionCalendarSource} from "@/src/public-site";
export function CompetitionCalendar(){
 return <><ul>{competitionCalendar.map(event=><li key={event.date}><time dateTime={event.date}>{event.displayDate}</time> - <Link href={event.path}>{event.label}</Link>.</li>)}</ul><p>Датите са от <a href={competitionCalendarSource}>съобщението на НПМГ за 2026/2027 г. (PDF)</a> и подлежат на промяна от МОН. Проверявайте и сроковете за записване.</p></>;
}
