import { NextRequest, NextResponse } from 'next/server';
import { withAuthContext, AuthResult } from '../../utils/auth';
import { ApiResponse } from '../../types';
import { getActiveSessionForBaby, formatSessionResponse } from '../session-core';

async function handleGet(req: NextRequest, authContext: AuthResult) {
  const { searchParams } = new URL(req.url);
  const babyId = searchParams.get('babyId');

  if (!babyId) {
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'babyId is required' }, { status: 400 });
  }

  const session = await getActiveSessionForBaby(babyId, authContext);

  return NextResponse.json<ApiResponse<any>>({
    success: true,
    data: session ? formatSessionResponse(session) : null,
  });
}

export const GET = withAuthContext(handleGet as any);
