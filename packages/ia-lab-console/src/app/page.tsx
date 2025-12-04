'use client';

import Link from 'next/link';
import {
  Bot,
  FileText,
  GitBranch,
  Shield,
  Zap,
  Database,
  ArrowRight,
  Check,
  Play,
  Sparkles,
  Lock,
  Eye,
  Workflow,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '@/components/home/navbar';
import { FeatureCard } from '@/components/home/feature-card';
import { FSMDemo } from '@/components/home/fsm-demo';
import { UseCaseCard } from '@/components/home/use-case-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';
import { I18nProvider, useI18n } from '@/lib/i18n';

function FSMDemoSection() {
  const { t } = useI18n();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 hero-gradient opacity-50" />
      <div className="absolute top-20 left-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
              {t('fsm.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">
              {t('fsm.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">
              {t('fsm.description')}
            </p>

            <div className="space-y-4">
              {[
                { icon: Eye, text: t('fsm.feature.visibility') },
                { icon: Lock, text: t('fsm.feature.tools') },
                { icon: GitBranch, text: t('fsm.feature.transition') },
                { icon: Shield, text: t('fsm.feature.fallback') },
              ].map(({ icon: Icon, text }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 group hover:translate-x-2 transition-transform duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-brand-900/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-8">
            <FSMDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <I18nProvider>
      <HomePageContent />
    </I18nProvider>
  );
}

function HomePageContent() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden hero-gradient">
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Floating decorative elements */}
        <div className="absolute top-40 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4" />
              <span>{t('hero.badge')}</span>
            </div>

            {/* Main heading */}
            <h1
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              {t('hero.title1')}
              <br />
              <span className="text-gradient">{t('hero.title2')}</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {t('hero.description')}
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href="/console"
                className={cn(
                  'group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold',
                  'bg-brand-600 text-white',
                  'hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/25',
                  'transition-all duration-300 hover:-translate-y-1'
                )}
              >
                <Play className="w-5 h-5" />
                {t('hero.cta.console')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/catalog"
                className={cn(
                  'inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold',
                  'border-2 border-gray-200 dark:border-gray-700',
                  'hover:border-brand-500 hover:text-brand-600',
                  'transition-all duration-300 hover:-translate-y-1'
                )}
              >
                {t('hero.cta.catalog')}
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="animate-bounce-soft">
              <ChevronDown className="w-6 h-6 mx-auto text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 100, suffix: '%', label: t('stats.typeSafe'), icon: Check },
              { value: 8, suffix: '+', label: t('stats.fsmStates'), icon: GitBranch },
              { value: 50, suffix: '+', label: t('stats.toolTypes'), icon: Zap },
              { value: 99, suffix: '.9%', label: t('stats.uptime'), icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 mb-3 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
              {t('problem.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
              {t('problem.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('problem.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            <FeatureCard
              icon={FileText}
              title={t('problem.scattered.title')}
              description={t('problem.scattered.description')}
              color="from-red-500 to-orange-500"
              details={[
                t('problem.scattered.detail1'),
                t('problem.scattered.detail2'),
                t('problem.scattered.detail3'),
              ]}
            />
            <FeatureCard
              icon={GitBranch}
              title={t('problem.version.title')}
              description={t('problem.version.description')}
              color="from-red-500 to-orange-500"
              details={[
                t('problem.version.detail1'),
                t('problem.version.detail2'),
                t('problem.version.detail3'),
              ]}
            />
            <FeatureCard
              icon={Shield}
              title={t('problem.safety.title')}
              description={t('problem.safety.description')}
              color="from-red-500 to-orange-500"
              details={[
                t('problem.safety.detail1'),
                t('problem.safety.detail2'),
                t('problem.safety.detail3'),
              ]}
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
              {t('solution.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
              {t('solution.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('solution.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            <FeatureCard
              icon={FileText}
              title={t('solution.prd.title')}
              description={t('solution.prd.description')}
              color="from-brand-500 to-cyan-500"
              details={[
                t('solution.prd.detail1'),
                t('solution.prd.detail2'),
                t('solution.prd.detail3'),
              ]}
            />
            <FeatureCard
              icon={Workflow}
              title={t('solution.fsm.title')}
              description={t('solution.fsm.description')}
              color="from-purple-500 to-pink-500"
              details={[
                t('solution.fsm.detail1'),
                t('solution.fsm.detail2'),
                t('solution.fsm.detail3'),
              ]}
            />
            <FeatureCard
              icon={Lock}
              title={t('solution.gating.title')}
              description={t('solution.gating.description')}
              color="from-green-500 to-emerald-500"
              details={[
                t('solution.gating.detail1'),
                t('solution.gating.detail2'),
                t('solution.gating.detail3'),
              ]}
            />
            <FeatureCard
              icon={Database}
              title={t('solution.memory.title')}
              description={t('solution.memory.description')}
              color="from-amber-500 to-orange-500"
              details={[
                t('solution.memory.detail1'),
                t('solution.memory.detail2'),
                t('solution.memory.detail3'),
              ]}
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <FSMDemoSection />

      {/* Use Cases Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-600 font-semibold text-sm uppercase tracking-wider">
              {t('useCases.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
              {t('useCases.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('useCases.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UseCaseCard
              title={t('useCases.saude.title')}
              domain={t('useCases.saude.domain')}
              description={t('useCases.saude.description')}
              states={8}
              tools={12}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
              slug="saude-conecta"
            />
            <UseCaseCard
              title={t('useCases.accommodation.title')}
              domain={t('useCases.accommodation.domain')}
              description={t('useCases.accommodation.description')}
              states={12}
              tools={8}
              gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              slug="accommodation-capacity"
            />
            <UseCaseCard
              title={t('useCases.financial.title')}
              domain={t('useCases.financial.domain')}
              description={t('useCases.financial.description')}
              states={6}
              tools={10}
              gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              {t('useCases.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-12 md:p-16">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <pattern id="enterprise-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#enterprise-grid)" />
              </svg>
            </div>

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-brand-400 font-semibold text-sm uppercase tracking-wider">
                  {t('enterprise.badge')}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-6">
                  {t('enterprise.title')}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t('enterprise.description')}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    t('enterprise.feature1'),
                    t('enterprise.feature2'),
                    t('enterprise.feature3'),
                    t('enterprise.feature4'),
                    t('enterprise.feature5'),
                    t('enterprise.feature6'),
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('enterprise.deployments'), value: '10K+', color: 'from-brand-500 to-cyan-500' },
                  { label: t('enterprise.uptime'), value: '99.9%', color: 'from-green-500 to-emerald-500' },
                  { label: t('enterprise.security'), value: 'SOC 2', color: 'from-purple-500 to-pink-500' },
                  { label: t('enterprise.support'), value: '24/7', color: 'from-amber-500 to-orange-500' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-colors"
                  >
                    <div className={cn('text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent', item.color)}>
                      {item.value}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className={cn(
                'group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold',
                'bg-brand-600 text-white',
                'hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/25',
                'transition-all duration-300 hover:-translate-y-1'
              )}
            >
              {t('cta.catalog')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/console/agents/new"
              className={cn(
                'inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold',
                'border-2 border-gray-200 dark:border-gray-700',
                'hover:border-brand-500 hover:text-brand-600',
                'transition-all duration-300 hover:-translate-y-1'
              )}
            >
              {t('cta.create')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-brand-600" />
              <span className="font-semibold">IA Lab</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/catalog" className="hover:text-brand-600 transition-colors">
                {t('nav.catalog')}
              </Link>
              <Link href="/console" className="hover:text-brand-600 transition-colors">
                {t('nav.console')}
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-600 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
