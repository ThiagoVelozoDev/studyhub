# Changelog

Todas as mudanças relevantes do projeto são registradas aqui, da mais
recente para a mais antiga. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Uma seção por
marco de entrega (não por commit individual). Ao fazer uma mudança que
afete stack, padrão de código, configuração ou decisão de arquitetura,
adicionar uma entrada nova no topo deste arquivo e atualizar o `docs/*.md`
correspondente na mesma tarefa — ver `CLAUDE.md`.

## "Minha Evolução": Dashboard + Estatísticas viram uma análise em etapas

- Dashboard e Estatísticas (páginas e itens de menu separados) foram
  fundidos numa única página, `/dashboard` ("Minha Evolução"), com um
  storytelling de análise em 5 etapas navegáveis: Visão Geral → Progresso
  do Plano → Desempenho → Tendências → Distribuição — respondendo, em
  ordem, "estou no caminho certo?" para quem estuda para concursos.
- Etapa atual guardada em query param (`?etapa=`), com indicador de
  progresso clicável e botões de etapa anterior/próxima.
- Novo `useActivePlan` (plano salvo em `localStorage`, compartilhado pelas
  5 etapas) e `PlanFilterSelect` — trocar de plano em qualquer etapa
  atualiza a análise inteira, sem precisar reescolher em cada tela.
- Nova etapa "Desempenho": tabela por disciplina (tempo/certas/erradas/%
  com badge colorido), substituindo o gráfico de barras equivalente.
- `GoalProgress` extraído de dentro de `DashboardPage.tsx` para
  `src/components/dashboard/GoalProgress.tsx`.

## Redesign visual da tela de Login

- Layout dividido em duas colunas a partir de `lg:`: painel escuro de
  marca à esquerda (`LoginBrandPanel`, com headline, bullets de feature,
  card de citação e um preview estático do dashboard flutuando sobre a
  borda) + formulário à direita, sem `Card` bordado, campos de e-mail/senha
  com ícone prefixado.
- **"Lembrar de mim"** (novo `Checkbox`, shadcn) agora tem efeito real:
  controla `setPersistence` do Firebase Auth (local vs sessão).
- **"Esqueceu a senha?"** abre um diálogo (`ForgotPasswordDialog`) que
  envia e-mail de redefinição via `sendPasswordResetEmail`.
- `RegisterPage.tsx` não foi alterado nesta tarefa — continua com o shell
  antigo (card centralizado), ficando visualmente inconsistente até o
  mesmo tratamento ser pedido para ela.

## Editais compartilhados por admin, carreiras, criação rápida de plano, metas com dias da semana e reset de progresso

- **Papel de administrador**: `UserProfile.role` (`"admin" | "user"`),
  `AuthContext` expõe `profile`/`isAdmin`, novo painel `/admin/usuarios`
  (só para admins) para promover/rebaixar qualquer usuário. O primeiro
  admin ainda precisa ser definido manualmente no Console do Firebase.
- **Editais públicos**: admin pode marcar um edital como `public` (visível
  a todos os usuários, que podem reaproveitá-lo para criar planos, mas não
  editá-lo/excluí-lo). `firestore.rules` atualizado com `isAdmin()` e
  suporte a leitura de documentos públicos — **precisa ser publicado
  manualmente no Console do Firebase** para funcionar em produção (ver
  `docs/CONFIGURATION.md`).
- **Carreiras**: novo campo obrigatório `Edital.categoria`, validado contra
  a lista extensível `src/constants/editalCategorias.ts`; filtro por
  carreira na página de Editais.
- **Criar plano direto do card do edital**: botão "Criar plano" abre o
  formulário com o edital já selecionado e travado.
- **Metas com dias da semana**: seleção dos dias que a pessoa vai estudar
  (Seg–Dom), escolha de unidade (minutos/horas) para a meta diária, e
  cálculo automático (mas editável) da meta semanal/mensal — no plano e na
  meta padrão de Configurações. Novo componente reusável
  `StudyGoalsFields`.
- **Zerar progresso**: nova "Zona de risco" em Configurações apaga todos os
  planos, sessões de estudo e metas do usuário, sem afetar os editais.
- Correção: `createPlanFromEdital` agora resolve o dono real do edital de
  origem antes de copiar disciplinas/tópicos — necessário para editais
  públicos de outro usuário, que antes resultavam em planos sem conteúdo
  copiado.

