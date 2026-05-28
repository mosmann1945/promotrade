'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
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
  receita:   {MOS:95838.68,AST:104086.63,FLO:64736.62,XIM:25127.47,WEB:5483.09,FIL:10582.64,SAK:30071.42,BRA:1219.00,ODA:4386.63,AVA:6425.76,CRIS:3661.82,COT:11115.00,ARB:3031.60,REG:900.00,DSA:18469.44,LAF:2800.00,MAR:3264.80,PBC:1906.23,TUT:3810.00,ESS:1733.33,FFKR:1509.00,JHN:541.67} as Record<string,number>,
  csv:       {MOS:94691.36,AST:124400.55,FLO:45435.49,XIM:26185.98,WEB:7667.89,FIL:6469.87,SAK:10834.90,BRA:3813.28,ODA:4583.53,AVA:4101.05,CRIS:3658.98,COT:10830.00,ARB:1377.63,REG:176.34,DSA:18645.14,LAF:6700.79,MAR:4350.86,PBC:2483.41,TUT:9061.74,ESS:2049.91,FFKR:12784.40,JHN:1300.48} as Record<string,number>,
  desp_ind:  {MOS:9482.15,AST:10298.20,FLO:6404.96,XIM:2486.08,WEB:542.49,FIL:1047.03,SAK:2975.23,BRA:120.61,ODA:434.01,AVA:635.76,CRIS:362.30,COT:1099.70,ARB:299.94,REG:89.04,DSA:1827.34,LAF:277.03,MAR:323.02,PBC:188.60,TUT:376.96,ESS:171.49,FFKR:149.30,JHN:53.59} as Record<string,number>,
  deducoes:  {MOS:13177.82,AST:14311.91,FLO:8901.29,XIM:3455.03,WEB:753.92,FIL:1455.11,SAK:4134.82,BRA:167.61,ODA:603.16,AVA:883.54,CRIS:503.50,COT:1528.31,ARB:416.85,REG:123.75,DSA:2539.55,LAF:385.00,MAR:448.91,PBC:262.11,TUT:523.88,ESS:238.33,FFKR:207.49,JHN:74.48} as Record<string,number>,
  atend:     {MOS:4660,AST:4660,FLO:2532,XIM:1716,WEB:1452,FIL:1072,SAK:1264,BRA:692,ODA:788,AVA:788,CRIS:332,COT:704,ARB:300,REG:8,DSA:1324,LAF:304,MAR:836,PBC:624,TUT:800,ESS:372,FFKR:580,JHN:236} as Record<string,number>,
  horas:     {MOS:4296,AST:5644,FLO:2061,XIM:1188,WEB:348,FIL:294,SAK:492,BRA:173,ODA:208,AVA:186,CRIS:166,COT:491,ARB:63,REG:8,DSA:846,LAF:304,MAR:197,PBC:113,TUT:411,ESS:93,FFKR:580,JHN:59} as Record<string,number>,
  preco_atual:{MOS:82.26,AST:89.34,FLO:102.27,XIM:58.57,WEB:15.10,FIL:39.49,SAK:95.16,BRA:7.05,ODA:22.27,AVA:32.62,CRIS:44.12,COT:63.15,ARB:40.42,REG:450.00,DSA:55.80,LAF:36.84,MAR:15.62,PBC:12.22,TUT:19.05,ESS:18.64,FFKR:10.41,JHN:9.18} as Record<string,number>,
}

const MARGENS_FIXED = [10, 15, 20]

