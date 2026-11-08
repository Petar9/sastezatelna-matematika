import type { ReactNode } from "react";
import Link from "next/link";
import { ChildSharing } from "./child-sharing";
import { ProfileNameForm } from "./profile-name-form";
import { FeedbackButton } from "./feedback";
import { KidsOtter } from "./kids-otter";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { Message } from "./ui/message";
import o from "./onboarding.module.css";

export type LoginIssue = "denied" | "cancelled" | "unavailable";
const loginMessages: Record<LoginIssue, string> = {
  denied: "Този Google профил още няма достъп. Влез с имейла, за който е добавен достъп.",
  cancelled: "Входът е прекъснат. Когато си готов, опитай отново.",
  unavailable: "Не успяхме да завършим входа. Опитай отново след малко.",
};

export function OnboardingFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return <main lang="bg" className={o.shell}>
    <div className={o.content}>
      <Link className={o.brand} href="/">Състезателна математика</Link>
      <section className={o.island}>
        <div className={o.mascot}><KidsOtter /></div>
        {children}
      </section>
      {footer && <footer className={o.footer}>{footer}</footer>}
    </div>
  </main>;
}

export function LoginWelcome({ issue }: { issue?: LoginIssue }) {
  return <OnboardingFrame footer={<Link href="/about">За сайта</Link>}>
    <p className={o.eyebrow}>За родители и деца</p>
    <h1>Приключението започва тук</h1>
    <p className={o.intro}>Влез с Google профила си.</p>
    {issue && <Message className={o.notice} tone="warning" role={issue === "cancelled" ? "status" : "alert"}>{loginMessages[issue]}</Message>}
    <form method="post" action="/auth/login" className={o.form}>
      <Button type="submit" className={o.primary}>Продължи с Google</Button>
    </form>
    <p className={o.note}>Родителят може да добави достъп за детето и семейството.</p>
  </OnboardingFrame>;
}

type Child = { id: string; nickname: string; isOwner?: boolean };
export type ProfileIssue = "nickname" | "unavailable" | "full" | "missing" | "email" | "email-used" | "create-unavailable" | "select-unavailable" | "save-email-unavailable" | "remove-email-unavailable" | "rename-unavailable";
const profileMessages: Record<ProfileIssue, string> = {
  nickname: "Напиши прякор от 1 до 40 знака.",
  email: "Напиши валиден имейл адрес.",
  "email-used": "Този имейл вече се използва за друг профил.",
  unavailable: "Не успяхме да заредим профилите. Опитай отново.",
  "create-unavailable": "Не успяхме да създадем профила. Опитай отново.",
  "select-unavailable": "Не успяхме да изберем профила. Опитай отново.",
  "save-email-unavailable": "Не успяхме да запазим имейла. Опитай отново.",
  "remove-email-unavailable": "Не успяхме да премахнем имейла. Опитай отново.",
  "rename-unavailable": "Не успяхме да запазим името. Опитай отново.",
  full: "Петте места в пробната група вече са заети.",
  missing: "Този профил вече не е достъпен. Избери друг профил.",
};

function NicknameForm({ issue }: { issue?: ProfileIssue }) {
  return <form action="/api/profiles" method="post" className={o.form}>
    <input type="hidden" name="action" value="create" />
    <label className={o.label} htmlFor="nickname">Име на детето</label>
    <Input id="nickname" name="nickname" required minLength={1} maxLength={40}
      autoComplete="off" spellCheck={false} aria-describedby="nickname-help"
      aria-invalid={issue === "nickname" ? true : undefined} />
    <p id="nickname-help" className={o.note}>Избери прякор, който харесваш. Не е нужно да пишеш истинското си име.</p>
    <Button type="submit" className={o.primary} disabled={issue === "full"}>Към приключението <span aria-hidden="true">→</span></Button>
  </form>;
}

function ProfileFooter() {
  return <><Link href="/progress">Напредък</Link>
    <form method="post" action="/auth/logout"><Button type="submit" variant="quiet" className={o.textButton}>Изход</Button></form><Link href="/materiali">Ценни материали</Link><FeedbackButton/></>;
}

export function ChildProfiles({ children, issue, status, canCreateChildren = true }: { children: Child[]; canCreateChildren?: boolean; issue?: ProfileIssue; setup?: string; status?: "saved" | "removed" | "renamed" }) {
  const firstVisit = children.length === 0;
  return <OnboardingFrame footer={<ProfileFooter />}>
    <h1>{firstVisit ? "Име на детето:" : "Кой ще открива днес?"}</h1>
    <p className={o.intro}>{firstVisit ? "Видрата те очаква. Да направим ново откритие!" : "Избери своя профил и продължи приключението."}</p>
    {issue && <Message className={o.notice} tone="warning" role="alert">{profileMessages[issue]}</Message>}
    {status && <Message className={o.notice} tone="success" role="status">{status === "saved" ? "Имейлът е запазен." : status === "renamed" ? "Името е запазено." : "Самостоятелният вход е премахнат."}</Message>}
    {firstVisit ? <NicknameForm issue={issue} /> : <>
      <div className={o.profiles}>
        {children.map(child => <div key={child.id}>
          <form action="/api/profiles" method="post">
            <input type="hidden" name="action" value="select" />
            <input type="hidden" name="childId" value={child.id} />
            <Button type="submit" variant="secondary" className={o.profile}>{child.nickname}<span aria-hidden="true">→</span></Button>
          </form>
          <details className={o.loginSettings} open={issue === "rename-unavailable"}>
            <summary>Промени името</summary>
            <ProfileNameForm child={child} />
          </details>
          {child.isOwner !== false && <ChildSharing childId={child.id} />}
        </div>)}
      </div>
      {canCreateChildren && <details className={o.additional} open={issue === "nickname" || issue === "full" || issue === "create-unavailable"}>
        <summary>Добави друг изследовател</summary>
        <NicknameForm issue={issue} />
      </details>}
      <Link className={o.home} href="/">← Начало</Link>
    </>}
  </OnboardingFrame>;
}
