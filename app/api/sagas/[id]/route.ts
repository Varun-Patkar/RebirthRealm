import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SagaService } from '@/lib/saga-service';
import { UpdateSagaData } from '@/lib/types';
import { getDatabase } from '@/lib/mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;

    // If ID is not in the session, try to fetch it
    if (!userId && session.user.email) {
      const db = await getDatabase();
      const users = db.collection('users');
      const user = await users.findOne({ email: session.user.email });

      if (user) {
        userId = user._id.toString();
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;

    // If ID is not in the session, try to fetch it
    if (!userId && session.user.email) {
      const db = await getDatabase();
      const users = db.collection('users');
      const user = await users.findOne({ email: session.user.email });

      if (user) {
        userId = user._id.toString();
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: Omit<UpdateSagaData, '_id'> = await request.json();
    const updateData: UpdateSagaData = { ...data, _id: params.id };

    const saga = await SagaService.updateSaga(updateData, userId);

    if (!saga) {
      return NextResponse.json({ error: 'Saga not found' }, { status: 404 });
    }

    return NextResponse.json(saga);
  } catch (error) {
    console.error('Error updating saga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;

    // If ID is not in the session, try to fetch it
    if (!userId && session.user.email) {
      const db = await getDatabase();
      const users = db.collection('users');
      const user = await users.findOne({ email: session.user.email });

      if (user) {
        userId = user._id.toString();
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await SagaService.deleteSaga(params.id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Saga not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Saga deleted successfully' });
  } catch (error) {
    console.error('Error deleting saga:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    console.log("Session:", session);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log("Updating saga with data:", data);
    console.log("Saga ID:", params.id);

    // Ensure totalChapters is a number between 1 and 1000
    if (data.totalChapters) {
      const chapters = parseInt(data.totalChapters);
      if (isNaN(chapters) || chapters < 1 || chapters > 1000) {
        return NextResponse.json({
          error: 'Total chapters must be a number between 1 and 1000'
        }, { status: 400 });
      }
      data.totalChapters = chapters;
    }

    let userId = session.user.id;
    console.log("User ID from session:", userId);

    // If ID is not in the session, try to fetch it
    if (!userId && session.user.email) {
      const db = await getDatabase();
      const users = db.collection('users');
      const user = await users.findOne({ email: session.user.email });

      if (user) {
        userId = user._id.toString();
        console.log("User ID from database:", userId);
      } else {
        console.error("User not found for email:", session.user.email);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!userId) {
      console.error("No user ID available");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = {
      _id: params.id,
      ...data,
    };
    console.log("Final update data:", updateData);

    const updatedSaga = await SagaService.updateSaga(updateData, userId);
    console.log("Update result:", updatedSaga);

    if (!updatedSaga) {
      console.error(`Saga not found with ID ${params.id} for user ${userId}`);
      return NextResponse.json({ error: 'Saga not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSaga);
  } catch (error) {
    console.error('Error updating saga:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to update saga', details: errorMessage },
      { status: 500 }
    );
  }
}