'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Bot, MessageSquare, Calendar, ClipboardCheck, CheckCircle, Play, RotateCcw, Zap } from 'lucide-react';

export function FSMDemo() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const states = [
    {
      id: 'welcome',
      name: t('fsm.state.welcome'),
      icon: MessageSquare,
      color: 'bg-blue-500',
      ringColor: 'ring-blue-500',
      description: t('fsm.state.welcome.desc'),
    },
    {
      id: 'triage',
      name: t('fsm.state.triage'),
      icon: ClipboardCheck,
      color: 'bg-amber-500',
      ringColor: 'ring-amber-500',
      description: t('fsm.state.triage.desc'),
    },
    {
      id: 'schedule',
      name: t('fsm.state.schedule'),
      icon: Calendar,
      color: 'bg-purple-500',
      ringColor: 'ring-purple-500',
      description: t('fsm.state.schedule.desc'),
    },
    {
      id: 'complete',
      name: t('fsm.state.complete'),
      icon: CheckCircle,
      color: 'bg-green-500',
      ringColor: 'ring-green-500',
      description: t('fsm.state.complete.desc'),
    },
  ];

  const messages = [
    { state: 0, role: 'assistant', text: t('fsm.msg.1') },
    { state: 0, role: 'user', text: t('fsm.msg.2') },
    { state: 1, role: 'assistant', text: t('fsm.msg.3') },
    { state: 1, role: 'user', text: t('fsm.msg.4') },
    { state: 2, role: 'assistant', text: t('fsm.msg.5') },
    { state: 2, role: 'user', text: t('fsm.msg.6') },
    { state: 3, role: 'assistant', text: t('fsm.msg.7') },
  ];

  const toolsByState = [
    [
      { name: 'patient.verify', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      { name: 'consent.record', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    ],
    [
      { name: 'symptoms.analyze', color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
      { name: 'urgency.classify', color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    ],
    [
      { name: 'schedule.search', color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
      { name: 'schedule.book', color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    ],
    [
      { name: 'notification.send', color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
    ],
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setVisibleMessages((prev) => {
        if (prev.length >= messages.length) {
          setIsPlaying(false);
          return prev;
        }
        const nextIndex = prev.length;
        setCurrentStep(messages[nextIndex].state);
        return [...prev, nextIndex];
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [isPlaying, messages.length]);

  const handleStart = () => {
    setVisibleMessages([]);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setVisibleMessages([]);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl overflow-hidden',
        'border border-gray-200 dark:border-gray-700',
        'shadow-xl hover:shadow-2xl transition-shadow duration-500',
        'relative'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated border gradient on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(34, 197, 94, 0.3) 100%)',
          padding: '2px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Header with state indicator */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              {t('fsm.demo.title')}
            </h3>
          </div>
          <div className="flex gap-2">
            {!isPlaying && visibleMessages.length === 0 && (
              <button
                onClick={handleStart}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium',
                  'bg-brand-600 text-white rounded-full',
                  'hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/25',
                  'transition-all duration-300 hover:-translate-y-0.5'
                )}
              >
                <Play className="w-3 h-3" />
                {t('fsm.demo.play')}
              </button>
            )}
            {visibleMessages.length > 0 && !isPlaying && (
              <button
                onClick={handleReset}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium',
                  'bg-gray-200 dark:bg-gray-700 rounded-full',
                  'hover:bg-gray-300 dark:hover:bg-gray-600',
                  'transition-all duration-300'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                {t('fsm.demo.reset')}
              </button>
            )}
            {isPlaying && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t('fsm.demo.running')}
              </span>
            )}
          </div>
        </div>

        {/* State pills - improved design */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
          {states.map((state, index) => {
            const Icon = state.icon;
            const isActive = index === currentStep;
            const isPast = index < currentStep;

            return (
              <div
                key={state.id}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-500 flex-shrink-0',
                  'border',
                  isActive && `bg-white dark:bg-gray-800 ring-2 ${state.ringColor} shadow-lg scale-105 border-transparent`,
                  isPast && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                  !isActive && !isPast && 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500',
                    isActive && state.color + ' shadow-md',
                    isPast && 'bg-green-500',
                    !isActive && !isPast && 'bg-gray-300 dark:bg-gray-600'
                  )}
                >
                  {isPast ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={cn(
                    'text-sm font-semibold transition-colors',
                    isActive && 'text-gray-900 dark:text-white',
                    isPast && 'text-green-700 dark:text-green-400',
                    !isActive && !isPast && 'text-gray-500 dark:text-gray-400'
                  )}>
                    {state.name}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{state.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area - improved design */}
      <div className="h-80 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white via-gray-50/30 to-white dark:from-gray-800 dark:via-gray-900/30 dark:to-gray-800">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Bot className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 max-w-[200px]">{t('fsm.demo.placeholder')}</p>
            </div>
          </div>
        ) : (
          visibleMessages.map((msgIndex) => {
            const msg = messages[msgIndex];
            const isUser = msg.role === 'user';

            return (
              <div
                key={msgIndex}
                className={cn(
                  'flex animate-fade-in-up',
                  isUser ? 'justify-end' : 'justify-start'
                )}
                style={{ animationDuration: '0.3s' }}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="w-4 h-4 text-brand-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    isUser
                      ? 'bg-brand-600 text-white rounded-br-md shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                  )}
                >
                  {msg.text}
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center ml-2 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">U</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tools indicator - improved design */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('fsm.demo.tools')}
          </span>
          <div className="flex gap-2 flex-wrap">
            {toolsByState[currentStep]?.map((tool, i) => (
              <span
                key={i}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-300',
                  tool.color,
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
