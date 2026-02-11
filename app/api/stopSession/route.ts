import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { withAuthContext, AuthResult } from '../utils/auth';
import { checkWritePermission } from '../utils/writeProtection';

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }

  try {
    const { familyId, caretakerId } = authContext;
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

    const stoppedAt = new Date();
    const durationInSeconds = Math.max(1, Math.floor((stoppedAt.getTime() - session.startedAt.getTime()) / 1000));

    const feedLog = await prisma.$transaction(async (tx) => {
      const created = await tx.feedLog.create({
        data: {
          familyId,
          babyId: session.babyId,
          caretakerId: caretakerId || session.caretakerId,
          type: 'BREAST',
          side: session.side,
          startTime: session.startedAt,
          endTime: stoppedAt,
          feedDuration: durationInSeconds,
          amount: durationInSeconds / 60,
          time: stoppedAt,
          notes: body.notes && body.notes.trim() ? body.notes : session.notes,
        },
      });

      await tx.feedingSession.delete({ where: { id: session.id } });

      return created;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: feedLog.id,
        babyId: feedLog.babyId,
        startTime: feedLog.startTime?.toISOString(),
        endTime: feedLog.endTime?.toISOString(),
        feedDuration: feedLog.feedDuration,
      },
    });
  } catch (error) {
    console.error('Error stopping feeding session:', error);
    return NextResponse.json({ success: false, error: 'Failed to stop feeding session.' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost);
