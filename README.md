# RebirthRealm 🌌

A revolutionary AI-powered interactive storytelling platform that lets you create and experience infinite branching narratives. Built with cutting-edge local AI technology for privacy-first storytelling.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://rebirthrealm.vercel.app)
[![Video Demo](https://img.shields.io/badge/Video-Demo-red?style=for-the-badge&logo=youtube)](https://youtube.com/watch?v=placeholder)

## 🌟 Features

### 🤖 **Local AI-Powered Generation**

- **Privacy-First**: All story generation happens locally in your browser using WebLLM
- **No API Keys Required**: No need for OpenAI, Claude, or other external AI services
- **Offline Capable**: Generate stories even without internet connectivity

### 📖 **Interactive Storytelling**

- **Branching Narratives**: Create complex story trees with multiple paths and outcomes
- **Free-form Decisions**: Make any decision you want - no predefined choices
- **Memory System**: AI remembers previous chapters and character development
- **Chapter Progression**: Structured storytelling with proper pacing

### ✨ **Advanced Story Features**

- **Feedback System**: Regenerate any chapter with specific feedback
- **Timeline Visualization**: See your story's branching structure
- **Multiple Sagas**: Create different stories with unique worlds and premises
- **Rich World Building**: Detailed character and setting descriptions

### 🎨 **Modern UI/UX**

- **Glassmorphism Design**: Beautiful modern interface with glass effects
- **Nebula Backgrounds**: Immersive cosmic-themed visuals
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Theme**: Easy on the eyes for long reading sessions

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Modern Browser** (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Varun-Patkar/RebirthRealm.git
   cd RebirthRealm
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   MONGODB_URI=mongodb://localhost:27017/rebirth-realm
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. **Set up MongoDB**

   - **Local MongoDB**: Install and start MongoDB locally
   - **MongoDB Atlas**: Create a free cluster and get the connection string
   - Update the `MONGODB_URI` in your `.env.local`

5. **Set up GitHub OAuth** (for authentication)

   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App with:
     - Homepage URL: `http://localhost:3000`
     - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env.local`

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

### Creating Your First Story

1. **Sign in** with your GitHub account
2. **Create a new Saga** from the dashboard
3. **Fill in the details**:

   - **Title**: Name of your story
   - **World/Setting**: The universe your story takes place in
   - **World Description**: Detailed description of the setting
   - **Mood & Tropes**: Atmosphere and storytelling elements
   - **Premise**: Your character's starting situation
   - **Total Chapters**: Expected length of your story

4. **Start Writing**: Click "Begin Story" to generate your first chapter
5. **Make Decisions**: Enter what you want to do next
6. **Branch & Explore**: Create multiple story paths by going back and making different choices

### Advanced Features

- **Regenerate Chapters**: Not happy with a chapter? Use the feedback system to regenerate it
- **Timeline View**: Visualize your story's branching structure
- **Memory System**: The AI automatically summarizes previous chapters for context
- **Chapter Outlines**: See the AI's planning process for each chapter

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible component primitives

### Backend

- **Next.js API Routes** - Serverless backend
- **MongoDB** - Document database
- **NextAuth.js** - Authentication system
- **GitHub OAuth** - Social login

### AI & ML

- **WebLLM** - Local language model inference
- **Llama 3.2 1B** - Lightweight language model
- **Client-side Processing** - Privacy-preserving AI

### Deployment

- **Vercel** - Hosting and deployment
- **MongoDB Atlas** - Cloud database

## 📁 Project Structure
