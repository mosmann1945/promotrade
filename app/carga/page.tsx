'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { MetricCard, StatusBadge, BarProgress } from '@/components/ui'
import { supabase, calcularCargaRoteiro, type Roteiro, type Loja, type Marca, type Parametro, BRL } from '@/lib/supabase'

export default function CargaPage() {
  const [data,    setData]    = useState<any[]>([])
  const [params,  setParams]  = useState({ dias:6, horas:8, deslocMin:20, limiteAlerta:80 })
  const [loading, setLoading] = useState(true)

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
    ;(paramsDB??[]).forEach((pm:Parametro)=>{
      if(pm.chave==='dias_semana')   p.dias=+pm.valor
      if(pm.chave==='horas_dia')     p.horas=+pm.valor
      if(pm.chave==='desloc_min')    p.deslocMin=+pm.valor
      if(pm.chave==='limite_alerta') p.limiteAlerta=+pm.valor
    })
    setParams(p)
    setData((rotDB??[]).map((rot:Roteiro)=>{
      const lojas=(lojasDB??[]).filter((l:Loja)=>l.roteiro_id===rot.id)
      const carga=calcularCargaRoteiro(lojas,marcasDB??[],p)
      const cidades = Array.from(
  new Set((lojas || []).map((l: Loja) => l.cidade).filter(Boolean))
)
      return {...rot,lojas,carga,cidades}
    }))
    setLoading(false)
  }

  function exportCSV(){
    const rows=[['Roteiro','Cidades','Lojas','Vis/sem','Hrs est.','Capacidade','Ocupação%','Status'],
      ...data.map(r=>[`Roteiro ${r.numero}`,r.cidades.join(', '),r.lojas.length,r.carga.totalVisitas,
        (r.carga.minUsados/60).toFixed(1),(r.carga.capacidadeMin/60).toFixed(0),r.carga.pct,
        r.carga.status==='ok'?'Normal':r.carga.status==='warn'?'Atenção':'Sobrecarregado'])]
    const csv=rows.map(r=>r.join(';')).join('\n')
    const a=document.createElement('a')
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
    a.download=`carga_roteiros_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const nOk=data.filter(r=>r.carga.status==='ok').length
  const nWarn=data.filter(r=>r.carga.status==='warn').length
  const nAlert=data.filter(r=>r.carga.status==='alert').length

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div><h1 className="text-xl font-semibold">Carga de Trabalho</h1>
              <p className="text-sm text-gray-400">Ocupação por roteiro vs. capacidade contratada</p></div>
            <div className="flex gap-2">
              <button onClick={load} className="btn btn-secondary">↺ Atualizar</button>
              <button onClick={exportCSV} className="btn btn-secondary">↓ CSV</button>
            </div>
          </div>
          {loading ? <div className="text-gray-400 text-sm py-8 text-center">Carregando...</div> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="Horas/sem por promotor" value={`${params.dias*params.horas}h`} />
                <MetricCard label="Normal"       value={nOk}    variant="ok"    sub="roteiros" />
                <MetricCard label="Atenção"      value={nWarn}  variant="warn"  sub="roteiros" />
                <MetricCard label="Sobrecarregados" value={nAlert} variant="alert" sub="roteiros" />
              </div>
              <div className="card overflow-x-auto">
                <table className="tbl">
                  <thead><tr>
                    <th>Roteiro</th><th>Cidades</th><th>Lojas</th><th>Vis/sem</th>
                    <th>Hrs est.</th><th>Capac.</th><th className="min-w-[160px]">Ocupação</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {data.map(r=>(
                      <tr key={r.id} className={r.carga.status==='alert'?'bg-red-50':r.carga.status==='warn'?'bg-yellow-50':''}>
                        <td className="font-semibold">Rot. {r.numero}</td>
                        <td className="text-gray-500 text-xs max-w-[140px] truncate">{r.cidades.slice(0,2).join(', ')}{r.cidades.length>2?'…':''}</td>
                        <td className="text-center">{r.lojas.length}</td>
                        <td className="text-center">{r.carga.totalVisitas}</td>
                        <td className="text-center">{(r.carga.minUsados/60).toFixed(1)}h</td>
                        <td className="text-center">{(r.carga.capacidadeMin/60).toFixed(0)}h</td>
                        <td><BarProgress status={r.carga.status} pct={r.carga.pct} /></td>
                        <td><StatusBadge status={r.carga.status} pct={r.carga.pct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">* Tempos configurados em Parâmetros. Inclui {params.deslocMin}min de deslocamento.</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
