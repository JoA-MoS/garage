---
applyTo: '**'
---

# GitHub Copilot Integration Standards

This file provides specific guidance for GitHub Copilot to follow the established coding standards in this workspace.

## Code Generation Guidelines

When generating code, always follow these patterns and conventions established in this workspace.

**Primary Reference Files:**

- **React Components**: See `react-component-patterns.instructions.md` for complete patterns, templates, and mobile-first approach
- **File Naming**: See `file-naming-conventions.instructions.md` for all naming standards
- **General Standards**: See `coding-standards.instructions.md` for high-level principles

## Component Generation Decision Tree

**When creating React components:**

1. **Determine component type first:**

   - If the component needs data fetching, state management, or business logic → Create a Smart component
   - If the component is purely for UI display → Create a Presentation component
   - If unsure, ask the user or default to Smart component with a Presentation component

2. **Use proper file naming:**

   - Smart components: `{feature-name}.smart.tsx`
   - Presentation components: `{feature-name}.presentation.tsx`
   - Common components: `{component-name}.tsx`

3. **Follow the established architecture:**

   - Place Smart components in `components/smart/`
   - Place Presentation components in `components/presentation/`
   - Extract business logic into custom hooks when appropriate

4. **Apply mobile-first design:**
   - Start with mobile styles using Tailwind classes
   - Use progressive enhancement for larger screens
   - Ensure touch targets are minimum 44px × 44px
   - Test touch interactions and responsive behavior

## Workspace-Specific Patterns

### Nx Workspace Considerations

- Respect project boundaries and dependencies
- Use proper import paths for libraries
- Follow Nx conventions for project structure

### Existing Patterns

- Look at existing components in the `soccer-stats` app for reference
- Follow the established Smart/Presentation pattern already implemented
- Use similar styling approaches (Tailwind CSS where applicable)

### Technology Stack

- React with TypeScript
- Tailwind CSS for styling (mobile-first approach)
- React Testing Library for testing
- Vite for bundling (where applicable)
- NestJS for API applications

## Code Quality Standards for Generation

### TypeScript

- Always use proper TypeScript types
- Define interfaces for props and data structures
- Use generic types where appropriate
- Avoid `any` type

### Error Handling

- Include proper error handling in async operations
- Use try-catch blocks for API calls
- Provide meaningful error messages

### Testing

- Generate test files alongside components
- Use React Testing Library for component tests
- Mock external dependencies

### Performance

- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Use `memo` from React for presentation components when beneficial

## Migration and Refactoring

When updating existing code:

1. **Preserve backward compatibility** when possible
2. **Create migration plans** for breaking changes
3. **Update tests** to match new patterns
4. **Document changes** in appropriate files
5. **Follow established refactoring patterns** from the soccer-stats app

## Questions to Ask

When uncertain about implementation details, ask:

- "Should this be a Smart or Presentation component?"
- "What data does this component need to manage?"
- "Are there existing patterns I should follow?"
- "What testing strategy should I use?"
- "Does this need to integrate with existing services?"
