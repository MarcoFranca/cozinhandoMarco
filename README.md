Cozinhando com Marco — MVP

Um app enxuto para organizar o pipeline do canal (receitas → gravação → compras), com Supabase + Next.js 15 + shadcn/ui.

Visão Geral

Principais telas

Home: visão do dia (próximas gravações, compras, pipeline).

Receitas: listar/filtrar/buscar, criar, duplicar, excluir.

Receita (detalhe): Panorama, Ingredientes (CRUD), Instruções (CRUD), Gravações (CRUD).

Compras: itens por receita, filtro de opcionais, seleção de receitas, lista unificada (soma quantidades), limpar marcados/tudo.

Calendário: visão mensal das gravações com link para a receita.

Navegação

Navbar fixa (desktop), BottomTabBar (mobile), Breadcrumbs, botão “Voltar”.

Stack

Next.js 15 (RSC + Server Actions)

TypeScript (tipagem forte; nada de any)

Supabase (Postgres + Auth + RLS)

shadcn/ui + Tailwind

lucide-react (ícones)

Estrutura de Pastas (essencial)
src/
app/
(app)/layout.tsx              # layout pós-login (Navbar + BottomTabBar)
actions-auth.ts               # signOutAction()
calendar/page.tsx             # calendário mensal
recipes/
page.tsx                    # lista + NewRecipeDialog
actions/
index.ts                  # proxy ("use server") -> imports dinâmicos
common.ts                 # helpers server (parse/sanitize/nextPosition)
recipes.ts                # criar/duplicar/excluir/atualizar metadados
ingredients.ts            # CRUD + mover
instructions.ts           # CRUD + mover
recordings.ts             # CRUD
shopping.ts               # push para compras, toggle, limpar
[id]/page.tsx               # detalhe da receita (tabs)
components/
nav/                          # AppNavbar, BottomTabBar, Breadcrumbs, BackLink
home/                         # widgets da Home
recipes/                      # RecipeOverview, RecipeIngredients, etc
shopping/                     # ShoppingHeader, ShoppingList, ShoppingUnifiedList
calendar/                     # CalendarMonth
ui/                           # shadcn/ui
constants/
routes.ts                     # rotas usadas pela navbar/breadcrumbs
taxonomies.ts                 # categorias (PT-BR), dificuldades, status, record statuses
lib/
auth.ts                       # requireUser()
supabase/
server-rsc.ts               # client para Server Components
server-actions.ts           # client para Server Actions
types/
db.ts                         # tipos de linhas (RecipeRow, RecordingRow, etc)

Pré-requisitos

Node 18+

pnpm ou npm

Projeto Supabase com:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Variáveis de Ambiente

Crie .env.local:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...


Importante: usamos cookies do Supabase SSR; não precisa Service Role no código do app.

Scripts
# desenvolvimento
pnpm dev

# build / produção
pnpm build
pnpm start

# qualidade
pnpm lint
pnpm typecheck

Banco de Dados (resumo)

Tabelas:

recipes (id, user_id, name, category, status, difficulty, prep_time_minutes, youtube_url, cover_url, updated_at)

recipe_ingredients (id, user_id, recipe_id, name, amount, unit, note, optional, position)

recipe_instructions (id, user_id, recipe_id, step, text, duration_minutes)

recordings (id, user_id, recipe_id, shoot_date, shoot_status, scene_notes, equipment_checklist)

shopping_list_items (id, user_id, recipe_id, ingredient_name, quantity, note, in_pantry, recipe_ingredient_id)

Views úteis:

recipes_with_counts (agrega contagem de ingredientes).

RLS recomendada (conceito):

Todas as tabelas com políticas user_id = auth.uid() para SELECT/INSERT/UPDATE/DELETE.

Decisões de Design

Server Actions por domínio (recipes/ingredients/instructions/recordings/shopping) e um proxy actions/index.ts com "use server" chamando cada módulo via import dinâmico.

TypeScript forte: tipos em types/db.ts e enums/labels centralizados em constants/taxonomies.ts.

Next 15: params e searchParams são assíncronos → sempre await.

Ordenação posicional (position/step) com saltos de 10 (troca simples up/down).

Lista unificada soma por (nome + unidade) para evitar erros (conversão de unidades fica para o próximo passo).

UX: foco em MVP limpo (rounded-2xl, hover, acessibilidade básica, atalhos via UI).

Funcionalidades (Checklist)

Login obrigatório em todas as páginas internas (requireUser).

Logout (botão Sair na Navbar).

Receitas: listar, filtrar (status/categoria/dificuldade), buscar, criar (categoria em PT-BR), duplicar, excluir.

Receita (detalhe):

Panorama → Progresso, resumo, editar metadados, “Enviar p/ compras”.

Ingredientes → CRUD, opcional, mover, quick add, bulk add (parser “200 g farinha”, “3 ovos”).

Instruções → CRUD + mover + duração.

Gravações → CRUD (status PT-BR).

Compras:

Itens por receita, badge “Opcional”.

Filtros: Pendentes/Todos, Ocultar opcionais.

Seleção de receitas (chips).

Lista unificada (soma quantidades por nome/unidade).

Limpar marcados e Limpar tudo.

Calendário: mês a mês, contagem por dia, links para receita (aba Gravações).

Navegação: Navbar, BottomTabBar, Breadcrumbs, BackLink.

Como Rodar (passo a passo)

Configure .env.local (Supabase URL e Anon Key).

Instale deps: pnpm install (ou npm i).

Rode: pnpm dev.

Acesse http://localhost:3000.

Crie usuário via fluxo do Supabase (ou magic link), logue.

Cadastre sua primeira receita → ingredientes → instruções → gravação → compras.

Troubleshooting

“Auth session missing!”
Garanta que está autenticado. Em dev, abra /login e faça sign-in.
Verifique NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.

Next 15: params/searchParams should be awaited
Tipar em páginas:

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };
const { id } = await params; const { tab } = await searchParams;


“Only async functions allowed in 'use server' file”
No proxy actions/index.ts, cada export deve ser async e fazer await import("./module").

TypeScript “no overlap” em unions
Use type guards (ex.: isRecordingStatus) e dicionários (RECORDING_STATUS_LABELS) para labels.

Roadmap (opcional)

Conversão de unidades na lista unificada (kg ↔ g, ml ↔ l).

“Copiar” e “Imprimir” lista unificada.

Edição inline de quantidade/nota em Compras.

Modo Mercado (corredores por ingrediente).

Checklist de equipamentos em Gravações (JSONB) com template.

Seed/Migrations versionadas.

Testes básicos + métricas.

Convenções de UI

shadcn/ui; spacing consistente; rounded-2xl; hover:bg-muted/50; focus-visible ativo.

Labels em PT-BR (categorias, status, dificuldades).

Licença

Uso interno do projeto Cozinhando com Marco. Ajuste conforme a necessidade do cliente.