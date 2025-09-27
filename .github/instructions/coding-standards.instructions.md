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
- **Mobile-First**: Design and develop all UI components with mobile users as the primary consideration

## Architecture Patterns

### Component Architecture (React/UI Applications)

- Use **Three-Layer Fragment Architecture** for GraphQL applications following The Guild's pattern
- Use **Smart/Presentation Component Pattern** for non-GraphQL applications
- **Mobile-First Development**: ALL UI components must be designed for mobile devices first, then enhanced for larger screens
- **Fragment Masking**: Use `FragmentType` and `useFragment` for type-safe GraphQL data access
- **Collocated Fragments**: Define fragments in smart components and spread them in queries
- Keep components focused on a single responsibility
- Ensure touch-friendly interfaces with adequate touch targets (minimum 44px × 44px)

**Three-Layer Architecture:**

1. **Presentation Layer**: Pure UI components with individual props
2. **Smart Layer**: Fragment wrappers using The Guild's `FragmentType` pattern
3. **Composition Layer**: Query orchestration with collocated fragment spreading

**For detailed React patterns, see:** `react-component-patterns.instructions.md`

### GraphQL Best Practices

- Use **The Guild's GraphQL Code Generator** with client preset
- Import `FragmentType` and `useFragment` from generated `fragment-masking` module
- Import `graphql` function from generated `gql` directory
- Define fragments using `graphql(/* GraphQL */ \`...\`)` syntax
- Use fragment masking to prevent access to non-fragment fields
- Implement collocated fragment spreading for optimal query structure

### File Organization

- Group related files by feature/domain, not by file type
- Use consistent directory structures across projects
- Keep components, tests, and stories co-located when possible
- Place generated GraphQL files in `generated/gql/` directory

**For detailed naming conventions, see:** `file-naming-conventions.instructions.md`

## Code Quality Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type - use proper typing
- Use generic types where appropriate
- Document complex types with JSDoc comments

### GraphQL TypeScript Standards

- Use `FragmentType<typeof Fragment>` for component props that receive fragment data
- Import types from generated `gql` modules, not manual definitions
- Use fragment masking with `useFragment` to ensure type safety
- Define fragments with `graphql(/* GraphQL */ \`...\`)` syntax for proper codegen
- Avoid accessing fields not defined in fragments (TypeScript will prevent this)
- Use generated query/mutation hooks for proper typing

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

- Use `memo` from React for presentation components when appropriate
- Implement proper loading states
- Optimize bundle sizes with code splitting
- Use proper caching strategies
- Monitor and optimize re-renders
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
