---
applyTo: '**'
---

# Coding Standards & Best Practices

Follow these coding standards consistently across the entire workspace.

## General Principles

- **Consistency**: Use consistent patterns across all projects
- **Readability**: Write self-documenting code with clear names
- **Maintainability**: Separate concerns and keep components focused
- **Testing**: Write testable code with proper separation of logic and UI
- **Performance**: Consider performance implications of architectural decisions

## Architecture Patterns

### Component Architecture (React/UI Applications)

- Use **Smart/Presentation Component Pattern** for all UI applications
- Smart components handle data, state, and business logic
- Presentation components are pure UI components that receive props
- Keep components focused on a single responsibility

### File Organization

- Group related files by feature/domain, not by file type
- Use consistent directory structures across projects
- Keep components, tests, and stories co-located when possible

## Code Quality Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type - use proper typing
- Use generic types where appropriate
- Document complex types with JSDoc comments

### Error Handling

- Use proper error boundaries in React applications
- Handle async operations with proper error states
- Log errors appropriately for debugging
- Provide meaningful error messages to users

### Testing

- Write unit tests for business logic
- Write integration tests for component interactions
- Use React Testing Library for component testing
- Mock external dependencies in tests
- Aim for meaningful test coverage, not just high percentages

## Documentation Standards

- Document architectural decisions in ARCHITECTURE.md files
- Use JSDoc for complex functions and classes
- Keep README files up to date
- Document API interfaces and data structures
- Create migration guides for breaking changes

## Performance Guidelines

- Use React.memo for presentation components when appropriate
- Implement proper loading states
- Optimize bundle sizes with code splitting
- Use proper caching strategies
- Monitor and optimize re-renders
