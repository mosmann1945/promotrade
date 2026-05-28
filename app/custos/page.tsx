'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { MetricCard } from '@/components/ui'
import { supabase, BRL } from '@/lib/supabase'

const MARCAS_INFO:[string,string][] = [
  ['MOS','MOSMANN'],['AST','ASTORIA'],['FLO','FLORESTAL'],['XIM','XIMANGO'],
  ['WEB','WEBER'],['FIL','FILOS'],['SAK','SAKURA'],['BRA','BRASIL BEVERAGES'],
  ['ODA','ODARA'],['AVA','AVANT'],['CRIS','CRISTAL COPOS/ROFERC'],['COT','COTTON'],
  ['ARB','ARBOLÊ'],['REG','REGINA'],['DSA','DOCES SANTO ANTONIO'],['LAF','LAFRA'],
  ['MAR','MARQUEZ'],['PBC','PBCAT'],['TUT','TUTTI'],['ESS','ESSENTIAL'],
  ['FFKR','FFKR'],['JHN','PIPOCA DO JOHNNY'],
]

const FIN = {
  csv:   {MOS:94691.36,AST:124400.55,FLO:45435.49,XIM:26185.98,WEB:7667.89,FIL:6469.87,SAK:10834.90,BRA:3813.28,ODA:4583.53,AVA:4101.05,CRIS:3658.98,COT:10830.00,ARB:1377.63,REG:176.34,DSA:18645.14,LAF:6700.79,MAR:4350.86,PBC:2483.41,TUT:9061.74,ESS:2049.91,FFKR:12784.40,JHN:1300.48} as Record<string,number>,
  atend: {MOS:4660,AST:4660,FLO:2532,XIM:1716,WEB:1452,FIL:1072,SAK:1264,BRA:692,ODA:788,AVA:788,CRIS:332,COT:704,ARB:300,REG:8,DSA:1324,LAF:304,MAR:836,PBC:624,TUT:800,ESS:372,FFKR:580,JHN:236} as Record<string,number>,
  horas: {MOS:4296,AST:5644,FLO:2061,XIM:1188,WEB:348,FIL:294,SAK:492,BRA:173,ODA:208,AVA:186,CRIS:166,COT:491,ARB:63,REG:8,DSA:846,LAF:304,MAR:197,PBC:113,TUT:411,ESS:93,FFKR:580,JHN:59} as Record<string,number>,
}

const GASTOS_DEF = [
  {id:'salarios',   label:'Salários Promotores',            val:158301.31},
  {id:'encargos',   label:'Encargos Trabalhistas',           val:106683.53},
  {id:'med',        label:'Medicina e Segurança',            val:1000.00},
  {id:'viagem',     label:'Despesas de Viagem – Promotores', val:92504.93},
  {id:'locveiculo', label:'Locação de Veículos',             val:3420.00},
  {id:'viagvend',   label:'Despesas de Viagem – Vendas',     val:9966.68},
  {id:'info',       label:'Informática – Vendas',            val:964.08},
  {id:'merch1',     label:'Merchandising (próprio)',         val:8878.00},
  {id:'merch2',     label:'Merchandising (terceiros)',       val:3000.00},
  {id:'supervisor', label:'Supervisor',                      val:11000.00},
  {id:'locmos',     label:'Locação Veíc. Mosmann',           val:5786.00},
  {id:'meis',       label:'MEIs / Terceirizados',            val:11878.00},
]

type Gastos = Record<string,number>

