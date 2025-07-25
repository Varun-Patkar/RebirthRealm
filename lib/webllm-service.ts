'use client';

import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

interface WebLLMProgress {
	progress: number;
	text: string;
}

type ProgressCallback = (progress: WebLLMProgress) => void;
type MessageCallback = (message: string) => void;

// Define proper message types and export it
export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

// Check if we're running on client side
const isClient = typeof window !== 'undefined';

class WebLLMService {
	private static instance: WebLLMService;
	private engine: MLCEngine | null = null;
	private isInitializing = false;
	private modelName = "Llama-3.2-1B-Instruct-q0f16-MLC";

	private constructor() { }

	public static getInstance(): WebLLMService {
		// Only create the instance on the client side
		if (!isClient) {
			return {
				isInitialized: () => false,
				isLoading: () => false,
				shouldPromptUser: () => false,
				initialize: async () => false,
				generateResponse: async () => '',
			} as unknown as WebLLMService;
		}

		if (!WebLLMService.instance) {
			WebLLMService.instance = new WebLLMService();
		}
		return WebLLMService.instance;
	}

	public isInitialized(): boolean {
		return this.engine !== null;
	}

	public isLoading(): boolean {
		return this.isInitializing;
	}

	public shouldPromptUser(): boolean {
		if (!isClient) return false;

		// Only prompt if the engine is not initialized and not currently initializing
		return !this.isInitialized() && !this.isLoading();
	}

	public async initialize(progressCallback?: ProgressCallback): Promise<boolean> {
		if (!isClient) return false;
		if (this.engine) return true;
		if (this.isInitializing) return false;

		try {
			this.isInitializing = true;

			const initProgressCallback = (progress: any) => {
				// Calculate normalized progress - if loading from cache, progress may be 0
				// Even when loading from cache, we want to show progress
				let normalizedProgress = progress.progress || 0;

				// Extract stage information if available 
				const stageMatcher = /\[(\d+)\/(\d+)\]/;
				if (progress.text) {
					const match = progress.text.match(stageMatcher);
					if (match) {
						const currentStage = parseInt(match[1]);
						const totalStages = parseInt(match[2]);
						// Use stage information as a fallback progress indicator
						if (normalizedProgress === 0 && totalStages > 0) {
							normalizedProgress = (currentStage - 1) / totalStages;
						}
					}
				}

				if (progressCallback) {
					progressCallback({
						progress: normalizedProgress,
						text: progress.text || 'Loading model...'
					});
				}
			};

			this.engine = await CreateMLCEngine(this.modelName, { initProgressCallback });

			// Signal completion
			if (progressCallback) {
				progressCallback({
					progress: 1.0,
					text: "Model initialization finished"
				});
			}

			return true;
		} catch (error) {
			console.error("Failed to initialize WebLLM engine:", error);
			return false;
		} finally {
			this.isInitializing = false;
		}
	}

	public async reloadEngine(progressCallback?: ProgressCallback): Promise<boolean> {
		if (!isClient) return false;

		// Reset the engine
		this.engine = null;

		// Initialize a new engine
		return this.initialize(progressCallback);
	}

	public async generateResponse(
		messages: ChatMessage[],
		onUpdate?: MessageCallback
	): Promise<string> {
		if (!isClient || !this.engine) {
			throw new Error("WebLLM engine is not initialized or not running on client");
		}

		try {
			// Ensure messages are properly formatted for the API
			const formattedMessages = messages.map(msg => ({
				role: msg.role,
				content: msg.content
			}));

			const chunks = await this.engine.chat.completions.create({
				messages: formattedMessages,
				temperature: 0.7,
				stream: true,
				stream_options: { include_usage: true },
			});

			let reply = "";
			for await (const chunk of chunks) {
				const newContent = chunk.choices[0]?.delta.content || "";
				reply += newContent;
				if (onUpdate) {
					onUpdate(reply);
				}
			}

			return reply;
		} catch (error) {
			console.error("Error generating response:", error);
			throw error;
		}
	}
}

export default WebLLMService;