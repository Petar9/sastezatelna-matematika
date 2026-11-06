import type { ReactNode } from "react";
import Link from "next/link";
import { SkipChildEmailForm } from "./skip-child-email-form";
import { ProfileNameForm } from "./profile-name-form";
import { FeedbackButton } from "./feedback";
import { KidsOtter } from "./kids-otter";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { Message } from "./ui/message";
import o from "./onboarding.module.css";

export type LoginIssue = "denied" | "cancelled" | "unavailable";
const loginMessages: Record<LoginIssue, string> = {
  denied: "Този Google профил още няма достъп. Използвай одобрен родителски профил или свързан профил на дете.",
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
    <p className={o.intro}>Влез с Google като родител или със свързания профил на дете.</p>
    {issue && <Message className={o.notice} tone="warning" role={issue === "cancelled" ? "status" : "alert"}>{loginMessages[issue]}</Message>}
    <form method="post" action="/auth/login" className={o.form}>
      <Button type="submit" className={o.primary}>Продължи с Google</Button>
    </form>
    <p className={o.note}>За семейства с одобрена покана. Родителят може да добави самостоятелен вход за детето.</p>
  </OnboardingFrame>;
}

type Child = { id: string; nickname: string; loginEmail?: string | null; loginConnected?: boolean };
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

function EmailForm({ child, setup = false, issue }: { child: Child; setup?: boolean; issue?: ProfileIssue }) {
  const inputId = `email-${child.id}`;
  return <form action="/api/profiles" method="post" className={o.form}>
    <input type="hidden" name="action" value="link-email" />
    <input type="hidden" name="childId" value={child.id} />
    {setup && <input type="hidden" name="setup" value="1" />}
    <label className={o.label} htmlFor={inputId}>Google имейл на детето</label>
    <Input id={inputId} type="email" name="email" required maxLength={254}
      defaultValue={child.loginEmail ?? ""} autoComplete="email"
      aria-invalid={issue === "email" || issue === "email-used" ? true : undefined} />
    <Button type="submit" className={o.primary}>{setup ? "Запази и продължи" : "Запази имейла"}</Button>
  </form>;
}

function ProfileFooter() {
  return <><Link href="/progress">Напредък</Link>
    <form method="post" action="/auth/logout"><Button type="submit" variant="quiet" className={o.textButton}>Изход</Button></form><Link href="/materiali">Ценни материали</Link><FeedbackButton/></>;
}

export function ChildProfiles({ children, issue, setup, status }: { children: Child[]; issue?: ProfileIssue; setup?: string; status?: "saved" | "removed" | "renamed" }) {
  const firstVisit = children.length === 0;
  const setupChild = children.find(child => child.id === setup);
  if (setupChild) return <OnboardingFrame footer={<ProfileFooter />}>
    <h1>Google имейл на детето</h1>
    <p className={o.intro}>По желание добави Google имейла на {setupChild.nickname}, за да влиза самостоятелно. Можеш да го добавиш и по-късно.</p>
    {issue && <Message className={o.notice} tone="warning" role="alert">{profileMessages[issue]}</Message>}
    <EmailForm child={setupChild} setup issue={issue} />
    <SkipChildEmailForm childId={setupChild.id} />
  </OnboardingFrame>;
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
          <details className={o.loginSettings} open={issue === "email" || issue === "email-used" || issue === "save-email-unavailable" || issue === "remove-email-unavailable"}>
            <summary>Google имейл на детето</summary>
            <p className={o.note}>{child.loginConnected ? "Google профилът е свързан." : "По желание добави Google имейл за самостоятелен вход."}</p>
            <EmailForm child={child} />
            {child.loginEmail && <form action="/api/profiles" method="post">
              <input type="hidden" name="action" value="unlink-email" />
              <input type="hidden" name="childId" value={child.id} />
              <Button type="submit" variant="quiet" className={o.textButton}>Премахни самостоятелния вход</Button>
            </form>}
          </details>
        </div>)}
      </div>
      <details className={o.additional} open={issue === "nickname" || issue === "full" || issue === "create-unavailable"}>
        <summary>Добави друг изследовател</summary>
        <NicknameForm issue={issue} />
      </details>
      <Link className={o.home} href="/">← Начало</Link>
    </>}
  </OnboardingFrame>;
}

export function ChildProfileSettings({ child, issue, status }: { child: Child; issue?: ProfileIssue; status?: "renamed" }) {
  return <OnboardingFrame footer={<ProfileFooter />}>
    <h1>Твоят профил</h1>
    <p className={o.intro}>{child.nickname}</p>
    {issue && <Message className={o.notice} tone="warning">{profileMessages[issue]}</Message>}
    {status && <Message className={o.notice} tone="success">Името е запазено.</Message>}
    <ProfileNameForm child={child} />
    <Link className={o.home} href="/">← Начало</Link>
  </OnboardingFrame>;
}