export default function CustosPage() {
  const [promQtd, setPromQtd]   = useState(54)
  const [meiQtd,  setMeiQtd]    = useState(5)
  const [hrsDia,  setHrsDia]    = useState(8)
  const [diasSem, setDiasSem]   = useState(6)
  const [indireto,setIndireto]  = useState(50000)
  const [gastos,  setGastos]    = useState<Gastos>(Object.fromEntries(GASTOS_DEF.map(g=>[g.id,g.val])))
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)

  useEffect(() => { loadSaved() }, [])

  async function loadSaved() {
    const { data } = await supabase.from('parametros').select('*').in('chave',['custos_gastos','custos_equipe'])
    if(!data) return
    data.forEach(p => {
      try {
        const v = JSON.parse(p.valor)
        if(p.chave==='custos_gastos') setGastos(v)
        if(p.chave==='custos_equipe'){ setPromQtd(v.promQtd); setMeiQtd(v.meiQtd); setHrsDia(v.hrsDia); setDiasSem(v.diasSem); setIndireto(v.indireto) }
      } catch{}
    })
  }

  async function salvar() {
    setSaving(true)
    await Promise.all([
      supabase.from('parametros').upsert({chave:'custos_gastos',valor:JSON.stringify(gastos),descricao:'Gastos operacionais'},{onConflict:'chave'}),
      supabase.from('parametros').upsert({chave:'custos_equipe',valor:JSON.stringify({promQtd,meiQtd,hrsDia,diasSem,indireto}),descricao:'Equipe'},{onConflict:'chave'}),
    ])
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),3000)
  }

  const semanasM  = 4.33
  const hrsCLT    = promQtd*diasSem*hrsDia*semanasM
  const hrsMEI    = meiQtd*diasSem*hrsDia*semanasM
  const hrsTotal  = hrsCLT+hrsMEI
  const custoOp   = Object.values(gastos).reduce((s,v)=>s+v,0)
  const custoTot  = custoOp+indireto
  const cHoraOp   = hrsTotal>0?custoOp/hrsTotal:0
  const cHoraTot  = hrsTotal>0?custoTot/hrsTotal:0
  const cIndHora  = hrsTotal>0?indireto/hrsTotal:0
  const hrsM      = Object.values(FIN.horas).reduce((a,b)=>a+b,0)
  const totalAt   = Object.values(FIN.atend).reduce((a,b)=>a+b,0)

  const marcaRows = MARCAS_INFO.map(([cod,nome])=>{
    const csv=FIN.csv[cod]||0; const hm=FIN.horas[cod]||0; const at=FIN.atend[cod]||1
    const di=hrsM>0?indireto*(hm/hrsM):0; const ct=csv+di
    return {cod,nome,csv,hm,at,di,ct,cpa:ct/at,cph:hm>0?ct/hm:0}
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div><h1 className="text-xl font-semibold">Custos</h1>
              <p className="text-sm text-gray-400">Estrutura de custos mensal — edite e simule em tempo real</p></div>
            <div className="flex gap-2">
              <button onClick={()=>{setGastos(Object.fromEntries(GASTOS_DEF.map(g=>[g.id,g.val])));setPromQtd(54);setMeiQtd(5);setHrsDia(8);setDiasSem(6);setIndireto(50000)}} className="btn btn-secondary">↺ Restaurar</button>
              <button onClick={salvar} disabled={saving} className="btn btn-primary">{saving?'Salvando...':saved?'✅ Salvo!':'💾 Salvar'}</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <MetricCard label="Custo Operacional/mês"   value={BRL(custoOp)}      variant="alert" />
            <MetricCard label="Custo Total/mês"          value={BRL(custoTot)}     variant="alert" />
            <MetricCard label="Custo/hora (op.)"         value={BRL(cHoraOp)+'/h'} variant="warn" />
            <MetricCard label="Custo/hora (total)"       value={BRL(cHoraTot)+'/h'}variant="warn" />
            <MetricCard label="Horas disponíveis/mês"    value={Math.round(hrsTotal).toLocaleString('pt-BR')+'h'} />
            <MetricCard label="Atendimentos/mês"         value={totalAt.toLocaleString('pt-BR')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-title">👥 Capacidade</div>
              <table className="tbl">
                <thead><tr><th>Tipo</th><th className="text-center">Qtd</th><th className="text-center">Horas/mês</th></tr></thead>
                <tbody>
                  <tr><td>Promotores CLT</td>
                    <td className="text-center"><input type="number" value={promQtd} min={1} onChange={e=>setPromQtd(+e.target.value)} className="input w-16 text-center"/></td>
                    <td className="text-center font-medium">{Math.round(hrsCLT).toLocaleString('pt-BR')}h</td></tr>
                  <tr><td>Promotores MEI</td>
                    <td className="text-center"><input type="number" value={meiQtd} min={0} onChange={e=>setMeiQtd(+e.target.value)} className="input w-16 text-center"/></td>
                    <td className="text-center font-medium">{Math.round(hrsMEI).toLocaleString('pt-BR')}h</td></tr>
                  <tr className="font-semibold bg-gray-50"><td>TOTAL</td><td className="text-center">{promQtd+meiQtd}</td><td className="text-center">{Math.round(hrsTotal).toLocaleString('pt-BR')}h</td></tr>
                </tbody>
              </table>
              <div className="flex gap-4 mt-3">
                <div><label className="text-xs text-gray-500">Horas/dia</label>
                  <input type="number" value={hrsDia} min={4} max={12} onChange={e=>setHrsDia(+e.target.value)} className="input w-16 text-center block mt-1"/></div>
                <div><label className="text-xs text-gray-500">Dias/semana</label>
                  <input type="number" value={diasSem} min={1} max={6} onChange={e=>setDiasSem(+e.target.value)} className="input w-16 text-center block mt-1"/></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">🏢 Custos Indiretos Mensais</div>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm text-gray-600 flex-1">Total Custos Indiretos</label>
                <input type="number" value={indireto} min={0} step={1000} onChange={e=>setIndireto(+e.target.value)} className="input w-36 text-right"/>
              </div>
              <p className="text-xs text-gray-400 mb-4">Pró-labore, salários adm., encargos e gastos gerais. Rateado pelas horas de cada marca.</p>
              <div className="p-3 bg-blue-50 rounded-lg mb-2">
                <div className="text-xs text-blue-700 mb-1">Custo indireto/hora</div>
                <div className="text-2xl font-semibold text-blue-800">{BRL(cIndHora)}/h</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Custo hora total</div>
                <div className="text-2xl font-semibold text-gray-800">{BRL(cHoraTot)}/h</div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-title">🧾 Gastos Operacionais Mensais</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {GASTOS_DEF.map(g=>(
                <div key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                  <label className="text-sm text-gray-600 flex-1">{g.label}</label>
                  <input type="number" value={gastos[g.id]??g.val} min={0} step={100}
                    onChange={e=>setGastos(prev=>({...prev,[g.id]:+e.target.value}))}
                    className="input w-36 text-right text-sm"/>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              {[{l:'Custo Operacional',v:custoOp,bg:'bg-red-50',t:'text-red-800'},
                {l:'Custos Indiretos',v:indireto,bg:'bg-yellow-50',t:'text-yellow-800'},
                {l:'Custo Total',v:custoTot,bg:'bg-orange-50',t:'text-orange-800'},
                {l:'Custo/hora (op.)',v:cHoraOp,bg:'bg-green-50',t:'text-green-800',s:'/h'},
                {l:'Custo/hora (total)',v:cHoraTot,bg:'bg-green-50',t:'text-green-800',s:'/h'},
              ].map(item=>(
                <div key={item.l} className={`flex-1 min-w-[140px] p-3 rounded-lg ${item.bg}`}>
                  <div className={`text-xs ${item.t} mb-1`}>{item.l}</div>
                  <div className={`text-lg font-bold ${item.t}`}>{BRL(item.v)}{item.s??''}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">📊 Custo por Marca</div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr>
                  <th>Marca</th><th className="text-right">Atend./mês</th><th className="text-right">Horas/mês</th>
                  <th className="text-right">CSV</th><th className="text-right">CSV/atend.</th>
                  <th className="text-right">Desp.Ind.</th><th className="text-right">Custo Total</th>
                  <th className="text-right">Custo/atend.</th><th className="text-right">Custo/hora</th>
                </tr></thead>
                <tbody>
                  {marcaRows.map(r=>(
                    <tr key={r.cod}>
                      <td><span className="brand-tag">{r.cod}</span> <span className="text-xs">{r.nome}</span></td>
                      <td className="text-right">{r.at.toLocaleString('pt-BR')}</td>
                      <td className="text-right">{r.hm.toLocaleString('pt-BR')}</td>
                      <td className="text-right">{BRL(r.csv)}</td>
                      <td className="text-right">{BRL(r.csv/r.at)}</td>
                      <td className="text-right">{BRL(r.di)}</td>
                      <td className="text-right font-semibold">{BRL(r.ct)}</td>
                      <td className="text-right font-semibold">{BRL(r.cpa)}</td>
                      <td className="text-right">{BRL(r.cph)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td>TOTAL</td>
                    <td className="text-right">{totalAt.toLocaleString('pt-BR')}</td>
                    <td className="text-right">{hrsM.toLocaleString('pt-BR')}</td>
                    <td className="text-right">{BRL(marcaRows.reduce((s,r)=>s+r.csv,0))}</td>
                    <td/>
                    <td className="text-right">{BRL(marcaRows.reduce((s,r)=>s+r.di,0))}</td>
                    <td className="text-right">{BRL(marcaRows.reduce((s,r)=>s+r.ct,0))}</td>
                    <td/><td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
