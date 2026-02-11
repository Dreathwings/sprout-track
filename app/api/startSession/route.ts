import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { withAuthContext, AuthResult } from '../utils/auth';
import { checkWritePermission } from '../utils/writeProtection';
import { BreastSide } from '@prisma/client';

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

    const body: { babyId?: string; side?: BreastSide; notes?: string } = await req.json();

    if (!body.babyId) {
      return NextResponse.json({ success: false, error: 'Baby ID is required.' }, { status: 400 });
    }

    const baby = await prisma.baby.findFirst({ where: { id: body.babyId, familyId } });
    if (!baby) {
      return NextResponse.json({ success: false, error: 'Baby not found in this family.' }, { status: 404 });
    }

    const existingSession = await prisma.feedingSession.findFirst({
      where: {
        familyId,
        babyId: body.babyId,
        status: 'ACTIVE',
      },
    });

    if (existingSession) {
      return NextResponse.json({ success: false, error: 'A feeding session is already active for this child.' }, { status: 409 });
    }

    const session = await prisma.feedingSession.create({
      data: {
        familyId,
        babyId: body.babyId,
        caretakerId,
        startedAt: new Date(),
        status: 'ACTIVE',
        side: body.side,
        notes: body.notes && body.notes.trim() ? body.notes : null,
      },
    });

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
    console.error('Error starting feeding session:', error);
    return NextResponse.json({ success: false, error: 'Failed to start feeding session.' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost);
