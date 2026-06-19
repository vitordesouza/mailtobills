# MailToBills – Agents Guide

⚠️ **This file is the source of truth for AI agents (Codex, Copilot, etc.) working on this repo.**  
If there is any ambiguity, follow this file over README or DESIGN.

---

## 1. Contexto do Projeto

MailToBills é um micro-SaaS para freelancers e pequenas empresas:

> O usuário encaminha faturas por email, nós organizamos tudo.

**MVP scope (não expandir):**

- Receber invoices via email (n8n)
- Guardar ficheiros e metadados
- Expor tudo num dashboard simples
- Permitir export (zip/csv) para o contabilista

**Explicitamente fora do MVP:**

- OCR
- Extração profunda de dados (itens, IVA detalhado, parsing complexo)
- Pipelines “inteligentes” de parsing
- Estados complexos (ex: “pending processing” elaborados)

Este repositório é um **monorepo** gerido com **pnpm + Turborepo**.

---

## 2. Estrutura do Monorepo

- `apps/landing`

  - Next.js (TS)
  - Marketing site público
  - Foco em clareza, não em enfeite

- `apps/dashboard`

  - Next.js (TS)
  - Área autenticada (Convex)
  - Lista de invoices, download, export

- `backend/convex`

  - Backend + database
  - Mutations, queries e schema

- `packages/ui`

  - Design system leve
  - Tailwind + shadcn/ui
  - Não reinventar componentes base

- `packages/domain`

  - Tipos compartilhados (`Invoice`, `User`, `EmailMetadata`, etc.)

- `packages/config`

  - ESLint, tsconfig, etc.

- `workflows/n8n`
  - Workflows exportados em JSON
  - Ingestão de emails e anexos

⚠️ Não criar “pastas genéricas” sem necessidade.

---

## 3. Tecnologias e Ferramentas

- **Package manager:** pnpm (não trocar)
- **Monorepo:** Turborepo
- **Frontend:** Next.js + TypeScript
- **Styling:** Tailwind + shadcn/ui
- **Backend:** Convex (auth, db, functions)
- **Automação:** n8n
- **Storage:** Convex file storage ou S3-compatible (futuro)

---

## 4. Princípios de Código (não negociáveis)

### 4.1 TypeScript first

- Código novo sempre em TS
- Tipos explícitos nas bordas:
  - APIs
  - Convex args
  - Retornos públicos

### 4.2 Async / Await

- Usar `async/await`
- Nada de chains confusas de `.then`
- Tratar erros conscientemente

### 4.3 Erros e logging

- MVP:
  - `console.log` e `console.error` permitidos
  - Preferir logs **estruturados**
- Convex:
  - Erros claros e acionáveis
  - Não engolir exceções silenciosamente
- Não logar em loops de render ou spam de logs

### 4.4 Reutilização

- Preferir `packages/*` a duplicação
- Usar libs maduras:
  - `zod`
  - `date-fns`
  - etc
- Não reinventar utilidades comuns

### 4.5 Sem placeholders

- Nada de TODOs que quebrem fluxo
- App deve compilar e rodar
- Se algo não for feito:
  - documentar claramente
  - manter comportamento estável

### 4.6 Frontend

- Componentes funcionais + hooks
- Organização por feature
- Separar:
  - componentes de UI (presentacionais)
  - containers/orquestração
- Evitar over-engineering no MVP

### 4.7 Convex

- Schema em `backend/convex/schema.ts`
- Nomes claros:
  - `invoices/create`
  - `invoices/listForUser`
- Autorização explícita:
  - sempre validar `userId`

---

## 5. Fluxo Principal do Produto (MVP)

1. Usuário encaminha email para `inbox@mailtobills.com`
2. n8n:
   - Lê anexos
   - Filtra PDFs relevantes
   - Faz upload do ficheiro
   - Chama mutation Convex com:
     - `userId`
     - `fileId`
     - `originalFilename`
     - `receivedAt`
     - `rawEmailMetadata` (opcional)
3. Dashboard:
   - Autenticação simples
   - Listagem de invoices
   - Ações:
     - Download PDF
     - Export por período (zip/csv)

---

## 6. Attachment Handling (importante)

Emails podem conter **múltiplos anexos**.

O sistema deve escolher **um PDF principal**, ignorando ruído.

### Heurística obrigatória (pontuação aditiva)

- Preferir `application/pdf`
- Preferir nomes contendo:
  - `fatura`, `invoice`, `recibo`, `bill`, `pagamento`
- Penalizar nomes contendo:
  - `ads`, `promo`, `marketing`, `terms`, `condicoes`, `welcome`, `folheto`
- Preferir PDFs maiores (dentro do razoável)
- Em empate, usar o primeiro PDF recebido

⚠️ Nunca hard-code vendor específico.

---

## 7. Operação dos Agentes

### Pode fazer

- Criar/editar código em:
  - `apps/*`
  - `backend/convex`
  - `packages/*`
- Refatorar para clareza e tipagem
- Adicionar testes quando a lógica for não trivial
- Criar abstrações **apenas se simplificarem**

### Não deve fazer

- Trocar `pnpm`
- Mudar stack (Convex continua)
- Introduzir dependências pesadas sem motivo
- Criar features grandes não pedidas
- “Melhorar” o produto fora do escopo MVP

---

## 8. Commits e Pull Requests

- Mensagens claras e pequenas
- Exemplos:
  - `feat(dashboard): list invoices`
  - `chore(convex): add invoices schema`
- Se houver dúvida entre:
  - algo simples que funciona
  - algo elegante e complexo  
    → escolha **simples que funciona**

---

## Regra final

**MailToBills otimiza clareza e velocidade, não inteligência artificial avançada.**  
Qualquer decisão deve reduzir complexidade cognitiva para o usuário e para o código.
