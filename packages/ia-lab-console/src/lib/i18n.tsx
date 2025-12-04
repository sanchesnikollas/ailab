'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'pt';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.catalog': 'Catalog',
    'nav.console': 'Console',
    'nav.docs': 'Docs',
    'nav.createAgent': 'Create Agent',

    // Hero Section
    'hero.badge': 'Open Source Enterprise Platform',
    'hero.title1': 'Build AI Agents',
    'hero.title2': 'You Can Trust',
    'hero.description': 'Specify, version, test, and operate AI agents using PRD specifications, finite state machines, tool orchestration, and external memory.',
    'hero.cta.console': 'Open Console',
    'hero.cta.catalog': 'Browse Catalog',

    // Stats Section
    'stats.typeSafe': 'Type Safe',
    'stats.fsmStates': 'FSM States',
    'stats.toolTypes': 'Tool Types',
    'stats.uptime': 'Uptime',

    // Problem Section
    'problem.badge': 'The Challenge',
    'problem.title': 'Why Traditional Agent Development Fails',
    'problem.description': 'Building production-ready AI agents requires more than just prompts and API calls',
    'problem.scattered.title': 'Scattered Specifications',
    'problem.scattered.description': 'Agent requirements, prompts, and behaviors are scattered across documents, code, and tribal knowledge.',
    'problem.scattered.detail1': 'No single source of truth',
    'problem.scattered.detail2': 'Hard to onboard new team members',
    'problem.scattered.detail3': 'Requirements drift over time',
    'problem.version.title': 'No Version Control',
    'problem.version.description': 'Tracking changes to agent behavior, testing regressions, and rolling back issues is nearly impossible.',
    'problem.version.detail1': "Can't compare agent versions",
    'problem.version.detail2': 'No rollback capability',
    'problem.version.detail3': 'Difficult to audit changes',
    'problem.safety.title': 'Safety Concerns',
    'problem.safety.description': 'Agents with unrestricted tool access pose security risks. Lack of guardrails leads to unpredictable behavior.',
    'problem.safety.detail1': 'Tools accessible in wrong contexts',
    'problem.safety.detail2': 'No prompt injection protection',
    'problem.safety.detail3': 'Missing audit trails',

    // Solution Section
    'solution.badge': 'Our Solution',
    'solution.title': 'The IA Lab Approach',
    'solution.description': 'A structured, enterprise-grade framework for building reliable AI agents',
    'solution.prd.title': 'PRD-First Design',
    'solution.prd.description': 'Define agent purpose, scope, and requirements in a structured format that serves as the source of truth.',
    'solution.prd.detail1': 'Structured JSON schema',
    'solution.prd.detail2': 'Zod validation',
    'solution.prd.detail3': 'Auto-documentation',
    'solution.fsm.title': 'FSM State Management',
    'solution.fsm.description': 'Model agent behavior as finite state machines with explicit transitions and predictable logic.',
    'solution.fsm.detail1': 'Visual state diagrams',
    'solution.fsm.detail2': 'Transition rules',
    'solution.fsm.detail3': 'Fallback handling',
    'solution.gating.title': 'Tool Gating',
    'solution.gating.description': 'Control which tools are available in each state. Policy gates enforce restrictions reliably.',
    'solution.gating.detail1': 'Per-state tool access',
    'solution.gating.detail2': 'Policy enforcement',
    'solution.gating.detail3': 'Audit logging',
    'solution.memory.title': 'External Memory',
    'solution.memory.description': 'Integrate knowledge bases and persistent memory with retrieval by IDs, not copying documents.',
    'solution.memory.detail1': 'Vector search',
    'solution.memory.detail2': 'Session memory',
    'solution.memory.detail3': 'Long-term storage',

    // FSM Demo Section
    'fsm.badge': 'See It In Action',
    'fsm.title': 'Watch the FSM in Action',
    'fsm.description': 'Our finite state machine approach ensures predictable agent behavior. Each state has defined tools, prompts, and transitions - making your agent\'s behavior transparent and controllable.',
    'fsm.feature.visibility': 'Full visibility into agent state',
    'fsm.feature.tools': 'Tools restricted by state',
    'fsm.feature.transition': 'Clear transition logic',
    'fsm.feature.fallback': 'Fallback handling',

    // FSM Demo Component
    'fsm.demo.title': 'FSM State Machine Demo',
    'fsm.demo.play': 'Play Demo',
    'fsm.demo.reset': 'Reset',
    'fsm.demo.running': 'Running',
    'fsm.demo.placeholder': 'Click "Play Demo" to see the FSM in action',
    'fsm.demo.tools': 'Allowed tools:',

    // States
    'fsm.state.welcome': 'Welcome',
    'fsm.state.welcome.desc': 'Greet user and identify',
    'fsm.state.triage': 'Triage',
    'fsm.state.triage.desc': 'Collect symptoms',
    'fsm.state.schedule': 'Schedule',
    'fsm.state.schedule.desc': 'Book appointment',
    'fsm.state.complete': 'Complete',
    'fsm.state.complete.desc': 'Confirmation sent',

    // Messages
    'fsm.msg.1': "Hello! I'm here to help you schedule a consultation.",
    'fsm.msg.2': "Hi, I've been having headaches for 3 days.",
    'fsm.msg.3': 'I understand. Can you describe the intensity from 1-10?',
    'fsm.msg.4': "It's about a 6, mostly in the morning.",
    'fsm.msg.5': 'Based on your symptoms, I recommend a general consultation. Available slots: Tomorrow 10am or 2pm?',
    'fsm.msg.6': '2pm works for me.',
    'fsm.msg.7': 'Your appointment is confirmed for tomorrow at 2pm with Dr. Smith. You will receive an email confirmation shortly.',

    // Use Cases Section
    'useCases.badge': 'Use Cases',
    'useCases.title': 'Built for Real Applications',
    'useCases.description': 'From healthcare to finance, IA Lab powers agents across industries',
    'useCases.viewAll': 'View all use cases',
    'useCases.saude.title': 'Saúde Conecta',
    'useCases.saude.domain': 'Healthcare',
    'useCases.saude.description': 'Patient triage, appointment scheduling, and treatment follow-up with PII handling and consent management.',
    'useCases.accommodation.title': 'Accommodation Flow',
    'useCases.accommodation.domain': 'Real Estate',
    'useCases.accommodation.description': 'Multi-agent orchestration for hotel bookings with inventory, pricing, and booking coordination.',
    'useCases.financial.title': 'Financial Advisor',
    'useCases.financial.domain': 'Finance',
    'useCases.financial.description': 'Risk assessment, portfolio recommendations, and compliance-aware investment guidance.',

    // Enterprise Section
    'enterprise.badge': 'Enterprise Ready',
    'enterprise.title': 'Built for Security & Compliance',
    'enterprise.description': 'IA Lab provides the governance, auditability, and control that enterprises need to deploy AI agents safely at scale.',
    'enterprise.feature1': 'Approval Workflows',
    'enterprise.feature2': 'Audit Trails',
    'enterprise.feature3': 'Role-Based Access',
    'enterprise.feature4': 'PII Handling',
    'enterprise.feature5': 'Safety Testing',
    'enterprise.feature6': 'Auto Rollback',
    'enterprise.deployments': 'Deployments',
    'enterprise.uptime': 'Uptime SLA',
    'enterprise.security': 'Security',
    'enterprise.support': 'Support',

    // CTA Section
    'cta.title': 'Ready to Build Reliable AI Agents?',
    'cta.description': 'Start by exploring our catalog of agent specifications or create your own from scratch.',
    'cta.catalog': 'Explore Catalog',
    'cta.create': 'Create Agent',

    // Footer
    'footer.tagline': 'Open source enterprise AI agent platform',
  },
  pt: {
    // Navbar
    'nav.catalog': 'Catálogo',
    'nav.console': 'Console',
    'nav.docs': 'Docs',
    'nav.createAgent': 'Criar Agente',

    // Hero Section
    'hero.badge': 'Plataforma Enterprise Open Source',
    'hero.title1': 'Construa Agentes de IA',
    'hero.title2': 'Confiáveis',
    'hero.description': 'Especifique, versione, teste e opere agentes de IA usando especificações PRD, máquinas de estado finito, orquestração de ferramentas e memória externa.',
    'hero.cta.console': 'Abrir Console',
    'hero.cta.catalog': 'Ver Catálogo',

    // Stats Section
    'stats.typeSafe': 'Type Safe',
    'stats.fsmStates': 'Estados FSM',
    'stats.toolTypes': 'Tipos de Tools',
    'stats.uptime': 'Uptime',

    // Problem Section
    'problem.badge': 'O Desafio',
    'problem.title': 'Por Que o Desenvolvimento Tradicional de Agentes Falha',
    'problem.description': 'Construir agentes de IA prontos para produção requer mais do que prompts e chamadas de API',
    'problem.scattered.title': 'Especificações Dispersas',
    'problem.scattered.description': 'Requisitos, prompts e comportamentos dos agentes estão espalhados em documentos, código e conhecimento tribal.',
    'problem.scattered.detail1': 'Sem fonte única de verdade',
    'problem.scattered.detail2': 'Difícil integrar novos membros',
    'problem.scattered.detail3': 'Requisitos mudam com o tempo',
    'problem.version.title': 'Sem Controle de Versão',
    'problem.version.description': 'Rastrear mudanças no comportamento do agente, testar regressões e reverter problemas é quase impossível.',
    'problem.version.detail1': 'Não compara versões de agentes',
    'problem.version.detail2': 'Sem capacidade de rollback',
    'problem.version.detail3': 'Difícil auditar mudanças',
    'problem.safety.title': 'Preocupações de Segurança',
    'problem.safety.description': 'Agentes com acesso irrestrito a ferramentas representam riscos de segurança. Falta de guardrails leva a comportamento imprevisível.',
    'problem.safety.detail1': 'Ferramentas acessíveis em contextos errados',
    'problem.safety.detail2': 'Sem proteção contra prompt injection',
    'problem.safety.detail3': 'Falta de trilhas de auditoria',

    // Solution Section
    'solution.badge': 'Nossa Solução',
    'solution.title': 'A Abordagem do IA Lab',
    'solution.description': 'Um framework estruturado e enterprise-grade para construir agentes de IA confiáveis',
    'solution.prd.title': 'Design PRD-First',
    'solution.prd.description': 'Defina propósito, escopo e requisitos do agente em formato estruturado que serve como fonte de verdade.',
    'solution.prd.detail1': 'Schema JSON estruturado',
    'solution.prd.detail2': 'Validação Zod',
    'solution.prd.detail3': 'Auto-documentação',
    'solution.fsm.title': 'Gestão de Estado FSM',
    'solution.fsm.description': 'Modele o comportamento do agente como máquinas de estado finito com transições explícitas e lógica previsível.',
    'solution.fsm.detail1': 'Diagramas de estado visuais',
    'solution.fsm.detail2': 'Regras de transição',
    'solution.fsm.detail3': 'Tratamento de fallback',
    'solution.gating.title': 'Tool Gating',
    'solution.gating.description': 'Controle quais ferramentas estão disponíveis em cada estado. Policy gates aplicam restrições de forma confiável.',
    'solution.gating.detail1': 'Acesso por estado',
    'solution.gating.detail2': 'Aplicação de políticas',
    'solution.gating.detail3': 'Log de auditoria',
    'solution.memory.title': 'Memória Externa',
    'solution.memory.description': 'Integre bases de conhecimento e memória persistente com recuperação por IDs, não copiando documentos.',
    'solution.memory.detail1': 'Busca vetorial',
    'solution.memory.detail2': 'Memória de sessão',
    'solution.memory.detail3': 'Armazenamento de longo prazo',

    // FSM Demo Section
    'fsm.badge': 'Veja em Ação',
    'fsm.title': 'Veja a FSM em Ação',
    'fsm.description': 'Nossa abordagem de máquina de estados finitos garante comportamento previsível do agente. Cada estado tem ferramentas, prompts e transições definidas - tornando o comportamento do seu agente transparente e controlável.',
    'fsm.feature.visibility': 'Visibilidade total do estado do agente',
    'fsm.feature.tools': 'Ferramentas restritas por estado',
    'fsm.feature.transition': 'Lógica de transição clara',
    'fsm.feature.fallback': 'Tratamento de fallback',

    // FSM Demo Component
    'fsm.demo.title': 'Demo da Máquina de Estados',
    'fsm.demo.play': 'Iniciar Demo',
    'fsm.demo.reset': 'Reiniciar',
    'fsm.demo.running': 'Executando',
    'fsm.demo.placeholder': 'Clique em "Iniciar Demo" para ver a FSM em ação',
    'fsm.demo.tools': 'Ferramentas permitidas:',

    // States
    'fsm.state.welcome': 'Boas-vindas',
    'fsm.state.welcome.desc': 'Saudar e identificar',
    'fsm.state.triage': 'Triagem',
    'fsm.state.triage.desc': 'Coletar sintomas',
    'fsm.state.schedule': 'Agendamento',
    'fsm.state.schedule.desc': 'Marcar consulta',
    'fsm.state.complete': 'Concluído',
    'fsm.state.complete.desc': 'Confirmação enviada',

    // Messages
    'fsm.msg.1': 'Olá! Estou aqui para ajudá-lo a agendar uma consulta.',
    'fsm.msg.2': 'Oi, estou tendo dores de cabeça há 3 dias.',
    'fsm.msg.3': 'Entendo. Pode descrever a intensidade de 1 a 10?',
    'fsm.msg.4': 'É cerca de 6, principalmente pela manhã.',
    'fsm.msg.5': 'Com base nos seus sintomas, recomendo uma consulta geral. Horários disponíveis: Amanhã às 10h ou 14h?',
    'fsm.msg.6': '14h funciona para mim.',
    'fsm.msg.7': 'Sua consulta está confirmada para amanhã às 14h com Dr. Silva. Você receberá uma confirmação por email em breve.',

    // Use Cases Section
    'useCases.badge': 'Casos de Uso',
    'useCases.title': 'Feito para Aplicações Reais',
    'useCases.description': 'Da saúde às finanças, o IA Lab potencializa agentes em diversas indústrias',
    'useCases.viewAll': 'Ver todos os casos de uso',
    'useCases.saude.title': 'Saúde Conecta',
    'useCases.saude.domain': 'Saúde',
    'useCases.saude.description': 'Triagem de pacientes, agendamento de consultas e acompanhamento de tratamento com gestão de PII e consentimento.',
    'useCases.accommodation.title': 'Fluxo de Acomodações',
    'useCases.accommodation.domain': 'Imobiliário',
    'useCases.accommodation.description': 'Orquestração multi-agente para reservas de hotéis com inventário, preços e coordenação de reservas.',
    'useCases.financial.title': 'Consultor Financeiro',
    'useCases.financial.domain': 'Finanças',
    'useCases.financial.description': 'Avaliação de risco, recomendações de portfólio e orientação de investimentos em conformidade.',

    // Enterprise Section
    'enterprise.badge': 'Pronto para Enterprise',
    'enterprise.title': 'Construído para Segurança & Compliance',
    'enterprise.description': 'O IA Lab fornece governança, auditabilidade e controle que as empresas precisam para implantar agentes de IA com segurança em escala.',
    'enterprise.feature1': 'Fluxos de Aprovação',
    'enterprise.feature2': 'Trilhas de Auditoria',
    'enterprise.feature3': 'Acesso por Função',
    'enterprise.feature4': 'Gestão de PII',
    'enterprise.feature5': 'Testes de Segurança',
    'enterprise.feature6': 'Rollback Automático',
    'enterprise.deployments': 'Deployments',
    'enterprise.uptime': 'SLA de Uptime',
    'enterprise.security': 'Segurança',
    'enterprise.support': 'Suporte',

    // CTA Section
    'cta.title': 'Pronto para Construir Agentes de IA Confiáveis?',
    'cta.description': 'Comece explorando nosso catálogo de especificações de agentes ou crie o seu do zero.',
    'cta.catalog': 'Explorar Catálogo',
    'cta.create': 'Criar Agente',

    // Footer
    'footer.tagline': 'Plataforma open source enterprise para agentes de IA',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Check localStorage for saved language preference
    const saved = localStorage.getItem('ia-lab-language') as Language;
    if (saved && (saved === 'en' || saved === 'pt')) {
      setLanguage(saved);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pt')) {
        setLanguage('pt');
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('ia-lab-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={`inline-flex items-center gap-0.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className || ''}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          language === 'en'
            ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('pt')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          language === 'pt'
            ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        PT
      </button>
    </div>
  );
}
