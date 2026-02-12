import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { checkWritePermission } from '../../utils/writeProtection';
import { activeSessionSelect, sessionResponse } from '../utils/session-utils';
import { BreastSide } from '@prisma/client';

interface StartFeedingBody {
  babyId: string;
  side: BreastSide;
  note?: string;
}

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  try {
    const { familyId, caretakerId } = authContext;
    const body: StartFeedingBody = await req.json();

    if (!body.babyId || !body.side) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'babyId and side are required' }, { status: 400 });
    }

    const baby = await prisma.baby.findFirst({ where: { id: body.babyId, familyId: familyId || null } });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Baby not found in this family.' }, { status: 404 });
    }

    const existing = await prisma.activeFeedingSession.findFirst({ where: { babyId: body.babyId, familyId: familyId || null } });
    if (existing) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'An active feeding session already exists for this baby.' }, { status: 409 });
    }

    const now = new Date();
    const session = await prisma.activeFeedingSession.create({
      data: {
        babyId: body.babyId,
        familyId: familyId || null,
        caretakerId: caretakerId || null,
        startedAt: now,
        activeSide: body.side,
        lastSwitchAt: now,
        status: 'ACTIVE',
        note: body.note?.trim() ? body.note.trim() : null,
      },
      select: activeSessionSelect,
    });

    return NextResponse.json<ApiResponse<any>>({ success: true, data: sessionResponse(session) });
  } catch (error) {
    console.error('Error starting feeding session:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to start feeding session' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost as any);
