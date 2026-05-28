'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase, type Marca, type Parametro } from '@/lib/supabase'

export default function ConfigPage() {
  const [marcas,  setMarcas]  = useState<Marca[]>([])
  const [params,  setParams]  = useState<Parametro[]>([])
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data:m }, { data:p }] = await Promise.all([
      supabase.from('marcas').select('*').eq('ativa',true).order('ordem'),
      supabase.from('parametros').select('*'),
    ])
    setMarcas(m??[]); setParams(p??[]); setLoading(false)
  }

  const getP = (c:string) => params.find(p=>p.chave===c)?.valor??''
  const setP = (c:string,v:string) => setParams(prev=>prev.map(p=>p.chave===c?{...p,valor:v}:p))

  async function salvar(){
    setSaving(true)
    await Promise.all([
      ...params.map(p=>supabase.from('parametros').update({valor:p.valor}).eq('chave',p.chave)),
      ...marcas.map(m=>supabase.from('marcas').update({tempo_padrao_min:m.tempo_padrao_min}).eq('id',m.id)),
    ])
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  const totalTempo = marcas.reduce((s,m)=>s+m.tempo_padrao_min,0)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div><h1 className="text-xl font-semibold">Parâmetros</h1>
              <p className="text-sm text-gray-400">Configurações de tempo e capacidade</p></div>
            <button onClick={salvar} disabled={saving} className="btn btn-primary">
              {saving?'Salvando...':saved?'✅ Salvo!':'💾 Salvar tudo'}
            </button>
          </div>
          {loading ? <div className="text-gray-400 text-sm">Carregando...</div> : (
            <>
              <div className="card">
                <div className="card-title">⏱ Parâmetros gerais</div>
                <div className="space-y-4">
                  {[
                    {c:'dias_semana',   l:'Dias trabalhados/semana por promotor', u:'dias'},
                    {c:'horas_dia',     l:'Horas/dia contratadas',                u:'h'},
                    {c:'desloc_min',    l:'Deslocamento médio entre lojas',        u:'min'},
                    {c:'limite_alerta', l:'Limite de atenção (% capacidade)',      u:'%'},
                  ].map(({c,l,u})=>(
                    <div key={c} className="flex items-center justify-between gap-4">
                      <label className="text-sm text-gray-600 flex-1">{l}</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={getP(c)} onChange={e=>setP(c,e.target.value)} className="input w-20 text-center" />
                        <span className="text-sm text-gray-400">{u}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  Capacidade: <b>{+getP('dias_semana') * +getP('horas_dia')}h/semana</b> por promotor
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="card-title mb-0">📦 Tempo por marca (min/visita)</div>
                  <div className="text-xs text-gray-400">Média: {(totalTempo/Math.max(marcas.length,1)).toFixed(1)}min</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {marcas.map(m=>(
                    <div key={m.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50">
                      <span className="brand-tag shrink-0">{m.codigo}</span>
                      <span className="text-sm flex-1 truncate" title={m.nome}>{m.nome}</span>
                      <input type="number" min={0} max={120} value={m.tempo_padrao_min}
                        onChange={e=>setMarcas(prev=>prev.map(x=>x.id===m.id?{...x,tempo_padrao_min:+e.target.value}:x))}
                        className="input w-16 text-center text-xs" />
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setMarcas(prev=>prev.map(m=>({...m,tempo_padrao_min:10})))} className="btn btn-secondary mt-3 text-xs">
                  ↺ Resetar para 10min
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
