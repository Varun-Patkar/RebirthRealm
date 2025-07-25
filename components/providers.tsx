"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import WebLLMService from "@/lib/webllm-service";

// Define proper message types
interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

// Create WebLLM context
interface WebLLMContextType {
	isInitialized: boolean;
	isLoading: boolean;
	generateResponse: (
		messages: ChatMessage[],
		onUpdate?: (message: string) => void
	) => Promise<string>;
}

const WebLLMContext = createContext<WebLLMContextType | undefined>(undefined);

export function useWebLLM() {
	const context = useContext(WebLLMContext);
	if (context === undefined) {
		throw new Error("useWebLLM must be used within a WebLLMProvider");
	}
	return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const webLLM = WebLLMService.getInstance();

	// Check if we're mounted on the client
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted) return;

		// Check initialization status
		const checkStatus = () => {
			setIsInitialized(webLLM.isInitialized());
			setIsLoading(webLLM.isLoading());
		};

		// Initial check
		checkStatus();

		// Set up periodic checking until initialized
		const interval = setInterval(() => {
			checkStatus();
			if (webLLM.isInitialized()) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [isMounted]);

	const generateResponse = async (
		messages: ChatMessage[],
		onUpdate?: (message: string) => void
	) => {
		if (!webLLM.isInitialized()) {
			throw new Error("WebLLM is not initialized");
		}

		return await webLLM.generateResponse(messages, onUpdate);
	};

	return (
		<SessionProvider>
			<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
				<WebLLMContext.Provider
					value={{ isInitialized, isLoading, generateResponse }}
				>
					{children}
				</WebLLMContext.Provider>
			</ThemeProvider>
		</SessionProvider>
	);
}
