import type { ReactNode } from "react";
import Link from "next/link";
import { KidsOtter } from "./kids-otter";
import o from "./onboarding.module.css";

export type LoginIssue = "denied" | "cancelled" | "unavailable";
const loginMessages: Record<LoginIssue, string> = {
  denied: "Този Google профил още няма достъп. Влез с одобрения родителски профил.",
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
    <p className={o.eyebrow}>За родителя</p>
    <h1>Приключението започва тук</h1>
    <p className={o.intro}>Влез с Google, за да запазваме откритията на детето ти.</p>
    {issue && <p className={o.notice} role={issue === "cancelled" ? "status" : "alert"}>{loginMessages[issue]}</p>}
    <form method="post" action="/auth/login" className={o.form}>
      <button className={o.primary}>Продължи с Google</button>
    </form>
    <p className={o.note}>За семейства с одобрена покана. Детето използва само прякор.</p>
  </OnboardingFrame>;
}

type Child = { id: string; nickname: string };
export type ProfileIssue = "nickname" | "unavailable" | "full" | "missing";
const profileMessages: Record<ProfileIssue, string> = {
  nickname: "Напиши прякор от 1 до 40 знака.",
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

export function ChildProfiles({ children, issue }: { children: Child[]; issue?: ProfileIssue }) {
  const firstVisit = children.length === 0;
  return <OnboardingFrame footer={<>
    <Link href="/parent">За родителя</Link>
    <form method="post" action="/auth/logout"><button className={o.textButton}>Изход</button></form>
  </>}>
    <h1>{firstVisit ? "Как да те наричаме?" : "Кой ще открива днес?"}</h1>
    <p className={o.intro}>{firstVisit ? "Видрата те очаква. Да направим ново откритие!" : "Избери своя прякор и продължи оттам, докъдето стигна."}</p>
    {issue && <p className={o.notice} role="alert">{profileMessages[issue]}</p>}
    {firstVisit ? <NicknameForm issue={issue} /> : <>
      <div className={o.profiles}>
        {children.map(child => <form key={child.id} action="/api/profiles" method="post">
          <input type="hidden" name="action" value="select" />
          <input type="hidden" name="childId" value={child.id} />
          <button className={o.profile}>{child.nickname}<span aria-hidden="true">→</span></button>
        </form>)}
      </div>
      <details className={o.additional} open={issue === "nickname" || issue === "full" || issue === "unavailable"}>
        <summary>Добави друг изследовател</summary>
        <NicknameForm issue={issue} />
      </details>
      <Link className={o.home} href="/">← Начало</Link>
    </>}
  </OnboardingFrame>;
}
