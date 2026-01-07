# Soccer Stats App - Refactored Architecture

This document describes the refactored architecture of the Soccer Stats app, which now follows a clean separation between presentation and smart components.

## Architecture Overview

The app has been refactored to use a **Smart/Presentation Component Pattern** (also known as Container/Presentational Components) to separate concerns and prepare for future integration with actual data services.

### Component Architecture

```
apps/soccer-stats/src/app/components/
├── smart/                              # Smart components (data & logic)
│   ├── GameManager.tsx                # Central game state management
│   ├── SoccerStatsTrackerSmart.tsx    # Main orchestrator component
│   ├── GameHeaderSmart.tsx            # Game header logic
│   ├── LineupTabSmart.tsx             # Lineup management logic
│   └── SubstitutionsTabSmart.tsx      # Substitution logic
├── presentation/                       # Presentation components (UI only)
│   ├── GameHeaderPresentation.tsx     # Game header UI
│   ├── LineupTabPresentation.tsx      # Lineup UI
│   ├── SubstitutionsTabPresentation.tsx # Substitution UI
│   ├── TabNavigationPresentation.tsx  # Tab navigation UI
│   └── PlayerCardPresentation.tsx     # Player card UI (existing)
├── ConfigTab.tsx                       # Configuration component (unchanged)
├── StatsTab.tsx                        # Statistics component (unchanged)
├── GoalModal.tsx                       # Goal modal component (unchanged)
├── PlayerCard.tsx                      # Smart player card component
└── ...                                # Backward compatibility wrappers
```

## Smart Components

Smart components handle:

- **Data fetching** (currently using test data, future: API calls)
- **State management**
- **Business logic**
- **Data transformations**
- **Event handling**

### Key Smart Components

#### 1. `GameManager.tsx` (Hook)

- Central state management for the entire game
- Provides `useGameManager()` hook with:
  - `gameData`: Current game state
  - `gameActions`: Actions to modify state
  - `derivedData`: Computed values

#### 2. `SoccerStatsTrackerSmart.tsx`

- Main orchestrator component
- Uses `useGameManager()` to get state and actions
- Coordinates all other smart components
- Replaces the original `SoccerStatsTracker`

#### 3. Component-specific Smart Components

- `GameHeaderSmart`: Calculates scores from teams
- `LineupTabSmart`: Filters players by field status
- `SubstitutionsTabSmart`: Generates substitution recommendations

## Presentation Components

Presentation components:

- **Receive data via props**
- **Render UI only**
- **Handle user interactions via callback props**
- **No direct data fetching or state management**

### Benefits of This Architecture

1. **Separation of Concerns**: UI logic is separate from business logic
2. **Reusability**: Presentation components can be used in different contexts
3. **Testability**: Components can be tested independently
4. **Future-Ready**: Easy to replace test data with actual API calls

## Test Data Integration

Currently, all smart components use test data from `data/test-data.ts`:

- Multiple team configurations (5v5, 7v7, 9v9, 11v11)
- Realistic player data with different positions
- Pre-configured game scenarios

### Future Migration Path

When implementing real data services:

1. **Update Smart Components**: Replace test data with API calls
2. **Keep Presentation Components**: No changes needed
3. **Service Integration**: Smart components will use services instead of test data

Example migration:

```typescript
// Current (test data)
const team = testHomeTeam;

// Future (API service)
const team = await teamService.getTeam(teamId);
```

## Data Flow

```
User Interaction
    ↓
Presentation Component (callback prop)
    ↓
Smart Component (handles logic)
    ↓
GameManager Hook (updates state)
    ↓
Re-render with new data
```

## Key Files

- `app.tsx`: Uses `SoccerStatsTrackerSmart` as main component
- `GameManager.tsx`: Central state management hook
- `data/test-data.ts`: Test data (to be replaced with services)
- `services/`: Existing services for calculations (kept unchanged)

## Backward Compatibility

Legacy component files have been updated to re-export the new smart components, ensuring existing imports continue to work during the transition period.

## Next Steps

1. **Add Error Handling**: Implement proper error boundaries
2. **Add Loading States**: Add loading indicators for future async operations
3. **Service Integration**: Replace test data with actual backend services
4. **Component Testing**: Add tests for both smart and presentation components
5. **Documentation**: Add JSDoc comments to all components

## Development Workflow

1. **Presentation Components**: Design and implement UI-only components
2. **Smart Components**: Add business logic and data management
3. **Integration**: Connect smart components to presentation components
4. **Testing**: Test components independently and together
5. **Service Migration**: Replace test data with real services when ready

This architecture makes the codebase more maintainable, testable, and ready for future enhancements while preserving all existing functionality.
