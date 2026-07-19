# Configuração — StudyHub

> Leia este arquivo quando precisar entender **Firebase, regras de
> segurança, variáveis de ambiente ou o PWA**, sem precisar abrir
> `firestore.rules`/`config.ts`/`.env.example` diretamente.

## Sem backend próprio

Confirmado: não há `firebase.json`, `.firebaserc` nem pasta `functions/` no
projeto. O app fala **direto com o Firebase client SDK** (Auth, Firestore,
Storage) do navegador — não existe nenhuma API própria nem Cloud Function.

## Coleções Firestore (`src/constants/collections.ts`)

| Constante | Nome da coleção |
|---|---|
| `USERS` | `users` |
| `EDITALS` | `editals` |
| `EDITAL_SUBJECTS` | `editalSubjects` |
| `EDITAL_TOPICS` | `editalTopics` |
| `PLANS` | `plans` |
| `PLAN_SUBJECTS` | `planSubjects` |
| `PLAN_TOPICS` | `planTopics` |
| `STUDY_SESSIONS` | `studySessions` |
| `GOALS` | `goals` |

Todas são coleções de nível raiz (não sub-coleções aninhadas) — a hierarquia
lógica (edital → disciplina → tópico) é modelada via campos de referência
(`editalId`, `disciplinaId`...), não via caminho do documento.

## Regras de segurança (`firestore.rules`)

