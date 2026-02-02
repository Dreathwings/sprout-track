import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, FeedingTimerResponse, FeedingTimerUpdate } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { checkWritePermission } from '../utils/writeProtection';
import { formatForResponse, toUTC } from '../utils/timezone';

const formatTimerResponse = (timer: any): FeedingTimerResponse => ({
  ...timer,
  startTime: formatForResponse(timer.startTime),
  createdAt: formatForResponse(timer.createdAt) || '',
  updatedAt: formatForResponse(timer.updatedAt) || '',
});

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get('babyId');

    if (!babyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Baby ID is required.' }, { status: 400 });
    }

    const timer = await prisma.feedingTimer.findFirst({
      where: { babyId, familyId: userFamilyId },
    });

    if (!timer) {
      return NextResponse.json<ApiResponse<FeedingTimerResponse | null>>({ success: true, data: null });
    }

    return NextResponse.json<ApiResponse<FeedingTimerResponse>>({
      success: true,
      data: formatTimerResponse(timer),
    });
  } catch (error) {
    console.error('Error fetching feeding timer:', error);
    return NextResponse.json<ApiResponse<FeedingTimerResponse>>(
      { success: false, error: 'Failed to fetch feeding timer' },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }

  try {
    const { familyId: userFamilyId, caretakerId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'User is not associated with a family.' }, { status: 403 });
    }

    const body: FeedingTimerUpdate = await req.json();

    if (!body.babyId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Baby ID is required.' }, { status: 400 });
    }

    const baby = await prisma.baby.findFirst({
      where: { id: body.babyId, familyId: userFamilyId },
    });

    if (!baby) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Baby not found in this family.' }, { status: 404 });
    }

    const existingTimer = await prisma.feedingTimer.findFirst({
      where: { babyId: body.babyId, familyId: userFamilyId },
    });

    let startTime = existingTimer?.startTime ?? null;
    if (body.startTime !== undefined) {
      startTime = body.startTime ? toUTC(body.startTime) : null;
    }
    if (body.isRunning === false && body.startTime === undefined) {
      startTime = null;
    }
    if (body.isRunning === true && !startTime) {
      startTime = new Date();
    }

    const data = {
      babyId: body.babyId,
      familyId: userFamilyId,
      caretakerId,
      activeBreast: body.activeBreast ?? existingTimer?.activeBreast ?? null,
      leftDuration: body.leftDuration ?? existingTimer?.leftDuration ?? 0,
      rightDuration: body.rightDuration ?? existingTimer?.rightDuration ?? 0,
      isRunning: body.isRunning ?? existingTimer?.isRunning ?? false,
      startTime,
    };

    const timer = existingTimer
      ? await prisma.feedingTimer.update({ where: { id: existingTimer.id }, data })
      : await prisma.feedingTimer.create({ data });

    return NextResponse.json<ApiResponse<FeedingTimerResponse>>({
      success: true,
      data: formatTimerResponse(timer),
    });
  } catch (error) {
    console.error('Error updating feeding timer:', error);
    return NextResponse.json<ApiResponse<FeedingTimerResponse>>(
      { success: false, error: 'Failed to update feeding timer' },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet);
export const PUT = withAuthContext(handlePut);
