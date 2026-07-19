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

Todo documento — incluindo `editalSubjects`/`editalTopics`/`planSubjects`/
`planTopics` — possui um campo `userId` denormalizado diretamente nele
(não apenas nos documentos de topo `editals`/`plans`/`studySessions`/
`goals`). Leitura/escrita é restrita ao dono comparando esse campo com
`request.auth.uid`; posse **não** é validada via lookup no documento pai,
porque o Firestore rejeita a query inteira quando a regra depende de um
`get()` cruzado. Ver `docs/CONFIGURATION.md` para o conteúdo completo das
regras e o motivo.

## Documentação

Este projeto usa Claude Code e mantém documentação de contexto dedicada em
[`CLAUDE.md`](CLAUDE.md) e na pasta [`docs/`](docs/) — stack, arquitetura,
configuração, decisões e testes. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
é a especificação viva do produto (modelo de dados e padrões de projeto).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (type-check + Vite build)
- `npm run preview` — pré-visualização do build
