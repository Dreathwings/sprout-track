import { BreastSide, FeedingSessionStatus, Prisma } from '@prisma/client';

export const updateDurationsForElapsedTime = <T extends {
  status: FeedingSessionStatus;
  activeSide: BreastSide | null;
  lastSwitchAt: Date | null;
  leftDurationMs: bigint;
  rightDurationMs: bigint;
}>(session: T) => {
  if (session.status !== 'ACTIVE' || !session.activeSide || !session.lastSwitchAt) {
    return {
      leftDurationMs: session.leftDurationMs,
      rightDurationMs: session.rightDurationMs,
      elapsedMs: BigInt(0),
    };
  }

  const now = Date.now();
  const elapsed = Math.max(0, now - session.lastSwitchAt.getTime());
  const elapsedMs = BigInt(elapsed);

  if (session.activeSide === 'LEFT') {
    return {
      leftDurationMs: session.leftDurationMs + elapsedMs,
      rightDurationMs: session.rightDurationMs,
      elapsedMs,
    };
  }

  return {
    leftDurationMs: session.leftDurationMs,
    rightDurationMs: session.rightDurationMs + elapsedMs,
    elapsedMs,
  };
};

export const getSessionTotals = (session: {
  startedAt: Date;
  status: FeedingSessionStatus;
  activeSide: BreastSide | null;
  lastSwitchAt: Date | null;
  leftDurationMs: bigint;
  rightDurationMs: bigint;
}) => {
  const withElapsed = updateDurationsForElapsedTime(session);
  const totalMs = withElapsed.leftDurationMs + withElapsed.rightDurationMs;

  return {
    totalMs,
    leftDurationMs: withElapsed.leftDurationMs,
    rightDurationMs: withElapsed.rightDurationMs,
  };
};

export const sessionResponse = (session: {
  id: string;
  babyId: string;
  caretakerId: string | null;
  startedAt: Date;
  activeSide: BreastSide | null;
  leftDurationMs: bigint;
  rightDurationMs: bigint;
  lastSwitchAt: Date | null;
  status: FeedingSessionStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => {
  const totals = getSessionTotals(session);

  return {
    id: session.id,
    babyId: session.babyId,
    startedAt: session.startedAt.toISOString(),
    activeSide: session.activeSide,
    leftDurationMs: Number(totals.leftDurationMs),
    rightDurationMs: Number(totals.rightDurationMs),
    totalDurationMs: Number(totals.totalMs),
    lastSwitchAt: session.lastSwitchAt ? session.lastSwitchAt.toISOString() : null,
    status: session.status,
    note: session.note,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
};

export const activeSessionSelect = {
  id: true,
  babyId: true,
  caretakerId: true,
  startedAt: true,
  activeSide: true,
  leftDurationMs: true,
  rightDurationMs: true,
  lastSwitchAt: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ActiveFeedingSessionSelect;
