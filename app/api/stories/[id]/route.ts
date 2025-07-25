import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface RouteParams {
	params: {
		id: string;
	};
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const deleteChildren = searchParams.get('deleteChildren') === 'true';

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		// First, get the node to verify ownership and get children if needed
		const node = await stories.findOne({
			_id: new ObjectId(params.id),
			userId: session.user.id
		});

		if (!node) {
			return NextResponse.json({ error: 'Story node not found' }, { status: 404 });
		}

		let deletedCount = 0;

		if (deleteChildren) {
			// Delete this node and all its descendants recursively
			const nodesToDelete = await findAllDescendants(stories, params.id);
			nodesToDelete.push(params.id);

			// Delete all nodes
			const result = await stories.deleteMany({
				_id: { $in: nodesToDelete.map(id => new ObjectId(id)) },
				userId: session.user.id
			});

			deletedCount = result.deletedCount || 0;
		} else {
			// Only delete this specific node
			// First, update any children to point to this node's parent
			if (node.parentId) {
				await stories.updateMany(
					{ parentId: params.id, userId: session.user.id },
					{ $set: { parentId: node.parentId } }
				);
			} else {
				// If this is a root node, make its children root nodes
				await stories.updateMany(
					{ parentId: params.id, userId: session.user.id },
					{ $unset: { parentId: "" } }
				);
			}

			// Delete the node
			const result = await stories.deleteOne({
				_id: new ObjectId(params.id),
				userId: session.user.id
			});

			deletedCount = result.deletedCount || 0;
		}

		return NextResponse.json({
			success: true,
			deletedCount,
			message: `Deleted ${deletedCount} node${deletedCount > 1 ? 's' : ''}`
		});

	} catch (error) {
		console.error('Error deleting story node:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// Helper function to find all descendants of a node
async function findAllDescendants(collection: any, nodeId: string): Promise<string[]> {
	const descendants: string[] = [];
	const queue = [nodeId];

	while (queue.length > 0) {
		const currentId = queue.shift()!;
		const children = await collection.find({ parentId: currentId }).toArray();

		for (const child of children) {
			const childId = child._id.toString();
			descendants.push(childId);
			queue.push(childId);
		}
	}

	return descendants;
}

// Removed unused migration function

export async function PATCH(
	_: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { node } = await _.json();

		if (!node) {
			return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
		}

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		// Verify the node exists and belongs to the user
		const existingNode = await stories.findOne({
			_id: new ObjectId(params.id),
			userId: session.user.id
		});

		if (!existingNode) {
			return NextResponse.json({ error: 'Node not found or unauthorized' }, { status: 404 });
		}

		// Preserve the original _id, createdAt, userId
		const updatedNode = {
			...node,
			_id: existingNode._id,
			userId: existingNode.userId,
			createdAt: existingNode.createdAt
		};

		// Remove _id from the update data
		const { _id, ...updateData } = updatedNode;

		const result = await stories.findOneAndUpdate(
			{ _id: new ObjectId(params.id) },
			{ $set: updateData },
			{ returnDocument: 'after' }
		);

		return NextResponse.json({
			...result,
			_id: result?._id?.toString() || null
		});
	} catch (error) {
		console.error('Error updating story node:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}


export async function GET(
	_: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const db = await getDatabase();
		const stories = db.collection('storyNodes');

		const node = await stories.findOne({ _id: new ObjectId(params.id) });

		if (!node) {
			return NextResponse.json({ error: 'Node not found' }, { status: 404 });
		}

		return NextResponse.json({
			...node,
			_id: node._id.toString()
		});
	} catch (error) {
		console.error('Error fetching story node:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
