'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useI18n, LanguageToggle } from '@/lib/i18n';
import { Bot, Menu, X, Github, Moon, Sun } from 'lucide-react';

export function Navbar() {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Check initial dark mode
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg shadow-gray-200/50 dark:shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
              <Bot className="h-8 w-8 text-brand-600 relative transition-transform group-hover:scale-110" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              IA Lab
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/catalog"
              className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"
            >
              {t('nav.catalog')}
            </Link>
            <Link
              href="/console"
              className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"
            >
              {t('nav.console')}
            </Link>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            {/* Language Toggle */}
            <LanguageToggle />

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <Link
              href="/console/agents/new"
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all duration-300',
                'bg-brand-600 text-white',
                'hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/25',
                'hover:-translate-y-0.5'
              )}
            >
              {t('nav.createAgent')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageToggle />
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            isMobileMenuOpen ? 'max-h-80 pb-4' : 'max-h-0'
          )}
        >
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/catalog"
              className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {t('nav.catalog')}
            </Link>
            <Link
              href="/console"
              className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {t('nav.console')}
            </Link>
            <div className="flex items-center justify-between px-4 py-2">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
              >
                {isDark ? (
                  <>
                    <Sun className="h-5 w-5" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
            <Link
              href="/console/agents/new"
              className="block px-4 py-2 bg-brand-600 text-white rounded-lg text-center"
            >
              {t('nav.createAgent')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
