'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { MetricCard, StatusBadge, BarProgress } from '@/components/ui'
import { supabase, calcularCargaRoteiro, type Roteiro, type Loja, type Marca, type Parametro } from '@/lib/supabase'

export default function Dashboard() {
  const [stats, setStats]   = useState<any[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: rotDB }, { data: lojasDB }, { data: marcasDB }, { data: paramsDB }] = await Promise.all([
      supabase.from('roteiros').select('*').eq('ativo', true).order('numero'),
      supabase.from('lojas').select('*, loja_marcas(*, marcas(*))').eq('ativa', true),
      supabase.from('marcas').select('*').eq('ativa', true).order('ordem'),
      supabase.from('parametros').select('*'),
    ])
    const p = { dias:6, horas:8, deslocMin:20, limiteAlerta:80 }
    ;(paramsDB??[]).forEach((pm:Parametro) => {
      if(pm.chave==='dias_semana')   p.dias=+pm.valor
      if(pm.chave==='horas_dia')     p.horas=+pm.valor
      if(pm.chave==='desloc_min')    p.deslocMin=+pm.valor
      if(pm.chave==='limite_alerta') p.limiteAlerta=+pm.valor
    })
    setMarcas(marcasDB??[])
    setStats((rotDB??[]).map((rot:Roteiro) => {
      const lojas = (lojasDB??[]).filter((l:Loja) => l.roteiro_id===rot.id)
      const carga = calcularCargaRoteiro(lojas, marcasDB??[], p)
      const cidades = Array.from(
  new Set(lojas.map((l: Loja) => l.cidade).filter(Boolean))
)
      return { ...rot, lojas, carga, cidades }
    }))
    setLoading(false)
  }

  const totalLojas   = stats.reduce((s,r)=>s+r.lojas.length,0)
  const totalVisitas = stats.reduce((s,r)=>s+r.carga.totalVisitas,0)
  const cidades      = new Set(stats.flatMap(r=>r.cidades)).size
  const nOk    = stats.filter(r=>r.carga.status==='ok').length
  const nWarn  = stats.filter(r=>r.carga.status==='warn').length
  const nAlert = stats.filter(r=>r.carga.status==='alert').length
  const emAlerta = stats.filter(r=>r.carga.status!=='ok')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Visão Geral</h1>
            <p className="text-sm text-gray-400 mt-0.5">Acompanhamento de carga e cobertura da equipe</p>
          </div>
          {loading ? <div className="text-gray-400 text-sm py-12 text-center">Carregando...</div> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
                <MetricCard label="Roteiros"     value={stats.length}   sub="ativos" />
                <MetricCard label="Lojas"        value={totalLojas}     sub={`${cidades} cidades`} />
                <MetricCard label="Visitas/sem"  value={totalVisitas}   sub="total equipe" />
                <MetricCard label="Marcas"       value={marcas.length}  sub="ativas" />
                <MetricCard label="Normal"       value={nOk}            variant="ok" />
                <MetricCard label="Atenção"      value={nWarn}          variant="warn" />
                <MetricCard label="Sobrecarga"   value={nAlert}         variant="alert" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="card">
                  <div className="card-title">⚠️ Roteiros em alerta</div>
                  {emAlerta.length===0
                    ? <p className="text-sm text-gray-400">Nenhum roteiro em alerta.</p>
                    : emAlerta.map(r=>(
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <b className="text-sm">Roteiro {r.numero}</b>
                          <span className="text-xs text-gray-400 ml-2">{r.cidades.slice(0,2).join(', ')}</span>
                          <span className="text-xs text-gray-400 ml-1">· {r.lojas.length} lojas</span>
                        </div>
                        <StatusBadge status={r.carga.status} pct={r.carga.pct} />
                      </div>
                    ))
                  }
                </div>
                <div className="card">
                  <div className="card-title">✅ Status da equipe</div>
                  {([['ok','Normal',nOk],['warn','Atenção',nWarn],['alert','Sobrecarregado',nAlert]] as any[]).map(([st,lbl,cnt])=>(
                    <div key={st} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{lbl}</span>
                        <StatusBadge status={st} pct={Math.round(cnt/Math.max(stats.length,1)*100)} />
                      </div>
                      <BarProgress status={st} pct={Math.round(cnt/Math.max(stats.length,1)*100)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title">📊 Ocupação por roteiro</div>
                <div className="max-h-96 overflow-y-auto space-y-1.5">
                  {stats.map(r=>(
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-14 shrink-0">Rot. {r.numero}</span>
                      <span className="text-xs text-gray-400 w-28 truncate shrink-0">{r.cidades[0]}{r.cidades.length>1?'+':''}</span>
                      <BarProgress status={r.carga.status} pct={r.carga.pct} />
                      <span className="text-xs text-gray-500 w-7 shrink-0">{r.carga.totalVisitas}v</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
