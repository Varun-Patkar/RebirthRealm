import { ObjectId } from 'mongodb';

export interface Saga {
  _id?: string;
  userId: string;
  title: string;
  worldName: string;          // Renamed from fandom
  worldDescription: string;   // Renamed from customFandomDescription
  moodAndTropes: string;      // New field
  premise: string;
  advancedOptions?: string;
  totalChapters: number;      // New field to track total planned chapters
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  image?: string;
  githubId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSagaData = Omit<Saga, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateSagaData = Partial<CreateSagaData> & { _id: string };

// Updated story types without predefined choices
export interface StoryNode {
  _id?: string;
  sagaId: string;
  parentId?: string | null;
  userDecision?: string; // The free-text decision that led to this node
  summary: string;
  content: string;
  status: 'active' | 'ended' | 'unsafe'; // Track if this timeline ended
  endReason?: string; // Why the timeline ended (if status is 'ended' or 'unsafe')
  chapterNumber: number;      // New field to track which chapter this node represents
  outline?: ChapterOutline;   // New field to store the chapter outline
  createdAt: Date;
}

// New type for chapter outline
export interface ChapterOutline {
  goals: string[];
  beats: {
    beat: number;
    description: string;
  }[];
  synopsis: string;
}

export interface StoryTimeline {
  nodes: StoryNode[];
  currentNodeId: string | null;
  deadEnds: string[]; // Track nodes that ended due to poor decisions
}