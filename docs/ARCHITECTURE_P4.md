# P4 — Multi-client (Insight + Ana 3D)

Este documento complementa `ARCHITECTURE_P1/P2/P3.md`, que descrevem a
arquitetura original de upload, análise e viewer 3D. A P4 não substitui nada
daquilo: apenas adiciona uma camada de isolamento para que mais de um
site/aplicação use o mesmo projeto Supabase.

## O que muda

- Nova tabela `public.clients` (`id`, `slug`, `name`, timestamps), populada
  com `insight` e `ana-3d`.
- `model_uploads.client_id` (`uuid`, `NOT NULL`, `REFERENCES clients(id)`),
  adicionada em três passos na migration `20260905120000_p4_multi_client.sql`
  para não quebrar dados existentes:
  1. coluna nullable;
  2. backfill de todas as linhas existentes para o client `insight`;
  3. `NOT NULL` + índices, só depois do backfill confirmado.
- `model_analyses` **não** ganha `client_id` próprio: ela só existe em
  relação 1:1 com um `model_uploads` (via `model_upload_id`), então o
  isolamento por client já é herdado dessa relação. Duplicar a coluna ali
  seria redundante.
- `insight_rate_limits` também não ganha `client_id`: rate limit é controle
  de abuso por IP/rota, não é dado de negócio de um client.

## Onde vive o isolamento

Antes da P4, `model_uploads` e `model_analyses` já tinham RLS habilitado e
**nenhuma policy pública**: todo acesso passa pelas Edge Functions usando a
service role, nunca pela chave anônima diretamente. Isso significa que
`anon`/`authenticated` continuam sem qualquer leitura ou escrita direta —
adicionar `clients` não muda esse modelo de confiança.

O isolamento entre Insight e Ana 3D acontece em dois lugares:

1. **Banco:** `client_id` é `NOT NULL` com `FOREIGN KEY` para `clients`, e há
   índice composto `(client_id, upload_status)`. Um valor de `client_id`
   inválido é rejeitado pela constraint, não apenas pela aplicação.
2. **Edge Functions:** cada função (`create-model-upload`,
   `complete-model-upload`, `remove-model-upload`, `start-model-analysis`,
   `save-model-analysis`) recebe um `clientSlug` no payload, resolve o
   `client_id` correspondente no servidor (`_shared/client-resolver.ts`) e
   inclui `.eq("client_id", clientId)` em toda consulta a `model_uploads`.
   Um upload do Insight nunca é retornado, atualizado ou removido por uma
   chamada com `clientSlug: "ana-3d"`, e vice-versa.

Nenhum frontend envia um `client_id` (UUID) diretamente — apenas o `slug`
público, que é resolvido no servidor. Isso evita que alguém falsifique um
`client_id` arbitrário a partir do browser.

## Identificação da aplicação no frontend

Cada frontend declara seu client uma única vez, em
`src/config/app.config.js`:

```js
export const APP_CLIENT = Object.freeze({ slug: "ana-3d" }); // ou "insight"
```

`upload-service.js` e `analysis-service.js` usam `APP_CLIENT.slug` como
valor padrão de `clientSlug` em toda chamada às Edge Functions, então nenhum
outro componente precisa conhecer o slug diretamente.

## Limitação conhecida

RLS em `clients`, `model_uploads` e `model_analyses` está habilitado mas sem
policies permissivas — o mesmo padrão já usado desde a P1 para essas tabelas.
Isso é intencional enquanto todo acesso passa por Edge Functions com service
role. Se no futuro o frontend passar a consultar essas tabelas diretamente
com a chave anônima (ex.: um dashboard client-side), será necessário
introduzir policies que filtrem por `client_id` a partir de um claim de JWT
autenticado — hoje não há autenticação de usuário final, então essa policy
ainda não pode ser escrita com segurança.
