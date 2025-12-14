---
applyTo: '**'
---

# React Component Patterns & Development Guide

Complete guide for building React components following this workspace's standards and mobile-first approach.

## Mobile-First Development Approach

**ALL UI components must be designed and developed with a mobile-first approach.** Our primary users access applications on mobile devices, making mobile optimization critical for user experience and adoption.

### Mobile-First Design Principles

**Start with Mobile Design:**

- Design and implement components for mobile screens first (320px and up)
- Ensure all functionality is accessible and usable on touch devices
- Test on actual mobile devices, not just browser dev tools
- Prioritize essential content and features for small screens

**Progressive Enhancement:**

- Add features and layout complexity for larger screens using responsive breakpoints
- Use Tailwind's responsive utilities: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Never assume desktop features are available (hover states, precise cursor positioning)

**Touch-First Interactions:**

- Design for finger-sized touch targets (minimum 44px × 44px)
- Provide adequate spacing between interactive elements
- Consider thumb-friendly navigation patterns
- Implement swipe gestures where appropriate

### Mobile-First Component Development

**Component Structure for Mobile:**

```tsx
export const MobileFirstComponent = ({ data }: ComponentProps) => {
  return (
    <div
      className="
      /* Mobile styles first (default) */
      /* Progressive enhancement
      
      for larger screens */ space-y-3 p-4 text-base
      sm:space-y-4 sm:p-6 sm:text-lg
      md:space-y-6 md:p-8 md:text-xl
      lg:flex lg:space-x-8 lg:space-y-0
    "
    >
      <div
        className="
        /* Mobile: full width, stacked */
        /*
        
        Tablet and up: constrained width, side-by-side */ w-full
        md:w-1/2 lg:w-1/3
      "
      >
        {/* Content optimized for mobile first */}
      </div>
    </div>
  );
};
```

**Responsive Design Patterns:**

```tsx
// Mobile-first grid layout
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
">

// Mobile-first typography
<h1 className="
  text-xl font-bold leading-tight
  sm:text-2xl
  md:text-3xl md:leading-normal
  lg:text-4xl
">

// Mobile-first navigation
<nav className="
  fixed bottom-0 left-0 right-0 bg-white border-t
  sm:relative sm:border-t-0 sm:border-b
  lg:flex lg:items-center lg:justify-between
">
```

**Touch Target Guidelines:**

- Minimum touch target size: `min-h-[44px] min-w-[44px]`
- Adequate spacing: `space-y-3` or `gap-3` minimum between touch targets
- Button sizing: `py-3 px-4` minimum for mobile buttons

**Performance Considerations:**

- Optimize images for mobile bandwidth: use responsive images with `srcset`
- Minimize initial bundle size for mobile networks
- Implement lazy loading for content below the fold
- Use efficient animations that perform well on mobile devices

## Smart/Presentation Component Pattern

### Three-Layer Fragment Architecture (GraphQL Applications)

**For GraphQL-powered applications, use the advanced three-layer fragment architecture following The Guild's GraphQL Code Generator approach:**

#### Layer 1: Presentation Components (Pure UI)

- **Purpose**: Pure UI components with zero business logic
- **GraphQL Role**: No GraphQL dependencies - receives individual typed props
- **Mobile-First**: All components start with mobile design (320px+) with progressive enhancement
- **Naming**: End with `.presentation.tsx` suffix

#### Layer 2: Smart Components (Fragment Wrappers)

- **Purpose**: GraphQL fragment containers using The Guild's `FragmentType` pattern
- **GraphQL Role**: Defines fragments, maps fragment data to presentation props
- **Fragment Masking**: Uses `useFragment` from generated fragment-masking module
- **Naming**: End with `.smart.tsx` suffix

#### Layer 3: Composition Components (Query Orchestration)

- **Purpose**: Query orchestration with collocated fragment spreading
- **GraphQL Role**: Defines queries, handles loading/error states, spreads fragments
- **Layout Management**: Responsive grid layouts, list management, empty states
- **Naming**: End with `.composition.tsx` suffix

**Three-Layer Fragment Architecture Example:**

```tsx
// Layer 1: Pure Presentation Component
interface UserCardPresentationProps {
  id: string;
  firstName: string;
  lastName: string;
  // Individual props, not objects
}

export const UserCardPresentation = ({ id, firstName, lastName }: UserCardPresentationProps) => {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {' '}
      {/* Mobile-first styling */}
      <h3>
        {firstName} {lastName}
      </h3>
    </div>
  );
};

// Layer 2: Fragment Wrapper (Smart Component)
import { FragmentType, useFragment } from '../../generated/gql/fragment-masking';
import { graphql } from '../../generated/gql';

export const UserCardFragment = graphql(/* GraphQL */ `
  fragment UserCard on User {
    id
    firstName
    lastName
    email
    isActive
  }
`);

interface UserCardSmartProps {
  user: FragmentType<typeof UserCardFragment>; // Type-safe fragment
  onEdit: (userId: string) => void;
}

export const UserCardSmart = ({ user: userFragment, onEdit }: UserCardSmartProps) => {
  const user = useFragment(UserCardFragment, userFragment); // Fragment masking

  return <UserCardPresentation id={user.id} firstName={user.firstName} lastName={user.lastName} />;
};

// Layer 3: Query Orchestration (Composition Component)
import { useQuery } from '@apollo/client';
import { UserCardSmart, UserCardFragment } from '../smart/user-card.smart';

const GetUsersQuery = graphql(/* GraphQL */ `
  query GetUsers {
    users {
      id
      ...UserCard # Collocated fragment spreading
    }
  }
