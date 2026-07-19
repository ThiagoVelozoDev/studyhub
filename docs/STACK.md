# Stack — StudyHub

> Leia este arquivo quando precisar saber **o que está instalado, em qual
> versão, e como o build/tooling está configurado**, sem precisar abrir
> `package.json`/`vite.config.ts`/`tsconfig*.json` diretamente.

## Runtime

| Área | Tecnologia | Versão |
|---|---|---|
| UI | React | ^19.2.7 |
| Linguagem | TypeScript | ~6.0.2 |
| Build | Vite | ^8.1.1 |
| Estilo | Tailwind CSS | ^4.3.3 (via `@tailwindcss/vite`) |
| Componentes | shadcn/ui | style `new-york` |
| Ícones | lucide-react | ^1.25.0 |
| Roteamento | react-router-dom | ^7.18.1 |
| Server state | @tanstack/react-query | ^5.101.2 (+ react-query-devtools) |
| Formulários | react-hook-form | ^7.82.0 |
| Validação | zod | ^4.4.3 (+ @hookform/resolvers ^5.4.0) |
| Gráficos | recharts | ^3.8.0 |
| Animação | framer-motion | ^12.42.2 |
| Backend | firebase | ^12.16.0 (Auth, Firestore, Storage — client SDK only) |
| Datas | date-fns | ^4.4.0 |
| Exportação | jspdf ^4.2.1, jspdf-autotable ^5.0.8, xlsx ^0.18.5 | |
| Toasts | sonner | ^2.0.7 |
| Utilitários CSS | clsx, tailwind-merge, class-variance-authority, tw-animate-css | |
| PWA | vite-plugin-pwa | ^1.3.0 |

**`zustand` (^5.0.14)** está instalado mas **não é usado em nenhum store
atualmente** — todo estado de servidor passa por TanStack Query e o estado
local por `useState`/Context. Não remover sem checar se algo passou a
depender dele.

**`radix-ui`, `next-themes`, `react-day-picker`** foram trazidos
transitivamente pelo CLI do shadcn ao instalar os componentes `chart` e
`calendar` — não foram adicionados manualmente, mas são dependências reais
dos componentes de UI instalados.

## Nenhum framework de teste configurado

Não há Vitest/Jest/Playwright como dependência do projeto. Verificação de
mudanças é manual — ver `docs/TESTING.md`.

## shadcn/ui

- `components.json`: `style: "new-york"`, `baseColor: "neutral"`,
  `cssVariables: true`, `iconLibrary: "lucide"`.
- **Aliases não-padrão**: `utils` aponta para `@/utils/cn` (não
  `@/lib/utils`, que é o padrão do shadcn). Isso importa ao rodar
  `npx shadcn add <componente>` — os imports gerados já saem corretos porque
  o CLI lê `components.json`, mas se algum snippet copiado de fora usar
  `@/lib/utils`, precisa ajustar para `@/utils/cn`.
- 24 primitivos já instalados em `src/components/ui/`: `alert-dialog`,
  `avatar`, `badge`, `button`, `calendar`, `card`, `chart`, `dialog`,
  `dropdown-menu`, `form`, `input`, `label`, `popover`, `progress`, `select`,
  `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`,
  `textarea`, `tooltip`. Antes de criar um componente novo, checar se já
  existe aqui.

## TypeScript — cuidados ao escrever código

`tsconfig.app.json` e `tsconfig.node.json` têm:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `erasableSyntaxOnly: true`
- `noFallthroughCasesInSwitch: true`

Isso significa: **variáveis/imports/parâmetros não usados quebram o build**
(`npm run build` roda `tsc -b` antes do `vite build`). Um `catch (err)` sem
usar `err` já causou erro de build nesta base — use `catch {}` quando não
precisar do erro.

Alias de import: `@/*` → `./src/*` (definido em `tsconfig.app.json`,
`tsconfig.json` e espelhado em `vite.config.ts` via `resolve.alias`).

## Vite — build

- `manualChunks` em `vite.config.ts` separa vendor bundles: `vendor-react`
  (react/react-dom/react-router), `vendor-firebase`, `vendor-charts`
  (recharts/d3), `vendor-export` (jspdf/xlsx), e um `vendor` genérico para o
  resto de `node_modules`. Ao adicionar uma lib nova pesada, considere se ela
  merece seu próprio chunk.
- `VitePWA`: `registerType: 'autoUpdate'`, `workbox.maximumFileSizeToCacheInBytes`
  ajustado para 4 MB (o padrão de 2 MB não cobria o bundle principal).

## Scripts npm

| Script | Comando | O que faz |
|---|---|---|
| `dev` | `vite` | servidor de desenvolvimento |
| `build` | `tsc -b && vite build` | type-check + build de produção |
| `lint` | `oxlint` | lint rápido (regras em `.oxlintrc.json`) |
| `preview` | `vite preview` | serve o build de produção localmente |
