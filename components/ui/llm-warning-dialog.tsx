"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/ui/mystical-button";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Cpu, Loader2 } from "lucide-react";
import WebLLMService from "@/lib/webllm-service";
import { toast } from "sonner";

interface ProgressInfo {
	progress: number;
	text: string;
}

interface LLMWarningDialogProps {
	onInitialized?: () => void;
}

export function LLMWarningDialog({ onInitialized }: LLMWarningDialogProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [progressInfo, setProgressInfo] = useState<ProgressInfo>({
		progress: 0,
		text: "",
	});
	const webLLM = WebLLMService.getInstance();

	const handleConfirm = async () => {
		try {
			setIsLoading(true);

			const success = await webLLM.initialize((progress) => {
				setProgressInfo(progress);
			});

			if (success) {
				toast.success("AI model loaded successfully!");
				setIsOpen(false);
				if (onInitialized) {
					onInitialized();
				}
			} else {
				toast.error("Failed to load AI model. Please try again.");
				setIsLoading(false);
			}
		} catch (error) {
			console.error("Failed to initialize WebLLM:", error);
			toast.error("Failed to initialize the AI model. Please try again later.");
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setIsOpen(false);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<GlassCard className="max-w-lg p-6 mx-4">
				<div className="flex items-start mb-4">
					<AlertTriangle className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
					<div>
						<h2 className="text-xl font-bold text-white mb-2">
							AI Model Required
						</h2>
						<p className="text-gray-300 mb-4">
							RebirthRealm uses your device's hardware to run a local AI model
							for generating stories. This requires a capable GPU and
							approximately 2GB of downloaded data.
						</p>
						<p className="text-gray-300 mb-4">
							By clicking "Load AI Model", you agree to download and run the
							Llama-3.2-1B model locally on your device.
						</p>

						{isLoading && (
							<div className="mb-4">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm text-gray-300">
										{progressInfo.text}
									</span>
									<span className="text-sm text-gray-300">
										{Math.round(progressInfo.progress * 100)}%
									</span>
								</div>
								<div className="w-full bg-gray-700 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-purple-500 to-teal-500 h-2 rounded-full"
										style={{ width: `${progressInfo.progress * 100}%` }}
									></div>
								</div>
								<p className="text-xs text-gray-400 mt-2">
									This may take several minutes depending on your connection
									speed
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end space-x-3 mt-6">
					<Button
						variant="ghost"
						className="text-gray-300 hover:text-white"
						onClick={handleCancel}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<MysticalButton onClick={handleConfirm} disabled={isLoading} glow>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Loading Model...
							</>
						) : (
							<>
								<Cpu className="w-4 h-4 mr-2" />
								Load AI Model
							</>
						)}
					</MysticalButton>
				</div>
			</GlassCard>
		</div>
	);
}
