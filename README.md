# StudyHub — Gerenciamento de Estudos

SaaS de gerenciamento de estudos para concursos: editais (templates), planos
(cópias personalizáveis), cronômetro de estudos, dashboard, estatísticas e
histórico. React 19 + TypeScript + Vite + Firebase.

## Configuração

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   e ative **Authentication** (E-mail/Senha), **Firestore** e **Storage**.
2. Copie `.env.example` para `.env` e preencha com as credenciais do seu app
   web (Configurações do projeto → Seus apps → SDK setup).
3. Instale as dependências e rode o projeto:

```bash
npm install
npm run dev
```

## Regras de segurança do Firestore

Cada documento das coleções `editals`, `plans`, `studySessions` e `goals`
possui um campo `userId`. Restrinja leitura/escrita ao dono do documento, e
para `editalSubjects`/`editalTopics`/`planSubjects`/`planTopics` valide pelo
`editalId`/`planoId` do documento pai.

## Estrutura

Veja `CLAUDECODE_INSTRUCTIONS.md` para a especificação completa do produto.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (type-check + Vite build)
- `npm run preview` — pré-visualização do build
