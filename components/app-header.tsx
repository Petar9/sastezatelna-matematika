import Link from "next/link";
import { AppMenu } from "./app-menu";
import type { ComponentProps } from "react";
import s from "./app-navigation.module.css";

export function AppHeader(props: ComponentProps<typeof AppMenu>) {
 return <header className={s.header}><Link className={s.brand} href="/">Състезателна математика</Link><AppMenu {...props}/></header>;
}
