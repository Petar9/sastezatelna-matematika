"use client";

import { useId, useState } from "react";
import { ChildSharing } from "./child-sharing";
import { ProfileNameForm } from "./profile-name-form";
import { Button } from "./ui/button";
import { ActionIcon } from "./ui/action-icon";
import s from "./profiles.module.css";

export function ProfileCard({ child, renameOpen = false }: { child: {id:string; nickname:string; isOwner?:boolean}; renameOpen?:boolean }) {
 const [pane, setPane] = useState<"name" | "share" | undefined>(renameOpen ? "name" : undefined);
 const id = useId();
 return <section className={s.card} aria-label={child.nickname}>
  <form action="/api/profiles" method="post">
   <input type="hidden" name="action" value="select"/><input type="hidden" name="childId" value={child.id}/>
   <Button type="submit" variant="secondary" className={s.entry}><span>{child.nickname}</span><span className={s.arrow}><ActionIcon name="arrow"/></span></Button>
  </form>
  <div className={s.tools}>
   <Button id={`${id}-name-toggle`} variant="quiet" className={s.tool} aria-expanded={pane === "name"} aria-controls={`${id}-name`} onClick={() => setPane(pane === "name" ? undefined : "name")}><ActionIcon name="pencil"/><span>Промени името</span><ActionIcon name="chevron"/></Button>
   {child.isOwner !== false && <Button id={`${id}-share-toggle`} variant="quiet" className={s.tool} aria-expanded={pane === "share"} aria-controls={`${id}-share`} onClick={() => setPane(pane === "share" ? undefined : "share")}><ActionIcon name="share"/><span>Сподели достъп</span><ActionIcon name="chevron"/></Button>}
  </div>
  <div id={`${id}-name`} className={s.pane} hidden={pane !== "name"} role="region" aria-labelledby={`${id}-name-toggle`}><ProfileNameForm child={child}/></div>
  {child.isOwner !== false && <div id={`${id}-share`} className={s.pane} hidden={pane !== "share"} role="region" aria-labelledby={`${id}-share-toggle`}><ChildSharing childId={child.id} embedded active={pane === "share"}/></div>}
 </section>;
}
