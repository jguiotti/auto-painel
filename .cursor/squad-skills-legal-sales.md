# Squad Skills — Jurídico & Comercial (adição ao squad-skills.md do AutoPainel)

---

## Skill: Cláusulas obrigatórias em todo contrato SaaS AutoPainel

```
1. Objeto (licença de uso, não venda do software)
2. Plano e módulos contratados (referência ao Anexo I)
3. Vigência e renovação automática
4. Valores, reajuste e inadimplência
5. Obrigações da Contratada (SLA por plano)
6. Obrigações da Contratante (uso adequado, veracidade dos dados)
7. Proteção de dados (LGPD — definição de controlador/operador)
8. Propriedade intelectual e dos dados (dados do tenant são do tenant)
9. Rescisão (com janela de exportação de dados pós-cancelamento)
10. Limitação de responsabilidade
11. Confidencialidade
12. Foro
```

---

## Skill: SLA por plano (referência rápida)

```
Starter:    99,0% disponibilidade | suporte até 24h úteis | e-mail
Pro:        99,5% disponibilidade | suporte até 8h úteis  | e-mail + chat
Enterprise: 99,9% disponibilidade | suporte até 2h úteis  | e-mail + chat + telefone
```

---

## Skill: Modelo de dados — Gerador de Contratos (admin-master)

```
contract_templates     — cláusulas versionadas
contracts               — instância por tenant, referencia template_version
contract_status         — draft | sent_for_signature | signed | cancelled
signature_provider_ref  — referência externa (Clicksign/D4Sign/Autentique)
```

Regra inegociável: contrato enviado para assinatura nunca é editado — qualquer
mudança gera aditivo. Template sempre versionado; contrato referencia a versão exata.

---

## Skill: Estágios de Pipeline (CRM AutoPainel)

```
1. Lead novo
2. Qualificação
3. Demonstração agendada
4. Demonstração realizada
5. Proposta enviada
6. Negociação
7. Contrato assinado (ganho)
8. Onboarding
--- Perdido (motivo obrigatório) ---
```

---

## Skill: Entidades de CRM

```
leads        — contato, origem/UTM, ICP fit score
deals        — estágio, valor (MRR), plano de interesse, probabilidade, owner
activities   — histórico de interação (ligação, e-mail, demo) com timestamp
lost_reasons — taxonomia fixa (preço, timing, já tem solução, sem orçamento, concorrente)
proposals    — vinculado ao deal e ao contrato gerado pelo Advogado Agent
```

---

## Skill: Critérios de ICP fit (qualificação rápida)

```
[ ] Tem site próprio ou depende 100% de portal de terceiros?
[ ] Tem volume mínimo viável de estoque?
[ ] Decisor está na conversa ou acessível?
[ ] Já demonstrou dor explícita (não apenas curiosidade)?
```

---

## Skill: Objeções → Resposta (setor automotivo)

```
"Já tenho agência"      → Autonomia, não substituição de quem cuida do visual
"É caro"                 → Comparar custo total atual (agência + ferramentas separadas)
"Não tenho tempo agora"  → Onboarding feito pela equipe AutoPainel, não pelo cliente
"Vou pensar"              → Identificar objeção real: preço, função ou tempo
```

---

## Skill: Métricas mínimas de pipeline a acompanhar desde o dia 1

```
- Taxa de conversão por estágio
- Tempo médio em cada estágio
- Ticket médio (MRR por fechamento)
- Win rate geral
- Top 3 motivos de perda
```
