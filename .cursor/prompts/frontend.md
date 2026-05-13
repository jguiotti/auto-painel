# /frontend — Implementação de UI (Frontend Phase)

Ative o **Frontend Agent** com base nos contratos e design aprovados no contexto.

Antes de escrever qualquer código, confirme que existem:
- PRD com acceptance criteria
- UX design com inventory de screens/componentes
- TypeScript contracts em `packages/shared`
- API/RPC surfaces definidas
- Migrations escritas (ou confirmadas como desnecessárias)

Se algum item faltar, pare e informe.

Ao implementar:
- Identificadores e comentários em **inglês**
- Rotas e copy visível ao usuário em **português**
- Importar tipos de `packages/shared` — nunca redefinir localmente
- Tratar todos os estados: loading, empty, success, error
- `'use client'` apenas onde estritamente necessário

Para cada arquivo: mostrar o path completo e a implementação completa (sem placeholders).

Ao final, listar o que o QA Agent deve verificar.