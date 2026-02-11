import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { withAuthContext, AuthResult } from '../utils/auth';

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');
    const { familyId } = authContext;

    if (!familyId) {
      return NextResponse.json({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    if (!babyId) {
      return NextResponse.json({ success: false, error: 'Baby ID is required.' }, { status: 400 });
    }

    const session = await prisma.feedingSession.findFirst({
      where: { familyId, babyId, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        babyId: session.babyId,
        startedAt: session.startedAt.toISOString(),
        side: session.side,
      },
    });
  } catch (error) {
    console.error('Error fetching active feeding session:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch active feeding session.' }, { status: 500 });
  }
}

export const GET = withAuthContext(handleGet);
