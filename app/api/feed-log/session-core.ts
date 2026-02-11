import prisma from '../db';
import { NextResponse } from 'next/server';
import { ApiResponse } from '../types';
import { formatForResponse } from '../utils/timezone';
import { AuthResult } from '../utils/auth';
import { BreastSide } from '@prisma/client';

export const formatSessionResponse = (session: any) => ({
  id: session.id,
  startedAt: formatForResponse(session.startedAt) || '',
  currentSide: session.currentSide,
  isPaused: session.isPaused,
  accumulatedDurationLeft: session.accumulatedDurationLeft,
  accumulatedDurationRight: session.accumulatedDurationRight,
  lastResumedAt: formatForResponse(session.lastResumedAt),
  note: session.note,
  babyId: session.babyId,
  caretakerId: session.caretakerId,
  familyId: session.familyId,
  createdAt: formatForResponse(session.createdAt) || '',
  updatedAt: formatForResponse(session.updatedAt) || '',
});

const withAccumulatedDurations = (session: any) => {
  if (session.isPaused || !session.lastResumedAt) {
    return session;
  }

  const now = Date.now();
  const resumedAtMs = new Date(session.lastResumedAt).getTime();
  const elapsed = Math.max(0, Math.floor((now - resumedAtMs) / 1000));

  if (session.currentSide === 'LEFT') {
    return { ...session, accumulatedDurationLeft: session.accumulatedDurationLeft + elapsed };
  }

  return { ...session, accumulatedDurationRight: session.accumulatedDurationRight + elapsed };
};

export async function getActiveSessionForBaby(babyId: string, authContext: AuthResult) {
  const session = await prisma.activeFeedingSession.findFirst({
    where: {
      babyId,
      familyId: authContext.familyId,
    },
  });

  if (!session) {
    return null;
  }

  return withAccumulatedDurations(session);
}

export async function getValidatedBaby(babyId: string, authContext: AuthResult) {
  const baby = await prisma.baby.findFirst({ where: { id: babyId, familyId: authContext.familyId } });
  if (!baby) {
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Baby not found in this family.' }, { status: 404 });
  }
  return baby;
}

export async function persistElapsedTime(sessionId: string) {
  const session = await prisma.activeFeedingSession.findUnique({ where: { id: sessionId } });
  if (!session || session.isPaused || !session.lastResumedAt) return session;

  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(session.lastResumedAt).getTime()) / 1000));

  return prisma.activeFeedingSession.update({
    where: { id: sessionId },
    data: {
      accumulatedDurationLeft: session.currentSide === 'LEFT' ? session.accumulatedDurationLeft + elapsed : session.accumulatedDurationLeft,
      accumulatedDurationRight: session.currentSide === 'RIGHT' ? session.accumulatedDurationRight + elapsed : session.accumulatedDurationRight,
      lastResumedAt: now,
    },
  });
}

export async function ensureNoOtherSession(babyId: string, familyId: string | null | undefined) {
  const existing = await prisma.activeFeedingSession.findFirst({ where: { babyId, familyId: familyId || undefined } });
  return existing;
}

export async function stopAndCreateFeedEntries(sessionId: string, authContext: AuthResult) {
  const session = await prisma.activeFeedingSession.findUnique({ where: { id: sessionId } });
  if (!session) return null;

  const now = new Date();
  const elapsed = !session.isPaused && session.lastResumedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(session.lastResumedAt).getTime()) / 1000))
    : 0;

  const left = session.accumulatedDurationLeft + (session.currentSide === 'LEFT' ? elapsed : 0);
  const right = session.accumulatedDurationRight + (session.currentSide === 'RIGHT' ? elapsed : 0);

  const createLogs: any[] = [];
  if (left > 0) {
    createLogs.push(prisma.feedLog.create({
      data: {
        babyId: session.babyId,
        familyId: session.familyId,
        caretakerId: authContext.caretakerId,
        time: now,
        type: 'BREAST',
        side: BreastSide.LEFT,
        startTime: new Date(now.getTime() - left * 1000),
        endTime: now,
        feedDuration: left,
        notes: session.note,
      },
    }));
  }
  if (right > 0) {
    createLogs.push(prisma.feedLog.create({
      data: {
        babyId: session.babyId,
        familyId: session.familyId,
        caretakerId: authContext.caretakerId,
        time: now,
        type: 'BREAST',
        side: BreastSide.RIGHT,
        startTime: new Date(now.getTime() - right * 1000),
        endTime: now,
        feedDuration: right,
        notes: session.note,
      },
    }));
  }

  await prisma.$transaction([
    ...createLogs,
    prisma.activeFeedingSession.delete({ where: { id: sessionId } }),
  ]);

  return { left, right };
}
