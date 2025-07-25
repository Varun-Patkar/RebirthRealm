"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/ui/mystical-button";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import {
	Plus,
	BookOpen,
	Sparkles,
	Scroll,
	User,
	LogOut,
	TrendingUp,
	Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [stats, setStats] = useState({
		totalSagas: 0,
		recentSagas: 0,
	});

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await fetch("/api/sagas/stats");
				if (response.ok) {
					const data = await response.json();
					setStats(data);
				}
			} catch (error) {
				console.error("Error fetching stats:", error);
			}
		};

		if (session) {
			fetchStats();
		}
	}, [session]);

	if (status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<NebulaBackground />
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	const handleSignOut = () => {
		signOut({ callbackUrl: "/login" });
	};

	return (
		<div className="min-h-screen p-4 md:p-8">
			<NebulaBackground />

			<div className="max-w-6xl md:max-w-7xl lg:max-w-[90rem] mx-auto">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
					<div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-yellow-400 bg-clip-text text-transparent mb-2">
							Welcome back, {session.user?.name}
						</h1>
						<p className="text-gray-300 text-lg">
							Continue your mystical journey through the realms of imagination
						</p>
					</div>

					<div className="flex items-center space-x-4 mt-4 md:mt-0">
						<div className="flex items-center space-x-2 text-gray-300">
							<User className="w-5 h-5" />
							<span className="text-sm">{session.user?.email}</span>
						</div>
						<Button
							onClick={handleSignOut}
							variant="ghost"
							size="sm"
							className="text-gray-300 hover:text-white"
						>
							<LogOut className="w-4 h-4 mr-2" />
							Sign Out
						</Button>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<GlassCard className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400">Total Sagas</p>
								<p className="text-2xl font-bold text-white">
									{stats.totalSagas}
								</p>
							</div>
							<Scroll className="w-8 h-8 text-purple-400" />
						</div>
					</GlassCard>

					<GlassCard className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400">Recent Activity</p>
								<p className="text-2xl font-bold text-white">
									{stats.recentSagas}
								</p>
							</div>
							<Clock className="w-8 h-8 text-teal-400" />
						</div>
					</GlassCard>

					<GlassCard className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400">Realm Status</p>
								<p className="text-2xl font-bold text-white">Active</p>
							</div>
							<TrendingUp className="w-8 h-8 text-yellow-400" />
						</div>
					</GlassCard>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<GlassCard className="p-8" glow>
						<div className="text-center">
							<Plus className="w-16 h-16 text-purple-400 mx-auto mb-4" />
							<h3 className="text-2xl font-bold text-white mb-2">
								Create New Saga
							</h3>
							<p className="text-gray-300 mb-6">
								Begin a new mystical adventure and weave your tale into the
								fabric of reality
							</p>
							<Link href="/sagas/create">
								<MysticalButton size="lg" glow className="w-full">
									<Sparkles className="w-5 h-5 mr-2" />
									Start Creating
								</MysticalButton>
							</Link>
						</div>
					</GlassCard>

					<GlassCard className="p-8">
						<div className="text-center">
							<BookOpen className="w-16 h-16 text-teal-400 mx-auto mb-4" />
							<h3 className="text-2xl font-bold text-white mb-2">
								Browse Sagas
							</h3>
							<p className="text-gray-300 mb-6">
								Explore the vast library of sagas created by fellow travelers of
								the realm
							</p>
							<Link href="/sagas/browse">
								<MysticalButton
									variant="secondary"
									size="lg"
									glow
									className="w-full"
								>
									<BookOpen className="w-5 h-5 mr-2" />
									Explore Library
								</MysticalButton>
							</Link>
						</div>
					</GlassCard>
				</div>

				{/* Recent Activity */}
				<div className="mt-8">
					<GlassCard className="p-6">
						<h3 className="text-xl font-bold text-white mb-4 flex items-center">
							<Clock className="w-5 h-5 mr-2 text-purple-400" />
							Recent Activity
						</h3>
						<div className="text-center py-8">
							<p className="text-gray-400">
								Your recent saga activities will appear here
							</p>
						</div>
					</GlassCard>
				</div>
			</div>
		</div>
	);
}
