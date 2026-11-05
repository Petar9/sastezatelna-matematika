import s from "@/components/kids.module.css";
export default function Loading() {
 return <main className={s.shell}><div className={s.content}><h1>Напредък</h1><p role="status">Зареждаме напредъка…</p></div></main>;
}
