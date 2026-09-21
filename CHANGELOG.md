# Changelog

Todas as mudanças relevantes do projeto são registradas aqui, da mais
recente para a mais antiga. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Uma seção por
marco de entrega (não por commit individual). Ao fazer uma mudança que
afete stack, padrão de código, configuração ou decisão de arquitetura,
adicionar uma entrada nova no topo deste arquivo e atualizar o `docs/*.md`
correspondente na mesma tarefa — ver `CLAUDE.md`.

## Impressão do cronograma replica o hero rico e força paisagem

- `ScheduleCover` deixou de ter uma segunda variante compacta/tema-neutra
  só para impressão — o mesmo hero rico (foto de fundo, cores do tema,
  ícone, barra de progresso, frase motivacional) usado na tela agora
  também é usado por `window.print()`/"Salvar como PDF", com
  `print-color-adjust: exact` para preservar as cores do tema.
- Novo `@page { size: landscape; margin: 12mm; }` em `src/index.css` força
  orientação paisagem na impressão, para a grade de 7 dias caber lado a
  lado — regra global (não é possível escopar `@page` por rota em CSS),
  segura hoje porque `/schedule` é a única página do app com
  `print:`/`window.print()` (ver `docs/DECISIONS.md`).
- Cores e foto de fundo só aparecem impressas se o usuário habilitar
  "Imprimir gráficos de segundo plano" ("Background graphics") na janela
  de impressão do navegador — limitação do navegador, não contornável via
  CSS.

## Imagem real de fundo no hero do tema "Policial"

- `careerThemes.policial.backgroundImage` agora aponta para
  `src/assets/banner/policiais/banner.png`, importado como asset do Vite
  (`import policialBanner from "@/assets/banner/policiais/banner.png"`),
  em vez do caminho estático em `public/` que ainda não existia. É o
  primeiro tema com foto real — os demais (`tribunais`, `fiscal`,
  `administrativo`, `outros`) continuam usando só o gradiente até que suas
  imagens sejam adicionadas. `ScheduleCover` não precisou de nenhuma
  mudança: já consumia `theme.backgroundImage` como uma URL qualquer.

## Tema visual por carreira no cronograma (`/schedule`)

- `ScheduleCover` agora resolve um tema visual (paleta, ícone, imagem de
  fundo em camadas com fallback e frases motivacionais) a partir de
  `Edital.categoria`, via novo registry `src/constants/careerThemes.ts`
  (`getCareerTheme`, mesmo padrão extensível de `EDITAL_CATEGORIAS`) — a
  lógica de geração do cronograma (`scheduleGenerator.ts`/
  `subjectPriority.ts`) não foi alterada, continua 100% agnóstica de
  carreira.
- `ScheduleCover` ganhou duas variantes no mesmo componente: hero rico com
  imagem de fundo para tela, versão compacta sem imagem para impressão —
  mantém o cronograma leve o suficiente para caber em uma página impressa.
- Nova barra de progresso no hero (`computeScheduleProgress`,
  `src/utils/scheduleProgress.ts`), calculada sobre `ScheduleItem.concluido`
  de todas as semanas do cronograma ativo.
- Cores do tema aplicadas via `style` inline local ao hero, nunca nos
  tokens globais de tema — não afeta o claro/escuro do resto do app (ver
  `docs/DECISIONS.md`).
- Imagens de fundo reais ainda não foram adicionadas (`public/images/
  careers/{categoria}.webp`); até lá o hero usa só o gradiente de cada
  tema.

## Correção: tela em branco ao abrir `/schedule` com cronograma arquivado

- `ArchivedSchedulesList` lançava `RangeError: Invalid time value` (crash de
  página inteira) ao formatar `Schedule.createdAt` com `date-fns` — esse
  campo, gravado via `serverTimestamp()`, volta do Firestore como instância
  de `Timestamp` do SDK, não como `number` (apesar do tipo declarado).
  `listSchedules` agora normaliza esse campo para `number` ao ler os
  documentos. Ver nota em `docs/ARCHITECTURE.md` — o mesmo problema, ainda
  não corrigido, existe em outras entidades caso algum dia precisem exibir
  `createdAt` como data.

## Matérias por dia, rodízio de semanas e sidebar recolhível

- `/schedule` agora pergunta também **quantas matérias por dia** (teto
  fixo, não mais implícito por round-robin). Quando as disciplinas do plano
  não cabem em uma semana com essa configuração, um painel aparece
  perguntando se o usuário quer estudar **todas** (rodízio de várias
  semanas que se repete em loop — `Schedule.numeroSemanas`,
  `ScheduleItem.semana`) ou **focar** num grupo agora, e qual prioridade
  usar: **Intercalado** (recomendado — básicas e específicas alternadas),
  Básicas primeiro ou Específicas primeiro. Classificação básica/específica
  por palavra-chave (`src/constants/basicSubjectKeywords.ts`), sem IA.
- Grade semanal ganhou navegação Anterior/Próxima entre semanas do rodízio
  quando há mais de uma.
