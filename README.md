# 🚀 Promotrade — Guia de Instalação

## Pré-requisitos (tudo gratuito)
| Ferramenta | Link |
|---|---|
| Node.js | https://nodejs.org |
| Supabase (banco) | https://supabase.com |
| Vercel (hospedagem) | https://vercel.com |
| GitHub (código) | https://github.com |

---

## PASSO 1 — Banco de dados (Supabase)
1. Crie conta em supabase.com → **New Project**
2. Vá em **SQL Editor** → cole o conteúdo de `supabase/migrations/001_schema.sql` → **Run**
3. Em **Settings > API** copie a **Project URL** e a **anon public key**

---

## PASSO 2 — Configurar o projeto
```bash
cd promotrade
npm install
cp .env.local.example .env.local
```
Edite `.env.local` com suas credenciais do Supabase.

---

## PASSO 3 — Rodar localmente
```bash
npm run dev
# Abrir: http://localhost:3000
```

---

## PASSO 4 — Importar dados
1. Acesse **Importar Dados** no menu
2. Arraste o arquivo `Roteiros.csv`
3. Confirme na aba **Lojas / Marcas**

---

## PASSO 5 — Publicar na internet (Vercel)
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/SEU_USUARIO/promotrade.git
git push -u origin main
```
1. Acesse vercel.com → **Add New Project** → selecione o repositório
2. Adicione as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. **Deploy** — em 2 minutos estará em `https://promotrade.vercel.app`

---

## Estrutura
```
promotrade/
├── app/
│   ├── page.tsx          ← Dashboard
│   ├── roteiros/         ← Roteiros + edição de lojas
│   ├── lojas/            ← Busca e filtros
│   ├── carga/            ← Carga de trabalho
│   ├── matriz/           ← Matriz horas × marca
│   ├── custos/           ← Estrutura de custos
│   ├── precos/           ← Precificação + DRE
│   ├── importar/         ← Upload CSV
│   └── config/           ← Parâmetros
├── components/
│   ├── Sidebar.tsx
│   └── ui.tsx
├── lib/
│   ├── supabase.ts       ← Conexão + tipos
│   └── importar.ts       ← Lógica CSV
└── supabase/migrations/
    └── 001_schema.sql
```

## Alterações com Claude Code
Com o Claude Code instalado, abra a pasta do projeto e peça em português:
> "Adiciona uma coluna de telefone nas lojas"
> "Cria uma página de relatório mensal"
> "Exporta a matriz em Excel"
