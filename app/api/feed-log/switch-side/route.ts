import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { checkWritePermission } from '../../utils/writeProtection';
import { activeSessionSelect, sessionResponse, updateDurationsForElapsedTime } from '../utils/session-utils';
import { BreastSide } from '@prisma/client';

interface SwitchBody { babyId: string; side: BreastSide }

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  try {
    const { familyId } = authContext;
    const body: SwitchBody = await req.json();

    const session = await prisma.activeFeedingSession.findFirst({
      where: { babyId: body.babyId, familyId: familyId || null },
      select: activeSessionSelect,
    });

    if (!session) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'No active feeding session found.' }, { status: 404 });

    const rolled = updateDurationsForElapsedTime(session);
    const now = new Date();
    const updated = await prisma.activeFeedingSession.update({
      where: { id: session.id },
      data: {
        leftDurationMs: rolled.leftDurationMs,
        rightDurationMs: rolled.rightDurationMs,
        activeSide: body.side,
        status: 'ACTIVE',
        lastSwitchAt: now,
      },
      select: activeSessionSelect,
    });

    return NextResponse.json<ApiResponse<any>>({ success: true, data: sessionResponse(updated) });
  } catch (error) {
    console.error('Error switching feeding side:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to switch side' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost as any);
