import type { PostContent } from './types.js';

interface DomainRule {
  domain: string;
  keywords: string[];
  weight: number;
}

const DOMAIN_RULES: DomainRule[] = [
  {
    domain: 'healthcare',
    keywords: [
      'saúde', 'health', 'medical', 'médico', 'hospital', 'paciente', 'patient',
      'diagnóstico', 'diagnosis', 'tratamento', 'treatment', 'clínica', 'clinic',
      'enfermagem', 'nursing', 'farmácia', 'pharmacy', 'telemedicina', 'telehealth'
    ],
    weight: 1.5,
  },
  {
    domain: 'finance',
    keywords: [
      'financeiro', 'finance', 'banco', 'bank', 'pagamento', 'payment', 'crédito',
      'credit', 'investimento', 'investment', 'fintech', 'transação', 'transaction',
      'contabilidade', 'accounting', 'fiscal', 'tax'
    ],
    weight: 1.5,
  },
  {
    domain: 'education',
    keywords: [
      'educação', 'education', 'ensino', 'teaching', 'aprendizado', 'learning',
      'escola', 'school', 'universidade', 'university', 'aluno', 'student',
      'professor', 'teacher', 'curso', 'course', 'treinamento', 'training'
    ],
    weight: 1.3,
  },
  {
    domain: 'retail',
    keywords: [
      'varejo', 'retail', 'e-commerce', 'loja', 'store', 'compra', 'purchase',
      'venda', 'sale', 'produto', 'product', 'estoque', 'inventory', 'carrinho',
      'cart', 'checkout'
    ],
    weight: 1.3,
  },
  {
    domain: 'logistics',
    keywords: [
      'logística', 'logistics', 'transporte', 'transport', 'entrega', 'delivery',
      'rastreamento', 'tracking', 'armazém', 'warehouse', 'frete', 'shipping',
      'cadeia de suprimentos', 'supply chain'
    ],
    weight: 1.3,
  },
  {
    domain: 'hr',
    keywords: [
      'rh', 'recursos humanos', 'hr', 'human resources', 'funcionário', 'employee',
      'contratação', 'hiring', 'recrutamento', 'recruitment', 'folha de pagamento',
      'payroll', 'benefícios', 'benefits', 'onboarding'
    ],
    weight: 1.2,
  },
  {
    domain: 'customer-service',
    keywords: [
      'atendimento', 'customer service', 'suporte', 'support', 'chatbot', 'helpdesk',
      'ticket', 'chamado', 'sac', 'faq', 'autoatendimento', 'self-service'
    ],
    weight: 1.2,
  },
  {
    domain: 'legal',
    keywords: [
      'jurídico', 'legal', 'contrato', 'contract', 'advogado', 'lawyer', 'compliance',
      'regulatório', 'regulatory', 'processo', 'lawsuit', 'lgpd', 'gdpr'
    ],
    weight: 1.3,
  },
  {
    domain: 'marketing',
    keywords: [
      'marketing', 'campanha', 'campaign', 'publicidade', 'advertising', 'crm',
      'leads', 'conversão', 'conversion', 'branding', 'social media', 'conteúdo'
    ],
    weight: 1.1,
  },
  {
    domain: 'real-estate',
    keywords: [
      'imobiliário', 'real estate', 'imóvel', 'property', 'aluguel', 'rent',
      'compra e venda', 'corretor', 'broker', 'locação', 'lease'
    ],
    weight: 1.3,
  },
  {
    domain: 'travel',
    keywords: [
      'viagem', 'travel', 'turismo', 'tourism', 'hotel', 'hospedagem', 'voo',
      'flight', 'reserva', 'booking', 'passagem', 'ticket'
    ],
    weight: 1.2,
  },
  {
    domain: 'insurance',
    keywords: [
      'seguro', 'insurance', 'apólice', 'policy', 'sinistro', 'claim',
      'cobertura', 'coverage', 'prêmio', 'premium', 'corretora'
    ],
    weight: 1.4,
  },
];

/**
 * Detect the primary domain of a post based on content analysis
 */
