// This file is no longer needed as we don't use predefined choices in the new story system.
// All story progression is handled through free-text user decisions.
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
	params: {
		id: string;
	};
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { choiceIndex, childNodeId } = await request.json();

		if (choiceIndex === undefined || !childNodeId) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		const updatePath = `choices.${choiceIndex}.childNodeId`;
		const updateObj = { [updatePath]: childNodeId };

		const result = await stories.updateOne(
			{ _id: new ObjectId(params.id) },
			{ $set: updateObj }
		);

		if (result.matchedCount === 0) {
			return NextResponse.json({ error: 'Story node not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error updating choice:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
