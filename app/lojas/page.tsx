'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { DayPills, MarcaTags } from '@/components/ui'
import { supabase, diasVisita, type Marca } from '@/lib/supabase'

const PAGE_SIZE = 50

export default function LojasPage() {
  const [lojas,    setLojas]    = useState<any[]>([])
  const [marcas,   setMarcas]   = useState<Marca[]>([])
  const [roteiros, setRoteiros] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [selRot,   setSelRot]   = useState('')
  const [selCidade,setSelCidade]= useState('')
  const [selRede,  setSelRede]  = useState('')
  const [selMarca, setSelMarca] = useState('')
  const [page,     setPage]     = useState(1)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: lojasDB }, { data: marcasDB }, { data: rotDB }] = await Promise.all([
      supabase.from('lojas').select('*, roteiros(numero), loja_marcas(*, marcas(*))').eq('ativa',true).order('nome'),
      supabase.from('marcas').select('*').eq('ativa',true).order('ordem'),
      supabase.from('roteiros').select('*').eq('ativo',true).order('numero'),
    ])
    setLojas(lojasDB??[]); setMarcas(marcasDB??[]); setRoteiros(rotDB??[])
    setLoading(false)
  }

  const cidades = [...new Set(lojas.map(l=>l.cidade).filter(Boolean))].sort() as string[]
  const redes   = [...new Set(lojas.map(l=>l.rede).filter(Boolean))].sort() as string[]

  let filtered = lojas
  if(search)    filtered = filtered.filter(l=>l.nome.toLowerCase().includes(search.toLowerCase())||(l.endereco??'').toLowerCase().includes(search.toLowerCase()))
  if(selRot)    filtered = filtered.filter(l=>l.roteiros?.numero===+selRot)
  if(selCidade) filtered = filtered.filter(l=>l.cidade===selCidade)
  if(selRede)   filtered = filtered.filter(l=>l.rede===selRede)
  if(selMarca)  filtered = filtered.filter(l=>(l.loja_marcas??[]).some((lm:any)=>lm.marcas?.codigo===selMarca))

  const pages  = Math.ceil(filtered.length/PAGE_SIZE)
  const sliced = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-full">
          <div className="flex items-center justify-between mb-5">
            <div><h1 className="text-xl font-semibold">Lojas / Marcas</h1>
              <p className="text-sm text-gray-400">{lojas.length} lojas cadastradas</p></div>
            <button onClick={load} className="btn btn-secondary">↺ Atualizar</button>
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            <input className="input" style={{width:220}} placeholder="Buscar loja ou endereço..."
              value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} />
            <select className="input" value={selRot} onChange={e=>{setSelRot(e.target.value);setPage(1)}}>
              <option value="">Todos os roteiros</option>
              {roteiros.map(r=><option key={r.id} value={r.numero}>Roteiro {r.numero}</option>)}
            </select>
            <select className="input" value={selCidade} onChange={e=>{setSelCidade(e.target.value);setPage(1)}}>
              <option value="">Todas as cidades</option>
              {cidades.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={selRede} onChange={e=>{setSelRede(e.target.value);setPage(1)}}>
              <option value="">Todas as redes</option>
              {redes.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <select className="input" value={selMarca} onChange={e=>{setSelMarca(e.target.value);setPage(1)}}>
              <option value="">Todas as marcas</option>
              {marcas.map(m=><option key={m.id} value={m.codigo}>{m.codigo} — {m.nome}</option>)}
            </select>
          </div>
          <div className="text-xs text-gray-400 mb-3">{filtered.length} resultado(s) — pág. {page}/{pages||1}</div>
          {loading ? <div className="text-gray-400 text-sm py-8 text-center">Carregando...</div> : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="tbl">
                <thead><tr>
                  <th>Rot.</th><th>Loja</th><th>Rede</th><th>Cidade</th>
                  {['Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><th key={d} className="text-center">{d}</th>)}
                  <th>Vis/sem</th><th>Marcas</th>
                </tr></thead>
                <tbody>
                  {sliced.map(loja=>{
                    const lojaMarcas=(loja.loja_marcas??[]).map((lm:any)=>lm.marcas).filter(Boolean)
                    return(
                      <tr key={loja.id}>
                        <td><span className="badge badge-gray">{loja.roteiros?.numero}</span></td>
                        <td className="font-medium max-w-[180px] truncate">{loja.nome}</td>
                        <td><span className="badge badge-blue">{loja.rede||'—'}</span></td>
                        <td className="text-gray-500 text-xs whitespace-nowrap">{loja.cidade}</td>
                        {['seg','ter','qua','qui','sex','sab'].map(d=>(
                          <td key={d} className="text-center"><span className={loja[d]?'day-on':'day-off'}>{loja[d]?'S':'—'}</span></td>
                        ))}
                        <td className="text-center font-medium">{diasVisita(loja)}×</td>
                        <td><MarcaTags marcas={lojaMarcas} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pages>1 && (
            <div className="flex gap-2 items-center mt-3 flex-wrap">
              {page>1 && <button onClick={()=>setPage(p=>p-1)} className="btn btn-secondary">‹</button>}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{
                const p=Math.max(1,page-2)+i; if(p>pages) return null
                return <button key={p} onClick={()=>setPage(p)} className={`btn ${p===page?'btn-primary':'btn-secondary'}`}>{p}</button>
              })}
              {page<pages && <button onClick={()=>setPage(p=>p+1)} className="btn btn-secondary">›</button>}
              <span className="text-xs text-gray-400">{filtered.length} resultados</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