export default function PrecosPage() {
  const [deducoes,  setDeducoes]  = useState(13.75)
  const [despInd,   setDespInd]   = useState(9.89)
  const [margem,    setMargem]    = useState(10)
  const [indireto,  setIndireto]  = useState(50000)
  const [showAtual, setShowAtual] = useState(true)
  const [showCustom,setShowCustom]= useState(false)
  const [margens,   setMargens]   = useState([true, true, true])
  const [aba,       setAba]       = useState<'precificacao'|'dre'>('precificacao')

  useEffect(() => { loadIndireto() }, [])
  async function loadIndireto(){
    const { data } = await supabase.from('parametros').select('valor').eq('chave','custos_equipe').single()
    if(data){ try { const v=JSON.parse(data.valor); if(v.indireto) setIndireto(v.indireto) } catch{} }
  }

  const divisor = 1 - deducoes/100 - despInd/100 - margem/100

  function calcPreco(custoVisita:number, m:number){
    const d = 1 - deducoes/100 - despInd/100 - m/100
    return d > 0 ? custoVisita / d : 0
  }

  const hrsM = Object.values(FIN.horas).reduce((a,b)=>a+b,0)

  const rows = MARCAS_INFO.map(([cod,nome])=>{
    const csv   = FIN.csv[cod]||0
    const hm    = FIN.horas[cod]||0
    const at    = FIN.atend[cod]||1
    const di    = hrsM > 0 ? indireto*(hm/hrsM) : 0
    const ct    = csv+di
    const custo = ct/at
    const atual = FIN.preco_atual[cod]||0
    const result= atual - custo
    return { cod, nome, at, custo, atual, result,
      sugeridos: MARGENS_FIXED.map(m=>calcPreco(custo,m)),
      custom: calcPreco(custo, margem) }
  })

  // DRE
  const dreRows = [
    { label:'Receita Bruta',     key:'receita',  bold:true,  bg:'#EBF3FB', neg:false },
    { label:'(−) Deduções',      key:'deducoes', bold:false, bg:'#fff',    neg:true  },
    { label:'Receita Líquida',   key:null,       bold:true,  bg:'#EAF3DE', neg:false, calc:(c:string)=>FIN.receita[c]-FIN.deducoes[c] },
    { label:'(−) CSV',           key:'csv',      bold:false, bg:'#fff',    neg:true  },
    { label:'Lucro Bruto',       key:null,       bold:true,  bg:'#FAEEDA', neg:false, calc:(c:string)=>FIN.receita[c]-FIN.deducoes[c]-FIN.csv[c] },
    { label:'(−) Desp. Indiretas',key:'desp_ind',bold:false, bg:'#fff',    neg:true  },
    { label:'Resultado Operac.', key:null,       bold:true,  bg:'#FCEBEB', neg:false, calc:(c:string)=>FIN.receita[c]-FIN.deducoes[c]-FIN.csv[c]-FIN.desp_ind[c] },
  ]

  function dreVal(row:any, cod:string){ return row.calc ? row.calc(cod) : (FIN[row.key as keyof typeof FIN] as Record<string,number>)?.[cod]||0 }
  function dreTotal(row:any){ return MARCAS_INFO.reduce((s,[c])=>s+dreVal(row,c),0) }

  function exportPrecos(){
    const header = ['Marca','Nome','Atend./mês','Custo/visita','Preço Atual','Resultado Atual',...MARGENS_FIXED.map(m=>`Sugerido ${m}%`),`Personalizado ${margem}%`]
    const data = rows.map(r=>[r.cod,r.nome,r.at,r.custo.toFixed(2),r.atual.toFixed(2),r.result.toFixed(2),...r.sugeridos.map(v=>v.toFixed(2)),r.custom.toFixed(2)])
    const csv = [header,...data].map(r=>r.join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
    a.download = `precificacao_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-full">
          <div className="flex items-center justify-between mb-5">
            <div><h1 className="text-xl font-semibold">Preço de Venda</h1>
              <p className="text-sm text-gray-400">Precificação por markup e DRE por marca</p></div>
            <button onClick={exportPrecos} className="btn btn-secondary">↓ Exportar CSV</button>
          </div>

          {/* Parâmetros */}
          <div className="card mb-4">
            <div className="card-title">⚙️ Parâmetros de Precificação</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Deduções sobre receita (%)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={deducoes} min={0} max={30} step={0.1}
                    onChange={e=>setDeducoes(+e.target.value)} className="input w-24 text-center"/>
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">PIS, COFINS, ISS etc.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Despesas Indiretas (%)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={despInd} min={0} max={30} step={0.1}
                    onChange={e=>setDespInd(+e.target.value)} className="input w-24 text-center"/>
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Overhead administrativo</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Margem desejada (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={40} step={1} value={margem}
                    onChange={e=>setMargem(+e.target.value)} className="flex-1"/>
                  <input type="number" value={margem} min={0} max={40} step={1}
                    onChange={e=>setMargem(+e.target.value)} className="input w-16 text-center"/>
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
              <div className="p-3 bg-brand-900 rounded-xl text-white">
                <div className="text-xs opacity-70 mb-1">Markup divisor</div>
                <div className="text-3xl font-bold">{divisor > 0 ? divisor.toFixed(4) : '⚠️'}</div>
                <div className="text-xs opacity-50 mt-1">1 − (ded + despind + margem)</div>
              </div>
            </div>
          </div>

          {/* Sub-abas */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {([['precificacao','💰 Precificação'],['dre','📊 DRE por Marca']] as const).map(([id,lbl])=>(
              <button key={id} onClick={()=>setAba(id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${aba===id?'border-brand-900 text-brand-900':'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {lbl}
              </button>
            ))}
          </div>

          {aba === 'precificacao' && (
            <>
              {/* Filtros de colunas */}
              <div className="flex gap-3 items-center flex-wrap mb-3">
                <span className="text-xs text-gray-500">Mostrar colunas:</span>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={showAtual} onChange={e=>setShowAtual(e.target.checked)}/> Preço Atual
                </label>
                {MARGENS_FIXED.map((m,i)=>(
                  <label key={m} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={margens[i]} onChange={e=>setMargens(prev=>{const n=[...prev];n[i]=e.target.checked;return n})}/> {m}%
                  </label>
                ))}
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={showCustom} onChange={e=>setShowCustom(e.target.checked)}/> Personalizado ({margem}%)
                </label>
              </div>

              <div className="card overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Marca</th>
                      <th className="text-right">Atend./mês</th>
                      <th className="text-right">Custo/visita</th>
                      {showAtual && <th className="text-right">Preço Atual</th>}
                      {MARGENS_FIXED.map((m,i)=>margens[i]&&<th key={m} className="text-right bg-blue-50">Sugerido {m}%</th>)}
                      {showCustom && <th className="text-right bg-yellow-50">Personalizado {margem}%</th>}
                      <th className="text-right">Resultado Atual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r=>{
                      const resClr = r.result>=0 ? 'text-green-700' : 'text-red-700'
                      return (
                        <tr key={r.cod}>
                          <td><span className="brand-tag">{r.cod}</span> <span className="text-xs">{r.nome}</span></td>
                          <td className="text-right">{r.at.toLocaleString('pt-BR')}</td>
                          <td className="text-right font-medium">{BRL(r.custo)}</td>
                          {showAtual && <td className="text-right">{BRL(r.atual)}</td>}
                          {MARGENS_FIXED.map((m,i)=>margens[i]&&(
                            <td key={m} className="text-right bg-blue-50">
                              <span className={r.sugeridos[i]>r.atual?'text-green-700 font-semibold':'text-red-700 font-semibold'}>
                                {BRL(r.sugeridos[i])} {r.sugeridos[i]>r.atual?'▲':'▼'}
                              </span>
                            </td>
                          ))}
                          {showCustom && (
                            <td className="text-right bg-yellow-50">
                              <span className={r.custom>r.atual?'text-green-700 font-semibold':'text-red-700 font-semibold'}>
                                {BRL(r.custom)} {r.custom>r.atual?'▲':'▼'}
                              </span>
                            </td>
                          )}
                          <td className={`text-right font-bold ${resClr}`}>{BRL(r.result)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">🟢 Preço sugerido acima do atual · 🔴 Preço sugerido abaixo do atual</p>
              </div>
            </>
          )}

          {aba === 'dre' && (
            <div className="overflow-auto rounded-xl border border-gray-200 bg-white" style={{maxHeight:'70vh'}}>
              <table style={{borderCollapse:'collapse',minWidth:'100%',fontSize:11}}>
                <thead>
                  <tr>
                    <th style={{position:'sticky',top:0,left:0,zIndex:3,background:'#1B2A4A',color:'#fff',padding:'7px 12px',textAlign:'left',whiteSpace:'nowrap',borderRight:'2px solid #2E4A7A',minWidth:160}}>Linha DRE</th>
                    <th style={{position:'sticky',top:0,zIndex:2,background:'#1B2A4A',color:'#fff',padding:'7px 10px',textAlign:'right',whiteSpace:'nowrap',borderRight:'1px solid #2E4A7A'}}>TOTAL</th>
                    {MARCAS_INFO.map(([cod,nome])=>(
                      <th key={cod} title={nome} style={{position:'sticky',top:0,zIndex:2,background:'#1B2A4A',color:'#fff',padding:'7px 5px',textAlign:'center',whiteSpace:'nowrap',borderRight:'1px solid #2E4A7A',minWidth:80}}>
                        {cod}<br/><span style={{fontWeight:300,fontSize:9,opacity:.7}}>{nome.split(' ')[0]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dreRows.map((row,i)=>{
                    const total = dreTotal(row)
                    const totClr = row.calc ? (total>=0?'#27500A':'#A32D2D') : '#333'
                    return (
                      <tr key={i} style={{background:row.bg}}>
                        <td style={{position:'sticky',left:0,background:row.bg,fontWeight:row.bold?700:400,padding:'5px 12px',borderRight:'2px solid #ddd',fontSize:12,whiteSpace:'nowrap',zIndex:1}}>
                          {row.label}
                        </td>
                        <td style={{textAlign:'right',padding:'5px 10px',fontWeight:700,color:totClr,borderRight:'1px solid #ccc'}}>
                          {BRL(total)}
                        </td>
                        {MARCAS_INFO.map(([cod])=>{
                          const v = dreVal(row,cod)
                          const clr = row.calc ? (v>=0?'#27500A':'#A32D2D') : '#333'
                          return (
                            <td key={cod} style={{textAlign:'right',padding:'5px 6px',color:clr,fontWeight:row.bold?600:400,borderRight:'1px solid #eee'}}>
                              {BRL(v)}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
