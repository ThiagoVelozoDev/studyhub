# Decisões de arquitetura — StudyHub

> Leia este arquivo quando precisar entender **o porquê** por trás de uma
> escolha não óbvia do projeto, antes de propor mudá-la ou de re-discutir
> algo que já foi decidido.

Cada entrada: decisão → alternativas consideradas → motivo.

## Normalizar `Timestamp` do Firestore para `number` no service, não no componente

**Decisão**: `listSchedules` (`src/services/firestore/scheduleService.ts`)
converte `Schedule.createdAt` para `number` (`.toMillis()`) ao mapear os
documentos lidos do Firestore, em vez de converter no componente que exibe a
data (`ArchivedSchedulesList.tsx`).

**Alternativa considerada**: chamar `.toDate()`/`.toMillis()` só no ponto de
exibição (`ArchivedSchedulesList.tsx`), deixando o service continuar
retornando o valor "cru".

**Motivo**: `Schedule.createdAt` é tipado como `number` em `types/index.ts` e
outro código (`.sort()`) já assume esse tipo — normalizar no service faz o
dado bater com o tipo declarado em todo lugar que o consome, em vez de
espalhar `instanceof Timestamp` em cada componente que eventualmente precisar
do valor real. Causa raiz do bug corrigido: campos gravados via
`serverTimestamp()` voltam do Firestore como instância de `Timestamp`, não
como `number` — ver nota no topo de `docs/ARCHITECTURE.md`. Esse problema
ainda existe (não corrigido) em `Edital`/`Plan`/`Goal`/`UserProfile`, que
também gravam `createdAt`/`updatedAt` via `serverTimestamp()`; só foi
corrigido em `Schedule` porque foi o primeiro (e único) lugar que precisou
formatar esse campo como data legível.

## Rodízio de semanas em vez de excluir disciplinas por padrão

**Decisão**: quando as disciplinas do plano não cabem em uma semana com a
configuração de matérias/dia escolhida, o padrão recomendado no cronograma
(`/schedule`) é criar várias semanas em rodízio (`Schedule.numeroSemanas`,
`ScheduleItem.semana`) cobrindo **todas** as disciplinas, em vez de excluir
as que sobram. Excluir um subconjunto ("focar em um grupo agora") é uma
opção alternativa explícita, não o padrão.

**Alternativa considerada**: sempre cortar para caber em uma única semana
(como a v1 fazia implicitamente via round-robin, sem avisar o usuário).

**Motivo**: pedido explícito do usuário — nenhuma disciplina do plano deve
ficar de fora "silenciosamente"; se a configuração escolhida não cobre tudo,
o sistema deve dizer isso e oferecer cobrir tudo via rodízio como primeira
opção.

## Classificação básica/específica por palavra-chave, não IA nem campo manual

**Decisão**: para priorizar disciplinas "básicas" (Português, Redação,
Raciocínio Lógico, Informática, Constitucional, Administrativo) vs.
"específicas" no cronograma, a classificação é feita testando o nome da
disciplina contra uma lista de palavras-chave extensível
(`BASIC_SUBJECT_KEYWORDS`, `src/constants/basicSubjectKeywords.ts`) via
`isBasicSubject` (`src/utils/subjectPriority.ts`).

**Alternativas consideradas**: (a) chamar uma IA para classificar cada
disciplina; (b) adicionar um campo manual `tipo`/`basica` em `PlanSubject`
para o usuário marcar disciplina por disciplina.

