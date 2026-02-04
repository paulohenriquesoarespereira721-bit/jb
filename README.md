# Sistema de Controle Financeiro

Sistema completo de controle financeiro com gerenciamento de mensalidades, entradas e gastos.

## Funcionalidades

### Sincronização em Tempo Real
- **Atualização Automática**: Todas as mudanças são salvas e refletidas instantaneamente
- **Múltiplos Usuários**: Quando um usuário faz uma alteração, todos os outros veem automaticamente
- **Sem Refresh Manual**: Não é necessário recarregar a página para ver atualizações
- Funciona em todas as páginas: Dashboard, Mensalidades, Entradas e Gastos

### Dashboard (Início)
- **Caixa Atual**: Saldo total em caixa (Entradas - Gastos)
- **Investimento**: Valor aplicado
- **Entrada Mensal**: Total de entradas do mês atual
- **Filhos da Casa**: Quantidade de membros ativos
- **Caixa da Casa**: Histórico mensal com entradas, gastos e saldo

### Mensalidades
- Cadastro de membros com nome e valor da mensalidade
- Controle de status (ativo/inativo)
- Gerenciamento de pagamentos mensais
- Status de pagamento (pago/pendente) por mês
- Edição e exclusão de membros

### Entradas
- Registro de valores recebidos
- Filtro por mês e ano
- Total do período
- Exclusão de registros

### Gastos
- Registro de despesas
- Filtro por mês e ano
- Total do período
- Exclusão de registros

## Tecnologias

- **Next.js 13** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Banco de dados PostgreSQL)
- **shadcn/ui** (Componentes UI)
- **Lucide React** (Ícones)

## Como Executar Localmente

1. Clone o repositório

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse http://localhost:3000

## Deploy na Vercel

1. Faça push do código para um repositório Git (GitHub, GitLab, Bitbucket)

2. Acesse [vercel.com](https://vercel.com) e faça login

3. Clique em "Add New Project"

4. Importe seu repositório

5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. Clique em "Deploy"

A Vercel irá automaticamente detectar que é um projeto Next.js e configurar tudo corretamente.

## Autenticação e Controle de Acesso

O sistema possui dois níveis de acesso:

### Acesso Público
- Qualquer pessoa pode visualizar todos os dados do sistema
- Dashboard, mensalidades, entradas e gastos são visíveis para todos
- Nenhum login é necessário para visualização

### Acesso Administrativo
- Senha: **88410205**
- Clique no botão "Admin" no canto superior direito
- Digite a senha para obter acesso administrativo
- Com acesso admin, é possível:
  - Adicionar, editar e excluir membros
  - Registrar novos pagamentos de mensalidades
  - Adicionar e excluir entradas
  - Adicionar e excluir gastos
  - Ativar/desativar membros

Os dados de autenticação são salvos no localStorage do navegador.

## Estrutura do Projeto

```
project/
├── app/
│   ├── entradas/          # Página de entradas
│   ├── gastos/            # Página de gastos
│   ├── mensalidades/      # Página de mensalidades
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Dashboard
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── DashboardCard.tsx  # Card do dashboard
│   ├── Header.tsx         # Cabeçalho
│   ├── LoginForm.tsx      # Formulário de login
│   ├── Navigation.tsx     # Menu de navegação
│   └── ProtectedLayout.tsx # Layout protegido
├── contexts/
│   └── AuthContext.tsx    # Contexto de autenticação
└── lib/
    ├── formatters.ts      # Funções de formatação
    ├── supabase.ts        # Cliente Supabase
    └── utils.ts           # Utilitários
```

## Banco de Dados

O sistema usa Supabase com as seguintes tabelas:

- **members**: Membros/filhos da casa
- **monthly_payments**: Pagamentos mensais
- **income**: Entradas/receitas
- **expenses**: Gastos/despesas
- **settings**: Configurações do sistema

## Cálculos Automáticos

- **Caixa Atual**: Total de Entradas - Total de Gastos
- **Entrada Mensal**: Soma das entradas do mês atual
- **Caixa Mensal**: Entradas do mês - Gastos do mês

## Suporte

Para dúvidas ou problemas, verifique:
- Documentação do Next.js: https://nextjs.org/docs
- Documentação do Supabase: https://supabase.com/docs
- Documentação do Vercel: https://vercel.com/docs
