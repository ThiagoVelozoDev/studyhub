# Decisões de arquitetura — StudyHub

> Leia este arquivo quando precisar entender **o porquê** por trás de uma
> escolha não óbvia do projeto, antes de propor mudá-la ou de re-discutir
> algo que já foi decidido.

Cada entrada: decisão → alternativas consideradas → motivo.

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
