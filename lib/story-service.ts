import { StoryNode, Saga, ChapterOutline } from '@/lib/types';
import { fillPromptTemplate, NARRATIVE_PROMPT, STORYWRITER_NARRATIVE_PROMPT, DECISION_EVALUATION_PROMPT, CHAPTER_OUTLINE_PROMPT, MEMORY_SUMMARIZATION_PROMPT } from '@/lib/story-prompts';
import WebLLMService from '@/lib/webllm-service';
import type { ChatMessage } from '@/lib/webllm-service';

// Client-side service that uses API endpoints instead of direct MongoDB access
export class StoryService {
	static async getStoriesBySaga(sagaId: string): Promise<StoryNode[]> {
		const response = await fetch(`/api/stories?sagaId=${sagaId}`);
		if (!response.ok) {
			throw new Error('Failed to fetch story nodes');
		}
		return response.json();
	}

	static async createStoryNode(
		node: Omit<StoryNode, '_id' | 'createdAt'>
	): Promise<StoryNode> {
		const response = await fetch('/api/stories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ node }),
		});

		if (!response.ok) {
			throw new Error('Failed to create story node');
		}

		return response.json();
	}

	static async evaluateDecision(
		saga: Saga,
		userDecision: string,
		onUpdate?: (text: string) => void
	): Promise<{ judgment: 'CONTINUE' | 'UNSAFE' | 'CONCLUDE' | 'CLARIFY', explanation: string }> {
		const webLLM = WebLLMService.getInstance();

		if (!webLLM.isInitialized()) {
			throw new Error("WebLLM is not initialized");
		}

		const prompt = fillPromptTemplate(DECISION_EVALUATION_PROMPT, {
			title: saga.title,
			worldName: saga.worldName,
			userDecision,
		});

		const messages: ChatMessage[] = [
			{ role: 'system', content: 'You are a story safety evaluator. Analyze user decisions and provide judgment with explanation.' },
			{ role: 'user', content: prompt }
		];

		const response = await webLLM.generateResponse(messages, onUpdate);

		// Parse the response to extract judgment and explanation
		const judgmentMatch = response.match(/JUDGMENT:\s*(CONTINUE|UNSAFE|CONCLUDE|CLARIFY)/i);
		const explanationMatch = response.match(/EXPLANATION:\s*(.+)$/i);

		const judgment = judgmentMatch ? judgmentMatch[1].toUpperCase() as 'CONTINUE' | 'UNSAFE' | 'CONCLUDE' | 'CLARIFY' : 'CONTINUE';
		const explanation = explanationMatch ? explanationMatch[1].trim() : 'Decision evaluated successfully.';

		return { judgment, explanation };
	}

	static async processUserDecision(
		saga: Saga,
		currentNode: StoryNode,
		userDecision: string,
		onOutlineUpdate?: (text: string) => void,
		onNarrativeUpdate?: (text: string) => void,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {}
	): Promise<{ node: StoryNode | null, evaluation: { judgment: string, explanation: string } }> {
		// First evaluate the decision
		const evaluation = await this.evaluateDecision(saga, userDecision);

		if (evaluation.judgment === 'UNSAFE' || evaluation.judgment === 'CONCLUDE') {
			// Create an end node for this timeline
			const endNode: Omit<StoryNode, '_id' | 'createdAt'> = {
				sagaId: saga._id!,
				parentId: currentNode._id!,
				userDecision,
				summary: `Timeline ended: ${evaluation.explanation}`,
				content: `Your decision: "${userDecision}"\n\n${evaluation.explanation}\n\nThis timeline has ended. You can load back to a previous decision point to continue the story.`,
				status: evaluation.judgment === 'UNSAFE' ? 'unsafe' : 'ended',
				endReason: evaluation.explanation,
				chapterNumber: currentNode.chapterNumber // Keep same chapter number
			};

			const createdNode = await this.createStoryNode(endNode);
			return { node: createdNode, evaluation };
		}

		if (evaluation.judgment === 'CLARIFY') {
			// Don't create a new node, just return the evaluation for clarification
			return { node: null, evaluation };
		}

		// If judgment is CONTINUE, proceed with story generation
		// Calculate the next chapter number
		const nextChapterNumber = currentNode.chapterNumber + 1;

		// Generate chapter outline first
		const outline = await this.generateChapterOutline(
			saga,
			nextChapterNumber,
			currentNode.content,
			userDecision,
			onOutlineUpdate,
			undefined, // no feedback for first generation
			previousMemories
		);

		// Format the beats for the narrative prompt
		const formattedBeats = outline.beats.map(beat =>
			`Beat ${beat.beat}: ${beat.description}`
		).join('\n');

		// Generate narrative based on the outline
		const narrative = await this.generateNarrative(
			saga,
			nextChapterNumber,
			outline,
			formattedBeats,
			currentNode.content,
			userDecision,
			onNarrativeUpdate,
			undefined, // no feedback for first generation
			previousMemories
		);

		const newNode: Omit<StoryNode, '_id' | 'createdAt'> = {
			sagaId: saga._id!,
			parentId: currentNode._id!,
			userDecision,
			summary: outline.synopsis, // Use the synopsis from the outline as the summary
			content: narrative,
			status: 'active',
			chapterNumber: nextChapterNumber,
			outline: outline
		};

		const createdNode = await this.createStoryNode(newNode);
		return { node: createdNode, evaluation };
	}

	static async regenerateStory(
		saga: Saga,
		currentNode: StoryNode,
		userFeedback: string,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {},
		onOutlineUpdate?: (text: string) => void,
		onNarrativeUpdate?: (text: string) => void
	): Promise<StoryNode> {
		// Get the same chapter number and parent ID
		const chapterNumber = currentNode.chapterNumber;
		const parentId = currentNode.parentId;
		const userDecision = currentNode.userDecision;

		// Generate a new chapter outline incorporating the feedback
		const outline = await this.generateChapterOutline(
			saga,
			chapterNumber,
			currentNode.content,
			userDecision,
			onOutlineUpdate,
			userFeedback,
			previousMemories
		);

		// Format the beats for the narrative prompt
		const formattedBeats = outline.beats.map(beat =>
			`Beat ${beat.beat}: ${beat.description}`
		).join('\n');

		// Generate narrative based on the outline
		const narrative = await this.generateNarrative(
			saga,
			chapterNumber,
			outline,
			formattedBeats,
			currentNode.content,
			userDecision,
			onNarrativeUpdate,
			userFeedback,
			previousMemories
		);

		// Update the current node with the new content
		const updatedNode: Omit<StoryNode, '_id' | 'createdAt'> = {
			...currentNode,
			summary: outline.synopsis,
			content: narrative,
			outline: outline
		};

		// Update the node in the database
		const response = await fetch(`/api/stories/${currentNode._id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ node: updatedNode }),
		});

		if (!response.ok) {
			throw new Error('Failed to update story node');
		}

		return await response.json();
	}

	static async generateChapterOutline(
		saga: Saga,
		chapterNumber: number,
		previousText?: string,
		userDecision?: string,
		onUpdate?: (text: string) => void,
		userFeedback?: string,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {}
	): Promise<ChapterOutline> {
		const webLLM = WebLLMService.getInstance();

		if (!webLLM.isInitialized()) {
			throw new Error("WebLLM is not initialized");
		}

		const prompt = fillPromptTemplate(CHAPTER_OUTLINE_PROMPT, {
			title: saga.title,
			worldName: saga.worldName,
			worldDescription: saga.worldDescription,
			moodAndTropes: saga.moodAndTropes,
			premise: saga.premise,
			advancedOptions: saga.advancedOptions,
			totalChapters: saga.totalChapters?.toString() || "100",
			chapterNumber: chapterNumber.toString(),
			previousText: previousText?.slice(-500),
			userDecision,
			userFeedback,
			longTermMemory: previousMemories.longTermMemory,
			recentMemory: previousMemories.recentMemory
		});

		const messages: ChatMessage[] = [
			{ role: 'system', content: 'You are a narrative architect generating chapter outlines in JSON format. Follow the structure exactly.' },
			{ role: 'user', content: prompt }
		];

		const response = await webLLM.generateResponse(messages, onUpdate);

		try {
			// Try to parse the JSON response
			// Sometimes the LLM might add text before or after the JSON, so we need to extract it
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("Could not extract JSON from response");
			}

			const parsed = JSON.parse(jsonMatch[0]);

			// Validate the structure
			if (!parsed.goals || !Array.isArray(parsed.goals) ||
				!parsed.beats || !Array.isArray(parsed.beats) ||
				!parsed.synopsis) {
				throw new Error("Invalid outline structure");
			}

			return parsed as ChapterOutline;
		} catch (error) {
			console.error("Error parsing chapter outline:", error);
			// Fallback to a simple outline if parsing fails
			return {
				goals: ["Advance the story", "Develop the character"],
				beats: [
					{ beat: 1, description: "Continue from the previous events" },
					{ beat: 2, description: "Introduce a new development" },
					{ beat: 3, description: "Present a challenge or decision point" }
				],
				synopsis: "The story continues based on the user's previous decision."
			};
		}
	}

	static async generateNarrative(
		saga: Saga,
		chapterNumber: number,
		outline: ChapterOutline,
		formattedBeats: string,
		previousText?: string,
		userDecision?: string,
		onUpdate?: (text: string) => void,
		userFeedback?: string,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {}
	): Promise<string> {
		const webLLM = WebLLMService.getInstance();

		if (!webLLM.isInitialized()) {
			throw new Error("WebLLM is not initialized");
		}

		const prompt = fillPromptTemplate(NARRATIVE_PROMPT, {
			title: saga.title,
			worldName: saga.worldName,
			worldDescription: saga.worldDescription,
			moodAndTropes: saga.moodAndTropes,
			premise: saga.premise,
			advancedOptions: saga.advancedOptions,
			totalChapters: saga.totalChapters?.toString() || "100",
			chapterNumber: chapterNumber.toString(),
			goals: outline.goals.join(", "),
			beats: formattedBeats,
			synopsis: outline.synopsis,
			previousText: previousText?.slice(-500),
			userDecision,
			userFeedback,
			longTermMemory: previousMemories.longTermMemory,
			recentMemory: previousMemories.recentMemory
		});

		const messages: ChatMessage[] = [
			{
				role: 'system',
				content: 'You are a creative storytelling assistant writing in second-person perspective. Write at least 1500 words of detailed, immersive story content. DO NOT include any meta-text. Return ONLY pure narrative.'
			},
			{ role: 'user', content: prompt }
		];

		// For UI updates, we'll show the generation progress
		const handleUpdate = (text: string) => {
			if (onUpdate) {
				onUpdate(text);
			}
		};

		const response = await webLLM.generateResponse(messages, handleUpdate);

		// Clean up the response to remove any potential meta-text more aggressively
		const cleanedResponse = response
			.replace(/^(Generating narrative:|Generating:|Here's the narrative:|Chapter \d+:|Story:|Content:)/i, '')
			.replace(/^(Here is the story content:|Story content:|Narrative:|Story:|Here's the story:)/i, '')
			.replace(/^(Chapter \d+)/i, '')  // Remove any chapter headings
			.trim();

		// Return the full response without any length truncation
		return cleanedResponse;
	}

	static async deleteStoryNode(nodeId: string, deleteChildren: boolean = false): Promise<{ success: boolean, deletedCount: number, message: string }> {
		const response = await fetch(`/api/stories/${nodeId}?deleteChildren=${deleteChildren}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error('Failed to delete story node');
		}

		return response.json();
	}

	static async deleteAllStoryNodes(sagaId: string): Promise<{ success: boolean, deletedCount: number, message: string }> {
		const response = await fetch(`/api/stories?sagaId=${sagaId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error('Failed to delete all story nodes');
		}

		return response.json();
	}

	// Updated method for starting a story
	static async startNewStory(
		saga: Saga,
		onOutlineUpdate?: (text: string) => void,
		onNarrativeUpdate?: (text: string) => void
	): Promise<StoryNode> {
		// Generate the first chapter outline
		const chapterNumber = 1;

		const outline = await this.generateChapterOutline(
			saga,
			chapterNumber,
			undefined,
			undefined,
			onOutlineUpdate
		);

		// Format the beats for the narrative prompt
		const formattedBeats = outline.beats.map(beat =>
			`Beat ${beat.beat}: ${beat.description}`
		).join('\n');

		// Generate narrative based on the outline
		const narrative = await this.generateNarrative(
			saga,
			chapterNumber,
			outline,
			formattedBeats,
			undefined,
			undefined,
			onNarrativeUpdate
		);

		// Create the first story node
		const newNode = await this.createStoryNode({
			sagaId: saga._id as string,
			parentId: null,
			userDecision: undefined,
			summary: outline.synopsis, // Use the synopsis from the outline as the summary
			content: narrative,
			status: 'active',
			chapterNumber: chapterNumber,
			outline: outline
		});

		return newNode;
	}

	// New method for starting a Storywriter mode story
	static async startNewStorywriterStory(
		saga: Saga,
		storyDirection: string,
		onNarrativeUpdate?: (text: string) => void
	): Promise<StoryNode> {
		// Generate narrative directly without outline for Storywriter mode
		const chapterNumber = 1;

		const narrative = await this.generateStorywriterNarrative(
			saga,
			chapterNumber,
			storyDirection,
			undefined, // no previous text for first chapter
			onNarrativeUpdate
		);

		// Create the first story node
		const newNode = await this.createStoryNode({
			sagaId: saga._id as string,
			parentId: null,
			userDecision: undefined,
			storyDirection,
			summary: `Chapter ${chapterNumber}: ${storyDirection.substring(0, 100)}...`,
			content: narrative,
			status: 'active',
			chapterNumber: chapterNumber,
			outline: undefined // No outline needed for Storywriter mode
		});

		return newNode;
	}

	// New method for continuing Storywriter mode story
	static async continueStorywriterStory(
		saga: Saga,
		currentNode: StoryNode,
		storyDirection: string,
		onNarrativeUpdate?: (text: string) => void,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {}
	): Promise<StoryNode> {
		const nextChapterNumber = currentNode.chapterNumber + 1;

		// Generate narrative based on the story direction
		const narrative = await this.generateStorywriterNarrative(
			saga,
			nextChapterNumber,
			storyDirection,
			currentNode.content,
			onNarrativeUpdate,
			undefined, // no feedback for first generation
			previousMemories
		);

		const newNode: Omit<StoryNode, '_id' | 'createdAt'> = {
			sagaId: saga._id!,
			parentId: currentNode._id!,
			userDecision: undefined,
			storyDirection,
			summary: `Chapter ${nextChapterNumber}: ${storyDirection.substring(0, 100)}...`,
			content: narrative,
			status: 'active',
			chapterNumber: nextChapterNumber,
			outline: undefined // No outline needed for Storywriter mode
		};

		const createdNode = await this.createStoryNode(newNode);
		return createdNode;
	}

	// New method for regenerating Storywriter mode story
	static async regenerateStorywriterStory(
		saga: Saga,
		currentNode: StoryNode,
		userFeedback: string,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {},
		onNarrativeUpdate?: (text: string) => void
	): Promise<StoryNode> {
		const chapterNumber = currentNode.chapterNumber;
		const storyDirection = currentNode.storyDirection!;

		// Generate narrative based on the story direction and feedback
		const narrative = await this.generateStorywriterNarrative(
			saga,
			chapterNumber,
			storyDirection,
			currentNode.content,
			onNarrativeUpdate,
			userFeedback,
			previousMemories
		);

		// Update the current node with the new content
		const updatedNode: Omit<StoryNode, '_id' | 'createdAt'> = {
			...currentNode,
			content: narrative
		};

		// Update the node in the database
		const response = await fetch(`/api/stories/${currentNode._id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ node: updatedNode }),
		});

		if (!response.ok) {
			throw new Error('Failed to update story node');
		}

		return await response.json();
	}

	// New method to generate Storywriter narrative
	static async generateStorywriterNarrative(
		saga: Saga,
		chapterNumber: number,
		storyDirection: string,
		previousText?: string,
		onUpdate?: (text: string) => void,
		userFeedback?: string,
		previousMemories: { longTermMemory?: string, recentMemory?: string } = {}
	): Promise<string> {
		const webLLM = WebLLMService.getInstance();

		if (!webLLM.isInitialized()) {
			throw new Error("WebLLM is not initialized");
		}

		const prompt = fillPromptTemplate(STORYWRITER_NARRATIVE_PROMPT, {
			title: saga.title,
			worldName: saga.worldName,
			worldDescription: saga.worldDescription,
			moodAndTropes: saga.moodAndTropes,
			premise: saga.premise,
			advancedOptions: saga.advancedOptions,
			totalChapters: saga.totalChapters?.toString() || "100",
			chapterNumber: chapterNumber.toString(),
			storyDirection,
			previousText: previousText?.slice(-500),
			userFeedback,
			longTermMemory: previousMemories.longTermMemory,
			recentMemory: previousMemories.recentMemory
		});

		const messages: ChatMessage[] = [
			{
				role: 'system',
				content: 'You are a creative storytelling assistant writing in second-person perspective. Your primary job is to follow the user\'s story direction exactly as specified. The story direction is your most important instruction - prioritize it above all other context. Write at least 1500 words of detailed, immersive story content that makes the user\'s vision come to life. DO NOT include any meta-text. Return ONLY pure narrative.'
			},
			{ role: 'user', content: prompt }
		];

		const handleUpdate = (text: string) => {
			if (onUpdate) {
				onUpdate(text);
			}
		};

		const response = await webLLM.generateResponse(messages, handleUpdate);

		// Clean up the response
		const cleanedResponse = response
			.replace(/^(Generating narrative:|Generating:|Here's the narrative:|Chapter \d+:|Story:|Content:)/i, '')
			.replace(/^(Here is the story content:|Story content:|Narrative:|Story:|Here's the story:)/i, '')
			.replace(/^(Chapter \d+)/i, '')
			.trim();

		return cleanedResponse;
	}

	// New method to generate memory summaries
	static async generateMemorySummary(
		summaries: string[]
	): Promise<string> {
		if (summaries.length === 0) return "";
		if (summaries.length === 1) return summaries[0];

		const webLLM = WebLLMService.getInstance();
		if (!webLLM.isInitialized()) {
			throw new Error("WebLLM is not initialized");
		}

		const prompt = fillPromptTemplate(MEMORY_SUMMARIZATION_PROMPT, {
			summaries: summaries.join("\n\n")
		});

		const messages: ChatMessage[] = [
			{
				role: 'system',
				content: 'You are a narrative summarizer. Create a concise, memory-like summary of multiple story events.'
			},
			{ role: 'user', content: prompt }
		];

		const response = await webLLM.generateResponse(messages);
		return response.trim();
	}

	// New method to build memory context for a given chapter
	static async buildMemoryContext(
		storyNodes: StoryNode[],
		currentChapterNumber: number
	): Promise<{ longTermMemory?: string, recentMemory?: string }> {
		// Filter previous chapters and sort by chapter number
		const previousChapters = storyNodes
			.filter(node => node.chapterNumber < currentChapterNumber)
			.sort((a, b) => a.chapterNumber - b.chapterNumber);

		// If no previous chapters, return empty memories
		if (previousChapters.length === 0) {
			return {};
		}

		// If only one previous chapter, use it as recent memory
		if (previousChapters.length === 1) {
			return { recentMemory: previousChapters[0].summary };
		}

		// If we have multiple previous chapters
		// Last chapter is always the recent memory
		const recentChapter = previousChapters[previousChapters.length - 1];
		const recentMemory = recentChapter.summary;

		// Earlier chapters form the long-term memory
		const earlierChapters = previousChapters.slice(0, -1);
		const earlierSummaries = earlierChapters.map(node => node.summary);

		// Summarize the earlier chapters into a long-term memory
		const longTermMemory = await this.generateMemorySummary(earlierSummaries);

		return { longTermMemory, recentMemory };
	}
}