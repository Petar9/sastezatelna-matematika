import type { ReactNode } from "react";
import Link from "next/link";
import { KidsOtter } from "./kids-otter";
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
    {issue && <p className={o.notice} role={issue === "cancelled" ? "status" : "alert"}>{loginMessages[issue]}</p>}
    <form method="post" action="/auth/login" className={o.form}>
      <button className={o.primary}>Продължи с Google</button>
    </form>
    <p className={o.note}>За семейства с одобрена покана. Родителят може да добави самостоятелен вход за детето.</p>
  </OnboardingFrame>;
}

type Child = { id: string; nickname: string; loginEmail?: string | null; loginConnected?: boolean };
export type ProfileIssue = "nickname" | "unavailable" | "full" | "missing" | "email" | "email-used";
const profileMessages: Record<ProfileIssue, string> = {
  nickname: "Напиши прякор от 1 до 40 знака.",
  email: "Напиши валиден имейл адрес.",
  "email-used": "Този имейл вече се използва за друг профил.",
  unavailable: "Не успяхме да отворим приключението. Опитай отново след малко.",
  full: "Петте места в пробната група вече са заети.",
  missing: "Този профил вече не е достъпен. Избери друг профил.",
};

function NicknameForm({ issue }: { issue?: ProfileIssue }) {
  return <form action="/api/profiles" method="post" className={o.form}>
    <input type="hidden" name="action" value="create" />
    <label className={o.label} htmlFor="nickname">Твоят прякор</label>
    <input className={o.input} id="nickname" name="nickname" required minLength={1} maxLength={40}
      autoComplete="off" spellCheck={false} aria-describedby="nickname-help"
      aria-invalid={issue === "nickname" ? true : undefined} />
    <p id="nickname-help" className={o.note}>Избери прякор, който харесваш. Не е нужно да пишеш истинското си име.</p>
    <button className={o.primary} disabled={issue === "full"}>Към приключението <span aria-hidden="true">→</span></button>
  </form>;
}

function EmailForm({ child, setup = false, issue }: { child: Child; setup?: boolean; issue?: ProfileIssue }) {
  const inputId = `email-${child.id}`;
  return <form action="/api/profiles" method="post" className={o.form}>
    <input type="hidden" name="action" value="link-email" />
    <input type="hidden" name="childId" value={child.id} />
    {setup && <input type="hidden" name="setup" value="1" />}
    <label className={o.label} htmlFor={inputId}>Имейл на детето</label>
    <input className={o.input} id={inputId} type="email" name="email" required maxLength={254}
      defaultValue={child.loginEmail ?? ""} autoComplete="email"
      aria-invalid={issue === "email" || issue === "email-used" ? true : undefined} />
    <button className={o.primary}>{setup ? "Запази и продължи" : "Запази имейла"}</button>
  </form>;
}

function ProfileFooter() {
  return <><Link href="/parent">За родителя</Link>
    <form method="post" action="/auth/logout"><button className={o.textButton}>Изход</button></form></>;
}

export function ChildProfiles({ children, issue, setup, status }: { children: Child[]; issue?: ProfileIssue; setup?: string; status?: "saved" | "removed" }) {
  const firstVisit = children.length === 0;
  const setupChild = children.find(child => child.id === setup);
  if (setupChild) return <OnboardingFrame footer={<ProfileFooter />}>
    <h1>Самостоятелен вход</h1>
    <p className={o.intro}>По желание добави Google имейла на {setupChild.nickname}, за да влиза самостоятелно. Можеш да го добавиш и по-късно.</p>
    {issue && <p className={o.notice} role="alert">{profileMessages[issue]}</p>}
    <EmailForm child={setupChild} setup issue={issue} />
    <form action="/api/profiles" method="post">
      <input type="hidden" name="action" value="select" />
      <input type="hidden" name="childId" value={setupChild.id} />
      <button className={o.textButton}>Не сега</button>
    </form>
  </OnboardingFrame>;
  return <OnboardingFrame footer={<ProfileFooter />}>
    <h1>{firstVisit ? "Как да те наричаме?" : "Кой ще открива днес?"}</h1>
    <p className={o.intro}>{firstVisit ? "Видрата те очаква. Да направим ново откритие!" : "Избери своя прякор и продължи оттам, докъдето стигна."}</p>
    {issue && <p className={o.notice} role="alert">{profileMessages[issue]}</p>}
    {status && <p className={o.notice} role="status">{status === "saved" ? "Имейлът е запазен." : "Самостоятелният вход е премахнат."}</p>}
    {firstVisit ? <NicknameForm issue={issue} /> : <>
      <div className={o.profiles}>
        {children.map(child => <div key={child.id}>
          <form action="/api/profiles" method="post">
            <input type="hidden" name="action" value="select" />
            <input type="hidden" name="childId" value={child.id} />
            <button className={o.profile}>{child.nickname}<span aria-hidden="true">→</span></button>
          </form>
          <details className={o.loginSettings} open={issue === "email" || issue === "email-used"}>
            <summary>Самостоятелен вход</summary>
            <p className={o.note}>{child.loginConnected ? "Google профилът е свързан." : "По желание добави Google имейл за самостоятелен вход."}</p>
            <EmailForm child={child} />
            {child.loginEmail && <form action="/api/profiles" method="post">
              <input type="hidden" name="action" value="unlink-email" />
              <input type="hidden" name="childId" value={child.id} />
              <button className={o.textButton}>Премахни самостоятелния вход</button>
            </form>}
          </details>
        </div>)}
      </div>
      <details className={o.additional} open={issue === "nickname" || issue === "full" || issue === "unavailable"}>
        <summary>Добави друг изследовател</summary>
        <NicknameForm issue={issue} />
      </details>
      <Link className={o.home} href="/">← Начало</Link>
    </>}
  </OnboardingFrame>;
}
