---
applyTo: '**'
---

# React Component Patterns

Follow these patterns when building React components in any UI application.

## Smart/Presentation Component Pattern

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

**Example Structure:**

```tsx
// game-header.smart.tsx
export const GameHeaderSmart: React.FC<GameHeaderSmartProps> = ({ gameId }) => {
  const { gameData, updateGame } = useGameManager(gameId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = useCallback(
    (updates: GameUpdate) => {
      updateGame(updates);
      setIsEditing(false);
    },
    [updateGame]
  );

  return <GameHeaderPresentation game={gameData} isEditing={isEditing} onEdit={() => setIsEditing(true)} onSave={handleSave} onCancel={() => setIsEditing(false)} />;
};
```

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

**Example Structure:**

```tsx
// game-header.presentation.tsx
interface GameHeaderPresentationProps {
  game: Game;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: GameUpdate) => void;
  onCancel: () => void;
}

export const GameHeaderPresentation: React.FC<GameHeaderPresentationProps> = ({ game, isEditing, onEdit, onSave, onCancel }) => {
  // Only UI logic here
  const [localFormData, setLocalFormData] = useState(game);

  return <div className="game-header">{isEditing ? <EditForm data={localFormData} onChange={setLocalFormData} onSave={() => onSave(localFormData)} onCancel={onCancel} /> : <DisplayView game={game} onEdit={onEdit} />}</div>;
};
```

## Custom Hooks for Business Logic

Extract complex business logic into custom hooks that can be shared between smart components.

**Naming Convention:**

- Start with `use-` prefix (e.g., `use-game-manager.ts`)
- Use kebab-case for hook names
- Place in `hooks/` directory

**Example:**

```tsx
// hooks/use-game-manager.ts
export const useGameManager = (gameId: string) => {
  const [gameData, setGameData] = useState<Game | null>(null);

  const updateGame = useCallback((updates: GameUpdate) => {
    // Business logic here
    setGameData((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    gameData,
    gameActions: { updateGame },
    derivedData: {
      isGameActive: gameData?.status === 'active',
      totalPlayers: gameData?.players.length ?? 0,
    },
  };
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

### Testing Strategy

- Test smart components by mocking dependencies
- Test presentation components with different prop combinations
- Use React Testing Library for user-centric testing
- Mock external services and APIs in smart component tests

## Migration Strategy

When working with existing components:

1. Identify mixed components (components with both logic and UI)
2. Extract business logic into custom hooks or smart components
3. Create pure presentation components for UI
4. Maintain backward compatibility during migration
5. Update tests to match new component structure
