# Arquitetura e padrões — StudyHub

> Leia este arquivo quando precisar entender **o modelo de dados ou como uma
> camada do app é convencionalmente estruturada**, antes de abrir vários
> arquivos para inferir o padrão por conta própria.

## Modelo de dados (`src/types/index.ts`)

Todas as datas são tipadas como `Timestamp = number` (epoch ms) — mas essa
tipagem só é **verdadeira de fato** para campos calculados no cliente
(`new Date(input).getTime()`/`Date.now()`, ex.: `Plan.dataProva`,
`PlanTopic.ultimaRevisao`). Campos gravados via `serverTimestamp()`
(`createdAt`/`updatedAt` de `Edital`/`Plan`/`Goal`/`Schedule`/`UserProfile`)
voltam do Firestore como **instância da classe `Timestamp` do SDK**, não como
`number` — o `as Entidade` nos services (`{ id: d.id, ...d.data() } as X`) é
só uma asserção de tipo, não converte nada em runtime. Isso nunca quebrou
porque o único uso desses campos era ordenação (`.sort((a,b) =>
b.createdAt - a.createdAt)`, que "funciona" porque `Timestamp` implementa
`valueOf()`) — até `Schedule.createdAt` precisar ser exibido como data
legível em `ArchivedSchedulesList.tsx` via `date-fns` `format()`, que espera
`number`/`Date`/string e lança `RangeError: Invalid time value` ao receber
um `Timestamp`. `listSchedules` (`src/services/firestore/scheduleService.ts`)
normaliza isso com um helper `toMillis` (`value instanceof Timestamp ?
value.toMillis() : value`) ao mapear os documentos. **Outras entidades ainda
não têm essa normalização** — se algum dia precisarem formatar `createdAt`
como data, vão precisar do mesmo tratamento.

```
Edital (template)                    Plan (cópia personalizável)
├── id, userId                       ├── id, userId, editalId
├── nome, orgao, cargo, banca         ├── nome, descricao?, dataProva?
├── categoria (carreira), public      ├── diasEstudo (["seg","ter",...])
├── descricao?, dataPublicacao?       ├── metaDiaria/Semanal/Mensal (min)
├── linkEdital?, status               └── createdAt
└── createdAt, updatedAt

EditalSubject                        PlanSubject
├── id, userId, editalId, public      ├── id, userId, planoId
├── nome, cor, icone                  ├── disciplinaOriginalId (→ EditalSubject)
└── ordem                             ├── nome, cor, icone, ordem
                                       └── oculta

EditalTopic                          PlanTopic
├── id, userId, editalId, public      ├── id, userId, planoId, disciplinaId
├── disciplinaId (→ EditalSubject)    ├── topicoOriginalId? (→ EditalTopic)
├── nome, descricao?                  ├── nome, ordem, concluido
├── ordem                             ├── percentualConclusao, tempoEstudado
└── cargaHorariaSugerida?             ├── questoesResolvidas, observacoes?
                                       ├── ultimaRevisao?
                                       └── oculta

StudySession                          Goal
├── id, userId                        ├── id, userId, planoId?
├── planoId, disciplinaId, topicoId?  ├── periodo: "diaria"|"semanal"|"mensal"
├── tipo?: SessionType                ├── metaMinutos, diasEstudo? (só na "diaria")
├── inicio, fim, duracao (ms)         └── createdAt
├── questoesCertas?, questoesErradas?
├── questoesBrancas?
└── observacoes?

Schedule                              ScheduleItem
├── id, userId, planoId               ├── id, userId, cronogramaId (→ Schedule)
├── status: "ativo"|"arquivado"       ├── diaSemana, disciplinaId (→ PlanSubject)
├── minutosPorDia, questoesPorDia     ├── ordem
├── diasEstudo                        ├── minutosPlanejados, questoesPlanejadas
└── createdAt                         └── concluido

UserProfile
├── uid, nome, email, photoURL?
├── role?: "admin" | "user" (ausente = usuário comum)
└── createdAt
```

