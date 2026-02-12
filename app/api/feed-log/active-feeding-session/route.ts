import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { activeSessionSelect, sessionResponse } from '../utils/session-utils';

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');
    const { familyId } = authContext;

    if (!babyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'babyId is required' }, { status: 400 });
    }

    const session = await prisma.activeFeedingSession.findFirst({
      where: { babyId, familyId: familyId || null },
      select: activeSessionSelect,
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: session ? sessionResponse(session) : null,
    });
  } catch (error) {
    console.error('Error fetching active feeding session:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to fetch active feeding session' }, { status: 500 });
  }
}

export const GET = withAuthContext(handleGet as any);
