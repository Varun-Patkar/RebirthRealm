import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { StoryNode } from '@/lib/types';

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const url = new URL(request.url);
		const sagaId = url.searchParams.get('sagaId');

		if (!sagaId) {
			return NextResponse.json({ error: 'Missing sagaId parameter' }, { status: 400 });
		}

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		const result = await stories.find({ sagaId }).toArray();
		return NextResponse.json(result.map(doc => ({
			...doc,
			_id: doc._id.toString(),
		})));
	} catch (error) {
		console.error('Error fetching stories:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { node } = await request.json();

		if (!node || !node.sagaId) {
			return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
		}

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		const newNode = {
			...node,
			userId: session.user.id,
			status: node.status || 'active',
			createdAt: new Date(),
		};

		const result = await stories.insertOne(newNode);

		return NextResponse.json({
			...newNode,
			_id: result.insertedId.toString(),
		});
	} catch (error) {
		console.error('Error creating story node:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const sagaId = searchParams.get('sagaId');

		if (!sagaId) {
			return NextResponse.json({ error: 'Missing sagaId parameter' }, { status: 400 });
		}

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		// Delete all story nodes for this saga belonging to the user
		const result = await stories.deleteMany({
			sagaId,
			userId: session.user.id
		});

		return NextResponse.json({
			success: true,
			deletedCount: result.deletedCount || 0,
			message: `Deleted ${result.deletedCount || 0} story nodes`
		});

	} catch (error) {
		console.error('Error deleting all story nodes:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}