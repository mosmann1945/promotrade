import Papa from 'papaparse'
import { supabase } from './supabase'

const MARCAS_COLS = ['MOS','AST','FLO','XIM','WEB','FIL','SAK','BRA','ODA','AVA','CRIS','COT','ARB','REG','DSA','LAF','MAR','PBC','TUT','ESS','FFKR','JHN']

function inferRede(nome:string):string {
  const n = nome.toUpperCase()
  for(const r of ['ZAFFARI','BOURBON','ATACADÃO','ASUN','CESTTO','GAUCHÃO','CARREFOUR','BIG','CENTER SHOP','HOFFMANN','GECEPEL','ANDREAZZA','PERUZZO','BISTEK','COMETA','CONDOR','ANGELONI'])
    if(n.includes(r)) return r.charAt(0)+r.slice(1).toLowerCase()
  return 'Outros'
}

export type ImportResult = { ok:boolean; inseridos:number; erros:string[]; log:string[] }

export async function importarCSVRoteiros(file:File):Promise<ImportResult> {
  const result:ImportResult = { ok:false, inseridos:0, erros:[], log:[] }
  const text = await file.text()
  const { data, errors } = Papa.parse(text,{ header:true, skipEmptyLines:true, delimitersToGuess:[';',',','\t'] })
  if(errors.length){ result.erros.push(`Erro: ${errors[0].message}`); return result }

  const { data:marcasDB } = await supabase.from('marcas').select('*').order('ordem')
  if(!marcasDB){ result.erros.push('Erro ao buscar marcas'); return result }
  const marcaMap = Object.fromEntries(marcasDB.map(m=>[m.codigo,m.id]))

  const rows = data as Record<string,string>[]
  const rotNums = Array.from(
  new Set(
    rows
      .map(r => parseInt(r['ROT'] ?? ''))
      .filter(n => !isNaN(n))
  )
)

  for(const num of rotNums)
    await supabase.from('roteiros').upsert({numero:num,descricao:`Roteiro ${num}`,ativo:true},{onConflict:'numero'})

  const { data:rotDB } = await supabase.from('roteiros').select('id,numero')
  const rotMap = Object.fromEntries((rotDB??[]).map(r=>[r.numero,r.id]))

  for(const row of rows){
    const rotNum = parseInt(row['ROT']??'')
    if(isNaN(rotNum)) continue
    const nome = (row['LOJA']??'').trim()
    if(!nome) continue
    const roteiroId = rotMap[rotNum]
    if(!roteiroId) continue

    const lojaData = {
      roteiro_id: roteiroId, nome,
      rede:      (row['NOME REDE']??'').trim() || inferRede(nome),
      cidade:    (row['CIDADE']??'').trim(),
      endereco:  (row['ENDEREÇO']??row['ENDERECO']??'').trim(),
      cnpj:      (row['CNPJ']??'').trim(),
      seg: !!(row['Seg']??'').trim(), ter: !!(row['Ter']??'').trim(),
      qua: !!(row['Qua']??'').trim(), qui: !!(row['Qui']??'').trim(),
      sex: !!(row['Sex']??'').trim(), sab: !!(row['Sab']??'').trim(),
      ativa: true,
    }

    const { data:lojaDB, error } = await supabase.from('lojas')
      .upsert(lojaData,{onConflict:'roteiro_id,nome'}).select('id').single()
    if(error||!lojaDB){ result.erros.push(`Erro loja ${nome}: ${error?.message}`); continue }

    const marcasCols = MARCAS_COLS.filter(m=>(row[m]??'').trim()!=='')
    if(marcasCols.length>0)
      await supabase.from('loja_marcas').upsert(
        marcasCols.filter(m=>marcaMap[m]).map(m=>({loja_id:lojaDB.id,marca_id:marcaMap[m],tempo_min:null})),
        {onConflict:'loja_id,marca_id'}
      )
    result.inseridos++
  }

  await supabase.from('importacoes').insert({arquivo:file.name,tipo:'roteiros',registros:result.inseridos,status:result.erros.length?'parcial':'ok',detalhes:result.erros.join('\n')||null})
  result.ok=true
  result.log.push(`${result.inseridos} lojas processadas em ${rotNums.length} roteiros`)
  return result
}
