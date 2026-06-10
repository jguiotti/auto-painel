# Squad Skills — AutoPainel (v2)

Snippets e padrões reutilizáveis. Adicione como Notepad no Cursor.

---

## Stack do projeto

| Camada | Tech |
|--------|------|
| Monorepo | Turborepo |
| Apps | admin-master · dealership-panel · customer-site · marketing-site (Next.js App Router) |
| Shared | packages/shared (UI, types, Supabase client, utils) |
| UI | Tailwind CSS + shadcn/ui via @autopainel/shared/ui |
| Backend | Supabase (Postgres, Auth, Edge Functions, Realtime, Storage) |
| Deploy | Vercel (um projeto por app) |

---

## Skill: Business Rule — formato canônico AutoPainel

```
BR-[N]: [Sujeito] [condição/ação] [restrição].

Exemplos com tenant isolation:
BR-01: Apenas usuários com role `operator` pertencentes ao tenant X podem criar registros para o tenant X.
BR-02: Tenant A nunca deve ver, consultar ou alterar dados do tenant B — enforced por RLS.
BR-03: [Se módulo] Feature só acessível quando effective_feature_keys inclui `xxx_feature`.
BR-04: Exclusão é sempre soft-delete; deleted_at não nulo — nunca DELETE físico em dados auditáveis.
```

---

## Skill: Affected Surfaces (PRD)

```markdown
| App | Affected? | What changes |
|-----|-----------|-------------|
| admin-master | yes/no | [describe] |
| dealership-panel | yes/no | [describe] |
| customer-site | yes/no | [describe] |
| marketing-site | yes/no | [describe] |
```

---

## Skill: TypeScript Contract (packages/shared)

```typescript
// packages/shared/src/types/[domain].ts

export interface CreateXxxRequest {
  tenantId: string;
  name: string;
}

export interface XxxRecord {
  id: string;
  tenantId: string;
  name: string;
  status: XxxStatus;
  createdAt: string; // ISO 8601
  deletedAt: string | null; // soft-delete
}

export type XxxStatus = 'active' | 'inactive' | 'pending';
```

---

## Skill: RLS Migration — padrão AutoPainel (multi-tenant)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_[description].sql

CREATE TABLE public.xxx (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id),
  name        text NOT NULL,
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz DEFAULT now(),
  deleted_at  timestamptz  -- soft-delete
);

ALTER TABLE public.xxx ENABLE ROW LEVEL SECURITY;

-- Tenant isolation
CREATE POLICY "tenant_select" ON public.xxx
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "operator_insert" ON public.xxx
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') = 'operator'
  );

CREATE POLICY "operator_update" ON public.xxx
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'role') = 'operator'
  );
-- No DELETE policy = no physical deletes allowed
```

---

## Skill: Server Action — padrão AutoPainel

```typescript
// apps/[app]/app/[rota]/actions.ts
'use server';

import { createSupabaseServerClient } from '@autopainel/shared/lib/supabase';
import type { CreateXxxRequest, XxxRecord } from '@autopainel/shared/types';

export async function createXxx(input: CreateXxxRequest): Promise<XxxRecord> {
  const supabase = await createSupabaseServerClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  // 2. Module gate (if applicable)
  // const keys = await getEffectiveFeatureKeys(supabase, input.tenantId);
  // if (!keys.includes('xxx_feature')) throw new Error('MODULE_NOT_ACTIVE');

  // 3. Scoped query (RLS + explicit tenant_id)
  const { data, error } = await supabase
    .from('xxx')
    .insert({ ...input, tenant_id: input.tenantId })
    .select()
    .single();

  if (error) throw new Error('INTERNAL'); // never expose raw Supabase error
  return data as XxxRecord;
}
```

---

## Skill: Tenant Isolation Matrix (QA)

```markdown
| Actor | Action | Own tenant data | Other tenant data |
|-------|--------|----------------|-------------------|
| operator (tenant A) | SELECT | ✅ allowed | ❌ 0 rows (RLS) |
| operator (tenant A) | INSERT | ✅ allowed | ❌ blocked (RLS) |
| operator (tenant A) | UPDATE | ✅ allowed | ❌ blocked (RLS) |
| admin (platform) | SELECT | ✅ all tenants | ✅ allowed |
| unauthenticated | any | ❌ 401 | ❌ 401 |
```

---

## Skill: Screen States (Frontend checklist)

Para cada screen/componente, verificar:
- [ ] Loading — skeleton (não spinner genérico se tabela/lista)
- [ ] Empty — copy do UX Writer (nunca inventar)
- [ ] Error — copy do UX Writer, sem raw error code
- [ ] Success — dados renderizados
- [ ] Permission denied — redirect ou hidden, nunca 403 raw
- [ ] Module inactive — upgrade prompt com copy do UX Writer
- [ ] Responsive — mobile/tablet/desktop per UX spec

---

## Skill: UX Writer — Empty State canônico

```
❌ Ruim: "Nenhum registro encontrado."

✅ Bom:
  Headline: "[O que está vazio, em positivo]"
  Descrição: "[Por que está vazio + o que isso significa]"
  CTA: "[Ação para resolver]"

Exemplo:
  Headline: "Seu estoque está vazio"
  Descrição: "Adicione veículos para que eles apareçam aqui e no site da sua loja."
  CTA: "Cadastrar primeiro veículo"
```

---

## Skill: Internal Docs Checklist (internal-docs-living.mdc)

Ao finalizar qualquer feature:
- [ ] `apps/admin-master/content/internal-docs/regras-de-negocio.md` atualizado
- [ ] `apps/admin-master/content/internal-docs/documentacao-tecnica.md` atualizado (migrations, RPCs, paths, env vars)
- [ ] `packages/shared/docs/SUPABASE_TYPES.md` atualizado se novos RPCs
- [ ] `packages/shared/docs/` atualizado se novo contrato de design system

---

## Rotas de documentação interna

- `/painel/documentacao` — hub de docs internos
- `/painel/documentacao/regras-de-negocio` — PRD/BRs operacionais (tabela `platform_internal_documents`, doc_slug=`business_rules`)
- `/painel/documentacao/tecnica` — contratos técnicos (doc_slug=`technical`)
- `packages/shared/docs/` — design system, Supabase types, blueprints cross-cutting
