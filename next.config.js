/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		// Skip TypeScript errors during build
		ignoreBuildErrors: true,
	},
	eslint: {
		// Skip ESLint errors during build (optional)
		ignoreDuringBuilds: true,
	},
	images: { unoptimized: true },
};

module.exports = nextConfig;