`);

export const UsersListComposition = () => {
  const { data, loading, error } = useQuery(GetUsersQuery);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data?.users?.map((user) => (
        <UserCardSmart key={user.id} user={user} onEdit={handleEdit} />
      ))}
    </div>
  );
};
```

### Standard Smart/Presentation Pattern (Non-GraphQL Applications)

For applications not using GraphQL, use the standard two-layer pattern:

### Smart Components (Container Components)

Smart components handle data, state, and business logic.

**Responsibilities:**

- Data fetching and API calls
- State management (useState, useReducer, custom hooks)
- Business logic and data transformations
- Event handling and side effects
- Integration with external services

**Naming Convention:**

- End with `.smart.tsx` suffix (e.g., `game-header.smart.tsx`)
- Use kebab-case for component names
- Place in `components/smart/` directory

### Presentation Components (Pure Components)

Presentation components are pure UI components that only handle display logic.

**Responsibilities:**

- UI rendering and styling
- User interaction (onClick, onChange, etc.)
- Basic UI state (hover, focus states)
- Accessibility features
- Animation and transitions

**Naming Convention:**

- End with `.presentation.tsx` suffix (e.g., `game-header.presentation.tsx`)
- Use kebab-case for component names
- Place in `components/presentation/` directory

## Code Generation Templates

### Smart Component Template

```tsx
import { useState, useCallback } from 'react';
import { {FeatureName}Presentation } from '../presentation/{feature-name}.presentation';
import { use{FeatureName}Manager } from '../../hooks/use-{feature-name}-manager';

interface {FeatureName}SmartProps {
  // Define props here
}

export const {FeatureName}Smart = (props: {FeatureName}SmartProps) => {
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

### Presentation Component Template

```tsx
interface {FeatureName}PresentationProps {
  // Define UI-focused props here
  onAction: () => void;
}

export const {FeatureName}Presentation = ({
  onAction,
  // other props
}: {FeatureName}PresentationProps) => {
  return (
    <div className="
      /* Mobile-first styling */
      p-4 space-y-3

      /* Progressive enhancement for larger screens */
      sm:p-6 sm:space-y-4
      md:p-8 md:space-y-6
      lg:flex lg:space-y-0 lg:space-x-8
    ">
      {/* UI content here */}
      <button
        onClick={onAction}
        className="
          /* Mobile-first touch target */
          min-h-[44px] min-w-[44px] py-3 px-4
          bg-blue-600 text-white rounded-md

          /* Progressive enhancement */
          sm:py-2 sm:px-3
          lg:hover:bg-blue-700

          /* Touch-friendly feedback */
          active:scale-95 transition-transform
        "
      >
        Action
      </button>
    </div>
  );
};
```

## Custom Hooks for Business Logic

Extract complex business logic into custom hooks that can be shared between smart components.

**Naming Convention:**

- Start with `use-` prefix (e.g., `use-game-manager.ts`)
- Use kebab-case for hook names
- Place in `hooks/` directory

**Custom Hook Template:**

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

## API Service Patterns

**Naming Convention:**

- Use kebab-case: `{domain}-api.service.ts`
- Place in `services/api/`
- Export individual functions, not classes

**API Service Template:**

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

## Modern React Standards

### Component Structure

- **Function Components**: Use arrow function syntax without `React.FC`
- **Props Typing**: Define interfaces separately and use inline type annotations
- **Imports**: Only import specific hooks/functions needed from React
- **No Default React Import**: Modern JSX transform doesn't require importing React

**Standard Component Pattern:**

```tsx
import { useState, useCallback } from 'react';

interface ComponentProps {
  title: string;
  onAction: () => void;
}

export const Component = ({ title, onAction }: ComponentProps) => {
  const [state, setState] = useState(false);

  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};
```

## Component Composition Guidelines

### Props Interface Design

- Use descriptive prop names
- Group related props into objects when appropriate
- Use optional props with sensible defaults
- Document complex props with JSDoc

### Event Handling

- Use callback props for user interactions
- Name event handlers with `on` prefix (onSave, onClick, onChange)
- Pass only necessary data in event callbacks
- Use proper TypeScript types for event handlers

### Performance Optimization

- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Use `memo` from React for presentation components when beneficial
- Implement proper loading states

## Testing Strategy

- **Smart Components**: Test by mocking dependencies and external services
- **Presentation Components**: Test with different prop combinations using React Testing Library
- **Custom Hooks**: Test business logic separately from UI
- **User-Centric Testing**: Focus on user interactions rather than implementation details

## Workspace-Specific Patterns

### Technology Stack

- React with TypeScript
- Tailwind CSS for styling (mobile-first approach)
- React Testing Library for testing
- Vite for bundling (where applicable)
- NestJS for API applications

### Nx Workspace Considerations

- Respect project boundaries and dependencies
- Use proper import paths for libraries
- Follow Nx conventions for project structure

## Migration Strategy

When working with existing components:

1. **Identify mixed components** (components with both logic and UI)
2. **Extract business logic** into custom hooks or smart components
3. **Create pure presentation components** for UI
4. **Maintain backward compatibility** during migration
5. **Update tests** to match new component structure
6. **Follow established refactoring patterns** from the soccer-stats app

## Code Generation Guidelines

When generating code:

1. **Determine component type first:**

   - Data/business logic needs → Smart component
   - Pure UI display → Presentation component
   - When unsure → Create both Smart and Presentation components

2. **Follow naming conventions** (see file-naming-conventions.instructions.md)
3. **Use mobile-first Tailwind classes**
4. **Include proper TypeScript types**
5. **Add error handling for async operations**
6. **Generate corresponding test files**
