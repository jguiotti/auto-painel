# Squad Skills — Referências rápidas

Snippets e padrões reutilizáveis para o workflow de squad AutoPainel.
Adicione este arquivo como **Notepad** no Cursor para acesso rápido.

---

## Skill: Business Rule (formato canônico)

```
BR-[número]: [subject] [condition/action] [constraint].
Exemplo:
BR-01: Somente usuários com role `operator` podem criar entradas.
BR-02: O valor deve ser inteiro positivo e menor ou igual ao limite configurado no tenant.
BR-03: Exclusão é sempre soft-delete; registros auditados nunca são apagados permanentemente.
```

---

## Skill: Acceptance Scenario (Given/When/Then)

```
Scenario: [nome descritivo — ação do usuário + resultado esperado]
  Given [estado do sistema / pré-condições]
  When  [ação do usuário ou chamada de API]
  Then  [resultado observável]
  And   [resultado adicional se necessário]
```

Mínimo por feature: 1 happy path + 2 caminhos negativos/edge.

---

## Skill: TypeScript Contract (packages/shared)

```typescript
// packages/shared/types/[domain].ts

/** Request to create a new Xxx entry */
export interface CreateXxxRequest {
  tenantId: string;
  name: string;
  // ...
}

/** Persisted Xxx record returned from API */
export interface XxxRecord {
  id: string;
  tenantId: string;
  name: string;
  status: XxxStatus;
  createdAt: string; // ISO 8601
}

export type XxxStatus = 'active' | 'inactive' | 'pending';
```

---

## Skill: RLS Policy (Supabase migration)

```sql
-- Enable RLS
ALTER TABLE public.xxx ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: only see own-tenant rows
CREATE POLICY "tenant_isolation_select" ON public.xxx
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Only operators can insert
CREATE POLICY "operator_insert" ON public.xxx
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') = 'operator'
  );

-- Soft delete: update only, no hard DELETE
CREATE POLICY "operator_update" ON public.xxx
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') = 'operator'
  );
```

---

## Skill: Permission Matrix (QA)

```markdown
| Role          | Action        | Expected         |
|---------------|---------------|------------------|
| `operator`    | view list     | ✅ tenant rows only |
| `operator`    | create entry  | ✅ allowed        |
| `end_user`    | view list     | ✅ own records    |
| `end_user`    | create entry  | ❌ 403            |
| unauthenticated | any request | ❌ 401            |
```

---

## Skill: Screen States Checklist

Para cada screen/componente, verificar:

- [ ] **Loading** — skeleton ou spinner enquanto dados chegam
- [ ] **Empty** — mensagem + CTA quando não há dados
- [ ] **Success** — dados renderizados corretamente
- [ ] **Error** — mensagem amigável, sem vazar detalhes internos
- [ ] **Permission denied** — componente oculto ou redirect, não erro genérico
- [ ] **Mobile** — layout responsivo conforme breakpoints do UX spec

---

## Skill: Execution Prompt (para coding passes)

```
[Prompt N — descrição curta]
Contexto: [uma frase do que já existe]
Tarefa: Implemente [o quê] no(s) arquivo(s) [paths].
Constraints:
- Não toque em outros arquivos além dos listados.
- Use os tipos de `packages/shared/types/[domain].ts` — não redefina.
- [outras restrições específicas]
Entrega esperada: [o que deve existir ao final]
```

---

## Skill: Internal Docs Update Checklist (per internal-docs-living.mdc)

Ao finalizar qualquer feature que muda comportamento de produto:

- [ ] `apps/admin-master/content/internal-docs/regras-de-negocio.md` atualizado
- [ ] `apps/admin-master/content/internal-docs/documentacao-tecnica.md` atualizado
- [ ] DB-backed docs atualizados em `/painel/documentacao` (se o time já usa a tabela `platform_internal_documents`)
- [ ] Links para referências cross-cutting em `packages/shared/docs/` revisados
