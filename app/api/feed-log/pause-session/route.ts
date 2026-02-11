import { NextRequest, NextResponse } from 'next/server';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { ApiResponse } from '../../types';
import { checkWritePermission } from '../../utils/writeProtection';
import prisma from '../../db';
import { formatSessionResponse } from '../session-core';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  const body = await req.json();
  const sessionId = body.sessionId as string;

  const session = await prisma.activeFeedingSession.findUnique({ where: { id: sessionId } });
  if (!session || session.familyId !== authContext.familyId) {
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Active session not found' }, { status: 404 });
  }

  if (session.isPaused || !session.lastResumedAt) {
    return NextResponse.json<ApiResponse<any>>({ success: true, data: formatSessionResponse(session) });
  }

  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(session.lastResumedAt).getTime()) / 1000));

  const updated = await prisma.activeFeedingSession.update({
    where: { id: sessionId },
    data: {
      isPaused: true,
      lastResumedAt: null,
      accumulatedDurationLeft: session.currentSide === 'LEFT' ? session.accumulatedDurationLeft + elapsed : session.accumulatedDurationLeft,
      accumulatedDurationRight: session.currentSide === 'RIGHT' ? session.accumulatedDurationRight + elapsed : session.accumulatedDurationRight,
    },
  });

  return NextResponse.json<ApiResponse<any>>({ success: true, data: formatSessionResponse(updated) });
}

export const POST = withAuthContext(handlePost as any);
