# JARVIS Finance

PWA de gestão financeira pessoal — Next.js 14 + Prisma + SQLite + Tailwind + Recharts.

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Prisma + SQLite (dev) / Turso (prod)
- Tailwind CSS + glassmorphism
- Recharts, Framer Motion, Lucide
- React Hook Form + Zod
- Zustand (estado), iron-session (auth)
- next-pwa (PWA)

## Rodar localmente

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Acesse http://localhost:3000 — senha padrão `1234` (configurada em `.env.local`).

## Variáveis de ambiente

Veja `.env.example`:

- `DATABASE_URL` — `file:./dev.db` em dev, `libsql://...?authToken=...` em produção (Turso)
- `APP_PASSWORD` — senha de acesso ao app
- `SESSION_SECRET` — string aleatória de pelo menos 32 caracteres

## Deploy no Vercel + Turso

SQLite local não persiste no Vercel (filesystem efêmero). Use Turso:

```bash
# 1. Instalar Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Login e criar banco
turso auth login
turso db create jarvis-finance

# 3. Obter URL e token
turso db show jarvis-finance --url
turso db tokens create jarvis-finance

# 4. Deploy
vercel
```

No painel do Vercel, configure as env vars:
- `DATABASE_URL` = `libsql://[seu-banco].turso.io?authToken=[token]`
- `APP_PASSWORD` = sua senha
- `SESSION_SECRET` = string aleatória

> Para usar Turso com Prisma você precisará migrar do `@prisma/client` puro para o `@prisma/adapter-libsql`. O schema permanece o mesmo (SQLite-compatível). Como alternativa mais simples, troque o `provider` do Prisma para `postgresql` e use Supabase/Neon.

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/        ← tela de login
│   ├── (app)/               ← rotas protegidas (sidebar + header)
│   │   ├── dashboard/
│   │   ├── lancamentos/
│   │   ├── fixas/
│   │   ├── categorias/
│   │   ├── investimentos/
│   │   └── relatorios/
│   └── api/                 ← rotas REST (auth, lancamentos, fixas, categorias, investimentos, dashboard, relatorios)
├── components/
│   ├── ui/                  ← GlassCard, Modal, Badge, ProgressBar, IconRenderer, HiddenValue
│   ├── charts/              ← ChartTooltip wrapper Recharts
│   ├── forms/               ← Lancamento, Categoria, Fixa, Investimento
│   └── layout/              ← Sidebar, BottomNav, Header
├── lib/                     ← prisma, auth, formatters, utils
├── store/                   ← Zustand (período selecionado, tema, modo anônimo)
└── types/
```

## Modules implementados

- **Dashboard** — 4 KPIs (entradas/saídas/saldo/patrimônio) com variação mês anterior, gráfico de barras 6 meses, donut por categoria, área de evolução do patrimônio 12 meses, orçamento vs realizado, próximas fixas, gauge de poupança, fluxo projetado e meta mensal
- **Lançamentos** — tabela com filtros (tipo, categoria, busca, ordenação), paginação, modal CRUD com parcelas e tags
- **Despesas fixas** — CRUD + status (ativa/pausada/encerrada) + histórico de valores automático
- **Categorias** — CRUD com seletor de ícone Lucide e cor + orçamento mensal opcional
- **Investimentos** — CRUD + donut por classe + área de evolução acumulada
- **Relatórios** — período (mês/trimestre/semestre/ano/custom), tabs (resumo/categorias/evolução/top 10), exportação CSV e impressão PDF
- **Auth** — senha única via iron-session
- **PWA** — manifest + ícones + next-pwa
- **Modo anônimo** — toggle no header oculta valores como `R$ ••••`
- **Tema claro/escuro** — toggle na sidebar, persistido em localStorage
- **Período global** — header tem seletor mês/anterior/próximo que reage em dashboard, lançamentos e fixas

## Notas técnicas

- Server Components por padrão; `"use client"` apenas onde precisa de interatividade
- Validação Zod em todas as API routes antes de tocar no banco
- Prisma instanciado como singleton em `src/lib/prisma.ts`
- Datas no fuso `America/Sao_Paulo` via `Intl.DateTimeFormat`
- Print stylesheet em `globals.css` para exportação PDF dos relatórios
- Animação de gradiente sutil (12s) no fundo via `@keyframes`

## Build de produção

```bash
npm run build
npm start
```
