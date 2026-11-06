import Link from "next/link";
import {ButtonLink} from "./ui/button";
import l from "./landing.module.css";
import s from "./materials.module.css";
export function MaterialsHeader(){
 return <header className={`${l.header} ${s.header}`}><Link className={`${l.brand} ${s.brand}`} href="/">Състезателна математика</Link><ButtonLink variant="primary" className={l.login} href="/login">Вход</ButtonLink></header>;
}
