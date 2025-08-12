# 🏓 Ping Pong Pal - Tournament Bracket Manager

A modern, intuitive ping pong tournament management app that helps you organize tournaments, track matches, and crown champions in your friend group! Features both tournament brackets and continuous MMR/Elo rating system for competitive play.

## ✨ Features

### 🏆 Tournament Mode
- **Single Elimination Brackets**: Automatic bracket generation with BYE handling for odd player counts
- **Visual Tournament Graph**: Interactive bracket visualization using ReactFlow
- **Smart Match Progression**: Winners automatically advance to next round matches
- **Tournament Status Tracking**: Real-time tournament completion detection
- **Player Statistics**: Win/loss tracking throughout tournaments

### 📊 MMR Mode (Continuous Rating System)
- **Elo Rating System**: Standard ELO calculation with K-factor of 32 and 1000 starting rating
- **Continuous 1v1 Matches**: Record matches anytime with real-time rating updates
- **Dynamic Leaderboard**: Live rankings with trophy icons (🥇🥈🥉)
- **Match History**: Complete history showing rating changes and trends
- **Peak MMR Tracking**: Track each player's highest achieved rating

### 🎮 Core Features
- **Dual Mode Interface**: Seamless switching between Tournament and MMR modes
- **Player Management**: Comprehensive player registration with avatar support
- **Match Recording**: Score tracking with automatic statistics updates
- **Persistent Storage**: All data automatically saved to localStorage with proper serialization
- **Responsive Design**: Optimized for desktop and mobile devices
- **Custom Styling**: Tournament-themed color palette with custom CSS variables

## 🎯 Perfect For

- **Tournament Brackets**: Office tournaments, friend group competitions, local club events
- **MMR/Ranking System**: Ongoing competitive play, skill-based matchmaking, long-term rating tracking
- **Mixed Usage**: Switch between casual tournaments and serious ranked matches

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ping-pong-pal-bracket
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🛠️ Technology Stack

This project is built with modern web technologies:

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC compiler
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom tournament theme
- **Visualization**: ReactFlow (@xyflow/react) for tournament brackets
- **Routing**: React Router DOM
- **State Management**: React useState with localStorage persistence
- **Package Manager**: Bun (with npm/yarn compatibility)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/12710f8d-d2d8-4f2d-8ac3-cb5bdf4460e1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
