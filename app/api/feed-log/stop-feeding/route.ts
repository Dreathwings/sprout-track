import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { checkWritePermission } from '../../utils/writeProtection';
import { activeSessionSelect, getSessionTotals, sessionResponse } from '../utils/session-utils';

interface StopBody { babyId: string; note?: string }

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  try {
    const { familyId, caretakerId } = authContext;
    const body: StopBody = await req.json();

    const session = await prisma.activeFeedingSession.findFirst({
      where: { babyId: body.babyId, familyId: familyId || null },
      select: activeSessionSelect,
    });

    if (!session) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'No active feeding session found.' }, { status: 404 });
    }

    const totals = getSessionTotals(session);
    const now = new Date();

    const notes = body.note?.trim() ? body.note.trim() : session.note;

    await prisma.$transaction(async (tx) => {
      const common = {
        babyId: session.babyId,
        familyId: familyId || null,
        caretakerId: caretakerId || session.caretakerId || null,
        type: 'BREAST' as const,
        time: now,
        notes: notes || null,
      };

      if (totals.leftDurationMs > BigInt(0)) {
        const leftDurationSeconds = Math.floor(Number(totals.leftDurationMs) / 1000);
        await tx.feedLog.create({
          data: {
            ...common,
            side: 'LEFT',
            startTime: new Date(now.getTime() - Number(totals.leftDurationMs)),
            endTime: now,
            feedDuration: leftDurationSeconds,
          },
        });
      }

      if (totals.rightDurationMs > BigInt(0)) {
        const rightDurationSeconds = Math.floor(Number(totals.rightDurationMs) / 1000);
        await tx.feedLog.create({
          data: {
            ...common,
            side: 'RIGHT',
            startTime: new Date(now.getTime() - Number(totals.rightDurationMs)),
            endTime: now,
            feedDuration: rightDurationSeconds,
          },
        });
      }

      await tx.activeFeedingSession.delete({ where: { id: session.id } });
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        stopped: true,
        finalSession: sessionResponse(session),
      },
    });
  } catch (error) {
    console.error('Error stopping feeding session:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to stop feeding session' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost as any);
