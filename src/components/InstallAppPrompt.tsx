'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'cosiku-install-prompt-dismissed';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

export function InstallAppPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  });
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!installPrompt || dismissed || installed) return null;

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    if (choice?.outcome === 'accepted') {
      setInstalled(true);
    }
    setInstallPrompt(null);
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-lg border border-pink-100 bg-white px-3 py-2.5 shadow-lg sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-800">ホーム画面に追加</p>
        <p className="truncate text-xs text-gray-500">アプリのようにすぐ開けます</p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-pink-500 px-3 text-xs font-bold text-white transition-colors hover:bg-pink-600"
      >
        追加
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="閉じる"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
