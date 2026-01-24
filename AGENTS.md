# AGENTS.md - Agentic Coding Agent Guidelines

## Build & Run Commands
- **Install dependencies**: `npm install`
- **Run dev server**: `npm run dev`
- **Run electron dev**: `npm run electron:dev`
- **Build project**: `npm run build`
- **Build electron app**: `npm run electron:build`
- **Run linter**: `npm run lint`
- **Run typecheck**: `npm run typecheck``

## Code Style Guidelines

### Imports
- Group imports in order: 1) Node.js built-ins, 2) External libraries, 3) Internal modules, 4) Relative imports
- Use named exports for constants and utilities, default exports for main component/module
- Prefer named imports (`import { foo } from 'bar'`) over namespace imports
- Unused imports should be removed; fixers handle this automatically

### Formatting
- 2 spaces for indentation (no tabs)
- Max line length: 80-100 characters
- Trailing commas in multi-line arrays/objects
- Single quotes for strings, double quotes only when needed for escaped quotes
- Semicolons required

### Types
- Use TypeScript/Flow for type safety
- Prefer explicit return types for public functions
- Use `unknown` over `any` for generic types
- Define interfaces for complex object shapes, type aliases for unions/primitives
- Use readonly arrays/objects when immutability is needed

### Naming Conventions
- **Variables/Functions**: camelCase (`userId`, `getData`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_KEY`, `MAX_RETRIES`)
- **Classes/Components**: PascalCase (`UserService`, `UserProfile`)
- **Private members**: underscore prefix (`_internalState`)
- **Files**: kebab-case (`user-service.ts`, `user-profile.tsx`)

### Error Handling
- Always handle promise re/errors with try/catch or .catch()
- Use Error objects, never throw strings
- Log errors with appropriate context (error messages, stack traces)
- Provide user-friendly error messages, not technical details
- Use nullish coalescing (`??`) and optional chaining (`?.`) for safer access

### General Practices
- Keep functions small and focused (<50 lines when possible)
- DRY: Extract repeated logic into helper functions
- Prefer early returns over deep nesting
- Use meaningful variable/function names that describe intent
- Write tests for new features (TDD preferred)
- Always run lint and typecheck before committing
- Match existing code style when modifying files