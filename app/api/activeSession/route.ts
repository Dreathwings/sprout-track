import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { withAuthContext, AuthResult } from '../utils/auth';
import { checkWritePermission } from '../utils/writeProtection';

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
        notes: session.notes,
      },
    });
  } catch (error) {
    console.error('Error fetching active feeding session:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch active feeding session.' }, { status: 500 });
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }

  try {
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const body: { babyId?: string; notes?: string } = await req.json();

    if (!body.babyId) {
      return NextResponse.json({ success: false, error: 'Baby ID is required.' }, { status: 400 });
    }

    const session = await prisma.feedingSession.findFirst({
      where: {
        familyId,
        babyId: body.babyId,
        status: 'ACTIVE',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'No active feeding session found.' }, { status: 404 });
    }

    const updated = await prisma.feedingSession.update({
      where: { id: session.id },
      data: {
        notes: body.notes && body.notes.trim() ? body.notes : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        babyId: updated.babyId,
        startedAt: updated.startedAt.toISOString(),
        side: updated.side,
        notes: updated.notes,
      },
    });
  } catch (error) {
    console.error('Error updating active feeding session:', error);
    return NextResponse.json({ success: false, error: 'Failed to update active feeding session.' }, { status: 500 });
  }
}

export const GET = withAuthContext(handleGet);
export const PUT = withAuthContext(handlePut);
