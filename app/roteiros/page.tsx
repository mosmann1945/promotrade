'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { StatusBadge, DayPills, MarcaTags } from '@/components/ui'
import { supabase, calcularCargaRoteiro, diasVisita, type Roteiro, type Loja, type Marca, type Parametro } from '@/lib/supabase'

const DIAS_KEYS = ['seg','ter','qua','qui','sex','sab'] as const
const DIAS_LABELS = ['Seg','Ter','Qua','Qui','Sex','Sáb']

export default function RoteirosPage() {
  const [roteiros, setRoteiros] = useState<any[]>([])
  const [marcas,   setMarcas]   = useState<Marca[]>([])
  const [params,   setParams]   = useState({ dias:6, horas:8, deslocMin:20, limiteAlerta:80 })
  const [loading,  setLoading]  = useState(true)
  const [selRot,   setSelRot]   = useState('')
  const [selStatus,setSelStatus]= useState('')
  const [selCidade,setSelCidade]= useState('')
  const [editLoja, setEditLoja] = useState<Loja|null>(null)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: rotDB }, { data: lojasDB }, { data: marcasDB }, { data: paramsDB }] = await Promise.all([
      supabase.from('roteiros').select('*').eq('ativo',true).order('numero'),
      supabase.from('lojas').select('*, loja_marcas(*, marcas(*))').eq('ativa',true),
      supabase.from('marcas').select('*').eq('ativa',true).order('ordem'),
      supabase.from('parametros').select('*'),
    ])
    const p = { dias:6, horas:8, deslocMin:20, limiteAlerta:80 }
    ;(paramsDB??[]).forEach((pm:Parametro) => {
      if(pm.chave==='dias_semana')   p.dias=+pm.valor
      if(pm.chave==='horas_dia')     p.horas=+pm.valor
      if(pm.chave==='desloc_min')    p.deslocMin=+pm.valor
      if(pm.chave==='limite_alerta') p.limiteAlerta=+pm.valor
    })
    setParams(p); setMarcas(marcasDB??[])
    setRoteiros((rotDB??[]).map((rot:Roteiro) => {
      const lojas = (lojasDB??[]).filter((l:Loja)=>l.roteiro_id===rot.id)
      return {
  ...rot,
  lojas,
  carga: calcularCargaRoteiro(lojas, marcasDB ?? [], p),
  cidades: Array.from(
    new Set(lojas.map((l: Loja) => l.cidade).filter(Boolean))
  )
}
    }))
    setLoading(false)
  }

  const cidades = Array.from(
  new Set(roteiros.flatMap(r => r.cidades))
).sort() as string[]
  let filtered = roteiros
  if(selRot)    filtered = filtered.filter(r=>r.numero===+selRot)
  if(selStatus) filtered = filtered.filter(r=>r.carga.status===selStatus)
  if(selCidade) filtered = filtered.filter(r=>r.cidades.includes(selCidade))

  async function saveLoja() {
    if(!editLoja) return
    setSaving(true)
    const { id, loja_marcas, ...data } = editLoja as any
    await supabase.from('lojas').update(data).eq('id', id)
    setSaving(false); setEditLoja(null); load()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-semibold">Roteiros</h1>
              <p className="text-sm text-gray-400">Clique em Editar para alterar uma loja</p>
            </div>
            <button onClick={load} className="btn btn-secondary">↺ Atualizar</button>
          </div>
          <div className="flex gap-3 flex-wrap mb-5">
            <select className="input" value={selRot} onChange={e=>setSelRot(e.target.value)}>
              <option value="">Todos os roteiros</option>
              {roteiros.map(r=><option key={r.id} value={r.numero}>Roteiro {r.numero}</option>)}
            </select>
            <select className="input" value={selCidade} onChange={e=>setSelCidade(e.target.value)}>
              <option value="">Todas as cidades</option>
              {cidades.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={selStatus} onChange={e=>setSelStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="ok">Normal</option><option value="warn">Atenção</option><option value="alert">Sobrecarregado</option>
            </select>
          </div>

          {loading ? <div className="text-gray-400 text-sm py-8 text-center">Carregando...</div>
            : filtered.map(rot=>(
            <div key={rot.id} className="card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Roteiro {rot.numero}</span>
                  <span className="text-sm text-gray-400">{rot.cidades.join(' / ')}</span>
                  <StatusBadge status={rot.carga.status} pct={rot.carga.pct} />
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span><b className="text-gray-800">{rot.lojas.length}</b> lojas</span>
                  <span><b className="text-gray-800">{rot.carga.totalVisitas}</b> vis/sem</span>
                  <span><b className="text-gray-800">{(rot.carga.minUsados/60).toFixed(1)}h</b>/{(rot.carga.capacidadeMin/60).toFixed(0)}h</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr>
                    <th>Loja</th><th>Rede</th><th>Cidade</th><th>Dias</th>
                    <th>Vis/sem</th><th>Min/vis</th><th>Marcas</th><th></th>
                  </tr></thead>
                  <tbody>
                    {rot.lojas.map((loja:any)=>{
                      const vis = diasVisita(loja)
                      const lojaMarcas = (loja.loja_marcas??[]).map((lm:any)=>lm.marcas).filter(Boolean)
                      const minV = lojaMarcas.reduce((s:number,m:Marca)=>{
                        const lm = loja.loja_marcas.find((x:any)=>x.marca_id===m.id)
                        return s+(lm?.tempo_min??m.tempo_padrao_min??10)
                      },0)+params.deslocMin
                      return(
                        <tr key={loja.id}>
                          <td className="font-medium max-w-[180px] truncate">{loja.nome}</td>
                          <td><span className="badge badge-blue">{loja.rede||'—'}</span></td>
                          <td className="text-gray-500 text-xs">{loja.cidade}</td>
                          <td><DayPills loja={loja} /></td>
                          <td className="text-center font-medium">{vis}×</td>
                          <td className="text-center text-gray-500">{minV}min</td>
                          <td><MarcaTags marcas={lojaMarcas} /></td>
                          <td><button onClick={()=>setEditLoja(loja)} className="text-xs text-blue-600 hover:underline">Editar</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {editLoja && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h2 className="font-semibold text-base mb-4">Editar Loja</h2>
              <div className="space-y-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Nome</label>
                  <input className="input w-full" value={editLoja.nome} onChange={e=>setEditLoja({...editLoja,nome:e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Rede</label>
                    <input className="input w-full" value={editLoja.rede??''} onChange={e=>setEditLoja({...editLoja,rede:e.target.value})} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Cidade</label>
                    <input className="input w-full" value={editLoja.cidade??''} onChange={e=>setEditLoja({...editLoja,cidade:e.target.value})} /></div>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">Endereço</label>
                  <input className="input w-full" value={editLoja.endereco??''} onChange={e=>setEditLoja({...editLoja,endereco:e.target.value})} /></div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Dias de visita</label>
                  <div className="flex gap-2 flex-wrap">
                    {DIAS_KEYS.map((d,i)=>(
                      <button key={d} onClick={()=>setEditLoja({...editLoja,[d]:!editLoja[d]})}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                          ${editLoja[d]?'bg-blue-100 text-blue-800 border-blue-300':'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {DIAS_LABELS[i]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={()=>setEditLoja(null)} className="btn btn-secondary">Cancelar</button>
                <button onClick={saveLoja} disabled={saving} className="btn btn-primary">{saving?'Salvando...':'Salvar'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
