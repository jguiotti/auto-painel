# /frontend — Implementação Frontend (Frontend Phase)

Ative o Frontend Agent. Confirmar antes de escrever código:
- PRD + UX Writer copy + UX design aprovados
- TypeScript contracts em packages/shared/src/types
- Server actions implementadas pelo Backend
- Migrations escritas

Ao implementar:
- UI de @autopainel/shared/ui APENAS — nunca shadcn direto em apps
- Copy do UX Writer — nunca inventar textos
- Tipos de packages/shared/src/types — nunca redefinir localmente
- Identificadores e comentários em inglês; rotas e copy em pt-BR
- Todos os estados: loading (skeleton), empty, error, success, permission-denied, module-inactive
- 'use client' apenas onde estritamente necessário

Path completo + implementação completa por arquivo.
Ao final, listar o que o QA Agent deve verificar.
