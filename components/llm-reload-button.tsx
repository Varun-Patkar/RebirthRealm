"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cpu, Loader2 } from "lucide-react";
import { LLMReloadDialog } from "@/components/llm-reload-dialog";
import { useWebLLM } from "@/components/providers";

export function LLMReloadButton() {
	const [showDialog, setShowDialog] = useState(false);
	const { isInitialized, isLoading } = useWebLLM();

	// Display different button states based on loading status
	let buttonIcon = <Cpu className="h-4 w-4" />;
	let buttonText = "Reload AI";

	if (isLoading) {
		buttonIcon = <Loader2 className="h-4 w-4 animate-spin" />;
		buttonText = "Loading...";
	} else if (!isInitialized) {
		buttonText = "Load AI";
	}

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-full"
				onClick={() => setShowDialog(true)}
				disabled={isLoading} // Disable the button while loading but still show it
			>
				{buttonIcon}
				<span className="text-xs">{buttonText}</span>
			</Button>

			{showDialog && (
				<LLMReloadDialog mode="reload" onClose={() => setShowDialog(false)} />
			)}
		</>
	);
}
