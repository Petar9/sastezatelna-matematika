import Link from "next/link";
import { Button, ButtonLink } from "./ui/button";
import { Input } from "./ui/field";
import { Message } from "./ui/message";
import {LandingIllustration} from "./landing-illustration";
import l from "./landing.module.css";

export function Landing({request}:{request?:string}){
 const error=request==="invalid"||request==="unavailable";
 return <main className={l.shell}><div className={l.content}>
  <header className={l.header}>
   <strong className={l.brand}>Състезателна математика</strong>
   <ButtonLink variant="primary" className={l.login} href="/login">Вход</ButtonLink>
  </header>
  <section className={l.hero} aria-labelledby="landing-title">
   <div className={l.heroCopy}>
    <h1 className={l.title} id="landing-title">Подготовка за състезания, стъпка по стъпка.</h1>
    <p className={l.intro}>Истински задачи, ясни подсказки и приключения с награди.</p>
    <div className={l.invitation} id="invitation">
     {request==="received"?<Message className={l.success} tone="success">Благодарим! Получихме заявката за покана.</Message>:<form className={l.form} action="/api/invitations" method="post">
      <label className={l.email} htmlFor="invitation-email">Имейл на родител</label>
      <div className={l.formFields}>
       <Input id="invitation-email" name="email" type="email" maxLength={254} required autoComplete="email" aria-describedby={error?"invitation-note invitation-error":"invitation-note"} aria-invalid={request==="invalid"?true:undefined}/>
       <Button variant="secondary" className={l.button} type="submit">Заяви покана</Button>
      </div>
      <p className={l.note} id="invitation-note">Ще използваме имейла само за поканата.</p>
     </form>}
     {request==="invalid"&&<Message className={l.error} id="invitation-error" tone="error" inline>Въведи валиден имейл.</Message>}
     {request==="unavailable"&&<Message className={l.error} id="invitation-error" tone="error" inline>Заявката не беше приета. Опитай отново по-късно.</Message>}
    </div>
   </div>
   <LandingIllustration />
  </section>
  <p className={l.collection}>Наличният комплект е по математика за 4. клас и включва задачи от „Математика за всеки“, Олимпиада, НВО (матура) за 2023-2026 г.</p>
  <nav className={l.resources} aria-label="За приложението и подготовката"><Link href="/about">За сайта</Link><Link href="/materiali">Ценни материали</Link></nav>
 </div></main>;
}