## Documentação de contexto do projeto

- Adicionados `CLAUDE.md` (índice curto, carregado automaticamente) e
  `docs/{STACK,ARCHITECTURE,CONFIGURATION,DECISIONS,TESTING}.md` para
  permitir pesquisa de contexto sem reexplorar o código-fonte inteiro.
- Corrigido `README.md`: removida referência a `CLAUDECODE_INSTRUCTIONS.md`
  (nunca existiu em disco, só como anexo de mensagem) e corrigida a
  descrição da regra de segurança do Firestore (posse via `userId`
  denormalizado, não via documento pai).

## Redesign visual do Dashboard + tema claro/escuro

- Dashboard reconstruído visualmente: cards de estatística (`StatCard`)
  com sparkline, progresso circular da jornada do plano
  (`CircularProgress`, `JourneyIllustration`), ranking de disciplinas,
  próximas revisões e linha do tempo de atividades recentes.
- Adicionado toggle de tema claro/escuro no header (`useTheme`,
  `localStorage["studyhub:theme"]`), com **claro** como padrão (era
  escuro). Sidebar mantém fundo escuro fixo independente do tema.
- Cards do Dashboard usam exclusivamente dados reais derivados do
  Firestore do usuário (tópicos concluídos, sessões, streak) — sem dados
  fictícios do mockup original (ranking social, revisões previstas por
  IA).

## Cronômetro com pausa/retomada e questões certas/erradas

- `useTimer` reescrito para modelo baseado em timestamp
  (`accumulatedMs` + `segmentStartedAt`), não `setInterval` como fonte da
  verdade — sobrevive a reload de página via `localStorage`.
- Adicionado suporte a pausar/retomar sessão de estudo sem contar o tempo
  pausado.
- `StudySession` passou a registrar `questoesCertas`/`questoesErradas` em
  vez de um campo único de questões resolvidas.

## Import de edital via colar JSON

- Nova tela de import: usuário cola um JSON (gerado externamente) com
  estrutura de edital/disciplinas/tópicos; o app valida e cria
  `Edital` + `EditalSubject[]` + `EditalTopic[]` via `writeBatch`
  (`createEditalWithContent`).
- Decisão: evita chamar uma API de LLM direto do navegador (exporia chave
  de API) sem exigir um backend próprio.

## Correções de Firestore (fundação de dados)

- Habilitado `ignoreUndefinedProperties: true` em `initializeFirestore` —
  campos opcionais frequentemente chegam como `undefined`, e o Firestore
  rejeita esse valor por padrão.
- Removido todo uso de `.orderBy()` nas queries — evita exigência de
  índice composto (equality filter + orderBy em campo diferente).
  Ordenação passou a ser sempre no cliente.
- `userId` denormalizado em todo documento filho (`EditalSubject`,
  `EditalTopic`, `PlanSubject`, `PlanTopic`, `StudySession`, `Goal`) e
  adicionado como filtro explícito em toda sub-query — o Firestore rejeita
  a query inteira quando a regra de segurança depende de um `get()`
  cruzado sobre o documento pai.

## Módulos principais (Editais, Planos, Cronômetro, Dashboard, Estatísticas, Histórico)

- Modelo de dados completo (`src/types/index.ts`): `Edital`/
  `EditalSubject`/`EditalTopic` (templates) e `Plan`/`PlanSubject`/
  `PlanTopic` (cópias personalizáveis via `createPlanFromEdital`,
  deep-copy por `writeBatch`).
- CRUD completo de Editais e Planos, com formulários RHF + Zod.
- Cronômetro de estudo vinculado a Plano → Disciplina → Tópico, gravando
  `StudySession`.
- Dashboard inicial, página de Estatísticas (gráficos Recharts) e
  Histórico de sessões.
- Autenticação: e-mail/senha + Google (Firebase Auth), `AuthContext` +
  `ProtectedRoute`.

## Scaffold inicial

- Projeto criado com React 19 + TypeScript + Vite + Tailwind v4 +
  shadcn/ui (style `new-york`) + TanStack Query + React Hook Form + Zod +
  Firebase (Auth/Firestore/Storage, client SDK).
- PWA configurado via `vite-plugin-pwa` (`autoUpdate`, cache até 4 MB).
