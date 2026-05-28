'use client'
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { importarCSVRoteiros } from '@/lib/importar'
import { supabase } from '@/lib/supabase'

type Log = { type:'ok'|'error'|'info'; msg:string }

export default function ImportarPage() {
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [log,      setLog]      = useState<Log[]>([])
  const [history,  setHistory]  = useState<any[]>([])
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory(){
    const { data } = await supabase.from('importacoes').select('*').order('created_at',{ascending:false}).limit(10)
    setHistory(data??[])
  }

  function addLog(type:Log['type'], msg:string){ setLog(prev=>[...prev,{type,msg}]) }

  async function handleFile(file:File){
    if(!file.name.match(/\.csv$/i)){ addLog('error','Use arquivo .CSV'); return }
    setLoading(true); addLog('info',`Importando ${file.name}...`)
    try {
      const result = await importarCSVRoteiros(file)
      if(result.ok) addLog('ok',`✅ ${result.inseridos} lojas importadas!`)
      result.log.forEach(l=>addLog('info',l))
      result.erros.forEach(e=>addLog('error',e))
      loadHistory()
    } catch(e:any){ addLog('error',`Erro: ${e.message}`) }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold mb-1">Importar Dados</h1>
          <p className="text-sm text-gray-400 mb-6">Atualize roteiros e lojas com arquivo CSV padronizado</p>

          <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f)}}
            onClick={()=>ref.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
              ${dragging?'border-blue-400 bg-blue-50':'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
            <div className="text-4xl mb-3">📄</div>
            <div className="font-medium text-gray-700 mb-1">{loading?'Importando...':'Arraste o CSV ou clique para selecionar'}</div>
            <div className="text-sm text-gray-400">Arquivo .CSV — mesmo formato do Roteiros.csv</div>
            <input ref={ref} type="file" accept=".csv" className="hidden" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0])}} />
          </div>

          <div className="card mt-5">
            <div className="card-title">📋 Colunas esperadas no CSV</div>
            <table className="tbl">
              <thead><tr><th>Coluna</th><th>Obrigatório</th><th>Exemplo</th></tr></thead>
              <tbody>
                {[['ROT','✅','1'],['CIDADE','✅','Porto Alegre'],['LOJA','✅','ZAFFARI - 6 BORDINI'],['NOME REDE','—','Zaffari'],['CNPJ','—','93.015.006/0020-86'],['ENDEREÇO','—','R. Cel.Bordini, 530'],['Seg/Ter/Qua/Qui/Sex/Sab','—','X1 (qualquer valor = ativo)'],['MOS, AST, FLO... (22 marcas)','—','valor não vazio = atendida']].map(([c,r,e])=>(
                  <tr key={c}><td className="font-mono">{c}</td><td>{r}</td><td className="text-gray-500">{e}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {log.length>0 && (
            <div className="card mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="card-title mb-0">📝 Log</div>
                <button onClick={()=>setLog([])} className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {log.map((e,i)=>(
                  <div key={i} className={`text-xs px-3 py-1.5 rounded font-mono
                    ${e.type==='ok'?'bg-green-50 text-green-800':e.type==='error'?'bg-red-50 text-red-800':'bg-gray-50 text-gray-600'}`}>
                    {e.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length>0 && (
            <div className="card mt-4">
              <div className="card-title">🕑 Últimas importações</div>
              <table className="tbl">
                <thead><tr><th>Data</th><th>Arquivo</th><th>Registros</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map(h=>(
                    <tr key={h.id}>
                      <td className="text-gray-500 whitespace-nowrap">{new Date(h.created_at).toLocaleString('pt-BR')}</td>
                      <td className="font-mono text-xs">{h.arquivo}</td>
                      <td className="text-center">{h.registros}</td>
                      <td><span className={`badge ${h.status==='ok'?'badge-ok':h.status==='parcial'?'badge-warn':'badge-alert'}`}>{h.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
