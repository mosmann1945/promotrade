import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Roteiro   = { id:number; numero:number; descricao:string|null; ativo:boolean }
export type Loja      = { id:number; roteiro_id:number; nome:string; rede:string|null; cidade:string|null; endereco:string|null; cnpj:string|null; seg:boolean; ter:boolean; qua:boolean; qui:boolean; sex:boolean; sab:boolean; ativa:boolean; loja_marcas?:LojaMarca[] }
export type Marca     = { id:number; codigo:string; nome:string; tempo_padrao_min:number; ativa:boolean; ordem:number }
export type LojaMarca = { id:number; loja_id:number; marca_id:number; tempo_min:number|null; marcas?:Marca }
export type Parametro = { id:number; chave:string; valor:string; descricao:string|null }

export function diasVisita(l:Loja){ return [l.seg,l.ter,l.qua,l.qui,l.sex,l.sab].filter(Boolean).length }

export function tempoVisita(loja:Loja, marcas:Marca[], deslocMin:number):number {
  if(!loja.loja_marcas) return deslocMin
  const t = loja.loja_marcas.reduce((s,lm)=>{
    const tempo = lm.tempo_min ?? marcas.find(m=>m.id===lm.marca_id)?.tempo_padrao_min ?? 10
    return s+tempo
  },0)
  return t+deslocMin
}

export function calcularCargaRoteiro(lojas:Loja[], marcas:Marca[], p:{dias:number;horas:number;deslocMin:number;limiteAlerta:number}){
  const cap = p.dias*p.horas*60
  let min=0, vis=0
  lojas.forEach(l=>{ const v=diasVisita(l); min+=v*tempoVisita(l,marcas,p.deslocMin); vis+=v })
  const pct = Math.round(min/cap*100)
  return { minUsados:min, totalVisitas:vis, capacidadeMin:cap, pct, status: pct>100?'alert':pct>=p.limiteAlerta?'warn':'ok' }
}

export const BRL = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
