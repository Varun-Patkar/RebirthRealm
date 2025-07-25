"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/mystical-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Saga, StoryNode, StoryChoice } from "@/lib/types";
import { StoryService } from "@/lib/story-service";
import { Sparkles, ArrowRight, BookOpen, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

enum GenerationState {
	IDLE,
	GENERATING_SUMMARY,
	GENERATING_NARRATIVE,
	AWAITING_DECISION,
	EVALUATING_DECISION,
}

interface StoryGeneratorProps {
	saga: Saga;
}

export function StoryGenerator({ saga }: StoryGeneratorProps) {
	const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
	const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
	const [userDecision, setUserDecision] = useState("");
	const [generationState, setGenerationState] = useState<GenerationState>(
		GenerationState.IDLE
	);
	const [currentSummary, setCurrentSummary] = useState("");
	const [currentNarrative, setCurrentNarrative] = useState("");
	const [currentChoices, setCurrentChoices] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<string>("story");
	const [generationProgress, setGenerationProgress] = useState("");

	// Load existing story nodes for this saga
	useEffect(() => {
		const loadStoryNodes = async () => {
			try {
				const nodes = await StoryService.getStoriesBySaga(saga._id as string);
				setStoryNodes(nodes);

				// If there are existing nodes, set the last one as current
				if (nodes.length > 0) {
					// Find the leaf nodes (nodes that don't have children)
					const leafNodeIds = new Set(nodes.map((node) => node._id || ""));
					nodes.forEach((node) =>
						node.choices.forEach((choice) => {
							if (choice.childNodeId) leafNodeIds.delete(choice.childNodeId);
						})
					);

					// If there are leaf nodes, set the first one as current
					if (leafNodeIds.size > 0) {
						// Fix: Ensure we're providing a string or null, not undefined
						const firstLeafId = Array.from(leafNodeIds)[0];
						setCurrentNodeId(firstLeafId || null);
					} else if (nodes[nodes.length - 1]._id) {
						// Fix: Ensure _id exists before setting it
						setCurrentNodeId(nodes[nodes.length - 1]._id || null);
					}
				}
			} catch (error) {
				console.error("Error loading story nodes:", error);
				toast.error("Failed to load story data");
			}
		};

		if (saga._id) {
			loadStoryNodes();
		}
	}, [saga._id]);

	// Get the current node
	const currentNode = storyNodes.find((node) => node._id === currentNodeId);

	// Start the story generation process
	const startGeneration = async () => {
		try {
			setGenerationState(GenerationState.GENERATING_SUMMARY);
			setActiveTab("story");

			// Generate the summary
			const summary = await StoryService.generateSummary(
				saga,
				currentNode?.content,
				userDecision,
				(text) => setGenerationProgress(text)
			);

			setCurrentSummary(summary);
			setGenerationProgress("");

			// Generate the narrative
			setGenerationState(GenerationState.GENERATING_NARRATIVE);
			const narrative = await StoryService.generateNarrative(
				saga,
				summary,
				currentNode?.content,
				userDecision,
				(text) => setGenerationProgress(text)
			);

			setCurrentNarrative(narrative);

			// Extract choices from the narrative
			const choices = StoryService.extractChoices(narrative);
			setCurrentChoices(choices);

			// Set state to awaiting decision
			setGenerationState(GenerationState.AWAITING_DECISION);
			setGenerationProgress("");

			// Save the story node
			const newNode = await StoryService.createStoryNode(
				{
					sagaId: saga._id as string,
					parentId: currentNodeId,
					summary,
					content: narrative,
					choices: [],
				},
				choices.map((text) => ({ text }))
			);

			// Update story nodes and set current node
			setStoryNodes((prev) => [...prev, newNode]);
			setCurrentNodeId(newNode._id || null);

			// If this node has a parent, update the parent's choice to point to this node
			if (currentNodeId && userDecision) {
				const parentNode = storyNodes.find(
					(node) => node._id === currentNodeId
				);
				if (parentNode) {
					// Find the choice index that matches the user decision
					const choiceIndex = parentNode.choices.findIndex(
						(choice) => choice.text.toLowerCase() === userDecision.toLowerCase()
					);

					if (choiceIndex !== -1) {
						await StoryService.updateChoice(
							currentNodeId,
							choiceIndex,
							newNode._id as string
						);

						// Update the local state
						setStoryNodes((prev) =>
							prev.map((node) =>
								node._id === currentNodeId
									? {
											...node,
											choices: node.choices.map((choice, idx) =>
												idx === choiceIndex
													? { ...choice, childNodeId: newNode._id }
													: choice
											),
									  }
									: node
							)
						);
					}
				}
			}

			// Reset user decision
			setUserDecision("");
		} catch (error) {
			console.error("Error in story generation:", error);
			toast.error("Failed to generate story");
			setGenerationState(GenerationState.IDLE);
		}
	};

	// Submit the user's decision
	const submitDecision = async () => {
		if (!userDecision.trim()) {
			toast.error("Please enter your decision");
			return;
		}

		try {
			setGenerationState(GenerationState.EVALUATING_DECISION);

			// Evaluate the decision
			const evaluation = await StoryService.evaluateDecision(
				saga,
				userDecision,
				(text) => setGenerationProgress(text)
			);

			switch (evaluation) {
				case "CONTINUE":
					// Continue the story
					startGeneration();
					break;
				case "UNSAFE":
					toast.error(
						"Your decision leads to unsafe content. Please try something else."
					);
					setGenerationState(GenerationState.AWAITING_DECISION);
					break;
				case "CONCLUDE":
					toast.success("Your story has reached a natural conclusion!");
					setGenerationState(GenerationState.IDLE);
					break;
				case "CLARIFY":
					toast.warning(
						"Your decision needs more clarity. Please provide more details."
					);
					setGenerationState(GenerationState.AWAITING_DECISION);
					break;
			}
		} catch (error) {
			console.error("Error evaluating decision:", error);
			toast.error("Failed to process your decision");
			setGenerationState(GenerationState.AWAITING_DECISION);
		}
	};

	// Navigate to a specific node
	const navigateToNode = (nodeId: string | null) => {
		setCurrentNodeId(nodeId);
		setGenerationState(GenerationState.IDLE);
		setUserDecision("");
	};

	return (
		<div className="space-y-6">
			{/* Top actions */}
			<div className="flex justify-between">
				<MysticalButton
					onClick={startGeneration}
					disabled={generationState !== GenerationState.IDLE}
					glow
				>
					{generationState !== GenerationState.IDLE ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Generating...
						</>
					) : storyNodes.length === 0 ? (
						<>
							<Sparkles className="w-4 h-4 mr-2" />
							Begin Story
						</>
					) : (
						<>
							<ArrowRight className="w-4 h-4 mr-2" />
							Continue Story
						</>
					)}
				</MysticalButton>

				<Button
					variant="ghost"
					onClick={() =>
						setActiveTab(activeTab === "story" ? "timeline" : "story")
					}
				>
					{activeTab === "story" ? "View Timeline" : "Back to Story"}
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-2">
					<TabsTrigger value="story">Story</TabsTrigger>
					<TabsTrigger value="timeline">Timeline</TabsTrigger>
				</TabsList>

				{/* Story tab */}
				<TabsContent value="story">
					<div className="space-y-4">
						{/* Current story content */}
						<GlassCard className="p-6">
							{generationState === GenerationState.IDLE && !currentNode ? (
								<div className="text-center py-12">
									<BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
									<h3 className="text-xl font-bold text-white mb-2">
										No Story Generated Yet
									</h3>
									<p className="text-gray-400 mb-4">
										Click "Begin Story" to start generating your saga's
										narrative
									</p>
								</div>
							) : generationState === GenerationState.GENERATING_SUMMARY ||
							  generationState === GenerationState.GENERATING_NARRATIVE ? (
								<div>
									<div className="flex items-center space-x-2 mb-4">
										<Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
										<span className="text-purple-300">
											{generationState === GenerationState.GENERATING_SUMMARY
												? "Crafting story summary..."
												: "Weaving the narrative..."}
										</span>
									</div>
									<div className="text-white">
										{generationProgress || "Thinking..."}
									</div>
								</div>
							) : (
								<div className="prose prose-invert max-w-none">
									<div className="whitespace-pre-wrap text-white">
										{currentNode?.content || currentNarrative}
									</div>
								</div>
							)}
						</GlassCard>

						{/* Decision input */}
						{generationState === GenerationState.AWAITING_DECISION && (
							<GlassCard className="p-6">
								<h3 className="text-lg font-bold text-white mb-4">
									What will you do?
								</h3>

								{/* Show suggested choices */}
								<div className="mb-4 space-y-2">
									{currentChoices.map((choice, index) => (
										<Button
											key={index}
											variant="outline"
											className="w-full justify-start text-left bg-white/5 hover:bg-white/10 border-purple-500/30"
											onClick={() => setUserDecision(choice)}
										>
											{choice}
										</Button>
									))}
								</div>

								<div className="mt-4">
									<p className="text-sm text-gray-400 mb-2">
										Or enter your own decision:
									</p>
									<div className="flex space-x-2">
										<Textarea
											value={userDecision}
											onChange={(e) => setUserDecision(e.target.value)}
											placeholder="What do you want to do?"
											className="bg-white/10 border-white/20 text-white placeholder-gray-500"
										/>
										<Button
											onClick={submitDecision}
											className="bg-purple-600 hover:bg-purple-700"
											disabled={!userDecision.trim()}
										>
											<Send className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</GlassCard>
						)}

						{/* Evaluation in progress */}
						{generationState === GenerationState.EVALUATING_DECISION && (
							<GlassCard className="p-6">
								<div className="flex items-center space-x-2 mb-4">
									<Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
									<span className="text-yellow-300">
										Evaluating your decision...
									</span>
								</div>
								<div className="text-white">
									{generationProgress || "Thinking..."}
								</div>
							</GlassCard>
						)}
					</div>
				</TabsContent>

				{/* Timeline tab */}
				<TabsContent value="timeline">
					<GlassCard className="p-6">
						<h3 className="text-lg font-bold text-white mb-4">
							Story Timeline
						</h3>

						{storyNodes.length === 0 ? (
							<p className="text-gray-400 text-center py-4">
								No story has been generated yet.
							</p>
						) : (
							<div className="space-y-4">
								{storyNodes.map((node, index) => (
									<div
										key={node._id}
										className={`p-4 rounded-lg border ${
											node._id === currentNodeId
												? "bg-purple-900/30 border-purple-500"
												: "bg-white/5 border-white/10"
										}`}
									>
										<div className="flex justify-between items-start mb-2">
											<span className="text-sm text-gray-400">
												Part {index + 1}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="text-purple-400 hover:text-purple-300"
												onClick={() => navigateToNode(node._id || null)}
											>
												View
											</Button>
										</div>
										<p className="text-white font-medium mb-2 line-clamp-2">
											{node.summary}
										</p>

										{/* Show choices if any */}
										{node.choices.length > 0 && (
											<div className="mt-2 space-y-1">
												<p className="text-xs text-gray-400">Choices:</p>
												{node.choices.map((choice, idx) => (
													<div
														key={idx}
														className={`text-sm ${
															choice.childNodeId
																? "text-purple-300"
																: "text-gray-500"
														}`}
													>
														• {choice.text}
													</div>
												))}
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</GlassCard>
				</TabsContent>
			</Tabs>
		</div>
	);
}
