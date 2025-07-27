"use client";

import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/mystical-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Saga, StoryNode } from "@/lib/types";
import { StoryService } from "@/lib/story-service";
import {
	Sparkles,
	BookOpen,
	Loader2,
	Send,
	ArrowRight,
	ArrowLeft,
	Save,
	Circle,
	GitBranch,
	Trash2,
	AlertTriangle,
	ThumbsUp,
	ThumbsDown,
	RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

enum GenerationState {
	IDLE,
	GENERATING_SUMMARY,
	GENERATING_NARRATIVE,
	AWAITING_DECISION,
	EVALUATING_DECISION,
	REGENERATING,
	AWAITING_FEEDBACK,
}

interface FullscreenStoryExperienceProps {
	saga: Saga;
}

export function FullscreenStoryExperience({
	saga,
}: FullscreenStoryExperienceProps) {
	const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
	const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
	const [userDecision, setUserDecision] = useState("");
	const [generationState, setGenerationState] = useState<GenerationState>(
		GenerationState.IDLE
	);
	const [currentSummary, setCurrentSummary] = useState("");
	const [currentNarrative, setCurrentNarrative] = useState("");
	const [activeTab, setActiveTab] = useState<string>("story");
	const [generationProgress, setGenerationProgress] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
		type: "node" | "branch" | "all";
		nodeId?: string;
		nodeName?: string;
	} | null>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [showFeedbackForm, setShowFeedbackForm] = useState(false);
	const [userFeedback, setUserFeedback] = useState("");
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [memoryContext, setMemoryContext] = useState<{
		longTermMemory?: string;
		recentMemory?: string;
	}>({});
	const [storyMode, setStoryMode] = useState<"player" | "storywriter">(
		"player"
	);
	const [storyDirection, setStoryDirection] = useState("");
	const [isSelectingMode, setIsSelectingMode] = useState(true);
	const contentRef = useRef<HTMLDivElement>(null);

	// Load existing story nodes for this saga
	useEffect(() => {
		const loadStoryNodes = async () => {
			try {
				const nodes = await StoryService.getStoriesBySaga(saga._id as string);
				setStoryNodes(nodes);

				// If there are existing nodes, set the last active one as current
				if (nodes.length > 0) {
					const activeNodes = nodes.filter((node) => node.status === "active");
					if (activeNodes.length > 0) {
						// Get the most recent active node
						const latestNode = activeNodes.sort(
							(a, b) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime()
						)[0];
						setCurrentNodeId(latestNode._id || null);

						// Set the generation state to AWAITING_DECISION for active nodes
						// to show the decision input and feedback options
						setGenerationState(GenerationState.AWAITING_DECISION);
						setShowFeedback(true); // Show the feedback option for existing stories
					} else {
						// If no active nodes, set the last node
						setCurrentNodeId(nodes[nodes.length - 1]._id || null);
						// For ended nodes, keep the state as IDLE
						setGenerationState(GenerationState.IDLE);
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

	// Get the current node - MOVED THIS UP so it's defined before the useEffect that uses it
	const currentNode = storyNodes.find((node) => node._id === currentNodeId);

	// Add a new useEffect to handle state when current node changes
	useEffect(() => {
		// When current node changes, update the state based on node status
		if (currentNode) {
			if (currentNode.status === "active") {
				// For active nodes, always ensure we're in AWAITING_DECISION state
				// so that decision input and feedback options are shown
				setGenerationState(GenerationState.AWAITING_DECISION);
				setShowFeedback(true);
			} else {
				// For ended or unsafe nodes, set to IDLE
				setGenerationState(GenerationState.IDLE);
			}
		}
	}, [currentNode]);

	// Scroll to the top when current node changes
	useEffect(() => {
		contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
	}, [currentNodeId]);

	// New method to build memory context
	const buildMemoryContext = async (currentChapterNumber: number) => {
		try {
			const memories = await StoryService.buildMemoryContext(
				storyNodes,
				currentChapterNumber
			);
			setMemoryContext(memories);
			return memories;
		} catch (error) {
			console.error("Error building memory context:", error);
			return {};
		}
	};

	// Modified method to start a new story with memory context
	const startOrContinueStory = async () => {
		if (storyNodes.length === 0) {
			// Starting a brand new story
			try {
				if (storyMode === "player") {
					// Existing Player mode logic
					setGenerationState(GenerationState.GENERATING_SUMMARY);
					setGenerationProgress("Generating chapter outline...");
					setMemoryContext({});

					const newNode = await StoryService.startNewStory(
						saga,
						(text: string) =>
							setGenerationProgress("Generating outline: " + text),
						(text: string) => {
							setGenerationState(GenerationState.GENERATING_NARRATIVE);
							setGenerationProgress("Generating narrative: " + text);
						}
					);

					setStoryNodes([newNode]);
					setCurrentNodeId(newNode._id || null);
					setGenerationState(GenerationState.AWAITING_DECISION);
					setShowFeedback(true);
					setGenerationProgress("");
				} else {
					// New Storywriter mode logic
					if (!storyDirection.trim()) {
						toast.error(
							"Please provide a story direction for the first chapter"
						);
						return;
					}

					setGenerationState(GenerationState.GENERATING_NARRATIVE);
					setGenerationProgress("Generating first chapter...");
					setMemoryContext({});

					const newNode = await StoryService.startNewStorywriterStory(
						saga,
						storyDirection,
						(text: string) =>
							setGenerationProgress("Generating narrative: " + text)
					);

					setStoryNodes([newNode]);
					setCurrentNodeId(newNode._id || null);
					setStoryDirection("");
					setGenerationState(GenerationState.AWAITING_DECISION);
					setShowFeedback(true);
					setGenerationProgress("");
				}
			} catch (error) {
				console.error("Error starting story:", error);
				toast.error("Failed to start story");
				setGenerationState(GenerationState.IDLE);
			}
		} else {
			// Continue from current node
			setGenerationState(GenerationState.AWAITING_DECISION);
		}
	};

	// New method to select story mode
	const selectStoryMode = async (mode: "player" | "storywriter") => {
		try {
			// Update saga with selected mode
			const response = await fetch(`/api/sagas/${saga._id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ storyMode: mode }),
			});

			if (response.ok) {
				setStoryMode(mode);
				setIsSelectingMode(false);
				saga.storyMode = mode; // Update local saga object
			} else {
				toast.error("Failed to set story mode");
			}
		} catch (error) {
			console.error("Error setting story mode:", error);
			toast.error("Failed to set story mode");
		}
	};

	// New method to submit story direction (Storywriter mode)
	const submitStoryDirection = async () => {
		if (!storyDirection.trim()) {
			toast.error("Please provide a story direction for the next chapter");
			return;
		}

		if (!currentNode) {
			toast.error("No current story node found");
			return;
		}

		try {
			setGenerationState(GenerationState.GENERATING_NARRATIVE);

			// Build memory context for the next chapter
			const nextChapterNumber = currentNode.chapterNumber + 1;
			const memories = await buildMemoryContext(nextChapterNumber);

			// Generate the next chapter
			const newNode = await StoryService.continueStorywriterStory(
				saga,
				currentNode,
				storyDirection,
				(text: string) =>
					setGenerationProgress("Generating narrative: " + text),
				memories
			);

			setStoryNodes((prev) => [...prev, newNode]);
			setCurrentNodeId(newNode._id || null);
			setStoryDirection("");
			setGenerationState(GenerationState.AWAITING_DECISION);
			setShowFeedback(true);
			toast.success("Chapter generated!");

			setGenerationProgress("");
		} catch (error) {
			console.error("Error generating chapter:", error);
			toast.error("Failed to generate chapter");
			setGenerationState(GenerationState.AWAITING_DECISION);
			setGenerationProgress("");
		}
	};

	// Updated regeneration method to handle both modes
	const regenerateStory = async () => {
		if (!currentNode) return;

		try {
			setIsRegenerating(true);
			setGenerationState(GenerationState.REGENERATING);
			setGenerationProgress("Regenerating story based on your feedback...");

			const memories = await buildMemoryContext(currentNode.chapterNumber);

			let updatedNode;
			if (storyMode === "player") {
				updatedNode = await StoryService.regenerateStory(
					saga,
					currentNode,
					userFeedback,
					memories,
					(text: string) => setGenerationProgress("Updating outline: " + text),
					(text: string) =>
						setGenerationProgress("Generating new narrative: " + text)
				);
			} else {
				updatedNode = await StoryService.regenerateStorywriterStory(
					saga,
					currentNode,
					userFeedback,
					memories,
					(text: string) =>
						setGenerationProgress("Generating new narrative: " + text)
				);
			}

			setStoryNodes((prev) =>
				prev.map((node) => (node._id === updatedNode._id ? updatedNode : node))
			);

			setUserFeedback("");
			setShowFeedbackForm(false);
			setGenerationState(GenerationState.AWAITING_DECISION);
			setShowFeedback(true);

			toast.success("Story regenerated successfully!");
		} catch (error) {
			console.error("Error regenerating story:", error);
			toast.error("Failed to regenerate story");
			setGenerationState(GenerationState.AWAITING_DECISION);
		} finally {
			setIsRegenerating(false);
			setGenerationProgress("");
		}
	};

	// Handle satisfaction feedback
	const handleSatisfaction = (satisfied: boolean) => {
		if (satisfied) {
			// User is satisfied, just hide the feedback options
			setShowFeedback(false);
			// Make sure feedback form is not shown
			setShowFeedbackForm(false);
		} else {
			// User is not satisfied, show feedback form
			setShowFeedback(false);
			setShowFeedbackForm(true);
		}
	};

	// Navigate to a specific node
	const navigateToNode = (nodeId: string | null) => {
		setCurrentNodeId(nodeId);
		setGenerationState(GenerationState.IDLE);
		setUserDecision("");
	};

	// Navigate to previous node
	const navigateToPreviousNode = () => {
		if (!currentNodeId) return;

		const currentNodeInfo = storyNodes.find((n) => n._id === currentNodeId);
		if (currentNodeInfo?.parentId) {
			navigateToNode(currentNodeInfo.parentId);
		}
	};

	// Get nodes that branch from current node
	const getChildNodes = () => {
		if (!currentNodeId) return [];
		return storyNodes.filter((node) => node.parentId === currentNodeId);
	};

	// Create a tree structure for timeline visualization
	const createTimelineTree = () => {
		if (storyNodes.length === 0) return [];

		// Create a map of nodes by their ID for quick lookup
		const nodeMap = new Map(storyNodes.map((node) => [node._id || "", node]));

		// Find root nodes (nodes without parents)
		const rootNodes = storyNodes.filter((node) => !node.parentId);

		// Build tree structure
		const buildTree = (
			nodeId: string,
			level: number = 0,
			position: number = 0
		): any => {
			const node = nodeMap.get(nodeId);
			if (!node) return null;

			const children = storyNodes
				.filter((n) => n.parentId === nodeId)
				.map((child, index) => buildTree(child._id || "", level + 1, index));

			return {
				node,
				level,
				position,
				children: children.filter(Boolean),
			};
		};

		return rootNodes
			.map((root, index) => buildTree(root._id || "", 0, index))
			.filter(Boolean);
	};

	// Delete a specific node
	const deleteNode = async (
		nodeId: string,
		deleteChildren: boolean = false
	) => {
		try {
			const result = await StoryService.deleteStoryNode(nodeId, deleteChildren);

			// Remove the deleted nodes from local state
			if (deleteChildren) {
				// Remove the node and all its descendants
				const nodeToDelete = storyNodes.find((n) => n._id === nodeId);
				if (nodeToDelete) {
					const nodesToRemove = findAllDescendants(nodeId);
					nodesToRemove.push(nodeId);

					setStoryNodes((prev) =>
						prev.filter((node) => !nodesToRemove.includes(node._id || ""))
					);

					// If current node was deleted, navigate to parent or first available node
					if (nodesToRemove.includes(currentNodeId || "")) {
						if (nodeToDelete.parentId) {
							setCurrentNodeId(nodeToDelete.parentId);
						} else {
							const remainingNodes = storyNodes.filter(
								(node) => !nodesToRemove.includes(node._id || "")
							);
							setCurrentNodeId(
								remainingNodes.length > 0 ? remainingNodes[0]._id || null : null
							);
						}
					}
				}
			} else {
				// Remove only the specific node
				setStoryNodes((prev) => prev.filter((node) => node._id !== nodeId));

				// If current node was deleted, navigate to parent or first available node
				if (currentNodeId === nodeId) {
					const nodeToDelete = storyNodes.find((n) => n._id === nodeId);
					if (nodeToDelete?.parentId) {
						setCurrentNodeId(nodeToDelete.parentId);
					} else {
						const remainingNodes = storyNodes.filter(
							(node) => node._id !== nodeId
						);
						setCurrentNodeId(
							remainingNodes.length > 0 ? remainingNodes[0]._id || null : null
						);
					}
				}
			}

			toast.success(result.message);
			setShowDeleteConfirm(null);
		} catch (error) {
			console.error("Error deleting node:", error);
			toast.error("Failed to delete story node");
		}
	};

	// Delete all story nodes
	const deleteAllNodes = async () => {
		try {
			const result = await StoryService.deleteAllStoryNodes(saga._id as string);

			// Clear all local state
			setStoryNodes([]);
			setCurrentNodeId(null);
			setUserDecision("");
			setGenerationState(GenerationState.IDLE);

			toast.success(result.message);
			setShowDeleteConfirm(null);
		} catch (error) {
			console.error("Error deleting all nodes:", error);
			toast.error("Failed to delete story");
		}
	};

	// Helper function to find all descendants of a node
	const findAllDescendants = (nodeId: string): string[] => {
		const descendants: string[] = [];
		const queue = [nodeId];

		while (queue.length > 0) {
			const currentId = queue.shift()!;
			const children = storyNodes.filter((node) => node.parentId === currentId);

			for (const child of children) {
				const childId = child._id || "";
				descendants.push(childId);
				queue.push(childId);
			}
		}

		return descendants;
	};

	// Render timeline tree
	const renderTimelineTree = (
		treeItems: any[],
		parentX: number = 50,
		parentY: number = 50
	) => {
		return treeItems.map((item, index) => {
			const x = parentX + item.level * 150;
			const y = parentY + item.position * 80;
			const isCurrentNode = item.node._id === currentNodeId;

			return (
				<g key={item.node._id}>
					{/* Connection line to parent */}
					{item.level > 0 && (
						<line
							x1={parentX}
							y1={parentY}
							x2={x}
							y2={y}
							stroke="rgba(147, 51, 234, 0.4)"
							strokeWidth="2"
						/>
					)}

					{/* Node circle */}
					<circle
						cx={x}
						cy={y}
						r="8"
						fill={
							isCurrentNode
								? "#9333ea"
								: item.node.status === "active"
								? "#10b981"
								: item.node.status === "ended"
								? "#f59e0b"
								: "#ef4444"
						}
						stroke={isCurrentNode ? "#c084fc" : "rgba(255, 255, 255, 0.3)"}
						strokeWidth={isCurrentNode ? "3" : "1"}
						className="cursor-pointer hover:scale-110 transition-transform"
						onClick={() => {
							navigateToNode(item.node._id || null);
							setActiveTab("story");
						}}
					/>

					{/* Chapter number label */}
					<text
						x={x}
						y={y + 20}
						textAnchor="middle"
						className="text-xs fill-gray-300 pointer-events-none"
						fontSize="8"
					>
						Ch.{item.node.chapterNumber || "?"}
					</text>

					{/* Delete button for individual nodes */}
					<circle
						cx={x + 15}
						cy={y - 15}
						r="6"
						fill="#ef4444"
						stroke="rgba(255, 255, 255, 0.3)"
						strokeWidth="1"
						className="cursor-pointer hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
						onClick={(e) => {
							e.stopPropagation();
							setShowDeleteConfirm({
								type: "node",
								nodeId: item.node._id,
								nodeName: `Part ${storyNodes.indexOf(item.node) + 1}`,
							});
						}}
					/>
					<text
						x={x + 15}
						y={y - 11}
						textAnchor="middle"
						className="text-xs fill-white pointer-events-none"
						fontSize="8"
					>
						×
					</text>

					{/* Node tooltip */}
					<title>
						Part {storyNodes.indexOf(item.node) + 1}
						{item.node.userDecision &&
							`: "${item.node.userDecision.substring(0, 50)}..."`}
						{item.node.status !== "active" && ` (${item.node.status})`}
					</title>

					{/* Render children */}
					{item.children.length > 0 && renderTimelineTree(item.children, x, y)}
				</g>
			);
		});
	};

	const timelineTree = createTimelineTree();

	// Check if saga has a story mode set, or if we need to select one
	useEffect(() => {
		if (saga.storyMode) {
			setStoryMode(saga.storyMode);
			setIsSelectingMode(false);
		} else if (storyNodes.length > 0) {
			// Determine mode from existing story nodes
			const firstNode = storyNodes[0];
			const mode = firstNode.storyDirection ? "storywriter" : "player";
			setStoryMode(mode);
			setIsSelectingMode(false);
		} else {
			setIsSelectingMode(true);
		}
	}, [saga, storyNodes]);

	// Submit the user's decision with memory context (Player mode)
	const submitDecision = async () => {
		if (!userDecision.trim()) {
			toast.error("Please enter your decision");
			return;
		}

		if (!currentNode) {
			toast.error("No current story node found");
			return;
		}

		try {
			setGenerationState(GenerationState.EVALUATING_DECISION);

			// Build memory context for the next chapter
			const nextChapterNumber = currentNode.chapterNumber + 1;
			const memories = await buildMemoryContext(nextChapterNumber);

			// Process the user decision
			const result = await StoryService.processUserDecision(
				saga,
				currentNode,
				userDecision,
				(text: string) => setGenerationProgress("Generating outline: " + text),
				(text: string) =>
					setGenerationProgress("Generating narrative: " + text),
				memories // Pass memory context
			);

			if (result.evaluation.judgment === "CONTINUE" && result.node) {
				// Story continued successfully
				setStoryNodes((prev) => [...prev, result.node!]);
				setCurrentNodeId(result.node._id || null);
				setUserDecision("");
				setGenerationState(GenerationState.AWAITING_DECISION);
				setShowFeedback(true);
				toast.success("Story continued!");
			} else if (result.evaluation.judgment === "UNSAFE" && result.node) {
				// Timeline ended due to unsafe decision
				setStoryNodes((prev) => [...prev, result.node!]);
				setCurrentNodeId(result.node._id || null);
				setUserDecision("");
				setGenerationState(GenerationState.IDLE);
				toast.error("This timeline has ended due to an unsafe decision.");
			} else if (result.evaluation.judgment === "CONCLUDE" && result.node) {
				// Timeline ended naturally
				setStoryNodes((prev) => [...prev, result.node!]);
				setCurrentNodeId(result.node._id || null);
				setUserDecision("");
				setGenerationState(GenerationState.IDLE);
				toast.success("This storyline has reached its conclusion!");
			} else if (result.evaluation.judgment === "CLARIFY") {
				// Need clarification
				toast.warning(
					`Please clarify your decision: ${result.evaluation.explanation}`
				);
				setGenerationState(GenerationState.AWAITING_DECISION);
			}

			setGenerationProgress("");
		} catch (error) {
			console.error("Error processing decision:", error);
			toast.error("Failed to process your decision");
			setGenerationState(GenerationState.AWAITING_DECISION);
			setGenerationProgress("");
		}
	};
	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] max-w-[90%] mx-auto mt-8">
			<div className="flex justify-between items-center mb-6">
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={navigateToPreviousNode}
						disabled={!currentNode?.parentId}
						className="bg-white/5 hover:bg-white/10"
					>
						<ArrowLeft className="w-4 h-4 mr-1" />
						Previous
					</Button>

					{storyNodes.length === 0 ? (
						<MysticalButton
							onClick={startOrContinueStory}
							disabled={generationState !== GenerationState.IDLE}
							size="sm"
							glow
						>
							<Sparkles className="w-4 h-4 mr-2" />
							Begin Story
						</MysticalButton>
					) : generationState === GenerationState.IDLE &&
					  currentNode?.status === "active" ? (
						<MysticalButton onClick={startOrContinueStory} size="sm" glow>
							<ArrowRight className="w-4 h-4 mr-2" />
							Continue Story
						</MysticalButton>
					) : null}
				</div>

				<div className="flex space-x-2">
					{storyNodes.length > 0 && (
						<>
							<Button
								variant="outline"
								size="sm"
								className="bg-red-900/20 hover:bg-red-900/30 border-red-500/30 text-red-300"
								onClick={() => setShowDeleteConfirm({ type: "all" })}
							>
								<Trash2 className="w-4 h-4 mr-1" />
								Clear All
							</Button>
							{currentNode && (
								<Button
									variant="outline"
									size="sm"
									className="bg-yellow-900/20 hover:bg-yellow-900/30 border-yellow-500/30 text-yellow-300"
									onClick={() =>
										setShowDeleteConfirm({
											type: "branch",
											nodeId: currentNode._id,
											nodeName: `Part ${storyNodes.indexOf(currentNode) + 1}`,
										})
									}
								>
									<Trash2 className="w-4 h-4 mr-1" />
									Delete Branch
								</Button>
							)}
						</>
					)}
					<Button
						variant="outline"
						size="sm"
						className="bg-white/5 hover:bg-white/10"
					>
						<Save className="w-4 h-4 mr-1" />
						Save Progress
					</Button>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
					<GlassCard className="p-6 max-w-md mx-4">
						<div className="flex items-center gap-3 mb-4">
							<AlertTriangle className="w-6 h-6 text-red-400" />
							<h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
						</div>

						<p className="text-gray-300 mb-6">
							{showDeleteConfirm.type === "all"
								? "Are you sure you want to delete the entire story? This will remove all story nodes and cannot be undone."
								: showDeleteConfirm.type === "branch"
								? `Are you sure you want to delete ${showDeleteConfirm.nodeName} and all its branches? This cannot be undone.`
								: `Are you sure you want to delete ${showDeleteConfirm.nodeName}? Its children will be reconnected to the parent node.`}
						</p>

						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								onClick={() => setShowDeleteConfirm(null)}
								className="bg-white/5 hover:bg-white/10"
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									if (showDeleteConfirm.type === "all") {
										deleteAllNodes();
									} else if (showDeleteConfirm.nodeId) {
										deleteNode(
											showDeleteConfirm.nodeId,
											showDeleteConfirm.type === "branch"
										);
									}
								}}
								className="bg-red-600 hover:bg-red-700"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete
							</Button>
						</div>
					</GlassCard>
				</div>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
					<TabsTrigger value="story">Story</TabsTrigger>
					<TabsTrigger value="timeline">Timeline</TabsTrigger>
				</TabsList>

				{/* Story tab */}
				<TabsContent value="story" className="flex-1 flex flex-col">
					<div className="space-y-4 flex-1 flex flex-col">
						{/* Story Mode Selection */}
						{isSelectingMode && storyNodes.length === 0 && (
							<GlassCard className="p-8 max-w-5xl mx-auto w-full">
								<h2 className="text-2xl font-bold text-white mb-6 text-center">
									Choose Your Story Mode
								</h2>
								<div className="grid md:grid-cols-2 gap-6">
									<div
										className="p-6 border-2 border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/60 transition-colors"
										onClick={() => selectStoryMode("player")}
									>
										<h3 className="text-xl font-bold text-white mb-3">
											🎮 Player Mode
										</h3>
										<p className="text-gray-300 mb-4">
											Experience the story as it unfolds. The AI generates the
											first chapter, then you decide what happens next through
											your choices and actions.
										</p>
										<ul className="text-sm text-gray-400 space-y-1">
											<li>• AI-generated opening chapter</li>
											<li>• Make decisions to drive the story</li>
											<li>• Branching narrative paths</li>
											<li>• Surprise story developments</li>
										</ul>
									</div>
									<div
										className="p-6 border-2 border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/60 transition-colors"
										onClick={() => selectStoryMode("storywriter")}
									>
										<h3 className="text-xl font-bold text-white mb-3">
											✍️ Storywriter Mode
										</h3>
										<p className="text-gray-300 mb-4">
											Guide the narrative direction. You provide the plot
											direction for each chapter, and the AI writes the detailed
											story content.
										</p>
										<ul className="text-sm text-gray-400 space-y-1">
											<li>• You control the story direction</li>
											<li>• AI handles detailed writing</li>
											<li>• Chapter-by-chapter planning</li>
											<li>• Full creative control</li>
										</ul>
									</div>
								</div>
							</GlassCard>
						)}

						{/* Current story content */}
						<GlassCard
							className="p-8 lg:p-12 prose prose-invert max-w-none flex-1 overflow-auto"
							ref={contentRef}
						>
							{generationState === GenerationState.IDLE && !currentNode ? (
								<div className="text-center py-12">
									<BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
									<h3 className="text-xl font-bold text-white mb-2">
										Your Journey Awaits
									</h3>
									<p className="text-gray-400 mb-4">
										Click "Begin Story" to start your adventure in{" "}
										{saga.worldName}
									</p>
								</div>
							) : generationState === GenerationState.GENERATING_SUMMARY ||
							  generationState === GenerationState.GENERATING_NARRATIVE ||
							  generationState === GenerationState.REGENERATING ? (
								<div>
									<div className="flex items-center space-x-2 mb-4">
										<Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
										<span className="text-purple-300">
											{generationState === GenerationState.GENERATING_SUMMARY
												? "Creating your story..."
												: generationState === GenerationState.REGENERATING
												? "Regenerating the story..."
												: "Weaving the narrative..."}
										</span>
									</div>
									<div className="text-white">
										{generationProgress || "Thinking..."}
									</div>
								</div>
							) : (
								<div className="story-content max-w-5xl mx-auto">
									{formatStoryContent(currentNode?.content || "")}
								</div>
							)}
						</GlassCard>

						{/* Decision input for Player mode or Story Direction for Storywriter mode */}
						{generationState === GenerationState.AWAITING_DECISION &&
						!isSelectingMode ? (
							<GlassCard className="p-6 max-w-5xl mx-auto w-full">
								{storyMode === "player" ? (
									<>
										<h3 className="text-lg font-bold text-white mb-4">
											What will you do?
										</h3>

										{/* Show existing branches from this node */}
										{getChildNodes().length > 0 && (
											<div className="mb-4 space-y-2">
												<p className="text-sm text-gray-400 mb-2">
													Previously explored paths:
												</p>
												<div className="grid md:grid-cols-2 gap-3">
													{getChildNodes().map((childNode) => (
														<Button
															key={childNode._id}
															variant="outline"
															className="w-full justify-start text-left bg-white/5 hover:bg-white/10 border-purple-500/30"
															onClick={() =>
																navigateToNode(childNode._id || null)
															}
														>
															"{childNode.userDecision}"
															{childNode.status === "ended" && " (Ended)"}
															{childNode.status === "unsafe" && " (Unsafe)"}
														</Button>
													))}
												</div>
											</div>
										)}

										<div className="mt-4">
											<p className="text-sm text-gray-400 mb-2">
												Enter your decision:
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

										{/* Optional satisfaction feedback - shown below decision input */}
										{showFeedback && (
											<div className="mt-6 pt-4 border-t border-white/10">
												<p className="text-sm text-gray-400 mb-3">
													Feedback (optional): Are you satisfied with the
													previous story section?
												</p>
												<div className="flex space-x-4">
													<Button
														onClick={() => handleSatisfaction(true)}
														variant="outline"
														size="sm"
														className="bg-green-900/20 hover:bg-green-900/30 border-green-500/30 text-green-300"
													>
														<ThumbsUp className="w-4 h-4 mr-2" />
														It's good
													</Button>
													<Button
														onClick={() => handleSatisfaction(false)}
														variant="outline"
														size="sm"
														className="bg-amber-900/20 hover:bg-amber-900/30 border-amber-500/30 text-amber-300"
													>
														<ThumbsDown className="w-4 h-4 mr-2" />I want
														changes
													</Button>
													<Button
														onClick={() => setShowFeedback(false)}
														variant="outline"
														size="sm"
														className="bg-white/10 hover:bg-white/20"
													>
														Skip feedback
													</Button>
												</div>
											</div>
										)}
									</>
								) : (
									<>
										<h3 className="text-lg font-bold text-white mb-4">
											What happens in the next chapter?
										</h3>
										<div className="mt-4">
											<p className="text-sm text-gray-400 mb-2">
												Describe what you want to happen in the next chapter:
											</p>
											<div className="flex space-x-2">
												<Textarea
													value={storyDirection}
													onChange={(e) => setStoryDirection(e.target.value)}
													placeholder="Describe the story direction for the next chapter..."
													className="bg-white/10 border-white/20 text-white placeholder-gray-500 min-h-[100px]"
												/>
												<Button
													onClick={submitStoryDirection}
													className="bg-purple-600 hover:bg-purple-700"
													disabled={!storyDirection.trim()}
												>
													<Send className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</>
								)}

								{/* Optional satisfaction feedback - shown below decision input */}
								{showFeedback && (
									<div className="mt-6 pt-4 border-t border-white/10">
										<p className="text-sm text-gray-400 mb-3">
											Feedback (optional): Are you satisfied with the previous
											story section?
										</p>
										<div className="flex space-x-4">
											<Button
												onClick={() => handleSatisfaction(true)}
												variant="outline"
												size="sm"
												className="bg-green-900/20 hover:bg-green-900/30 border-green-500/30 text-green-300"
											>
												<ThumbsUp className="w-4 h-4 mr-2" />
												It's good
											</Button>
											<Button
												onClick={() => handleSatisfaction(false)}
												variant="outline"
												size="sm"
												className="bg-amber-900/20 hover:bg-amber-900/30 border-amber-500/30 text-amber-300"
											>
												<ThumbsDown className="w-4 h-4 mr-2" />I want changes
											</Button>
											<Button
												onClick={() => setShowFeedback(false)}
												variant="outline"
												size="sm"
												className="bg-white/10 hover:bg-white/20"
											>
												Skip feedback
											</Button>
										</div>
									</div>
								)}
							</GlassCard>
						) : generationState === GenerationState.EVALUATING_DECISION ? (
							<GlassCard className="p-6 max-w-5xl mx-auto w-full">
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
						) : currentNode?.status === "ended" ||
						  currentNode?.status === "unsafe" ? (
							<GlassCard className="p-6 max-w-5xl mx-auto w-full">
								<h3 className="text-lg font-bold text-white mb-4">
									Timeline Ended
								</h3>
								<p className="text-gray-300 mb-4">{currentNode.endReason}</p>
								<Button
									onClick={navigateToPreviousNode}
									className="bg-purple-600 hover:bg-purple-700"
									disabled={!currentNode.parentId}
								>
									<ArrowLeft className="w-4 h-4 mr-2" />
									Go Back to Previous Decision
								</Button>
							</GlassCard>
						) : null}

						{/* Feedback form - Only shown when user explicitly wants changes AND not regenerating */}
						{generationState === GenerationState.AWAITING_DECISION &&
							showFeedbackForm &&
							!isRegenerating && (
								<GlassCard className="p-6 max-w-5xl mx-auto w-full">
									<h3 className="text-lg font-bold text-white mb-4">
										What would you like to change?
									</h3>
									<div className="space-y-4">
										<Textarea
											value={userFeedback}
											onChange={(e) => setUserFeedback(e.target.value)}
											placeholder="Describe how you'd like the story to be different..."
											className="bg-white/10 border-white/20 text-white placeholder-gray-500 min-h-[100px]"
										/>
										<div className="flex space-x-4 justify-end">
											<Button
												onClick={() => {
													setShowFeedbackForm(false);
													setShowFeedback(true);
													setUserFeedback("");
												}}
												variant="outline"
												className="bg-white/10 hover:bg-white/20"
											>
												Cancel
											</Button>
											<Button
												onClick={regenerateStory}
												className="bg-purple-600 hover:bg-purple-700"
												disabled={!userFeedback.trim() || isRegenerating}
											>
												<RefreshCcw className="w-4 h-4 mr-2" />
												Regenerate Story
											</Button>
										</div>
									</div>
								</GlassCard>
							)}

						{/* Special input for first chapter in Storywriter mode */}
						{storyMode === "storywriter" &&
							storyNodes.length === 0 &&
							!isSelectingMode && (
								<GlassCard className="p-6 max-w-5xl mx-auto w-full">
									<h3 className="text-lg font-bold text-white mb-4">
										What happens in the first chapter?
									</h3>
									<div className="space-y-4">
										<Textarea
											value={storyDirection}
											onChange={(e) => setStoryDirection(e.target.value)}
											placeholder="Describe what you want to happen in the first chapter..."
											className="bg-white/10 border-white/20 text-white placeholder-gray-500 min-h-[100px]"
										/>
										<div className="flex justify-end">
											<Button
												onClick={startOrContinueStory}
												className="bg-purple-600 hover:bg-purple-700"
												disabled={
													!storyDirection.trim() ||
													generationState !== GenerationState.IDLE
												}
											>
												<Sparkles className="w-4 h-4 mr-2" />
												Generate First Chapter
											</Button>
										</div>
									</div>
								</GlassCard>
							)}
					</div>
				</TabsContent>

				{/* Timeline tab */}
				<TabsContent value="timeline" className="flex-1">
					<GlassCard className="p-6 h-full">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-bold text-white">Story Timeline</h3>

							{storyNodes.length > 0 && (
								<div className="flex gap-2">
									{currentNode && (
										<Button
											variant="outline"
											size="sm"
											className="bg-yellow-900/20 hover:bg-yellow-900/30 border-yellow-500/30 text-yellow-300"
											onClick={() =>
												setShowDeleteConfirm({
													type: "node",
													nodeId: currentNode._id,
													nodeName: `Part ${
														storyNodes.indexOf(currentNode) + 1
													}`,
												})
											}
										>
											<Trash2 className="w-3 h-3 mr-1" />
											Delete Node
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										className="bg-red-900/20 hover:bg-red-900/30 border-red-500/30 text-red-300"
										onClick={() => setShowDeleteConfirm({ type: "all" })}
									>
										<Trash2 className="w-3 h-3 mr-1" />
										Clear All
									</Button>
								</div>
							)}
						</div>

						{storyNodes.length === 0 ? (
							<p className="text-gray-400 text-center py-4">
								No story has been generated yet.
							</p>
						) : (
							<div className="h-full overflow-auto">
								{/* Tree visualization */}
								<div className="mb-6 group">
									<svg width="100%" height="400" className="overflow-visible">
										{renderTimelineTree(timelineTree)}
									</svg>
								</div>

								{/* Legend */}
								<div className="flex flex-wrap gap-4 mb-4 text-sm">
									<div className="flex items-center gap-2">
										<Circle className="w-4 h-4 text-green-500 fill-current" />
										<span className="text-gray-300">Active</span>
									</div>
									<div className="flex items-center gap-2">
										<Circle className="w-4 h-4 text-yellow-500 fill-current" />
										<span className="text-gray-300">Concluded</span>
									</div>
									<div className="flex items-center gap-2">
										<Circle className="w-4 h-4 text-red-500 fill-current" />
										<span className="text-gray-300">Unsafe/Ended</span>
									</div>
									<div className="flex items-center gap-2">
										<Circle className="w-4 h-4 text-purple-500 fill-current" />
										<span className="text-gray-300">Current</span>
									</div>
								</div>

								{/* Current node details */}
								{currentNode && (
									<div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
										<h4 className="text-lg font-semibold text-white mb-2">
											Chapter {currentNode.chapterNumber || "?"}: Part{" "}
											{storyNodes.indexOf(currentNode) + 1}
										</h4>
										<p className="text-gray-300 mb-2">{currentNode.summary}</p>

										{memoryContext.recentMemory && (
											<div className="mt-2">
												<p className="text-xs text-gray-400">Recent memory:</p>
												<p className="text-sm text-gray-300">
													"{memoryContext.recentMemory}"
												</p>
											</div>
										)}

										{memoryContext.longTermMemory && (
											<div className="mt-2">
												<p className="text-xs text-gray-400">
													Long-term memory:
												</p>
												<p className="text-sm text-gray-300">
													"{memoryContext.longTermMemory}"
												</p>
											</div>
										)}

										{currentNode.userDecision && (
											<div className="mt-2">
												<p className="text-xs text-gray-400">
													Decision that led here:
												</p>
												<p className="text-sm text-gray-300">
													"{currentNode.userDecision}"
												</p>
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</GlassCard>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Helper function to format the story content nicely
function formatStoryContent(content: string): JSX.Element {
	if (!content) return <></>;

	// Remove any "Options:" or "Choices:" sections
	const storyOnly = content
		.split(/Options:|Choices:|What will you do\?|What do you do now\?/i)[0]
		.trim();

	// Split paragraphs and add proper spacing
	const paragraphs = storyOnly.split(/\n+/).filter(Boolean);

	return (
		<>
			{paragraphs.map((paragraph, index) => (
				<p key={index} className="mb-6 text-lg leading-relaxed text-gray-100">
					{paragraph}
				</p>
			))}
		</>
	);
}
