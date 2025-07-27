import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SagaService } from '@/lib/saga-service';
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

interface RouteParams {
  params: {
    id: string;
  };
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const saga = await SagaService.getSagaById(params.id, userId);

    if (!saga) {
      return NextResponse.json({ error: 'Saga not found' }, { status: 404 });
    }

    return NextResponse.json(saga);
  } catch (error) {
    console.error('Error fetching saga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData = await request.json();

    const updatedSaga = await SagaService.updateSaga(
      { _id: params.id, ...updateData },
      userId
    );

    if (!updatedSaga) {
      return NextResponse.json({ error: 'Saga not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSaga);
  } catch (error) {
    console.error('Error updating saga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const success = await SagaService.deleteSaga(params.id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Saga not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}