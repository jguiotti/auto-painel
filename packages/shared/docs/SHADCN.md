# shadcn/ui no monorepo

## Onde instalar

Só em **`packages/shared`**. Os apps **não** devem ter `components.json` próprio nem cópias de primitives.

Configuração atual: `packages/shared/components.json` (aliases apontam para `@autopainel/shared/...`).

## Adicionar um componente

Na raiz do repositório ou dentro de `packages/shared`:

```bash
cd packages/shared && npm run ui:add -- button
```

Ou:

```bash
npx shadcn@latest add dialog -c packages/shared
```

- Use `-y` para reduzir prompts quando o CLI suportar.
- Após gerar arquivos em `src/ui`, exporte os símbolos novos em **`src/ui/index.ts`**.
- Nos apps, importe de `@autopainel/shared/ui`.

## init / reinstall

Evite rodar `shadcn init` de novo salvo migração major; isso pode sobrescrever `components.json`. Se precisar, use backup ou controle de versão.

## Cursor MCP

Se o projeto tiver o MCP do shadcn, consulte o registro e exemplos antes de adicionar um bloco grande (ex.: formulários complexos).

## Confirmações de ação (UI)

**Não use** `window.alert`, `window.confirm` ou `window.prompt` em nenhum app.

Para pedir confirmação antes de uma ação destrutiva ou irreversível, use **`ConfirmActionDialog`** (`@autopainel/shared/ui`) — wrapper sobre `AlertDialog` com botões Cancelar/Confirmar, estado de loading e exibição de erro inline.

Para avisos informativos (sem confirmação), use `AlertDialog` ou `Dialog` conforme o fluxo.