`Edital.categoria` é uma `string` livre validada contra a lista de
`src/constants/editalCategorias.ts` (`EDITAL_CATEGORIAS`) — não é uma union
type no tipo `Edital`, de propósito: adicionar uma carreira nova (ex.:
"Militar") é só acrescentar um item nessa constante, sem migração de schema
nem mudança de tipo. `Edital.public`/`EditalSubject.public`/
`EditalTopic.public` controlam se o edital aparece para todos os usuários
(só um admin pode marcar `public: true` — ver seção de edital público
abaixo e `docs/CONFIGURATION.md`).

### Regra central: Edital = template, Plano = cópia

`createPlanFromEdital` (`src/services/firestore/planService.ts`) faz um
**deep-copy** de todas as `EditalSubject`/`EditalTopic` do edital escolhido
para novas `PlanSubject`/`PlanTopic`, usando um único `writeBatch`. O plano
**nunca** referencia os documentos do edital ao vivo — por isso o usuário
pode reordenar, ocultar, editar ou excluir tópicos no plano sem afetar o
edital original. `disciplinaOriginalId`/`topicoOriginalId` guardam a
proveniência, mas não são usados para leitura em cascata.

### Edital público (admin) e permissão de edição

Um `Edital` com `public: true` é visível para **todos** os usuários (não só
o dono) — usado por editais criados por um admin para reaproveitamento.
Consequências no código:

- `useEditals()` (`src/hooks/useEditals.ts`) busca **dois** conjuntos em
  paralelo (`listEditals(uid)` + `listPublicEditals()`), deduplica por `id`
  (o próprio edital do admin não aparece duas vezes) e ordena o resultado
  mesclado por `createdAt`. Se `listPublicEditals()` falhar (ex.: regra de
  segurança ainda não publicada), cai silenciosamente para só os editais
  próprios — nunca quebra a lista inteira por causa da parte pública.
- `createPlanFromEdital` (`src/services/firestore/planService.ts`) busca o
  edital de origem primeiro (`getEdital`) para saber o dono real e o flag
  `public`; se o plano estiver sendo criado a partir do edital de **outro**
  usuário, as disciplinas/tópicos são buscados filtrando por
  `where("public","==",true)` em vez de `where("userId","==",callerUid)` —
  necessário porque o documento pertence a outro usuário e essa query
  nunca bateria pelo filtro de `userId`.
- Só o dono (`edital.userId === user.uid`) pode editar/excluir um edital ou
  suas disciplinas/tópicos — `EditalsPage`, `EditalDetailPage` e
  `EditalSubjectPanel` calculam `isOwner` e ocultam os botões de
  edição/exclusão quando `false`, deixando só "Gerenciar" (leitura) e
  "Criar plano". Reforçado também em `firestore.rules` (`ownsDoc()` continua
  exigido para `update`/`delete`, independente de `public`).
- Só um admin (`useAuth().isAdmin`) vê o campo "Visível para todos os
  usuários" no `EditalForm` — para outros usuários o campo nem é
  renderizado, fica sempre `false`.

### Papel de administrador (`role` em `UserProfile`)

`AuthContext` busca o documento `users/{uid}` via `onSnapshot` e expõe
`profile`/`isAdmin` além do `user` do Firebase Auth. Não existe fluxo de
"virar admin" dentro do cadastro — o **primeiro** admin precisa ser
definido manualmente no Console do Firebase (`role: "admin"` no documento
`users/{uid}`, ver `docs/CONFIGURATION.md`). A partir daí, promover/rebaixar
qualquer outro usuário é feito pela página `/admin/usuarios`
(`src/pages/Admin/UsersPage.tsx`, só acessível a admins via
`src/routes/AdminRoute.tsx`), que lista todos os usuários
(`userService.listAllUsers()` — única query da base sem filtro de `userId`,
deliberado) e alterna o `role` via `userService.updateUserRole`. A regra de
segurança de `users/{uid}` impede que um usuário altere o próprio `role`
(só um admin pode mudar o `role` de qualquer documento, inclusive o de
terceiros) — evita auto-promoção.

## Padrão de serviço Firestore (`src/services/firestore/*.ts`)

Um arquivo por agregado (`editalService.ts`, `planService.ts`,
`sessionService.ts`, `goalService.ts`). Convenções:

