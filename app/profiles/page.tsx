import {redirect} from "next/navigation";
import Link from "next/link";
import {mode,parentContext} from "@/src/server";
import {KidsError} from "@/src/core";
import s from "@/components/kids.module.css";
export const dynamic="force-dynamic";
export default async function Profiles({searchParams}:{searchParams:Promise<{full?:string}>}){if(mode()==="local")return <main className={s.shell}><div className={s.content}><Link href="/" className={s.secondary}>← Начало</Link><h1>Твоето приключение</h1><p>Напредъкът се пази на този компютър.</p></div></main>;
 const parent=await parentContext().catch(error=>{if(error instanceof KidsError)redirect(error.status===401?"/login":"/login?denied=1");throw error;});const {full}=await searchParams;
 return <main className={s.shell}><div className={s.content}><Link href="/" className={s.secondary}>← Начало</Link><h1>Кой ще открива днес?</h1><section className={s.card}>{parent.children.map(child=><form key={child.id} action="/api/profiles" method="post"><input type="hidden" name="action" value="select"/><input type="hidden" name="childId" value={child.id}/><button className={s.button}>{child.nickname}</button></form>)}<h2>Нов изследовател</h2>{full&&<p role="alert">Петте места в пилотната група са заети.</p>}<form action="/api/profiles" method="post"><input type="hidden" name="action" value="create"/><label>Прякор <input name="nickname" required minLength={1} maxLength={40}/></label><button className={s.secondary}>Добави профил</button></form></section><Link href="/parent" className={s.secondary}>Напредък за родители</Link><form method="post" action="/auth/logout"><button className={s.quiet}>Изход от родителския профил</button></form></div></main>;
}
