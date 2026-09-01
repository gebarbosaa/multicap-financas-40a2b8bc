/* BACKUP HISTÓRICO — HÁBITOS
 * Fonte: gebarbosaa/harmony-hub @ 61df491c9e0d199677927ccc2615407330e96739
 * Arquivo preservado fora do deploy atual.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Check, Flame, Pencil, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui-kit";
import { useHouseholdTable } from "@/hooks/use-household-data";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/habitos")({
  head: () => ({ meta: [{ title: "HÁBITOS — MULTICAP" }] }),
  component: HabitsPage,
});

type Habit={id:string;household_id:string;user_id:string;title:string;frequency:string;shift:string|null;privacy:string|null;created_at:string};
type HabitLog={id:string;household_id:string;habit_id:string;user_id:string;date:string;created_at:string};
const localDate=()=>{const d=new Date(),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10)};

function HabitsPage(){
 const {user}=useAuth();
 const habits=useHouseholdTable<Habit>("habits","*","created_at");
 const logs=useHouseholdTable<HabitLog>("habit_logs","*","date");
 const [tab,setTab]=useState<"MEUS HÁBITOS"|"HÁBITOS DE PARCEIRO">("MEUS HÁBITOS");
 const [showForm,setShowForm]=useState(false); const [title,setTitle]=useState(""); const [frequency,setFrequency]=useState("daily"); const [privacy,setPrivacy]=useState("private");
 const [editing,setEditing]=useState<Habit|null>(null); const [editTitle,setEditTitle]=useState(""); const [editFrequency,setEditFrequency]=useState("daily"); const [editPrivacy,setEditPrivacy]=useState("private");
 const today=localDate();
 useEffect(()=>{const open=()=>{setTitle("");setFrequency("daily");setPrivacy("private");setShowForm(true)};const handler=(event:globalThis.Event)=>{const detail=(event as CustomEvent<{option?:string}>).detail;if(!detail?.option||detail.option==="NOVO HÁBITO")open()};window.addEventListener("multicap:open-create",handler);return()=>window.removeEventListener("multicap:open-create",handler)},[]);
 const list=habits.rows.filter(h=>tab==="MEUS HÁBITOS"?h.user_id===user?.id:h.user_id!==user?.id);
 const myLogs=logs.rows.filter(l=>l.user_id===user?.id);
 const isDone=(id:string,date=today)=>myLogs.some(l=>l.habit_id===id&&l.date===date);
 const streak=(id:string)=>{let n=0,d=new Date(`${today}T12:00:00`);while(myLogs.some(l=>l.habit_id===id&&l.date===d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}return n};
 const total=list.length; const todayDone=list.filter(h=>isDone(h.id)).length; const progress=total?Math.round(todayDone/total*100):0;
 async function add(){const name=title.trim();if(!name){toast.error("INFORME O NOME DO HÁBITO");return}if(!user?.id||!habits.householdId){toast.error("SUA CONTA AINDA NÃO ESTÁ VINCULADA A UMA CASA");return}try{await habits.insert({user_id:user.id,title:name.toUpperCase(),frequency,privacy,shift:null});setShowForm(false);setTitle("");toast.success("HÁBITO ADICIONADO")}catch(e){toast.error(e instanceof Error?e.message:"ERRO AO ADICIONAR O HÁBITO")}}
 function startEdit(h:Habit){setEditing(h);setEditTitle(h.title);setEditFrequency(h.frequency);setEditPrivacy(h.privacy??"private")}
 async function saveEdit(){if(!editing||!editTitle.trim()){toast.error("INFORME O NOME DO HÁBITO");return}try{await habits.update(editing.id,{title:editTitle.trim().toUpperCase(),frequency:editFrequency,privacy:editPrivacy});setEditing(null);toast.success("HÁBITO ATUALIZADO")}catch(e){toast.error(e instanceof Error?e.message:"ERRO AO ATUALIZAR")}}
 async function remove(id:string){if(!window.confirm("Excluir este hábito e seu histórico?"))return;try{await habits.remove(id);toast.success("HÁBITO EXCLUÍDO")}catch(e){toast.error(e instanceof Error?e.message:"ERRO AO EXCLUIR")}}
 async function toggle(id:string){if(!user?.id||!logs.householdId)return;const existing=myLogs.find(l=>l.habit_id===id&&l.date===today);try{if(existing)await logs.remove(existing.id);else await logs.insert({habit_id:id,user_id:user.id,date:today});toast.success(existing?"REGISTRO DESMARCADO":"HÁBITO CONCLUÍDO")}catch(e){toast.error(e instanceof Error?e.message:"ERRO AO REGISTRAR HÁBITO")}}
 return <div className="space-y-5"><PageHeader title="HÁBITOS" subtitle="Acompanhe e construa hábitos melhores todos os dias." action={<button type="button" onClick={()=>setShowForm(true)} className="gradient-primary rounded-xl px-3 py-2 text-[10px] font-semibold text-primary-foreground">+ NOVO HÁBITO</button>}/><Dialog open={showForm} onOpenChange={setShowForm}><DialogContent className="max-w-lg rounded-3xl"><DialogHeader><DialogTitle className="label-caps">NOVO HÁBITO</DialogTitle></DialogHeader><div className="space-y-4"><label><span className="label-caps mb-1.5 block text-[9px]">NOME DO HÁBITO</span><input autoFocus value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"/></label><div className="grid grid-cols-2 gap-3"><select value={frequency} onChange={e=>setFrequency(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"><option value="daily">DIÁRIO</option><option value="weekly">SEMANAL</option><option value="monthly">MENSAL</option></select><select value={privacy} onChange={e=>setPrivacy(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"><option value="private">PRIVADO</option><option value="shared">COMPARTILHADO</option></select></div><button onClick={()=>void add()} className="gradient-primary w-full rounded-xl px-4 py-2.5 text-[10px] font-semibold text-primary-foreground">SALVAR HÁBITO</button></div></DialogContent></Dialog>{editing&&<Panel title="EDITAR HÁBITO"><div className="grid gap-2 md:grid-cols-[1fr_180px_180px_auto]"><input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 text-sm"/><select value={editFrequency} onChange={e=>setEditFrequency(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 text-sm"><option value="daily">DIÁRIO</option><option value="weekly">SEMANAL</option><option value="monthly">MENSAL</option></select><select value={editPrivacy} onChange={e=>setEditPrivacy(e.target.value)} className="rounded-xl border border-input bg-background px-4 py-3 text-sm"><option value="private">PRIVADO</option><option value="shared">COMPARTILHADO</option></select><div className="flex gap-2"><button onClick={()=>void saveEdit()} className="gradient-primary rounded-xl px-5 text-[10px] font-semibold text-primary-foreground">SALVAR</button><button onClick={()=>setEditing(null)} className="rounded-xl border border-border px-4">FECHAR</button></div></div></Panel>}<div className="flex gap-2 overflow-x-auto">{(["MEUS HÁBITOS","HÁBITOS DE PARCEIRO"] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={cn("whitespace-nowrap rounded-xl border px-5 py-3 text-[10px] font-semibold",tab===t?"border-orange-500/70 bg-orange-500/10 text-orange-400":"border-border text-muted-foreground")}>{t}</button>)}</div>{habits.isLoading?<p className="text-sm text-muted-foreground">Carregando hábitos...</p>:total===0?<Panel><div className="py-10 text-center"><p className="font-semibold">Nenhum hábito cadastrado</p></div></Panel>:<div className="grid gap-3 md:grid-cols-2">{list.map((h,i)=><div key={h.id} className="rounded-2xl border border-border bg-card/70 p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl border">✓</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{h.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{h.frequency} · {h.privacy}</p></div><span className="text-xs">🔥 {streak(h.id)}</span><button onClick={()=>startEdit(h)}><Pencil className="h-4 w-4"/></button><button onClick={()=>void remove(h.id)}><Trash2 className="h-4 w-4"/></button></div><button onClick={()=>void toggle(h.id)} className="mt-4 w-full rounded-xl border px-3 py-2 text-xs">{isDone(h.id)?"CONCLUÍDO HOJE":"MARCAR HOJE"}</button></div>)}</div>}</div>;
}