- Corrigido vazamento de conteúdo (texto de disciplina cortando/estourando
  o card em nomes longos) e melhorada a responsividade da grade em telas
  médias/mobile.
- Menu lateral (sidebar) agora pode ser recolhido para uma faixa só de
  ícones, com tooltip mostrando o nome de cada item; estado persistido em
  `localStorage`.

## Cronograma de estudos gerado a partir do edital (`/schedule`)

- Novo item de menu "Cronograma": lê as disciplinas do plano ativo (que
  vieram do edital) e, respondendo 3 perguntas (horas de estudo por dia,
  questões por dia, dias da semana), gera uma grade semanal fixa
  (Segunda→Domingo) distribuindo as disciplinas por round-robin — sem
  depender de um campo de peso/prioridade, que não existe no modelo.
- Cabeçalho/capa com os dados do edital vinculado ao plano (nome do
  concurso, órgão, cargo, banca), como um cronograma personalizado.
- Acompanhamento na tela: cada disciplina do dia tem um checkbox de
  concluído, persistido no Firestore. Botão "Imprimir" usa impressão nativa
  do navegador (`window.print()` + variant `print:` do Tailwind), sem gerar
  PDF separado.
- Reconfigurar o cronograma não apaga o anterior — ele é arquivado e pode
  ser restaurado depois ("Cronogramas anteriores" na página).
- Novas entidades `Schedule`/`ScheduleItem`, coleções `schedules`/
  `scheduleItems`, serviço `scheduleService.ts`, hooks `useSchedules.ts`.
  **Requer publicar manualmente as novas regras de `firestore.rules` no
  Console do Firebase** antes de criar/reconfigurar/restaurar um cronograma
  funcionar em produção (ver `docs/CONFIGURATION.md`).

## Tópico avulso e tipo de sessão no cronômetro (`/study`)

- Novo botão "Novo tópico" ao lado do Select de Tópico em `/study`: cria um
  `PlanTopic` avulso (não copiado do edital) direto no plano atual, via a
  nova `createPlanTopic` (`planService.ts`) + `useCreatePlanTopic`
  (`usePlans.ts`), mesmo padrão de `createEditalTopic`. Antes, um tópico só
  entrava num plano sendo copiado do edital na criação do plano — não havia
  como adicionar um novo depois. O tópico criado fica salvo no plano e
  disponível nas próximas sessões, sem afetar o edital de origem.
- Nova etapa "Tipo de sessão" antes de iniciar o cronômetro: Estudar (vídeo
  aula), Questões ou Simulado (`SessionType`, `src/constants/sessionTypes.ts`).
  Guardado em `StudySession.tipo` (campo novo, opcional) e exibido na coluna
  "Tipo" do Histórico.

## Lançamento manual de sessões de estudo (Histórico) e correção de `questoesResolvidas`

- `/history` ganhou os botões "Adicionar registro" e "Editar" por linha,
  abrindo `StudySessionForm` (novo, com schema `studySession.schema.ts`) num
  `Dialog` — até então a única forma de criar uma `StudySession` era rodar o
  cronômetro ao vivo em `/study`; não havia como registrar um bloco de
  estudo retroativo (ex.: importar histórico de outro app) nem editar uma
  sessão já salva (`updateStudySession` existia no serviço, mas nunca era
  chamado).
- `StudySession.topicoId` passou a ser opcional — um registro manual "por
  disciplina" (sem tópico específico) agora é permitido; sessões do
  cronômetro continuam sempre preenchendo o tópico normalmente.
- Novo campo opcional `StudySession.questoesBrancas`, ao lado de
  `questoesCertas`/`questoesErradas`.
- Corrigido `PlanTopic.questoesResolvidas`, que nunca era incrementado (nem
  pelo cronômetro normal) — `incrementPlanTopicStudyTime` agora também
  soma `certas + erradas` (sem contar brancas, mesma convenção do cálculo de
  `percentualAcerto`) ao criar uma sessão com tópico definido.
- `SubjectPerformanceTable` ganhou a coluna "Total" (soma de questões por
  disciplina).
- Nova página `/history/totais` (botão "Lançar totais por disciplina" em
  `/history`): escolhe um plano e preenche uma tabela com uma linha por
  disciplina (Horas/Minutos/Certas/Erradas/Brancas, Total/% calculados ao
  vivo) para lançar o histórico inteiro de uma vez, em vez de repetir
  "Adicionar registro" uma vez por disciplina. Cria as sessões num único
  `writeBatch` (`createStudySessionsBatch`/`useCreateStudySessionsBatch`).
- Corrigido bug encontrado durante a verificação manual: em `/history`, as
  colunas Disciplina/Tópico só resolviam o nome quando um Plano específico
  estava selecionado no filtro (com "Todos" selecionado, sempre mostravam
  "-", mesmo para sessões antigas válidas) — os mapas de nome agora usam
  `useAllPlanSubjects`/`useAllPlanTopics` (novos hooks, sem filtro de
  `planoId`), independentes dos hooks escopados que ainda alimentam as
  opções dos Selects de filtro.

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
