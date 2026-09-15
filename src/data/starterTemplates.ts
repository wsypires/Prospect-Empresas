import { ProjectTemplate, EnvironmentSpec } from '../types.ts';

export const ENVIRONMENT_SPECS: EnvironmentSpec[] = [
  {
    name: 'React',
    version: '19.0',
    category: 'Interface',
    description: 'Renderização reativa com Server e Client components',
    active: true,
  },
  {
    name: 'TypeScript',
    version: '5.8',
    category: 'Linguagem',
    description: 'Tipagem estática estrita e autocompletion seguro',
    active: true,
  },
  {
    name: 'Tailwind CSS',
    version: '4.1',
    category: 'Estilização',
    description: 'Engine de design moderna e utilitária',
    active: true,
  },
  {
    name: 'Vite',
    version: '6.2',
    category: 'Build Tool',
    description: 'Servidor de desenvolvimento ultrarrápido',
    active: true,
  },
];

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'dashboard',
    title: 'Painel de Gestão & Indicadores',
    category: 'Produtividade',
    description: 'Visualização de métricas, gráficos interativos e tabela de dados com filtros.',
    suggestedPrompt: 'Crie um dashboard financeiro com resumo de receitas, despesas, gráficos interativos e tabela de transações.',
    tags: ['Métricas', 'Gráficos', 'Filtros'],
  },
  {
    id: 'kanban',
    title: 'Gerenciador de Tarefas & Kanban',
    category: 'Organização',
    description: 'Quadro visual com colunas A Fazer, Em Andamento e Concluído, com drag and drop.',
    suggestedPrompt: 'Crie um aplicativo de quadro Kanban para gerenciamento de tarefas com colunas, prioridades e busca.',
    tags: ['Tarefas', 'Colunas', 'Produtividade'],
  },
  {
    id: 'ecommerce',
    title: 'Catálogo de Produtos & Carrinho',
    category: 'Comércio',
    description: 'Vitrine de produtos com filtro de categorias, visualização de detalhes e carrinho.',
    suggestedPrompt: 'Crie uma loja virtual com catálogo de produtos, filtros por categoria, busca e carrinho de compras.',
    tags: ['Catálogo', 'Carrinho', 'Busca'],
  },
  {
    id: 'crm',
    title: 'Controle de Clientes & Vendas',
    category: 'Negócios',
    description: 'Cadastro de leads, histórico de contatos e acompanhamento do funil de vendas.',
    suggestedPrompt: 'Crie um CRM para registrar clientes, contatos recentes e funil de oportunidades de vendas.',
    tags: ['Clientes', 'Funil', 'Histórico'],
  },
  {
    id: 'tools',
    title: 'Calculadora ou Utilitário',
    category: 'Ferramenta',
    description: 'Calculadora especializada, conversor de moedas ou simulador com resultados instantâneos.',
    suggestedPrompt: 'Crie uma calculadora financeira para simular investimentos com juros compostos e aportes mensais.',
    tags: ['Cálculos', 'Simulação', 'Conversão'],
  },
  {
    id: 'notes',
    title: 'Bloco de Notas & Markdown',
    category: 'Criação',
    description: 'Editor de notas com formatação rica, busca instantânea e organização por tags.',
    suggestedPrompt: 'Crie um aplicativo de anotações com suporte a markdown, tags e busca rápida.',
    tags: ['Notas', 'Editor', 'Tags'],
  },
];