- Nomeação: `list<Entidade>`, `get<Entidade>`, `create<Entidade>`,
  `update<Entidade>`, `delete<Entidade>` — mais funções especiais de cascata
  quando aplicável (`createEditalWithContent`, `createPlanFromEdital`).
- `userId` é **sempre parâmetro explícito** das funções de serviço — nunca
  lido de `auth.currentUser` dentro do serviço. Quem injeta o `userId` real é
  a camada de hooks (via `useAuth()`).
- Toda query filtra por `userId` **explicitamente**, mesmo quando o dado já
  tem outro filtro primário (`editalId`, `planoId`...) — ver
  `docs/CONFIGURATION.md` para o motivo (limitação de regra+query do
  Firestore).
- Nenhuma query usa `orderBy()` — ordenação é sempre feita no cliente após
  `getDocs()` (ver `docs/CONFIGURATION.md`).
- `writeBatch` para qualquer operação em cascata: criar edital+disciplinas+
  tópicos de uma vez (`createEditalWithContent`, com chunking manual de 400
  operações), excluir edital/plano e todos os filhos (`deleteEdital`,
  `deletePlan`).
- `serverTimestamp()` para `createdAt`/`updatedAt` em criação/atualização de
  `Edital`/`Plan`/`Goal`. `StudySession` não tem `createdAt` — usa
  `inicio`/`fim` (timestamps definidos pelo cronômetro no cliente).

## Padrão de hooks (`src/hooks/use*.ts`)

Cada hook envolve um serviço com TanStack Query:

- `useQuery`: `queryKey` é um array `["nomeEntidade", escopoId, ...]` —
  chave de lista (`["editals", userId]`) distinta da chave de detalhe
  (`["edital", editalId]`). `enabled` sempre guarda contra parâmetros
  ausentes (`enabled: !!user`, `enabled: !!editalId && !!user`) para não
  disparar a query com IDs indefinidos.
- `useMutation`: `mutationFn` chama o serviço; `onSuccess` invalida as
  queries afetadas via `queryClient.invalidateQueries({ queryKey: [...] })`
  — tanto a lista quanto o detalhe quando fizer sentido.
