'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalization } from '@/src/context/localization';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { useToast } from '@/src/components/ui/toast';

interface ActiveSession {
  id: string;
  startedAt: string;
  currentSide: 'LEFT' | 'RIGHT';
  isPaused: boolean;
  accumulatedDurationLeft: number;
  accumulatedDurationRight: number;
  lastResumedAt: string | null;
  note: string | null;
}

interface Props {
  babyId?: string;
  onStopped?: () => void;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function FeedingActivePanel({ babyId, onStopped }: Props) {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const noteDebounce = useRef<NodeJS.Timeout | null>(null);
  const [tick, setTick] = useState(0);

  const authHeader = (): Record<string, string> => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSession = async () => {
    if (!babyId) return;
    const res = await fetch(`/api/feed-log/active-session?babyId=${babyId}`, { headers: authHeader() });
    const data = await res.json();
    if (data.success) {
      setSession(data.data);
      setNoteDraft(data.data?.note || '');
    }
  };

  useEffect(() => {
    fetchSession();
    if (!babyId) return;
    const interval = setInterval(fetchSession, 7000);
    return () => clearInterval(interval);
  }, [babyId]);

  useEffect(() => {
    const interval = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session) return;
    if (noteDebounce.current) clearTimeout(noteDebounce.current);
    noteDebounce.current = setTimeout(async () => {
      await fetch('/api/feed-log/update-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ sessionId: session.id, note: noteDraft }),
      });
    }, 500);
  }, [noteDraft]);

  const durations = useMemo(() => {
    if (!session) return { left: 0, right: 0 };
    const now = Date.now();
    const resumed = session.lastResumedAt ? new Date(session.lastResumedAt).getTime() : null;
    const elapsed = !session.isPaused && resumed ? Math.max(0, Math.floor((now - resumed) / 1000)) : 0;

    return {
      left: session.accumulatedDurationLeft + (session.currentSide === 'LEFT' ? elapsed : 0),
      right: session.accumulatedDurationRight + (session.currentSide === 'RIGHT' ? elapsed : 0),
    };
  }, [session, tick]);

  const postAction = async (url: string) => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast({ variant: 'error', title: t('Error'), message: t(data.error || 'Failed to save feed log') });
      }
      await fetchSession();
      if (url.includes('stop-session')) onStopped?.();
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (side: 'LEFT' | 'RIGHT') => {
    if (!babyId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feed-log/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ babyId, currentSide: side }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast({ variant: 'error', title: t('Error'), message: t(data.error || 'Failed to save feed log') });
      }
      await fetchSession();
    } finally {
      setLoading(false);
    }
  };

  if (!babyId) return null;

  if (!session) {
    return (
      <div className="mb-4 rounded-lg border p-4 bg-white">
        <p className="text-sm mb-3">{t('No active feeding session')}</p>
        <div className="flex gap-2">
          <Button onClick={() => startSession('LEFT')} disabled={loading}>{t('Start Left')}</Button>
          <Button variant="outline" onClick={() => startSession('RIGHT')} disabled={loading}>{t('Start Right')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{t('Active Feeding Session')}</div>
        <div className="text-xs text-gray-600">{t('Active side')}: {session.currentSide === 'LEFT' ? t('Left') : t('Right')}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className={`rounded border p-2 ${session.currentSide === 'LEFT' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
          <div>{t('Left')}</div>
          <div className="font-mono">{formatDuration(durations.left)}</div>
        </div>
        <div className={`rounded border p-2 ${session.currentSide === 'RIGHT' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
          <div>{t('Right')}</div>
          <div className="font-mono">{formatDuration(durations.right)}</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {session.isPaused ? (
          <Button onClick={() => postAction('/api/feed-log/resume-session')} disabled={loading}>{t('Resume')}</Button>
        ) : (
          <Button onClick={() => postAction('/api/feed-log/pause-session')} disabled={loading}>{t('Pause')}</Button>
        )}
        <Button variant="outline" onClick={() => postAction('/api/feed-log/switch-side')} disabled={loading}>{t('Switch Side')}</Button>
        <Button variant="destructive" onClick={() => postAction('/api/feed-log/stop-session')} disabled={loading}>{t('Stop')}</Button>
      </div>
      <div>
        <Label>{t('Notes')}</Label>
        <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={t('Enter any notes about the feeding')} rows={3} />
      </div>
    </div>
  );
}
