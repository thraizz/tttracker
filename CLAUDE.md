# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```
Server runs on port 8080 with host "::" (accessible from all interfaces).

**Build for production:**
```bash
npm run build
```

**Build for development:**
```bash
npm run build:dev
```

**Lint code:**
```bash
npm run lint
```

**Preview production build:**
```bash
npm run preview
```

## Architecture Overview

This is a single-page ping pong application built with React, TypeScript, and Vite. The app supports two main modes:
1. **Tournament Mode**: Single elimination bracket tournaments
2. **MMR Mode**: Continuous 1v1 matches with Elo rating system

Both modes use local storage persistence.

### Core Architecture

- **Framework Stack**: React 18 + TypeScript + Vite + SWC
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom tournament-themed color palette
- **State Management**: React useState with localStorage persistence
- **Routing**: React Router DOM with basic setup/tournament views
- **Data Flow**: Top-down props passing from Index page to components

### Key Components

**Main Application Flow:**
- `src/pages/Index.tsx` - Main controller with tabbed interface switching between Tournament and MMR modes
- `src/components/TournamentBracket.tsx` - Tournament management UI with match recording and bracket progression
- `src/components/TournamentGraph.tsx` - Visual bracket representation using ReactFlow (@xyflow/react)
- `src/components/MMRMode.tsx` - MMR/Elo rating system with match recording, leaderboard, and history

**Supporting Components:**
- `src/components/PlayerManagement.tsx` - Player registration and management (handles both tournament stats and MMR)
- `src/components/MatchCard.tsx` - Individual match display and interaction
- `src/components/ui/` - Complete shadcn/ui component library

### Data Models (src/types/tournament.ts)

**Player**: `{ id, name, avatar?, wins, losses, mmr, peakMmr }`
**Match**: `{ id, player1, player2, winner?, score?, status, round, completedAt?, mmrChange?, gameMode }`
**Tournament**: `{ id, players, matches, status, winner?, createdAt, completedAt? }`
**MMRMatch**: `{ id, player1, player2, winner, score, mmrChange, completedAt }`

### Tournament Logic

**Bracket Generation (Index.tsx:99-141):**
- Automatically shuffles players and creates single elimination bracket
- Handles odd number of players with BYE advancement
- Generates matches for all rounds upfront with proper round numbering

**Match Progression (TournamentBracket.tsx:22-85):**
- Winners automatically advance to next round matches
- Player statistics (wins/losses) updated in real-time
- Tournament completion detected when all matches finished

**Persistence (Index.tsx:51-109):**
- All state (players, tournament, view, mmrMatches, activeTab) saved to localStorage
- Date objects properly serialized/deserialized
- Automatic recovery on page refresh
- Players automatically upgraded with MMR fields when loaded

### MMR System

**ELO Rating Calculation (MMRMode.tsx:31-36):**
- Uses standard ELO rating system with K-factor of 32
- Rating changes based on expected vs actual match outcomes
- Minimum rating floor of 0

**MMR Mode Features:**
- Continuous 1v1 match recording with real-time rating updates
- Leaderboard with ranking icons (🥇🥈🥉)
- Match history showing rating changes and trends
- Peak MMR tracking for each player
- All players start with 1000 MMR

### Styling System

Custom CSS variables defined in `src/index.css`:
- `--ping-pong`: Primary brand color
- `--table-green`: Success/completion color  
- `--victory-gold`: Winner/champion color
- `--soft-gray`: Background accent
- `--shadow-tournament`: Custom card shadows

### Development Notes

- TypeScript configuration allows implicit any and unused variables (relaxed for rapid development)
- ESLint configured with React hooks rules, unused vars disabled
- Vite alias `@/` maps to `src/` directory
- No testing framework currently configured
- Uses Bun for package management (bun.lockb present)