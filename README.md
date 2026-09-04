# Maria Paulina Saboaria

Fundação do aplicativo de gestão da Maria Paulina Saboaria, construída com React, Vite, TypeScript, Tailwind CSS, React Router e Supabase.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env.local` somente quando o projeto Supabase estiver criado. O cliente Supabase tipado fica centralizado em `src/lib/supabase.ts`; nenhuma credencial é mantida no código e o frontend nunca usa `service_role`.

## Banco de dados

A migration inicial está em `supabase/migrations/20260904000000_initial_schema.sql`. Ela cria, sem dados de exemplo:

- `ingredients` e `products`, com estoques separados;
- `formulas` e `formula_items`;
- `customers`;
- `sales` e `sale_items`, preservando o preço praticado na venda;
- `stock_movements`, com histórico e exatamente um item relacionado por movimentação.

Com a Supabase CLI instalada e o projeto vinculado, aplique a migration com:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Este repositório não possui um projeto Supabase vinculado e a migration não foi aplicada remotamente por esta sessão. A existência do arquivo SQL não representa uma aplicação bem-sucedida no projeto remoto.

Todas as tabelas de negócio têm Row Level Security habilitado. Como este é um aplicativo de usuário único sem login, as policies são individuais, limitadas às oito tabelas do aplicativo e concedem operações somente ao papel público `anon`. O schema não expõe outras tabelas nem usa policies genéricas para todo o banco. Essa escolha permite o funcionamento sem sessão, mas não oferece isolamento entre visitantes que obtenham a URL e a chave pública; se o sistema precisar de privacidade ou múltiplos usuários, autenticação e policies por usuário deverão ser reintroduzidas antes de publicar.

As tabelas `ingredients`, `products`, `customers`, `sales` e `stock_movements` são adicionadas à publicação `supabase_realtime` quando ela existir. A migration não simula Realtime e não cria baixa automática de estoque, produção ou notificações.

## Tipos do banco

Os contratos do primeiro módulo estão em `src/types/database.ts` e o cliente Supabase utiliza `createClient<Database>`. Para regenerar tipos a partir de um projeto vinculado, use a CLI:

```bash
npx supabase gen types typescript --linked > src/types/database.generated.ts
```

Depois, revise os aliases usados pelo aplicativo antes de substituir o contrato versionado. A CLI do Supabase não está instalada neste ambiente no momento.

## Verificação

```bash
npm run lint
npm run build
```

## Aplicação funcional

O aplicativo entra diretamente no Dashboard e usa o Supabase como fonte de dados. Os cadastros de insumos, produtos e clientes possuem pesquisa, filtro, criação, edição, ativação/desativação, exclusão protegida por relacionamento e feedback de erro/sucesso. Estoque usa a função transacional `adjust_stock` e mantém histórico em `stock_movements`.

Fórmulas podem ser criadas e editadas sem alterar estoque. Produção usa `produce_formula`, verifica os insumos e atualiza ingredientes, produto e movimentações na mesma operação. Vendas usam `create_sale`, preservam o preço praticado, baixam produtos e podem ser canceladas por `cancel_sale`, com estorno e histórico preservado.

Dashboard, estoque, aniversários, relatórios e configurações consultam dados reais. Não há seeds, mocks, arrays de dados de negócio ou persistência local.

## Estrutura

- `src/components/ui`: componentes visuais reutilizáveis.
- `src/contexts`: estado transversal, incluindo a sessão do Supabase Auth.
- `src/layouts`: composição estrutural da aplicação.
- `src/lib`: integrações e configurações compartilhadas.
- `src/pages`: páginas e estados de cada área.
- `src/types`: contratos TypeScript do domínio.
- `src/services/dataService.ts`: única camada de consultas e mutações do Supabase.
- `supabase/migrations`: migrations SQL versionadas e reproduzíveis.
- `.github/workflows/deploy.yml`: lint, build e deploy no GitHub Pages.

## GitHub Pages

O workflow usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como **Variables** públicas do repositório, não como secrets administrativos. Configure essas duas variables em `Settings > Secrets and variables > Actions > Variables`, habilite GitHub Pages com `GitHub Actions` como source e faça push na branch `main`. O workflow cria `404.html` para preservar o `BrowserRouter` em refresh.

URL esperada para este repositório: `https://sabos1313.github.io/MP-Connect/`. Ela só deve ser considerada publicada depois de uma execução bem-sucedida do workflow de deploy e uma verificação HTTP real.

O workflow `ci.yml` roda em pushes e pull requests. O workflow `deploy.yml` roda em pushes na `main` e por `workflow_dispatch`, executando instalação, lint, testes opcionais, build, upload do artefato e deploy oficial do GitHub Pages.

O build e os testes locais não comprovam que o workflow remoto foi executado nem que o banco remoto está disponível. A migration precisa ser aplicada ao projeto Supabase antes de usar as operações.