**Motivo**: (a) contradiria a decisão já registrada de não chamar IA direto
do cliente (exporia chave de API no bundle — ver "Importar edital via colar
JSON" abaixo); (b) o usuário forneceu diretamente a lista de termos que
considera básicos, então uma constante curada resolve o caso sem exigir
schema novo nem UI de marcação por disciplina. A prioridade "Intercalado" é
o padrão recomendado (não "básicas primeiro"): prática intercalada tem mais
respaldo do que estudar um bloco inteiro de básicas antes de tocar no
conteúdo específico que mais pesa na prova.

## Cronograma semanal fixo, sem datas nem horizonte até a prova

**Decisão**: o cronograma gerado em `/schedule` é um template fixo de
Segunda a Domingo, sempre os mesmos 7 dias, que se repete indefinidamente —
não tem data de início/fim nem é calculado até `Plan.dataProva`.

**Alternativa considerada**: gerar um calendário datado (N semanas, ou até a
data da prova quando cadastrada).

**Motivo**: pedido explícito do usuário — mais simples de entender e de
manter (não precisa recalcular nada quando a data muda ou passa), e cobre o
caso de uso de "o que eu estudo em cada dia da semana" sem exigir um
horizonte configurável.

## Distribuição das disciplinas por chunking de `materiasPorDia`, sem campo de peso novo

**Decisão**: `generateScheduleItems` (`src/utils/scheduleGenerator.ts`)
distribui as `PlanSubject` (já ordenadas pela prioridade escolhida — ver
"Rodízio de semanas" e "Classificação básica/específica" abaixo) em blocos
fixos de `materiasPorDia` por dia, sem nenhum campo de peso/prioridade
estrutural por disciplina no modelo de dados.

**Alternativa considerada**: (a) adicionar um campo de peso/prioridade em
`EditalSubject`/`PlanSubject` para balancear a distribuição; (b) a v1 desta
feature usava round-robin por módulo (ciclar disciplinas pelos dias) em vez
de um teto fixo por dia — substituído depois que o usuário pediu controle
explícito sobre "quantas matérias por dia".

**Motivo**: peso/prioridade **estrutural** no modelo continua não existindo
(a única "carga horária" é `EditalTopic.cargaHorariaSugerida?`, opcional e
nem copiada para `PlanTopic`) — adicionar um campo novo exigiria migração de
schema sem ter sido pedido. A ordenação por prioridade (intercalado/básicas/
específicas) resolve a necessidade de "peso" no nível de geração do
cronograma, não do modelo de dados em si.

## Reconfigurar cronograma arquiva, não sobrescreve

**Decisão**: gerar um novo cronograma para o mesmo plano arquiva o anterior
(`Schedule.status: "arquivado"`) em vez de apagá-lo ou atualizá-lo in-place;
`restoreSchedule` permite voltar a um arquivado depois, só trocando qual é o
`"ativo"`.

**Alternativa considerada**: `updateDoc` in-place no `Schedule` ativo ao
reconfigurar.

**Motivo**: pedido explícito — o usuário quer poder voltar a uma
configuração anterior depois de testar uma nova, sem perder o histórico.

## Impressão do cronograma via `print:` do Tailwind, não jsPDF

**Decisão**: o botão "Imprimir" em `/schedule` chama `window.print()`
reaproveitando a mesma grade semanal renderizada na tela (escondendo
sidebar/topbar via classe `print:hidden`), em vez de gerar um PDF separado
com `jspdf`/`jspdf-autotable` (já usado em `src/utils/export.ts` para o
Histórico). "Exportar para PDF" também é resolvido pelo mesmo caminho: o
usuário escolhe "Salvar como PDF" como destino no próprio diálogo nativo
de impressão do navegador.

O `ScheduleCover` (hero com foto de fundo do tema, cores, ícone, barra de
progresso e frase motivacional) imprime **igual** à tela — não existe mais
uma segunda variante compacta só para impressão. `@page { size: landscape;
margin: 12mm; }` em `src/index.css` força a página a imprimir deitada, pra
a grade de 7 dias caber lado a lado como na tela.

**Alternativas consideradas**:
- `exportScheduleToPdf`, no mesmo padrão de `exportHistoryToPdf`
  (rejeitada — jsPDF/`autoTable` produz uma tabela simples, boa para dados
  tabulares como o Histórico, mas não reproduz a grade semanal colorida
  por disciplina nem o hero com foto de fundo).
- Manter uma versão compacta e sem cor do `ScheduleCover` só para
  impressão, como havia antes, pra garantir que o cronograma coubesse em
  uma página (rejeitada — o pedido passou a ser fidelidade total ao
  visual da tela, não caber em uma página a qualquer custo; ver print
  enviado pelo usuário).
- Trocar a foto de fundo do hero por uma tag `<img>` real, já que ela
  imprime por padrão sem depender de nenhum toggle do navegador
  (rejeitada — a barra de progresso e os selos do hero também usam
  `backgroundColor` inline, que exige o mesmo toggle de qualquer forma;
  misturar as duas técnicas geraria um resultado inconsistente, foto
  aparecendo e cor sólida não, sem eliminar a dependência do navegador).

**Motivo**: impressão nativa do navegador reaproveita exatamente o visual
já construído para a tela, sem duplicar layout numa biblioteca de PDF.

**Limitações conhecidas, aceitas de propósito**:
- Cor de fundo e a foto do hero só aparecem impressas se o usuário
  habilitar "Imprimir gráficos de segundo plano" ("Background graphics")
  no diálogo de impressão do navegador — comportamento padrão de
  qualquer navegador para `background-color`/`background-image`, não
  contornável só com CSS. `print-color-adjust: exact` no hero evita que a
  cor seja clareada pra economizar tinta quando esse toggle já está
  ligado, mas não liga o toggle sozinho.
- `@page` é uma regra global do documento — CSS não permite escopá-la por
  rota/classe. Isso é seguro hoje porque `/schedule` é a única página do
  app que usa `window.print()`/classes `print:`. Se outra página no
  futuro precisar imprimir em retrato, essa regra global precisa ser
  revisitada (ex.: media query condicionada por algum estado, ou aceitar
  que todo o app imprime em paisagem).

## Denormalizar `userId` em todo documento filho

**Decisão**: todo documento filho (`EditalSubject`, `EditalTopic`,
`PlanSubject`, `PlanTopic`, `StudySession`, `Goal`) grava seu próprio campo
`userId`, em vez de derivar a posse a partir do documento pai.

**Alternativa considerada**: checar posse via `get()` cruzado na regra de
segurança (`get(/databases/$(db)/documents/editals/$(editalId)).data.userId
== request.auth.uid`).

**Motivo**: o Firestore rejeita a **query inteira** quando a regra de
segurança de uma coleção depende de um `get()` sobre outro documento — erro
`Missing or insufficient permissions`, mesmo quando os documentos retornados
pertenceriam ao usuário. Só funciona com o campo presente no próprio
documento. Ver `docs/CONFIGURATION.md`.

## Nunca usar `orderBy()` do Firestore

**Decisão**: toda ordenação de listas acontece no cliente, depois de
`getDocs()`.

**Alternativa considerada**: `where("userId","==",userId).orderBy("createdAt")`.

**Motivo**: filtro de igualdade + `orderBy` em campo diferente exige um
índice composto que o projeto não provisiona; a query falharia em runtime
pedindo criação manual do índice. Ver `docs/CONFIGURATION.md`.

## Sem backend próprio / sem Cloud Functions

**Decisão**: o app fala direto com o Firebase client SDK (Auth, Firestore,
Storage) do navegador. Não há `functions/`, `firebase.json` de deploy de
Functions, nem nenhuma API própria.

**Alternativa considerada**: Cloud Functions para lógica de servidor
(cascatas de exclusão, validações, chamada a uma IA para gerar edital).

**Motivo**: escopo do projeto não exigiu lógica que não pudesse rodar no
cliente com regras de segurança bem desenhadas; evita custo/complexidade
operacional de manter Functions.

## Importar edital via colar JSON, não chamando uma IA direto do app

**Decisão**: a tela de import de edital recebe um JSON colado pelo usuário
(gerado externamente, ex. por uma IA em outra aba) e valida/transforma esse
JSON em `Edital`/`EditalSubject`/`EditalTopic`.

**Alternativa considerada**: botão "Gerar com IA" que chama a API da
Anthropic/OpenAI direto do navegador.

**Motivo**: chamar uma API de LLM direto do cliente expõe a chave de API no
bundle do navegador; a alternativa correta seria uma Cloud Function/backend
proxy, que contradiz a decisão "sem backend próprio" acima. Colar JSON
resolve o caso de uso sem exigir nenhum backend.

## Tema padrão claro, sidebar com fundo escuro fixo

**Decisão**: ao redesenhar o Dashboard, o tema padrão do app passou de
escuro para **claro** (`useTheme`, sem valor salvo em `localStorage`). A
sidebar (`Sidebar.tsx`), porém, mantém fundo escuro fixo
(`bg-[#111827]` hardcoded), **independente do tema geral**.

**Alternativa considerada**: sidebar seguindo o tema geral (clara no tema
claro).

**Motivo**: escolha visual intencional, estilo Linear/Notion — sidebar
escura como elemento de identidade visual persistente, não uma preferência
de acessibilidade do usuário.

## Cards do Dashboard usam só dados reais

**Decisão**: os cards de estatística do Dashboard (tópicos concluídos,
sessões, sequência/streak, ranking de disciplinas) mostram exclusivamente
dados derivados do Firestore do próprio usuário.

**Alternativa considerada**: o mockup original (`Prompt_ClaudeCode_
Dashboard_StudyHub.md`, recebido como anexo) previa elementos como ranking
social entre amigos e horários futuros exatos de revisão sugeridos por IA.

**Motivo**: não inventar dados ou funcionalidades que não existem de fato
no app (sem sistema de amigos, sem motor de sugestão de revisão) — um card
com dado fictício é pior do que não ter o card.

## Página "Disciplinas" no menu lateral não criada

**Decisão**: o item "Disciplinas" previsto no mockup original de navegação
não foi implementado como página própria.

**Motivo**: definido como fora de escopo — disciplinas já são navegáveis a
partir de Editais/Planos; uma página dedicada ficou para uma iteração
futura, não bloqueando a entrega do restante do app.

## Carreira do edital como lista extensível, não union type

**Decisão**: `Edital.categoria` é `string`, validada em runtime contra
`src/constants/editalCategorias.ts` (`EDITAL_CATEGORIAS`), em vez de um
union type (`"policial" | "tribunais" | ...`) no próprio tipo `Edital`.

**Alternativa considerada**: `EditalCategoria` como union type estrito no
`types/index.ts`.

**Motivo**: pedido explícito do usuário — a lista de carreiras começa curta
(Policial, Tribunais, Fiscal/Receita, Administrativo/Federal, Outros) mas
deve crescer com o tempo. Union type exigiria tocar no tipo central e em
todo lugar que o usa a cada nova carreira; lista extensível é só adicionar
uma linha na constante.

## Tema de carreira do cronograma escopado localmente, não em tokens globais

**Decisão**: as cores do tema visual por carreira
(`src/constants/careerThemes.ts`) são aplicadas via `style` inline
diretamente nos elementos do hero (`ScheduleCover`), nunca sobrescrevendo
`--primary`/`--background`/demais CSS custom properties em `:root`/`.dark`.

**Alternativa considerada**: sobrescrever os tokens de tema globais (ex.:
`--primary`) enquanto a página `/schedule` está montada, para reaproveitar
componentes shadcn (`Badge`, `Progress`) como estão.

**Motivo**: esses tokens alimentam o app inteiro, inclusive a sidebar (que
já tem fundo hardcoded independente do tema, ver decisão acima) e o
claro/escuro (`useTheme`). Trocar `--primary` globalmente ao entrar em
`/schedule` vazaria a cor da carreira para outras páginas e entraria em
conflito com o tema do usuário. Por isso o hero usa `<span>`/`<div>`
estilizados com as cores do tema em vez de `Badge`/`Progress` do shadcn
(cujas variantes usam os tokens globais) — mantém a identidade visual da
carreira isolada ao próprio componente.

## Editais públicos (admin) em lista única com selo, não abas separadas

**Decisão**: a página de Editais mostra "meus editais" e "editais
oficiais/públicos" numa única grade, cada card com um badge de origem
("Meu edital" vs "Oficial"), em vez de duas abas.

**Alternativa considerada**: `Tabs` separando "Meus editais" de "Editais
públicos".

**Motivo**: escolha do usuário — mais simples de manter e reaproveita o
grid/filtro por carreira já existente sem introduzir um componente de
navegação novo.

## Só admin marca edital como público; dono sempre pode editar o seu

**Decisão**: qualquer usuário cadastra editais normalmente (privados por
padrão); só quem tem `role: "admin"` vê a opção de marcar um edital como
`public` (visível a todos). Edição/exclusão continuam restritas ao dono do
documento, mesmo quando ele é admin e o edital é público.

**Motivo**: pedido explícito — permitir reaproveitamento de editais
"oficiais" curados pelo admin sem abrir mão do isolamento de dados entre
usuários comuns. Reforçado tanto na UI (botões ocultos para não-donos)
quanto em `firestore.rules` (só `isAdmin()` pode setar `public`, só
`ownsDoc()` pode editar/excluir).

## Promoção a admin via painel dentro do app, com bootstrap manual único

**Decisão**: existe uma página `/admin/usuarios` (só para admins) que lista
todos os usuários e alterna Estudante/Administrador. O **primeiro** admin,
porém, precisa ser definido manualmente no Console do Firebase
(`role: "admin"` no documento `users/{uid}`) — não há como escapar desse
passo sem um backend próprio.

**Alternativa considerada**: manter tudo manual via Console (sem painel no
app); ou um código de convite auto-servido guardado em variável de ambiente.

**Motivo**: escolhido pelo usuário — um painel de gestão dentro do app é
mais usável no dia a dia do que repetir edições manuais no Console para
cada novo admin, e é mais seguro que um código de convite embutido no
bundle do navegador. O bootstrap manual único é aceito como custo de não
ter backend/Cloud Functions.

## Meta semanal/mensal calculada a partir da diária × dias selecionados

**Decisão**: ao definir a meta diária de estudo e os dias da semana em que
a pessoa vai estudar (no plano ou na meta padrão de Configurações),
`metaSemanal` e `metaMensal` são recalculados automaticamente como
`diária × dias` e `semanal × 4`, mas continuam editáveis manualmente depois.

**Motivo**: pedido explícito — evitar que o usuário tenha que fazer essa
conta de cabeça toda vez que ajusta a rotina de estudo. `× 4` (não `×
4.33`) foi escolhido por simplicidade; não editável exceto reabrindo a
conversa sobre precisão de semanas por mês.

## Zerar dados do usuário nunca apaga editais

**Decisão**: a "Zona de risco" em Configurações apaga todos os planos
(e disciplinas/tópicos de plano), sessões de estudo e metas do usuário, mas
**nunca** os editais criados por ele.

**Motivo**: pedido explícito — o app ainda está em fase de testes e o
usuário quer poder zerar seu próprio progresso repetidamente sem perder o
trabalho de cadastrar/importar editais toda vez.
