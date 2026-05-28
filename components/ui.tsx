'use client'
import type { Loja, Marca } from '@/lib/supabase'

type Status = 'ok'|'warn'|'alert'

export function StatusBadge({status,pct}:{status:Status;pct:number}){
  const m={ok:['badge-ok','Normal'],warn:['badge-warn','Atenção'],alert:['badge-alert','Sobrecarregado']}
  const [cls,label]=m[status]
  return <span className={`badge ${cls}`}>{label} {pct}%</span>
}

export function BarProgress({pct,status}:{pct:number;status:Status}){
  const c={ok:'bg-green-500',warn:'bg-yellow-500',alert:'bg-red-500'}
  return(
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${c[status]}`} style={{width:`${Math.min(pct,100)}%`}}/>
      </div>
      <span className="text-xs text-gray-500 w-9 text-right">{pct}%</span>
    </div>
  )
}

export function DayPills({loja}:{loja:Loja}){
  const dias=[{k:'seg',l:'S'},{k:'ter',l:'T'},{k:'qua',l:'Q'},{k:'qui',l:'Q'},{k:'sex',l:'S'},{k:'sab',l:'S'}]
  return(
    <div className="flex gap-0.5">
      {dias.map(d=><span key={d.k} className={loja[d.k as keyof Loja]?'day-on':'day-off'}>{d.l}</span>)}
    </div>
  )
}

export function MarcaTags({marcas}:{marcas:Marca[]}){
  return <div className="flex flex-wrap">{marcas.map(m=><span key={m.codigo} className="brand-tag" title={m.nome}>{m.codigo}</span>)}</div>
}

export function MetricCard({label,value,sub,variant='default'}:{label:string;value:string|number;sub?:string;variant?:'default'|'ok'|'warn'|'alert'}){
  const c={default:'text-brand-900',ok:'text-green-700',warn:'text-yellow-700',alert:'text-red-700'}
  return(
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${c[variant]}`}>{value}</div>
      {sub&&<div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
