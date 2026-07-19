# Verificação de mudanças — StudyHub

> Leia este arquivo quando precisar saber **como confirmar que uma mudança
> funciona** neste projeto, já que não há suite de testes automatizada.

## Não há framework de teste configurado

Sem Vitest/Jest/Playwright como dependência do projeto (ver
`docs/STACK.md`). Toda verificação de mudança é manual, em duas camadas:

## 1. `npm run build` — primeira verificação

`npm run build` roda `tsc -b && vite build`. Como `tsconfig.app.json` tem
`noUnusedLocals`/`noUnusedParameters`/`erasableSyntaxOnly` ativos, isso pega
tanto erros de tipo quanto imports/variáveis não usados que quebrariam o
build. Rodar sempre após qualquer mudança de código antes de considerar a
tarefa concluída.

## 2. Verificação funcional manual (Playwright headless + `npm run dev`)

Padrão usado ao longo desta sessão para validar fluxos ponta a ponta:

1. Subir o dev server (`npm run dev`, porta 5173).
2. Escrever um script Playwright headless curto e descartável (ex. em
   `scratchpad/`) que: registra um usuário de teste com e-mail único
   (`` `teste+${Date.now()}@example.com` ``), navega pelo fluxo que mudou,
   tira screenshot em pontos-chave, e captura eventos `console` (tipo
   `error`) e `pageerror` da página.
3. Ler os screenshots e os logs capturados antes de concluir que a mudança
   funciona — não basta o script rodar sem lançar exceção.

**Atenção a falhas silenciosas do Firestore**: `Missing or insufficient
permissions` **não aparece como exceção JS não tratada** — a call rejeitada
faz a query resolver como vazia/erro tratado internamente pelo hook do
TanStack Query, e a tela só mostra um estado vazio ou "erro ao carregar" sem
nenhum `pageerror` correspondente. Sempre que uma lista que deveria ter
dados aparece vazia sem nenhum erro visível no console, suspeitar primeiro
de regra de segurança/query (ver `docs/CONFIGURATION.md`), não de bug de
UI.

## Cuidado com o `.env`

O `.env` na raiz contém as credenciais reais do Firebase do usuário. **Nunca
apagar o `.env` real ao limpar arquivos de teste/scratch.** Se for
necessário um valor temporário para um smoke test, restaurar o conteúdo
original depois — isso já causou um incidente nesta sessão (app parou de
carregar depois do `.env` real ser apagado por engano durante uma limpeza).

## Reiniciar o dev server após mudança de config

Vite só lê `.env` na inicialização do processo — mudanças em variáveis de
ambiente exigem matar o processo anterior na porta 5173 e subir um novo
`npm run dev`, nunca são hot-reloaded. O mesmo vale para qualquer mudança
que dependa de estado inicial fora do HMR do React (ex.: valor padrão lido
uma vez de `localStorage` antes do primeiro render).

## Lint

`npm run lint` (`oxlint`, regras em `.oxlintrc.json`) para lint rápido, mas
as checagens de `tsc` no build são a rede de segurança principal, já que
capturam os erros que mais aconteceram nesta base (variável/import não
usado).
