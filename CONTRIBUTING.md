# Contributing to TTTracker

Thank you for your interest in contributing to TTTracker! We welcome contributions from the community to help make this table tennis tournament and MMR tracking app even better.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Git

### Setting up the Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tttracker.git
   cd tttracker
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🛠️ Development Workflow

### Important Development Notes
- **NEVER start the development server** (`npm run dev`) for testing - use build commands only
- Use `npm run build` for production builds
- Use `npm run build:dev` for development builds
- Run `npm run lint` to check code style
- Run `npm run typecheck` to verify TypeScript

### Making Changes

1. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the existing code style and patterns

3. **Test your changes** by building the project:
   ```bash
   npm run build:dev
   npm run lint
   npm run typecheck
   ```

4. **Commit your changes** with a descriptive message:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork** and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Code Style Guidelines

- Follow the existing TypeScript and React patterns
- Use shadcn/ui components when possible
- Follow Tailwind CSS conventions for styling
- Keep components focused and modular
- Use meaningful variable and function names
- Add TypeScript types for all new code

## 🧪 Testing

- Build the project to ensure no compilation errors
- Test both Tournament and MMR modes thoroughly
- Verify localStorage persistence works correctly
- Test responsive design on mobile devices

## 🎯 Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues or improve existing functionality
- **New features**: Add new modes, statistics, or UI improvements
- **Documentation**: Improve README, code comments, or guides
- **Performance**: Optimize rendering or data handling
- **UI/UX**: Enhance the user interface and experience
- **Accessibility**: Improve accessibility features

## 📋 Pull Request Process

1. Ensure your code follows the existing patterns and style
2. Update documentation if you've added new features
3. Make sure all builds pass (`npm run build`, `npm run lint`)
4. Write clear, descriptive commit messages
5. Reference any related issues in your PR description

## 🔍 Architecture Overview

- **React 18 + TypeScript + Vite** for the core framework
- **shadcn/ui + Radix UI** for components
- **Tailwind CSS** for styling
- **ReactFlow** for tournament bracket visualization
- **localStorage** for data persistence
- **Firebase** for authentication and cloud features

### Key Components
- `src/pages/Index.tsx` - Main application controller
- `src/components/TournamentBracket.tsx` - Tournament management
- `src/components/MMRMode.tsx` - Rating system
- `src/components/PlayerManagement.tsx` - Player registration

## 🤝 Community Guidelines

- Be respectful and constructive in discussions
- Help others learn and grow
- Focus on the code and technical aspects
- Follow the existing project patterns
- Ask questions if you're unsure about anything

## 🐛 Reporting Issues

When reporting bugs or issues:

1. Check if the issue already exists
2. Provide clear steps to reproduce
3. Include your browser and OS information
4. Add screenshots if helpful
5. Describe expected vs actual behavior

## 💡 Feature Requests

For new feature ideas:

1. Check existing issues and discussions
2. Describe the feature and use case
3. Explain how it would benefit users
4. Consider the implementation complexity

## 📞 Getting Help

- Open an issue for bugs or questions
- Check the README for basic setup instructions
- Review the CLAUDE.md file for development guidelines

Thank you for contributing to TTTracker! 🏓