import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { checkWritePermission } from '../../utils/writeProtection';
import { activeSessionSelect, sessionResponse, updateDurationsForElapsedTime } from '../utils/session-utils';

interface PauseBody { babyId: string }

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  try {
    const { familyId } = authContext;
    const body: PauseBody = await req.json();

    const session = await prisma.activeFeedingSession.findFirst({
      where: { babyId: body.babyId, familyId: familyId || null },
      select: activeSessionSelect,
    });

    if (!session) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'No active feeding session found.' }, { status: 404 });

    const rolled = updateDurationsForElapsedTime(session);
    const updated = await prisma.activeFeedingSession.update({
      where: { id: session.id },
      data: {
        leftDurationMs: rolled.leftDurationMs,
        rightDurationMs: rolled.rightDurationMs,
        activeSide: null,
        status: 'PAUSED',
        lastSwitchAt: null,
      },
      select: activeSessionSelect,
    });

    return NextResponse.json<ApiResponse<any>>({ success: true, data: sessionResponse(updated) });
  } catch (error) {
    console.error('Error pausing feeding session:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to pause feeding session' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost as any);
