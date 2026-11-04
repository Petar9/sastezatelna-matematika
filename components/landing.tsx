import Link from "next/link";
import {LandingIllustration} from "./landing-illustration";
import l from "./landing.module.css";

export function Landing({request}:{request?:string}){
 const error=request==="invalid"||request==="unavailable";
 return <main className={l.shell}><div className={l.content}>
  <header className={l.header}>
   <strong className={l.brand}>Състезателна математика</strong>
   <Link className={l.login} href="/login">Вход</Link>
  </header>
  <section className={l.hero} aria-labelledby="landing-title">
   <div className={l.heroCopy}>
    <h1 className={l.title} id="landing-title">Подготовка за състезания, стъпка по стъпка.</h1>
    <p className={l.intro}>Истински задачи, ясни подсказки и приключения с награди.</p>
    <div className={l.invitation} id="invitation">
     <p className={l.pilot}>Тестваме с група до 5 деца.</p>
     {request==="received"?<p className={l.success} role="status">Благодарим! Получихме заявката за покана.</p>:<form className={l.form} action="/api/invitations" method="post">
      <label className={l.email} htmlFor="invitation-email">Имейл на родител</label>
      <div className={l.formFields}>
       <input id="invitation-email" name="email" type="email" maxLength={254} required autoComplete="email" aria-describedby={error?"invitation-note invitation-error":"invitation-note"} aria-invalid={request==="invalid"?true:undefined}/>
       <button className={l.button} type="submit">Заяви покана</button>
      </div>
      <p className={l.note} id="invitation-note">Ще използваме имейла само за поканата.</p>
     </form>}
     {request==="invalid"&&<p className={l.error} id="invitation-error" role="alert">Въведи валиден имейл.</p>}
     {request==="unavailable"&&<p className={l.error} id="invitation-error" role="alert">Заявката не беше приета. Опитай отново по-късно.</p>}
    </div>
   </div>
   <LandingIllustration />
  </section>
  <p className={l.collection}>Наличният комплект е по математика за 4. клас и включва задачи от „Математика за всеки“, Олимпиада, НВО (матура) за 2023-2026 г.</p>
 </div></main>;
}
