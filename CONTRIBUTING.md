# Contributing to Nuclei Viewer

First off, thank you for considering contributing to Nuclei Viewer! It's people like you that make this tool better for everyone in the security community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Great bug reports include:**

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots if applicable
- Browser and version
- Any error messages from the browser console

**Bug Report Template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

- A clear description of the feature
- The problem it solves or use case it enables
- Any alternative solutions you've considered
- Mockups or examples if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

#### Pull Request Process

1. Ensure your code follows the existing style
2. Update the README.md if you've added new features
3. The PR will be reviewed by maintainers
4. Address any feedback from reviews
5. Once approved, your PR will be merged

## Development Setup

### Prerequisites

- Node.js 20+
- npm
- Git

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/Augmaster/Nuclei-Parser.git
cd nuclei-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Project Structure

```
src/
├── components/     # React components organized by feature
├── pages/          # Route page components
├── services/       # Business logic (database, parsers, exporters)
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
└── lib/            # Utility functions
```

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types that may be used elsewhere

```typescript
// Good
interface Finding {
  id: string;
  severity: Severity;
  host: string;
}

// Avoid
const finding: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

```typescript
// Good
export function FindingCard({ finding, onSelect }: FindingCardProps) {
  // ...
}

// Avoid
export function FC1({ data, cb }: any) {
  // ...
}
```

### File Naming

- React components: `PascalCase.tsx` (e.g., `FindingCard.tsx`)
- Utilities/services: `camelCase.ts` (e.g., `nucleiParser.ts`)
- Types: `camelCase.ts` in `types/` directory

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow existing patterns in the codebase
- Keep responsive design in mind
- Use the existing Shadcn UI components when possible

### Code Organization

- Group related functionality together
- Keep files focused on a single responsibility
- Extract shared logic into services or hooks
- Avoid deeply nested code

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(export): add Nessus XML export format

fix(parser): handle malformed JSON in scan files

docs(readme): add Docker installation instructions

refactor(store): simplify findings filtering logic
```

## Questions?

Feel free to open an issue or start a discussion if you have questions about contributing. We're happy to help!

---

Thank you for contributing!
