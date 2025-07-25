import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface MysticalButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "accent" | "ghost";
	size?: "sm" | "md" | "lg";
	glow?: boolean;
}

const MysticalButton = forwardRef<HTMLButtonElement, MysticalButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			glow = false,
			children,
			...props
		},
		ref
	) => {
		const baseClasses =
			"relative overflow-hidden transition-all duration-300 font-medium";

		const variants = {
			primary:
				"bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-purple-500/30",
			secondary:
				"bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white border-teal-500/30",
			accent:
				"bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black border-yellow-500/30",
			ghost:
				"bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm",
		};

		const sizes = {
			sm: "px-4 py-2 text-sm rounded-lg",
			md: "px-6 py-3 text-base rounded-xl",
			lg: "px-8 py-4 text-lg rounded-xl",
		};

		const glowClasses = glow
			? "shadow-lg shadow-current/50 hover:shadow-xl hover:shadow-current/60"
			: "";

		return (
			<button
				ref={ref}
				className={cn(
					baseClasses,
					variants[variant],
					sizes[size],
					glowClasses,
					"border",
					"hover:scale-105 active:scale-95",
					"flex items-center justify-center gap-2",
					"before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
					"before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
					className
				)}
				{...props}
			>
				<span className="relative z-10 inline-flex items-center justify-center gap-2">
					{children}
				</span>
			</button>
		);
	}
);

MysticalButton.displayName = "MysticalButton";

export { MysticalButton };
