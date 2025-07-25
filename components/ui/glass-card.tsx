import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
	glow?: boolean;
	pulse?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
	({ className, glow = false, children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"rounded-xl bg-white/5 backdrop-blur-md border border-white/10",
					"transition-all duration-300",
					glow && "shadow-md shadow-purple-500/20",
					"p-4 md:p-6 lg:p-8",
					className
				)}
				{...props}
			>
				{children}
			</div>
		);
	}
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
