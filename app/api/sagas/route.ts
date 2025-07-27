import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SagaService } from '@/lib/saga-service';
import { CreateSagaData } from '@/lib/types';
import { getDatabase } from '@/lib/mongodb';

// Extend the Session user type to include 'id'
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

async function getUserId(session: any): Promise<string | null> {
  let userId = session.user.id;

  // If ID is not in the session, try to fetch it
  if (!userId && session.user.email) {
    const db = await getDatabase();
    const users = db.collection('users');
    const user = await users.findOne({ email: session.user.email });

    if (user) {
      userId = user._id.toString();
    }
  }

  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const userOnly = url.searchParams.get('userOnly') === 'true';

    let sagas;
    if (userOnly) {
      sagas = await SagaService.getSagasByUser(userId);
    } else {
      sagas = await SagaService.getAllSagas(limit, skip);
    }

    return NextResponse.json(sagas);
  } catch (error) {
    console.error('Error fetching sagas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();

    // Set default value for totalChapters if not provided
    if (!data.totalChapters) {
      data.totalChapters = 100;
    } else {
      // Ensure totalChapters is a number between 1 and 1000
      const chapters = parseInt(data.totalChapters);
      if (isNaN(chapters) || chapters < 1 || chapters > 1000) {
        return NextResponse.json({
          error: 'Total chapters must be a number between 1 and 1000'
        }, { status: 400 });
      }
      data.totalChapters = chapters;
    }

    const saga = await SagaService.createSaga(data, userId);
    return NextResponse.json(saga, { status: 201 });
  } catch (error) {
    console.error('Error creating saga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}