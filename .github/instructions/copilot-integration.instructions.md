---
applyTo: '**'
---

# GitHub Copilot Integration Standards

This file provides specific guidance for GitHub Copilot to follow the established coding standards in this workspace.

## Code Generation Guidelines

When generating code, always follow these patterns and conventions established in this workspace.

### Component Generation

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

**Example Smart Component Template:**

```tsx
import React, { useState, useCallback } from 'react';
import { {FeatureName}Presentation } from '../presentation/{feature-name}.presentation';
import { use{FeatureName}Manager } from '../../hooks/use-{feature-name}-manager';

interface {FeatureName}SmartProps {
  // Define props here
}

export const {FeatureName}Smart: React.FC<{FeatureName}SmartProps> = (props) => {
  // Business logic and state management here
  const { data, actions } = use{FeatureName}Manager();

  // Event handlers
  const handleAction = useCallback(() => {
    // Handle business logic
  }, []);

  return (
    <{FeatureName}Presentation
      data={data}
      onAction={handleAction}
      // Pass other props
    />
  );
};
```

**Example Presentation Component Template:**

```tsx
import React from 'react';

interface {FeatureName}PresentationProps {
  // Define UI-focused props here
  onAction: () => void;
}

export const {FeatureName}Presentation: React.FC<{FeatureName}PresentationProps> = ({
  onAction,
  // other props
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Always use Tailwind CSS classes for styling */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {FeatureName} Component
      </h2>
      <button 
        onClick={onAction}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Action
      </button>
    </div>
  );
};
```

### Hook Generation

**When creating custom hooks:**

- Name with `use-` prefix: `use-{hook-name}.ts`
- Place in `hooks/` directory
- Return object with `data`, `actions`, and `derivedData` when appropriate

**Example Hook Template:**

```tsx
import { useState, useCallback, useMemo } from 'react';

export const use{FeatureName}Manager = () => {
  const [data, setData] = useState();

  const actions = useMemo(() => ({
    update: (updates) => {
      // Business logic here
      setData(prev => ({ ...prev, ...updates }));
    },
  }), []);

  const derivedData = useMemo(() => ({
    // Computed values here
  }), [data]);

  return {
    data,
    actions,
    derivedData
  };
};
```

### API Service Generation

**When creating API services:**

- Use kebab-case: `{domain}-api.service.ts`
- Place in `services/api/`
- Export individual functions, not classes

**Example API Service Template:**

```tsx
import { ApiResponse, {Domain} } from '../../types/{domain}.types';

const BASE_URL = '/api/{domain}';

export const get{Domain}ById = async (id: string): Promise<{Domain}> => {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch {domain}: ${response.statusText}`);
  }
  return response.json();
};

export const create{Domain} = async (data: Create{Domain}Request): Promise<{Domain}> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create {domain}: ${response.statusText}`);
  }
  return response.json();
};
```

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
- Implement `React.memo` for presentation components when beneficial

## Workspace-Specific Patterns

### Nx Workspace Considerations

- Respect project boundaries and dependencies
- Use proper import paths for libraries
- Follow Nx conventions for project structure

### Existing Patterns

- Look at existing components in the `chore-board-ui` app for reference
- Follow the established Smart/Presentation pattern already implemented
- **Use Tailwind CSS for all styling** - this is the workspace standard
- Follow the grid-areas pattern for complex layouts (see `chore-board-ui/app.tsx`)
- Use established color patterns (`bg-cyan-400`, `bg-purple-400`, `bg-green-400` for assignees)

### Technology Stack

- React with TypeScript
- **Tailwind CSS for styling (STRONGLY RECOMMENDED - use for all new components)**
- React Testing Library for testing
- Vite for bundling (where applicable)
- NestJS for API applications

### Styling Guidelines

**Always use Tailwind CSS for new components:**

- Use utility classes directly in components: `className="flex items-center justify-between p-4 bg-white rounded-lg"`
- Leverage responsive utilities: `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"`
- Use the workspace's custom theme extensions when applicable (grid-areas, checkered backgrounds)
- Follow the existing patterns from `chore-board-ui` for consistency

**Common Tailwind patterns in this workspace:**
```tsx
// Grid layout with custom areas
<div className="grid-areas-scramble grid-cols-scramble grid-rows-scramble grid h-screen">
  <nav className="grid-in-nav bg-slate-900 text-white">...</nav>
  <main className="grid-in-main bg-slate-200">...</main>
</div>

// Assignee circles pattern
<div className="bg-cyan-400 border-cyan-400 rounded-full">...</div>

// Interactive elements
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
  Action
</button>
```

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
