'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBaby } from '@/app/context/baby';
import { useLocalization } from '@/src/context/localization';
import { Button } from '@/src/components/ui/button';
import { useToast } from '@/src/components/ui/toast';

interface ActiveSession {
  id: string;
  babyId: string;
  startedAt: string;
  side: 'LEFT' | 'RIGHT' | null;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((v) => v.toString().padStart(2, '0')).join(':');
};

export function ActiveFeedingBanner() {
  const { selectedBaby } = useBaby();
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isStopping, setIsStopping] = useState(false);

  const fetchSession = async () => {
    if (!selectedBaby?.id) {
      setSession(null);
      return;
    }

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/activeSession?babyId=${selectedBaby.id}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return;
      }

      setSession(data.data || null);
    } catch (error) {
      console.error('Error loading active feeding session:', error);
    }
  };

  useEffect(() => {
    fetchSession();
    const pollingInterval = setInterval(fetchSession, 30000);
    const secondInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      clearInterval(pollingInterval);
      clearInterval(secondInterval);
    };
  }, [selectedBaby?.id]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [selectedBaby?.id]);

  const elapsedSeconds = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
  }, [session, now]);

  const handleStop = async () => {
    if (!session || !selectedBaby?.id || isStopping) return;

    try {
      setIsStopping(true);
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/stopSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ babyId: selectedBaby.id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || t('Failed to stop feeding session.'));
      }

      setSession(null);
      showToast({ variant: 'success', title: t('Success'), message: t('Feeding session completed.'), duration: 5000 });
      window.dispatchEvent(new CustomEvent('feedingSessionStopped'));
    } catch (error) {
      console.error('Error stopping feeding session:', error);
      showToast({ variant: 'error', title: t('Error'), message: error instanceof Error ? t(error.message) : t('Failed to stop feeding session.'), duration: 5000 });
    } finally {
      setIsStopping(false);
    }
  };

  if (!session || !selectedBaby?.id) {
    return null;
  }

  return (
    <div className="w-full bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3">
      <div className="text-sm font-medium text-amber-900">
        {t('Feeding in progress')} • {t('Elapsed')}: {formatDuration(elapsedSeconds)}
      </div>
      <Button size="sm" onClick={handleStop} disabled={isStopping}>
        {t('Stop Feeding')}
      </Button>
    </div>
  );
}
