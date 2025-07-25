"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { GlassCard } from "@/components/ui/glass-card";
import { MysticalButton } from "@/components/ui/mystical-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Search,
	BookOpen,
	User,
	Calendar,
	Filter,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Saga } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

export default function BrowseSagasPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [sagas, setSagas] = useState<Saga[]>([]);
	const [filteredSagas, setFilteredSagas] = useState<Saga[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFandom, setSelectedFandom] = useState("");

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		}
	}, [status, router]);

	useEffect(() => {
		const fetchSagas = async () => {
			try {
				const response = await fetch("/api/sagas");
				if (response.ok) {
					const data = await response.json();
					setSagas(data);
					setFilteredSagas(data);
				}
			} catch (error) {
				console.error("Error fetching sagas:", error);
			} finally {
				setIsLoading(false);
			}
		};

		if (session) {
			fetchSagas();
		}
	}, [session]);

	useEffect(() => {
		let filtered = sagas;

		if (searchTerm) {
			filtered = filtered.filter(
				(saga) =>
					saga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					saga.premise.toLowerCase().includes(searchTerm.toLowerCase()) ||
					saga.worldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					saga.worldDescription
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					saga.moodAndTropes.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		if (selectedFandom) {
			filtered = filtered.filter((saga) => saga.worldName === selectedFandom);
		}

		setFilteredSagas(filtered);
	}, [searchTerm, selectedFandom, sagas]);

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

	const fandoms = Array.from(new Set(sagas.map((saga) => saga.worldName)));

	return (
		<div className="min-h-screen p-4 md:p-8">
			<NebulaBackground />

			<div className="max-w-6xl md:max-w-7xl lg:max-w-[90rem] mx-auto">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
					<div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-teal-400 to-yellow-400 bg-clip-text text-transparent mb-2">
							Browse Sagas
						</h1>
						<p className="text-gray-300 text-lg">
							Discover epic tales from across the mystical realms
						</p>
					</div>

					<div className="flex items-center space-x-4 mt-4 md:mt-0">
						<Link href="/sagas/create">
							<MysticalButton size="sm" glow>
								<Sparkles className="w-4 h-4 mr-2" />
								Create Saga
							</MysticalButton>
						</Link>
						<Link href="/dashboard">
							<Button
								variant="ghost"
								className="text-gray-300 hover:text-white"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Dashboard
							</Button>
						</Link>
					</div>
				</div>

				{/* Search and Filters */}
				<GlassCard className="p-6 mb-8">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<Input
									placeholder="Search sagas by title, premise, or fandom..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
								/>
							</div>
						</div>

						<div className="md:w-48">
							<select
								value={selectedFandom}
								onChange={(e) => setSelectedFandom(e.target.value)}
								className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
							>
								<option value="">All Fandoms</option>
								{fandoms.map((fandom) => (
									<option key={fandom} value={fandom}>
										{fandom}
									</option>
								))}
							</select>
						</div>
					</div>
				</GlassCard>

				{/* Sagas Grid */}
				{isLoading ? (
					<div className="flex justify-center py-12">
						<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
					</div>
				) : filteredSagas.length === 0 ? (
					<GlassCard className="p-12 text-center">
						<BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-xl font-bold text-white mb-2">
							No Sagas Found
						</h3>
						<p className="text-gray-400">
							{searchTerm || selectedFandom
								? "No sagas match your current filters"
								: "Be the first to create a saga in the realm"}
						</p>
					</GlassCard>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{filteredSagas.map((saga) => (
							<GlassCard
								key={saga._id?.toString()}
								className="p-6 hover:scale-105 transition-transform"
							>
								<div className="flex items-start justify-between mb-4">
									<Badge
										variant="secondary"
										className="bg-purple-500/20 text-purple-300 border-purple-500/30"
									>
										{saga.worldName}
									</Badge>
									<div className="text-xs text-gray-400 flex items-center">
										<Calendar className="w-3 h-3 mr-1" />
										{formatDistanceToNow(new Date(saga.createdAt), {
											addSuffix: true,
										})}
									</div>
								</div>

								<h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
									{saga.title}
								</h3>

								<p className="text-gray-300 text-sm mb-2 line-clamp-2">
									<span className="text-purple-300 font-semibold">Mood: </span>
									{saga.moodAndTropes}
								</p>

								<p className="text-gray-300 text-sm mb-4 line-clamp-3">
									{saga.premise}
								</p>

								<div className="flex items-center justify-between">
									<div className="flex items-center text-gray-400 text-xs">
										<User className="w-3 h-3 mr-1" />
										Anonymous
									</div>

									<Link href={`/sagas/${saga._id}`}>
										<Button
											size="sm"
											variant="ghost"
											className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
										>
											<BookOpen className="w-4 h-4 mr-1" />
											Read More
										</Button>
									</Link>
								</div>
							</GlassCard>
						))}
					</div>
				)}

				{/* Load More Button */}
				{filteredSagas.length > 0 && (
					<div className="text-center mt-8">
						<Button variant="ghost" className="text-gray-300 hover:text-white">
							Load More Sagas
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
