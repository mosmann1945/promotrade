'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {href:'/',          label:'Visão Geral',       icon:'▦'},
  {href:'/roteiros',  label:'Roteiros',           icon:'⇌'},
  {href:'/lojas',     label:'Lojas / Marcas',     icon:'🏪'},
  {href:'/carga',     label:'Carga de Trabalho',  icon:'◎'},
  {href:'/matriz',    label:'Matriz de Carga',    icon:'⊞'},
  {href:'/custos',    label:'Custos',             icon:'💰'},
  {href:'/precos',    label:'Preço de Venda',     icon:'🏷️'},
  {href:'/importar',  label:'Importar Dados',     icon:'↑'},
  {href:'/config',    label:'Parâmetros',         icon:'⚙'},
]

export default function Sidebar(){
  const path = usePathname()
  return(
    <aside className="w-56 min-h-screen bg-brand-900 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-white font-semibold text-base">Promotrade</div>
        <div className="text-white/40 text-xs mt-0.5">Gestão de Roteiros</div>
      </div>
      <nav className="flex-1 py-3 px-2">
        {nav.map(item=>{
          const active=path===item.href
          return(
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors
                ${active?'bg-white/15 text-white font-medium':'text-white/60 hover:text-white hover:bg-white/10'}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-white/30 text-xs">v1.0 · 761 lojas · 55 roteiros</div>
    </aside>
  )
}
