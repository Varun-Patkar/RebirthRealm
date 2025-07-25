"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import { LLMReloadDialog } from "@/components/llm-reload-dialog";
import WebLLMService from "@/lib/webllm-service";

interface LLMStatusContextType {
	isInitialized: boolean;
	isLoading: boolean;
}

const LLMStatusContext = createContext<LLMStatusContextType>({
	isInitialized: false,
	isLoading: false,
});

export function useLLMStatus() {
	return useContext(LLMStatusContext);
}

export function LLMStatusProvider({ children }: { children: ReactNode }) {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showPrompt, setShowPrompt] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const webLLM = WebLLMService.getInstance();

	// Wait until component is mounted (client-side)
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Check LLM status periodically
	useEffect(() => {
		if (!isMounted) return;

		const checkStatus = () => {
			const initialized = webLLM.isInitialized();
			const loading = webLLM.isLoading();

			setIsInitialized(initialized);
			setIsLoading(loading);

			// Show prompt if the model should be prompted
			setShowPrompt(webLLM.shouldPromptUser() || loading);
		};

		// Initial check
		checkStatus();

		// Set up periodic checking
		const interval = setInterval(checkStatus, 2000);

		return () => clearInterval(interval);
	}, [isMounted]);

	const handleInitialized = () => {
		setIsInitialized(true);
		setShowPrompt(false);
	};

	return (
		<LLMStatusContext.Provider value={{ isInitialized, isLoading }}>
			{children}
			{isMounted && showPrompt && (
				<LLMReloadDialog mode="initial" onClose={handleInitialized} />
			)}
		</LLMStatusContext.Provider>
	);
}
