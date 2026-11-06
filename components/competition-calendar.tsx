import Link from "next/link";
import { competitionCalendar, competitionHref, type CompetitionDate } from "../src/competition-dates";
import s from "./competition-calendar.module.css";

export function CompetitionCalendar({ events = competitionCalendar }: { events?: readonly CompetitionDate[] }) {
 return <ul className={s.list}>{events.map(event => <li className={s.item} key={event.competitionId}>
  <Link className={s.link} href={competitionHref(event)}>
   <span className={s.date}><time dateTime={event.date}>{event.displayDate}</time>{event.kind === "deadline" && <span className={s.caption}>Краен срок за провеждане</span>}</span>
   <span className={s.label}>{event.label}</span><span aria-hidden="true">→</span>
  </Link>
 </li>)}</ul>;
}