- **Invalidação cruzada**: `useCreateStudySession`
  (`src/hooks/useStudySessions.ts`) registra a sessão E incrementa
  `tempoEstudado`/`questoesResolvidas` do `PlanTopic` correspondente na mesma
  mutação — por isso invalida `studySessions` **e** `planTopics` no
  `onSuccess`. `StudySession.topicoId` é opcional (registro manual "por
  disciplina", sem tópico específico — ver seção "Lançamento manual" abaixo);
  quando ausente, esse incremento é pulado por completo, só o documento de
  `StudySession` é criado.
- O `userId` vem sempre de `useAuth()` dentro do próprio hook, nunca é
  passado pelo componente de página.

## Padrão de formulário

- Schema Zod em `src/schemas/<entidade>.schema.ts`; o tipo do formulário é
  **sempre** `z.infer<typeof schema>`, nunca escrito à mão.
- Componente em `src/components/forms/<Entidade>Form.tsx` com props fixas:
  `{ defaultValues?: Partial<FormValues>; onSubmit: (values) => Promise<void>; submitting?: boolean; submitLabel?: string }`.
  O mesmo componente serve para criar (sem `defaultValues`) e editar (com
  `defaultValues` do registro existente).
- Campos usam os wrappers do shadcn (`Form`, `FormField`, `FormItem`,
  `FormLabel`, `FormControl`, `FormMessage`) em torno de `Input`/`Textarea`/
  `Select`.
- Padrão de campo numérico controlado via `Controller` do RHF (não
  `register` com `valueAsNumber`): `field.onChange(e.target.value === "" ? undefined : Number(e.target.value))`.

## Metas de estudo com dias da semana (`StudyGoalsFields`)

`src/components/forms/StudyGoalsFields.tsx` é um componente controlado
(sem estado próprio de valor, só o toggle local de unidade min/horas)
reusado em dois lugares: `PlanForm` (via `form.watch`/`form.setValue` do
react-hook-form) e `SettingsPage` (via `useState` cru, para a meta padrão
global). Ele recebe `metaDiaria`/`metaSemanal`/`metaMensal` (sempre em
**minutos**) e `diasEstudo` (`string[]` de `src/constants/diasSemana.ts`) e:

- Deixa escolher a unidade de exibição da meta diária (minutos ou horas) —
  a conversão é só de exibição, o valor armazenado nunca muda de unidade.
- Mostra os 7 dias da semana como botões de seleção múltipla (sem
  `toggle-group` do shadcn instalado — ver `docs/STACK.md` — por isso é um
  grid de `Button` comum).
- Recalcula `metaSemanal = metaDiaria × diasEstudo.length` e
  `metaMensal = metaSemanal × 4` automaticamente sempre que a diária ou os
  dias mudarem (via `useEffect` com uma chave de comparação em `useRef`,
  para não recalcular a cada render). Os campos semanal/mensal continuam
  editáveis manualmente depois — o próximo ajuste de diária/dias
  sobrescreve de novo.

## Autenticação e rotas

- `src/contexts/AuthContext.tsx` é uma casca fina sobre
  `src/services/auth/authService.ts` (que fala direto com o Firebase Auth
  SDK) — expõe `{ user, profile, isAdmin, loading, login, loginGoogle,
  register, signOut, resetPassword }`. `profile`/`isAdmin` vêm de um
  `onSnapshot` em `users/{uid}` (ver seção "Papel de administrador" acima).
- **Persistência ("Lembrar de mim")**: `login(email, password, rememberMe)`
  e `loginGoogle(rememberMe)` chamam `setPersistence(auth,
  rememberMe ? browserLocalPersistence : browserSessionPersistence)` antes
  de autenticar — um único checkbox na tela de Login governa a
  persistência independente do método de login escolhido.
- **Redefinição de senha**: `resetPassword(email)` encaminha para
  `sendPasswordResetEmail` do Firebase Auth, usado pelo
  `src/pages/Login/ForgotPasswordDialog.tsx`.
- **Tela de Login** (`src/pages/Login/LoginPage.tsx`): layout dividido em
  duas colunas a partir de `lg:` — `src/pages/Login/LoginBrandPanel.tsx`
  (painel escuro de marca à esquerda, com o card de preview do dashboard,
  todo estático/ilustrativo, no espírito do `JourneyIllustration.tsx`) +
  formulário à direita. `src/pages/Register/RegisterPage.tsx` **ainda usa
  o shell antigo** (card centralizado) — não foi redesenhado junto,
  ficando visualmente inconsistente até ser pedido.
- `src/routes/ProtectedRoute.tsx`: gate simples — spinner enquanto
  `loading`, `<Navigate to="/login">` se não autenticado, senão `<Outlet/>`.
- `src/routes/AdminRoute.tsx`: mesmo padrão, mas exige `isAdmin` — usado só
  na rota `/admin/usuarios`.
- `src/layouts/MainLayout.tsx`: sidebar fixa (desktop) + `Topbar` + `Outlet`;
  nav mobile é um `Sheet` disparado pelo `Topbar`.
- `src/App.tsx`: todas as páginas exceto Login/Register são `lazy()`,
  dentro de um único `<Suspense>` no topo.

## "Minha Evolução" — análise em etapas (Dashboard + Estatísticas fundidos)

O que antes eram as páginas separadas `Dashboard` e `Estatísticas` (cada
uma com seu próprio item de menu) virou **uma única página**,
`src/pages/Dashboard/AnalysisPage.tsx` (rota `/dashboard`, item de menu
"Minha Evolução"), com um **stepper de 5 etapas** — storytelling de análise
para o concurseiro responder "estou no caminho certo?" em passos:

```
Visão Geral → Progresso do Plano → Desempenho → Tendências → Distribuição
```

- Cada etapa é um componente em `src/pages/Dashboard/steps/*.tsx`
  (`OverviewStep`, `PlanProgressStep`, `PerformanceStep`, `TrendsStep`,
  `DistributionStep`), recebendo só `{ activePlanId }` como prop — sem
  header/título/filtro próprios (isso é responsabilidade da página host).
  `PerformanceStep`/`TrendsStep`/`DistributionStep` usam `useStatistics`;
  `OverviewStep`/`PlanProgressStep` usam `useDashboardStats` — ambos os
  hooks já existiam e não mudaram de lógica, só de página consumidora.
- `AnalysisPage` guarda a etapa atual em **query param** (`?etapa=...`) via
  `useSearchParams`, não em estado local — permite recarregar a página ou
  linkar direto para uma etapa específica e mantém o botão voltar do
  navegador funcional entre etapas.
- Indicador de etapas: barra horizontal de círculos numerados (clicáveis,
  pulam direto pra qualquer etapa) conectados por uma linha, etapa atual
  destacada com o gradiente de marca, etapas anteriores marcadas com
  `Check`. Botões "Etapa anterior"/"Próxima etapa" nas pontas.
- `src/components/charts/SubjectPerformanceTable.tsx` (usada por
  `PerformanceStep`): tabela Disciplina/Tempo/Certas/Erradas/%, badge de %
  colorido por faixa (≥70% verde, 60–69% amarelo, <60% vermelho), nome da
  disciplina como link para `/plans/:planId` — dado vem de
  `useStatistics().hoursBySubject` (já calculava `percentualAcerto`,
  `erradas` é `questoes - acertos` calculado na própria tabela).

### Filtro de plano persistente (`useActivePlan`)

`src/hooks/useActivePlan.ts` substitui o padrão antigo de `useState` local
por página para escolher o plano — como o usuário pode ter mais de um
plano de estudo, o plano escolhido é salvo em
`localStorage["studyhub:activePlanId"]` (mesmo padrão de `useTheme`) e
usado por **todas** as 5 etapas de uma vez (troca o plano em qualquer
etapa e a análise inteira recarrega para o novo plano). Se não há valor
salvo, ou o valor salvo não existe mais na lista de planos do usuário, cai
para `plans[0]`. `src/components/dashboard/PlanFilterSelect.tsx` é o
`Select` reaproveitado nas 5 etapas (só renderiza se `plans.length > 1`).

## Cronômetro (`src/hooks/useTimer.ts`)

Baseado em **timestamp, nunca em `setInterval` como fonte da verdade** —
`setInterval` só força re-render a cada 1s, o valor exibido sempre é
recalculado como `accumulatedMs + (Date.now() - segmentStartedAt)`. Suporta
pausa/retomada: `pause()` soma o segmento atual em `accumulatedMs` e zera
`segmentStartedAt`; `resume()` apenas marca um novo `segmentStartedAt`. Isso
garante que o tempo pausado nunca conta como estudado, e que o cronômetro
sobrevive a reload de página (persistido em `localStorage`).

### Tipo de sessão e tópico avulso

Antes de iniciar o cronômetro, além de Plano/Disciplina/Tópico, o usuário
escolhe o **tipo de sessão** (`SessionType`: `"aula"` | `"questoes"` |
`"simulado"`, rótulos em `src/constants/sessionTypes.ts`) — vai junto para
o `ActiveTimerState` (`useTimer.ts`) e é gravado em `StudySession.tipo` ao
salvar. Campo opcional no tipo (`tipo?`), pelo mesmo motivo de `topicoId?`:
sessões antigas no Firestore não têm esse campo e não há migração.

Se o tópico que a pessoa quer estudar não está na lista (copiada do edital
na criação do plano), o botão "Novo tópico" ao lado do Select de Tópico
(`StudyPage.tsx`) abre um formulário (`PlanTopicForm`) que cria um
`PlanTopic` avulso via `createPlanTopic` (`planService.ts`) — mesmo padrão
de `createEditalTopic`, mas gravando direto em `planTopics`, sem tocar no
edital de origem. É a primeira forma de adicionar um tópico a um plano já
criado sem passar por `createPlanFromEdital`; **não** viola "Edital =
template, Plano = cópia" acima porque nunca escreve de volta no edital nem
em outros planos — `topicoOriginalId` fica `undefined`, mesmo tratamento já
prometido pelo tipo `PlanTopic` para tópicos sem proveniência.

## Lançamento manual de sessão de estudo (`/history`)

Além do cronômetro (`/study`), `StudySession` pode ser criada/editada
diretamente na página Histórico (`src/pages/History/HistoryPage.tsx`), via
botões "Adicionar registro"/"Editar" abrindo um `Dialog` com
`src/components/forms/StudySessionForm.tsx` — usado tanto para criar
(sem `defaultValues`) quanto para editar (com `defaultValues` calculados a
partir da sessão clicada, via `sessionToFormDefaults` no próprio
`HistoryPage.tsx`). Schema em `src/schemas/studySession.schema.ts`, seguindo
o padrão de formulário documentado acima.

Diferenças em relação ao cronômetro:
- O tempo é digitado como **horas + minutos** (duração), não como
  início/fim reais — o formulário converte para `inicio`/`fim`/`duracao` no
  handler de submit do `HistoryPage.tsx` (`inicio` = meio-dia da data
  escolhida, para não sofrer deslocamento de dia por fuso horário).
- O campo Tópico é opcional (sentinel `"none"` no `Select`, já que Radix não
  aceita `value=""`) — permite um registro "por disciplina", sem tópico
  específico, útil para importar totais agregados de outra ferramenta de
  estudo (ex.: um lançamento por disciplina em vez de um por tópico).
- Editar/excluir uma sessão manual **não** reconcile `PlanTopic.tempoEstudado`/
  `questoesResolvidas` (mesma limitação que já existia para exclusão antes
  desta feature) — só a criação com tópico definido incrementa esses campos.

### Lançamento em lote (`/history/totais`)

Segunda forma de criar `StudySession`, para quando o usuário tem muitos
registros históricos "por disciplina" para lançar de uma vez (ex.: importar
o resumo de outra ferramenta de estudo) sem repetir o diálogo de "Adicionar
registro" uma vez por disciplina. `src/pages/History/BulkTotalsPage.tsx`:
escolhe um Plano, define uma única Data (aplicada a todas as linhas), e
preenche uma tabela com uma linha por `PlanSubject` do plano (Horas/Minutos/
Certas/Erradas/Brancas, com Total/% calculados ao vivo reaproveitando
`accuracyClassName`, exportado de `SubjectPerformanceTable.tsx`). Linhas
totalmente vazias são ignoradas no envio.

Usa `sessionService.createStudySessionsBatch`/`useCreateStudySessionsBatch`
(`src/hooks/useStudySessions.ts`) — um único `writeBatch` para todas as
linhas preenchidas, todas sem `topicoId` (mesma regra "sem tópico → sem
incremento em `PlanTopic`" da seção anterior). `firestore.rules` não precisa
de mudança: `ownsNewDoc()` já cobre documentos criados via `writeBatch`.

## Cronograma de estudos (`/schedule`)

Gera uma grade semanal fixa (Segunda→Domingo, sem datas — sempre os mesmos 7
dias) a partir das `PlanSubject` visíveis do plano ativo (`useActivePlan`).
Modelo: `Schedule` (a configuração — `minutosPorDia`, `questoesPorDia`,
`materiasPorDia`, `diasEstudo`, `numeroSemanas` — e o `status`: `"ativo"` |
`"arquivado"`) e `ScheduleItem` (uma disciplina atribuída a uma `semana` +
`diaSemana`, com minutos/questões planejados e `concluido`).

- **`materiasPorDia` é um teto fixo, não uma média**: o usuário informa
  quantas disciplinas quer por dia; `generateScheduleItems`
  (`src/utils/scheduleGenerator.ts`, função pura) faz um chunking explícito
  — corta `subjects` (já ordenado pela prioridade escolhida) em blocos de
  `diasEstudo.length × materiasPorDia` (uma "semana") e, dentro de cada
  semana, em blocos de `materiasPorDia` por dia. Se um dia não tem
  disciplina suficiente para preencher o bloco, fica livre — não é
  redistribuída sobra entre dias, é o comportamento mais previsível para um
  teto fixo.
- **Rodízio de semanas quando não cabe em uma só**: se
  `subjects.length > diasEstudo.length × materiasPorDia`, o excedente vira
  semanas seguintes (`ScheduleItem.semana` incrementa por bloco) em vez de
  descartar disciplinas. `computeNumeroSemanas`/`computeScheduleCapacity`
  (mesmo arquivo) calculam isso; a UI (`ScheduleWeekGrid`) navega entre
  semanas com Anterior/Próxima, "Próxima" na última volta para a primeira
  (visualiza o loop). Sem mismatch, `numeroSemanas` é sempre `1` — degrada
  para o caso simples.
- **Resolução do mismatch dentro do próprio formulário**
  (`ScheduleConfigForm.tsx`, sem dialog/wizard separado): quando a
  configuração não cobre todas as disciplinas, aparece um painel condicional
  perguntando (a) estudar todas em rodízio vs. focar num grupo de
  `capacidade` disciplinas agora, e (b) prioridade — "Intercalado"
  (recomendado), "Básicas primeiro" ou "Específicas primeiro". A escolha só
  afeta a **ordem**/corte de `subjects` antes de chamar `generateScheduleItems`
  (em `createSchedule`, `scheduleService.ts`) — não é persistida em
  `Schedule`, é estado transiente da geração.
- **Classificação básica/específica por palavra-chave, não IA**:
  `src/utils/subjectPriority.ts` (`isBasicSubject`, `sortSubjectsByPriority`)
  testa o nome da disciplina contra `BASIC_SUBJECT_KEYWORDS`
  (`src/constants/basicSubjectKeywords.ts`, lista extensível como
  `EDITAL_CATEGORIAS`) — sem chamar um LLM do cliente (ver
  `docs/DECISIONS.md`) nem exigir um campo manual novo por disciplina.
  "Intercalado" alterna item a item entre a sublista de básicas e a de
  específicas (prática intercalada), mantendo a ordem relativa (`ordem` do
  plano) dentro de cada sublista.
- **Reconfigurar arquiva, não sobrescreve**: `createSchedule`
  (`src/services/firestore/scheduleService.ts`) arquiva o `Schedule` ativo
  anterior do plano (`status: "arquivado"`) ao criar um novo, num único
  `writeBatch` — nunca apaga um cronograma antigo. `restoreSchedule` troca
  qual é o ativo (arquiva o atual, marca o escolhido como ativo) sem
  regenerar `ScheduleItem`, permitindo voltar a uma configuração anterior.
- **Capa com dados do edital**: `ScheduleCover` busca o `Edital` de origem
  via `useEdital(plan.editalId)` e mostra nome/órgão/cargo/banca como
  cabeçalho personalizado.
- **Tema visual por carreira**: `src/constants/careerThemes.ts` mapeia
  `Edital.categoria` (mesmas chaves de `EDITAL_CATEGORIAS`) para um
  `CareerTheme` (paleta, gradiente, imagem de fundo, ícone `lucide-react`,
  frases motivacionais), via `getCareerTheme(categoria)` — cai em
  `careerThemes.outros` para categoria vazia/desconhecida, nunca quebra.
  Lista extensível de propósito, mesmo padrão de `EDITAL_CATEGORIAS`:
  adicionar uma carreira nova é só acrescentar uma entrada, sem tocar
  `scheduleGenerator.ts`/`subjectPriority.ts` (a geração do cronograma
  continua 100% agnóstica de carreira).
  `ScheduleCover` usa esse tema para renderizar um hero com imagem de fundo
  que imprime igual à tela (`print-color-adjust: exact` evita clarear as
  cores do tema na impressão) — não existe mais uma variante compacta só
  para impressão; a foto/cores do tema só saem impressas se o usuário
  habilitar "Imprimir gráficos de segundo plano" no navegador (ver
  `docs/DECISIONS.md`). A imagem de cada tema (`CareerTheme.backgroundImage`)
  vem de `public/`
  (`/images/careers/{categoria}.webp`, temas ainda sem foto real) ou de um
  asset importado de `src/assets/` e resolvido pelo bundler (caso do tema
  `policial`, `src/assets/banner/policiais/banner.png`); ela é aplicada em
  camadas de `background-image` (overlay + foto + gradiente do tema); se o
  arquivo de `public/` não existir em disco, aquela camada simplesmente não
  pinta e o gradiente aparece sozinho — sem `onError`/JS. As cores do tema
  são aplicadas via `style` inline **local** ao hero, nunca em
  `:root`/`.dark` (ver `docs/DECISIONS.md`).
- **Progresso do cronograma**: `computeScheduleProgress`
  (`src/utils/scheduleProgress.ts`) calcula a % de `ScheduleItem.concluido`
  sobre **todos** os itens do cronograma ativo (todas as semanas, não só a
  semana exibida) — evita que a barra do hero "pule" ao navegar entre
  semanas.
- **Impressão via `print:` do Tailwind**: `window.print()` reaproveita a
  mesma grade renderizada na tela, em vez de gerar um PDF separado com
  jsPDF/autoTable (que produziria uma tabela simples, não a grade colorida).
  `MainLayout.tsx`/`Topbar.tsx` escondem sidebar/topbar com `print:hidden`;
  botões de ação da página usam a mesma classe. `src/index.css` tem uma
  regra `@page { size: landscape; margin: 12mm; }` global forçando
  paisagem na impressão, pra a grade de 7 dias caber lado a lado — global
  porque `@page` não pode ser escopado por rota em CSS, seguro hoje porque
  `/schedule` é a única página do app que imprime (ver `docs/DECISIONS.md`).

## Tema (claro/escuro)

- `src/index.css`: CSS custom properties em `:root` (claro) e `.dark`
  (escuro), mapeadas para tokens Tailwind v4 via `@theme inline`.
- `src/hooks/useTheme.ts`: chave `localStorage["studyhub:theme"]`, padrão
  **claro** quando não há valor salvo, toggle via classe `.dark` no
  `<html>`.
- A **sidebar tem fundo escuro fixo** (`bg-[#111827]` hardcoded em
  `Sidebar.tsx`) **independente do tema geral** — não usa as CSS variables
  de tema, é intencional (estilo Linear/Notion).
- **Sidebar recolhível** (`src/hooks/useSidebarCollapsed.ts`): mesmo padrão
  de `useTheme.ts` (chave `localStorage["studyhub:sidebarCollapsed"]`, sem
  Context). `MainLayout.tsx` alterna a largura do `<aside>` entre `w-64` e
  `w-[72px]`; `SidebarNav` (`Sidebar.tsx`) recebe `collapsed`/
  `onToggleCollapse` **opcionais** — só o uso desktop em `MainLayout.tsx`
  passa esses props; o `Sheet` mobile em `Topbar.tsx` nunca colapsa (é um
  overlay, não faz sentido recolher um menu que já se fecha sozinho).
  Recolhido, esconde labels/banner motivacional e mostra o nome de cada item
  num `Tooltip` (`TooltipProvider` já envolve o app em `main.tsx`).

## Mapa de pastas

| Pasta | Conteúdo | Exemplo |
|---|---|---|
| `src/pages/<Feature>/` | Uma pasta por feature, página(s) + subcomponentes locais | `pages/Editals/EditalDetailPage.tsx` |
| `components/ui/` | Primitivos shadcn (não editar padrões, só customizar) | `ui/button.tsx` |
| `components/common/` | Componentes genéricos reusáveis entre features | `common/EmptyState.tsx` |
| `components/forms/` | Formulários (RHF+Zod) por entidade | `forms/EditalForm.tsx` |
| `components/charts/` | Componentes de gráfico custom (fora do shadcn `chart`) | `charts/StudyHeatmap.tsx` |
| `components/dashboard/` | Componentes visuais específicos do Dashboard | `dashboard/StatCard.tsx` |
| `components/layout/` | Sidebar, Topbar | `layout/Topbar.tsx` |
| `hooks/` | Um hook por entidade/preocupação, wrapping TanStack Query | `hooks/usePlans.ts` |
| `services/firestore/` | CRUD Firestore puro, sem React | `firestore/editalService.ts` |
| `pages/Admin/` | Painel restrito a admins (`AdminRoute`) | `Admin/UsersPage.tsx` |
| `services/auth/`, `services/firebase/` | Auth wrapper e init do app Firebase | `firebase/config.ts` |
| `schemas/` | Zod schemas + tipos de formulário | `schemas/edital.schema.ts` |
| `constants/` | Nomes de coleção, navegação, cores fixas | `constants/collections.ts` |
| `utils/` | Funções puras (datas, export, cn) | `utils/datetime.ts` |
| `types/` | Modelo de dados central | `types/index.ts` |
