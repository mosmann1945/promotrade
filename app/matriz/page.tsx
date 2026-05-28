'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase, calcularCargaRoteiro, diasVisita, type Roteiro, type Loja, type Marca, type Parametro } from '@/lib/supabase'

export default function MatrizPage() {
  const [matrix,  setMatrix]  = useState<any[]>([])
  const [marcas,  setMarcas]  = useState<Marca[]>([])
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
    setParams(p); setMarcas(marcasDB??[])
    const hrsTotal=(marcasDB??[]).reduce((s:number,m:Marca)=>s,0) // calc below

    setMatrix((rotDB??[]).map((rot:Roteiro)=>{
      const lojas=(lojasDB??[]).filter((l:Loja)=>l.roteiro_id===rot.id)
      const carga=calcularCargaRoteiro(lojas,marcasDB??[],p)
      const cidades=[...new Set(lojas.map((l:Loja)=>l.cidade).filter(Boolean))]
      const hrsPerMarca:Record<number,number>={}
      ;(marcasDB??[]).forEach((m:Marca)=>{ hrsPerMarca[m.id]=0 })
      lojas.forEach((loja:Loja)=>{
        const vis=diasVisita(loja)
        ;(loja.loja_marcas??[]).forEach((lm:any)=>{
          const tempo=lm.tempo_min??(marcasDB??[]).find((m:Marca)=>m.id===lm.marca_id)?.tempo_padrao_min??10
          hrsPerMarca[lm.marca_id]=(hrsPerMarca[lm.marca_id]??0)+vis*tempo/60
        })
      })
      const totalMarcasHrs=Object.values(hrsPerMarca).reduce((s:number,v:number)=>s+v,0)
      const deslocHrs=carga.totalVisitas*p.deslocMin/60
      return {...rot,lojas,carga,cidades,hrsPerMarca,totalMarcasHrs,deslocHrs}
    }))
    setLoading(false)
  }

  function efColor(pct:number){ return pct>100?{bg:'#FCEBEB',fg:'#A32D2D'}:pct>=params.limiteAlerta?{bg:'#FAEEDA',fg:'#BA7517'}:{bg:'#EAF3DE',fg:'#27500A'} }
  function cellBg(hrs:number){ if(hrs<=0) return null; const i=Math.min(hrs/4,1); return `rgba(55,138,221,${(i*0.55+0.08).toFixed(2)})` }

  const totaisMarca:Record<number,number>={}
  marcas.forEach(m=>{ totaisMarca[m.id]=matrix.reduce((s,r)=>s+(r.hrsPerMarca[m.id]??0),0) })
  const totalGeral=matrix.reduce((s,r)=>s+r.totalMarcasHrs+r.deslocHrs,0)

  function exportCSV(){
    const header=['Roteiro','Cidades',...marcas.map(m=>m.nome),'Desloc.(h)','Total Marcas(h)','Total Geral(h)','Capac.(h)','Efic.%']
    const rows=matrix.map(r=>[`Roteiro ${r.numero}`,r.cidades.join(', '),...marcas.map(m=>(r.hrsPerMarca[m.id]??0).toFixed(2)),r.deslocHrs.toFixed(2),r.totalMarcasHrs.toFixed(2),(r.totalMarcasHrs+r.deslocHrs).toFixed(2),(r.carga.capacidadeMin/60).toFixed(0),r.carga.pct+'%'])
    const csv=[header,...rows].map(r=>r.join(';')).join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
    a.download=`matriz_carga_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const th='background:#1B2A4A;color:#fff;fontSize:10px;padding:6px 5px;textAlign:center;whiteSpace:nowrap;borderRight:1px solid #2E4A7A'
  const thFirst='background:#1B2A4A;color:#fff;fontSize:10px;padding:6px 10px;textAlign:left;whiteSpace:nowrap;borderRight:2px solid #2E4A7A;position:sticky;top:0;left:0;zIndex:3;minWidth:100px'

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-full">
          <div className="flex items-center justify-between mb-5">
            <div><h1 className="text-xl font-semibold">Matriz de Carga</h1>
              <p className="text-sm text-gray-400">Horas/semana por roteiro × marca</p></div>
            <div className="flex gap-2">
              <button onClick={load} className="btn btn-secondary">↺</button>
              <button onClick={exportCSV} className="btn btn-secondary">↓ CSV</button>
            </div>
          </div>
          {loading ? <div className="text-gray-400 text-sm py-8 text-center">Carregando...</div> : (
            <>
              <div className="overflow-auto rounded-xl border border-gray-200 shadow-sm" style={{maxHeight:'75vh'}}>
                <table style={{borderCollapse:'collapse',minWidth:'100%',fontSize:11}}>
                  <thead>
                    <tr>
                      <th style={{...Object.fromEntries(thFirst.split(';').map(s=>s.trim().split(':').map(x=>x.trim()))),position:'sticky',top:0,zIndex:3} as any}>Roteiro</th>
                      {marcas.map(m=>(
                        <th key={m.id} title={m.nome} style={{background:'#1B2A4A',color:'#fff',fontSize:10,padding:'6px 4px',textAlign:'center',whiteSpace:'nowrap',borderRight:'1px solid #2E4A7A',position:'sticky',top:0,zIndex:2,minWidth:52}}>
                          {m.codigo}<br/><span style={{fontWeight:300,fontSize:9,opacity:.7}}>{m.nome.split(' ')[0]}</span>
                        </th>
                      ))}
                      {['Desloc.','Marcas(h)','Total(h)','Capac.','Efic.%'].map(lbl=>(
                        <th key={lbl} style={{background:'#1B2A4A',color:'#fff',fontSize:10,padding:'6px 7px',textAlign:'center',whiteSpace:'nowrap',borderRight:'1px solid #2E4A7A',position:'sticky',top:0,zIndex:2}}>{lbl}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row,i)=>{
                      const bg=i%2===0?'#fff':'#fafaf8'
                      const ef=efColor(row.carga.pct)
                      return(
                        <tr key={row.id}>
                          <td style={{position:'sticky',left:0,background:bg,fontWeight:600,padding:'5px 10px',borderRight:'2px solid #e0e0e0',zIndex:1,whiteSpace:'nowrap'}}>
                            Rot. {row.numero} <span style={{fontWeight:400,color:'#888',fontSize:10}}>{row.cidades[0]}</span>
                          </td>
                          {marcas.map(m=>{
                            const v=row.hrsPerMarca[m.id]??0
                            const cb=cellBg(v)
                            return <td key={m.id} style={{textAlign:'center',padding:'4px',background:cb??bg,color:cb?(v>2?'#fff':'#1B2A4A'):'#bbb',borderRight:'1px solid #eee'}}>{v>0?v.toFixed(1):'—'}</td>
                          })}
                          <td style={{textAlign:'center',padding:'4px 7px',color:'#888',borderRight:'1px solid #e0e0e0'}}>{row.deslocHrs.toFixed(1)}</td>
                          <td style={{textAlign:'center',padding:'4px 7px',fontWeight:500,borderRight:'1px solid #e0e0e0'}}>{row.totalMarcasHrs.toFixed(1)}</td>
                          <td style={{textAlign:'center',padding:'4px 7px',fontWeight:700,borderRight:'1px solid #e0e0e0'}}>{(row.totalMarcasHrs+row.deslocHrs).toFixed(1)}</td>
                          <td style={{textAlign:'center',padding:'4px 7px',color:'#888',borderRight:'1px solid #e0e0e0'}}>{(row.carga.capacidadeMin/60).toFixed(0)}</td>
                          <td style={{textAlign:'center',padding:'4px 9px',fontWeight:700,background:ef.bg,color:ef.fg,borderRadius:4}}>{row.carga.pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:'2px solid #1B2A4A'}}>
                      <td style={{position:'sticky',left:0,background:'#f0f0f0',fontWeight:700,padding:'6px 10px',borderRight:'2px solid #ccc',zIndex:1}}>TOTAL</td>
                      {marcas.map(m=><td key={m.id} style={{textAlign:'center',fontWeight:600,padding:'5px 4px',background:'#f0f0f0',borderRight:'1px solid #ddd'}}>{totaisMarca[m.id]>0?totaisMarca[m.id].toFixed(1):'—'}</td>)}
                      <td style={{background:'#f0f0f0',borderRight:'1px solid #ccc'}}/>
                      <td style={{background:'#f0f0f0',borderRight:'1px solid #ccc'}}/>
                      <td style={{textAlign:'center',fontWeight:700,background:'#f0f0f0',borderRight:'1px solid #ccc'}}>{totalGeral.toFixed(1)}</td>
                      <td style={{background:'#f0f0f0',borderRight:'1px solid #ccc'}}/>
                      <td style={{background:'#f0f0f0'}}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex gap-4 flex-wrap mt-3 text-xs text-gray-500 items-center">
                <span>Cor azul = mais horas dedicadas</span>
                {[['#EAF3DE','#27500A','Normal'],['#FAEEDA','#BA7517','Atenção'],['#FCEBEB','#A32D2D','Sobrecarregado']].map(([bg,fg,lbl])=>(
                  <span key={lbl} style={{background:bg,color:fg,padding:'1px 8px',borderRadius:4,fontWeight:600}}>{lbl}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
