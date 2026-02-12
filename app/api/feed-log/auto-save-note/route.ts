import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { ApiResponse } from '../../types';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { checkWritePermission } from '../../utils/writeProtection';

interface AutoSaveNoteBody {
  feedLogId?: string;
  babyId?: string;
  note?: string;
  updatedAt?: string;
}

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) return writeCheck.response!;

  try {
    const { familyId } = authContext;
    const body: AutoSaveNoteBody = await req.json();
    const note = body.note?.trim() ? body.note.trim() : null;

    if (body.feedLogId) {
      const existing = await prisma.feedLog.findFirst({ where: { id: body.feedLogId, familyId: familyId || null } });
      if (!existing) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Feed log not found' }, { status: 404 });
      }

      if (body.updatedAt && new Date(body.updatedAt).getTime() < existing.updatedAt.getTime()) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Conflict: entry updated by another user.' }, { status: 409 });
      }

      const updated = await prisma.feedLog.update({ where: { id: body.feedLogId }, data: { notes: note } });
      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { id: updated.id, notes: updated.notes, updatedAt: updated.updatedAt.toISOString() },
      });
    }

    if (body.babyId) {
      const existingSession = await prisma.activeFeedingSession.findFirst({ where: { babyId: body.babyId, familyId: familyId || null } });
      if (!existingSession) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Active feeding session not found' }, { status: 404 });
      }

      const updated = await prisma.activeFeedingSession.update({ where: { id: existingSession.id }, data: { note } });
      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { id: updated.id, note: updated.note, updatedAt: updated.updatedAt.toISOString() },
      });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'feedLogId or babyId is required' }, { status: 400 });
  } catch (error) {
    console.error('Error auto-saving feed note:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to auto-save note' }, { status: 500 });
  }
}

export const POST = withAuthContext(handlePost as any);