export function detectDomain(post: PostContent): string {
  const textToAnalyze = [
    post.title,
    post.summary || '',
    post.purpose || '',
    post.context || '',
    post.solution_overview || '',
    ...(post.impacts || []),
    ...(post.requirements?.map(r => `${r.title} ${r.description}`) || []),
    post.markdown.slice(0, 5000), // First 5000 chars of content
  ].join(' ').toLowerCase();

  const scores: Record<string, number> = {};

  for (const rule of DOMAIN_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textToAnalyze.match(regex);
      if (matches) {
        score += matches.length * rule.weight;
      }
    }
    if (score > 0) {
      scores[rule.domain] = score;
    }
  }

  // Find highest scoring domain
  const entries = Object.entries(scores);
  if (entries.length === 0) {
    return 'general';
  }

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * Detect if post describes an FSM-based agent
 */
export function detectFSM(post: PostContent): boolean {
  const text = [
    post.markdown,
    post.purpose || '',
    post.context || '',
    JSON.stringify(post.requirements || []),
  ].join(' ').toLowerCase();

  const fsmIndicators = [
    'estado', 'state', 'estados', 'states',
    'transição', 'transition', 'transições', 'transitions',
    'fsm', 'finite state machine', 'máquina de estados',
    'fluxo', 'flow', 'workflow',
    'etapa', 'step', 'etapas', 'steps',
    'fase', 'phase', 'fases', 'phases',
    'rf1', 'rf2', 'rf3', 'rf4', 'rf5', 'rf6', 'rf7',
  ];

  let matchCount = 0;
  for (const indicator of fsmIndicators) {
    if (text.includes(indicator)) {
      matchCount++;
    }
  }

  // Need at least 3 indicators to consider it FSM-based
  return matchCount >= 3;
}

/**
 * Detect if post describes a multi-agent flow
 */
export function detectMultiAgent(post: PostContent): boolean {
  const text = [
    post.markdown,
    post.purpose || '',
    post.context || '',
    JSON.stringify(post.requirements || []),
  ].join(' ').toLowerCase();

  const multiAgentIndicators = [
    'multi-agent', 'multiagente', 'multi agente', 'multiagent',
    'orquestração', 'orchestration', 'orquestrador', 'orchestrator',
    'agentes', 'agents', 'múltiplos agentes', 'multiple agents',
    'coordenação', 'coordination', 'delegação', 'delegation',
    'supervisor', 'worker', 'executor',
    'agente especializado', 'specialized agent',
    'sistema multiagente', 'multi-agent system',
  ];

  for (const indicator of multiAgentIndicators) {
    if (text.includes(indicator)) {
      return true;
    }
  }

  // Also check for multiple RF sections that suggest different agents
  const rfCount = post.requirements?.length || 0;
  if (rfCount >= 5) {
    // Check if requirements mention different "actors" or "agents"
    const reqText = post.requirements?.map(r => r.description).join(' ').toLowerCase() || '';
    if (reqText.includes('agente') || reqText.includes('agent')) {
      return true;
    }
  }

  return false;
}

/**
 * Extract tags from post content
 */
export function extractTags(post: PostContent): string[] {
  const tags = new Set<string>();
  const text = [
    post.title,
    post.summary || '',
    post.purpose || '',
  ].join(' ').toLowerCase();

  // Add domain as tag
  const domain = detectDomain(post);
  if (domain !== 'general') {
    tags.add(domain);
  }

  // Add FSM/multiagent tags
  if (detectFSM(post)) {
    tags.add('fsm');
    tags.add('stateful');
  }
  if (detectMultiAgent(post)) {
    tags.add('multi-agent');
    tags.add('orchestration');
  }

  // Common tech/feature tags
  const tagPatterns: Array<[string, RegExp]> = [
    ['ai', /\b(ia|ai|inteligência artificial|artificial intelligence|llm|gpt|chatgpt|claude)\b/i],
    ['nlp', /\b(nlp|processamento de linguagem|natural language)\b/i],
    ['automation', /\b(automação|automation|automatizado|automated)\b/i],
    ['integration', /\b(integração|integration|api|webhook)\b/i],
    ['analytics', /\b(analytics|análise|análises|dashboard|métricas|metrics)\b/i],
    ['mobile', /\b(mobile|móvel|app|aplicativo)\b/i],
    ['voice', /\b(voz|voice|fala|speech)\b/i],
    ['chat', /\b(chat|chatbot|conversacional|conversational)\b/i],
  ];

  for (const [tag, pattern] of tagPatterns) {
    if (pattern.test(text)) {
      tags.add(tag);
    }
  }

  // Add requirement-based tags
  if (post.requirements && post.requirements.length > 0) {
    tags.add('documented');
    tags.add('requirements');
  }

  return Array.from(tags);
}
