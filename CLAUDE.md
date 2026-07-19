# StudyHub

SaaS de gerenciamento de estudos para concursos: editais (templates),
planos de estudo personalizados, cronômetro de sessões, dashboard e
estatísticas. React + TypeScript + Vite + Tailwind v4 + shadcn/ui +
TanStack Query + Firebase (Auth/Firestore/Storage, sem backend próprio).

## Índice de documentação

Este arquivo é carregado automaticamente em toda sessão — fica curto de
propósito. Os arquivos abaixo têm o conteúdo detalhado e devem ser lidos
sob demanda (`Read`/`Grep`), não de antemão:

- [docs/STACK.md](docs/STACK.md) — dependências e versões exatas,
  shadcn/ui, TypeScript/Vite/build, scripts npm. Ler antes de adicionar ou
  atualizar uma dependência.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — modelo de dados completo,
  padrão de serviço Firestore/hooks/formulários, auth, cronômetro, tema,
  mapa de pastas. Ler antes de criar uma entidade, serviço, hook ou
  formulário novo.
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md) — coleções Firestore,
  `firestore.rules` completo, variáveis de ambiente, PWA. Ler antes de
  mexer em regra de segurança, query nova ou config do Firebase.
- [docs/DECISIONS.md](docs/DECISIONS.md) — porquê de escolhas não óbvias
  (ADR curto). Ler antes de propor mudar algo que pareça estranho à
  primeira vista — pode já ter sido decidido de propósito.
- [docs/TESTING.md](docs/TESTING.md) — como verificar mudanças (sem suite
  automatizada). Ler antes de considerar uma tarefa concluída.
- [CHANGELOG.md](CHANGELOG.md) — histórico cronológico de entregas.

## Regra de manutenção

Sempre que uma mudança alterar stack, padrão de código, configuração ou
decisão de arquitetura: atualizar o `docs/*.md` correspondente **e**
adicionar uma entrada no topo do `CHANGELOG.md`, na mesma tarefa — não
deixar para depois.
