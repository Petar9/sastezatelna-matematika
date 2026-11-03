import {redirect} from "next/navigation";
import Link from "next/link";
import {mode} from "@/src/server";
import s from "@/components/kids.module.css";
export const dynamic="force-dynamic";
export default async function Login({searchParams}:{searchParams:Promise<{denied?:string}>}){if(mode()==="local")redirect("/");const {denied}=await searchParams;return <main className={s.shell}><div className={s.content}><h1>Математически открития</h1><section className={s.card}><h2>Вход за родител</h2><p>Детето учи със свой прякор, а напредъкът му се пази в твоя профил.</p>{denied&&<p role="alert">Този профил още няма достъп. Използвай одобрения родителски Google профил.</p>}<form method="post" action="/auth/login"><button className={s.button}>Продължи с Google</button></form></section><Link href="/about">За приложението</Link></div></main>;}
