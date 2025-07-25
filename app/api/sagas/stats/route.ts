import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { SagaService } from '@/lib/saga-service';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
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

    const userSagas = await SagaService.getSagasByUser(userId);

    // Calculate recent sagas (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentSagas = userSagas.filter(saga =>
      new Date(saga.createdAt) > oneWeekAgo
    ).length;

    return NextResponse.json({
      totalSagas: userSagas.length,
      recentSagas,
    });
  } catch (error) {
    console.error('Error fetching saga stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}