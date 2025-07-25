import { getDatabase } from './mongodb';
import { Saga, CreateSagaData, UpdateSagaData } from './types';
import { ObjectId } from 'mongodb';

export class SagaService {
  private static async getCollection() {
    const db = await getDatabase();
    return db.collection<Saga>('sagas');
  }

  static async createSaga(data: CreateSagaData, userId: string): Promise<Saga> {
    const collection = await this.getCollection();
    const saga: Omit<Saga, '_id'> = {
      ...data,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(saga);
    return { ...saga, _id: result.insertedId.toString() };
  }

  static async getSagasByUser(userId: string): Promise<Saga[]> {
    const collection = await this.getCollection();
    const sagas = await collection.find({ userId }).sort({ updatedAt: -1 }).toArray();
    return sagas.map(saga => ({
      ...saga,
      _id: saga._id.toString()
    }));
  }

  static async getSagaById(id: string, userId: string): Promise<Saga | null> {
    try {
      const collection = await this.getCollection();
      const objectId = new ObjectId(id);

      const saga = await collection.findOne({
        _id: objectId as any,
        userId
      });

      if (!saga) return null;

      // Convert ObjectId to string
      return {
        ...saga,
        _id: saga._id.toString()
      };
    } catch (error) {
      console.error(`Error getting saga by ID: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  static async updateSaga(data: UpdateSagaData, userId: string): Promise<Saga | null> {
    try {
      console.log(`Updating saga ${data._id} for user ${userId}`);
      const collection = await this.getCollection();
      const { _id, ...updateData } = data;

      // Convert string ID to ObjectId
      const objectId = new ObjectId(_id);
      console.log(`Looking for saga with ObjectId ${objectId}`);

      // First check if the saga exists for this user
      const existingSaga = await collection.findOne({
        _id: objectId as any,
        userId
      });

      if (!existingSaga) {
        console.error(`Saga not found with ID ${_id} for user ${userId}`);
        return null;
      }

      console.log("Existing saga found:", existingSaga);
      console.log("Applying updates:", updateData);

      const result = await collection.findOneAndUpdate(
        { _id: objectId as any, userId },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) return null;

      // Convert ObjectId to string in the result
      return {
        ...result,
        _id: result._id.toString()
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error updating saga: ${error.message}`);
      } else {
        console.error('Error updating saga:', error);
      }
      throw error;
    }
  }

  static async deleteSaga(id: string, userId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const objectId = new ObjectId(id);
      const result = await collection.deleteOne({ _id: objectId as any, userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting saga: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }

  static async getAllSagas(limit: number = 20, skip: number = 0): Promise<Saga[]> {
    const collection = await this.getCollection();
    const sagas = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    // Convert ObjectId to string in each saga
    return sagas.map(saga => ({
      ...saga,
      _id: saga._id.toString()
    }));
  }
}