Conteúdo completo:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function ownsUserId(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // get() em um caminho FIXO (o próprio uid de quem chama) — não varia por
    // documento retornado, então é seguro mesmo em regras de list/query.
    // Diferente do caso de ownsDoc() abaixo, que é sobre um get() cruzado
    // que variaria por documento (isso sim quebra queries).
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    // Dono via userId denormalizado no próprio documento. Evitamos checar a
    // posse via get() em um documento pai (ex: editalSubjects -> editals):
    // o Firestore não consegue validar estaticamente uma *query* (coleção
    // inteira) quando a regra depende de um get() cruzado, e rejeita a query
    // inteira com "Missing or insufficient permissions" mesmo quando os
    // documentos retornados pertenceriam ao usuário. Com userId direto no
    // documento, a regra é resolvida por documento sem lookups extras.
    function ownsDoc() {
      return isSignedIn() && resource.data.userId == request.auth.uid;
    }

    function ownsNewDoc() {
      return isSignedIn() && request.resource.data.userId == request.auth.uid;
    }

    // users/{uid}: dono pode editar o próprio perfil, mas não o próprio
    // campo `role` (evita auto-promoção a admin). Um admin pode ler/alterar
    // o role de qualquer usuário (necessário para o painel de gestão).
    match /users/{uid} {
      allow read: if ownsUserId(uid) || isAdmin();
      allow create: if ownsUserId(uid);
      allow update: if (ownsUserId(uid) && request.resource.data.role == resource.data.role) || isAdmin();
    }

    // editals: dono via userId, OU público (visível a todos). Só admin pode
    // marcar/desmarcar `public`.
    match /editals/{editalId} {
      allow read: if ownsDoc() || resource.data.public == true;
      allow create: if ownsNewDoc() && (request.resource.data.public == false || isAdmin());
      allow update: if ownsDoc() && (request.resource.data.public == resource.data.public || isAdmin());
      allow delete: if ownsDoc();
    }

    // editalSubjects: userId/public denormalizados do edital pai
    match /editalSubjects/{subjectId} {
      allow read: if ownsDoc() || resource.data.public == true;
      allow create: if ownsNewDoc() && (request.resource.data.public == false || isAdmin());
      allow update: if ownsDoc() && (request.resource.data.public == resource.data.public || isAdmin());
      allow delete: if ownsDoc();
    }

    // editalTopics: userId/public denormalizados do edital pai
    match /editalTopics/{topicId} {
      allow read: if ownsDoc() || resource.data.public == true;
      allow create: if ownsNewDoc() && (request.resource.data.public == false || isAdmin());
      allow update: if ownsDoc() && (request.resource.data.public == resource.data.public || isAdmin());
      allow delete: if ownsDoc();
    }

    // plans: dono direto via userId
    match /plans/{planId} {
      allow read, update, delete: if ownsDoc();
      allow create: if ownsNewDoc();
    }

    // planSubjects: userId denormalizado do plano pai
    match /planSubjects/{subjectId} {
      allow read, update, delete: if ownsDoc();
      allow create: if ownsNewDoc();
    }

    // planTopics: userId denormalizado do plano pai
    match /planTopics/{topicId} {
      allow read, update, delete: if ownsDoc();
      allow create: if ownsNewDoc();
    }

    // studySessions: dono direto via userId
    match /studySessions/{sessionId} {
      allow read, update, delete: if ownsDoc();
      allow create: if ownsNewDoc();
    }

    // goals: dono direto via userId
    match /goals/{goalId} {
      allow read, update, delete: if ownsDoc();
      allow create: if ownsNewDoc();
    }
  }
}
```

**Importante — deploy manual**: mudanças em `firestore.rules` só valem
depois de publicadas no Console do Firebase (Firestore → Regras → colar o
conteúdo acima → Publicar) ou via `firebase deploy --only firestore:rules`
(precisa do Firebase CLI configurado, que este projeto não tem). Enquanto
as regras antigas (sem suporte a `public`/`isAdmin`) continuarem publicadas,
`listPublicEditals()` falha com `Missing or insufficient permissions` — por
isso `useEditals()` (`src/hooks/useEditals.ts`) trata essa falha como
degradação suave (cai para só os editais próprios) em vez de quebrar a
página inteira. Ainda assim, os editais públicos só ficam realmente visíveis
a outros usuários **depois** do deploy destas regras.

**Bootstrap do primeiro admin**: não existe fluxo no app para criar o
primeiro administrador — é necessário editar manualmente o documento
`users/{uid}` do usuário desejado no Console do Firebase (Firestore →
coleção `users` → documento do usuário → adicionar campo `role` com valor
`"admin"`). A partir daí, promover/rebaixar qualquer outro usuário é feito
dentro do app, em `/admin/usuarios` (ver `docs/ARCHITECTURE.md`).

**Por que `userId` é denormalizado em todo documento filho**, em vez de
checar posse via `get()` no documento pai (ex.: `editalSubjects` checando
`get(/databases/$(database)/documents/editals/$(editalId)).data.userId`):
o Firestore **rejeita a query inteira** quando a regra de segurança depende
de um `get()` cruzado sobre um documento diferente do que está sendo lido,
com `Missing or insufficient permissions` — isso acontece mesmo quando todos
os documentos retornados pertenceriam legitimamente ao usuário autenticado.
A regra precisa ser resolvível **por documento, sem lookups extras**, então
`userId` é gravado diretamente em cada `EditalSubject`/`EditalTopic`/
`PlanSubject`/`PlanTopic`/`StudySession`/`Goal` no momento da criação.

## Gotcha de índice composto (por que não há `orderBy()`)

Nenhuma query do app usa `.orderBy()` do Firestore. Motivo: uma query com
**filtro de igualdade + `orderBy` em campo diferente** exige um índice
composto que precisa ser criado manualmente no console do Firebase (ou via
`firestore.indexes.json` + deploy) — o projeto não provisiona nenhum, e a
query falharia em runtime com um erro pedindo a criação do índice. Solução
adotada: todas as queries filtram só por igualdade (`where("userId", "==",
userId)`, `where("editalId", "==", editalId)` etc.) e a **ordenação é sempre
feita no cliente**, depois de `getDocs()` (ver `docs/ARCHITECTURE.md` →
padrão de serviço Firestore).

Corolário direto do ponto acima: como a regra de segurança depende do campo
`userId` do documento, e uma query só pode ser validada estaticamente pela
regra se **todo campo do qual a regra depende aparecer como filtro de
igualdade explícito na própria query**, toda sub-query (`editalSubjects`,
`editalTopics`, `planSubjects`, `planTopics`, `studySessions`, `goals`)
inclui `where("userId", "==", userId)` — mesmo quando já filtra por
`editalId`/`planoId`. Omitir esse filtro faz a query inteira ser rejeitada,
não apenas os documentos de outros usuários.

Exceção deliberada: `listEditalSubjects`/`listEditalTopics`
(`src/services/firestore/editalService.ts`) aceitam um `opts.public`, que
troca o filtro `where("userId","==",...)` por `where("public","==",true)` —
usado quando `createPlanFromEdital` copia disciplinas/tópicos de um edital
público de **outro** usuário (o filtro por `userId` do criador do plano
nunca bateria, já que o documento pertence ao dono original do edital).

## `ignoreUndefinedProperties: true` (`src/services/firebase/config.ts`)

```ts
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
```

Campos opcionais do modelo de dados (`descricao`, `dataProva`,
`cargaHorariaSugerida`, `observacoes`, `ultimaRevisao`...) são frequentemente
passados pelo código como `undefined` em vez de omitidos do objeto. Por
padrão o Firestore **rejeita** valores `undefined` em qualquer campo — essa
flag faz o SDK simplesmente omitir esses campos na escrita, em vez de lançar
erro.

## Variáveis de ambiente (`.env` / `.env.example`)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Todas as 6 são obrigatórias — vêm do console do Firebase (Configurações do
projeto → Seus apps → SDK config). Setup de um projeto Firebase novo:

1. Criar o projeto no console do Firebase.
2. Ativar **Authentication** → métodos "E-mail/senha" e "Google".
3. Ativar **Firestore Database** (modo produção) e publicar o conteúdo de
   `firestore.rules` (Console → Firestore → Regras, ou via Firebase CLI).
4. Ativar **Storage** (usado para upload de avatar/arquivos, se aplicável).
5. Copiar as 6 credenciais para `.env` (nunca commitar `.env`, só
   `.env.example`).

**Vite só lê `.env` na inicialização do servidor** — qualquer mudança nessas
variáveis exige reiniciar `npm run dev`, não é hot-reloaded.

## PWA (`vite-plugin-pwa`, configurado em `vite.config.ts`)

- `registerType: 'autoUpdate'` — service worker atualiza sem exigir ação do
  usuário.
- `workbox.maximumFileSizeToCacheInBytes: 4 * 1024 * 1024` (4 MB) — o padrão
  de 2 MB do Workbox não cobria o bundle principal do app.
- `manifest`: nome "StudyHub - Gerenciamento de Estudos", `theme_color`/
  `background_color` `#0f172a`, `display: 'standalone'`, um único ícone SVG
  (`favicon.svg`, `sizes: 'any'`) — não há conjunto de ícones PNG em
  múltiplos tamanhos.
