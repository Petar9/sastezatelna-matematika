import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { FeedbackButton } from "@/components/feedback";
import { ProgressCalendar, type ProgressCollection } from "@/components/progress-calendar";
import { KidsError } from "@/src/core/kids";
import { projectProgressCourse, sofiaDay } from "@/src/core/progress";
import { accountContext, childCookie, learnerContext } from "@/src/server/context";
import { mode } from "@/src/server/config";
import { availableCompetitions, competitionContent } from "@/src/server/competitions";
import { localStores } from "@/src/server/stores";
import { progressChild, readProgressRows } from "@/src/server/progress-access";
import s from "@/components/kids.module.css";
import p from "@/components/progress-calendar.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Напредък", robots: { index: false, follow: false } };
export default async function Progress({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
 const params = await searchParams;
 let nickname: string | undefined, childId: string | undefined;
 let children: { id: string; nickname: string }[] = [], parent = false;
 let collections: ProgressCollection[];
 try {
  const competitions = availableCompetitions();
  if (mode() === "local") {
   await learnerContext({ api: false });
   collections = competitions.map(competition => ({ ...projectProgressCourse(localStores(competition.id).kidsCourseStore.read(), competition.id, competitionContent(competition.id)), title: competition.title }));
  } else {
   const account = await accountContext({learningOnly:true});
   const child = progressChild(account.children, params.child, (await cookies()).get(childCookie)?.value);
   childId = child.id; nickname = child.nickname; parent = account.role === "parent";
   children = account.children.map(item => ({ id: item.id, nickname: item.nickname }));
   const rows = await readProgressRows(account.db, child.parentId, child.id);
   collections = competitions.map(competition => {
    const projection = projectProgressCourse(rows.find(row => row.competition_id === competition.id)?.course, competition.id, competitionContent(competition.id));
    return { ...projection, title: competition.title, ...(parent && projection.summary.hasTask ? { lastTaskHref: `/parent/task?child=${encodeURIComponent(child.id)}&competition=${encodeURIComponent(competition.id)}` } : {}) };
   });
  }
 } catch (error) {
  if (error instanceof KidsError) {
   if (error.status === 401) redirect("/login");
   if (error.status === 403) redirect("/login?denied=1");
   if (error.status === 428) redirect("/profiles");
   if (error.status === 404) notFound();
  }
  throw error;
 }
 return <main className={s.shell}><div className={s.content}>
  <ButtonLink href="/">← Начало</ButtonLink><h1>Напредък</h1>
  {parent && children.length > 1 ? <form action="/progress" method="get" className={p.filter}><label htmlFor="progress-child">Детски профил</label><Select name="child" id="progress-child" defaultValue={childId}>{children.map(child => <option key={child.id} value={child.id}>{child.nickname}</option>)}</Select><Button type="submit" variant="secondary">Покажи напредъка</Button></form> : nickname && <p>{nickname}</p>}
  <ProgressCalendar key={childId ?? "local"} collections={collections} initialDay={sofiaDay(new Date().toISOString())!}/>
  <div className={s.feedbackAction}><ButtonLink href="/materiali" variant="quiet">Ценни материали</ButtonLink>{childId && <FeedbackButton childId={childId}/>}</div>
 </div></main>;
}
