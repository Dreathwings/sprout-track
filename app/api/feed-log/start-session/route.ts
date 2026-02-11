import { NextRequest, NextResponse } from 'next/server';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { ApiResponse } from '../../types';
import { checkWritePermission } from '../../utils/writeProtection';
import prisma from '../../db';
import { BreastSide } from '@prisma/client';
import { ensureNoOtherSession, formatSessionResponse, getValidatedBaby } from '../session-core';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  const body = await req.json();
  const babyId = body.babyId as string;
  const currentSide = (body.currentSide as BreastSide) || 'LEFT';

  if (!babyId) {
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'babyId is required' }, { status: 400 });
  }

  const baby = await getValidatedBaby(babyId, authContext);
  if (baby instanceof NextResponse) return baby;

  const existing = await ensureNoOtherSession(babyId, authContext.familyId);
  if (existing) {
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'An active feeding session already exists for this child.' }, { status: 409 });
  }

  const now = new Date();
  const session = await prisma.activeFeedingSession.create({
    data: {
      babyId,
      familyId: authContext.familyId,
      caretakerId: authContext.caretakerId,
      startedAt: now,
      currentSide,
      isPaused: false,
      accumulatedDurationLeft: 0,
      accumulatedDurationRight: 0,
      lastResumedAt: now,
      note: body.note && typeof body.note === 'string' ? body.note : null,
    },
  });

  return NextResponse.json<ApiResponse<any>>({ success: true, data: formatSessionResponse(session) });
}

export const POST = withAuthContext(handlePost as any);
