/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  query GetUsersForList {\n    users {\n      ...UserCard\n    }\n  }\n': typeof types.GetUsersForListDocument;
  '\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n': typeof types.PlayerCardDataFragmentDoc;
  '\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.DebugGetTeamsDocument;
  '\n  query GetMyTeamsForList {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetMyTeamsForListDocument;
  '\n  fragment UserCard on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      team {\n        id\n        name\n        shortName\n      }\n    }\n  }\n': typeof types.UserCardFragmentDoc;
  '\n  mutation QuickCreateTeam($input: CreateTeamInput!) {\n    createTeam(createTeamInput: $input) {\n      id\n      name\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n    }\n  }\n': typeof types.QuickCreateTeamDocument;
  '\n  fragment GameEventFragment on GameEvent {\n    id\n    gameMinute\n    gameSecond\n    position\n    playerId\n    externalPlayerName\n    externalPlayerNumber\n    eventType {\n      id\n      name\n      category\n    }\n  }\n': typeof types.GameEventFragmentFragmentDoc;
  '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGameFormatsDocument;
  '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGamesDocument;
  '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n          isManaged\n          teamPlayers {\n            id\n            userId\n            jerseyNumber\n            primaryPosition\n            isActive\n            user {\n              id\n              email\n              firstName\n              lastName\n            }\n          }\n        }\n        gameEvents {\n          id\n          gameMinute\n          gameSecond\n          position\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGameByIdDocument;
  '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateGameDocument;
  '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.UpdateGameDocument;
  '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n': typeof types.RemoveGameDocument;
  '\n  query GetGameLineup($gameTeamId: ID!) {\n    gameLineup(gameTeamId: $gameTeamId) {\n      gameTeamId\n      formation\n      starters {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      bench {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      currentOnField {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n    }\n  }\n': typeof types.GetGameLineupDocument;
  '\n  query GetEventTypes {\n    eventTypes {\n      id\n      name\n      category\n      description\n      requiresPosition\n      allowsParent\n    }\n  }\n': typeof types.GetEventTypesDocument;
  '\n  mutation AddPlayerToLineup($input: AddToLineupInput!) {\n    addPlayerToLineup(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n': typeof types.AddPlayerToLineupDocument;
  '\n  mutation AddPlayerToBench($input: AddToBenchInput!) {\n    addPlayerToBench(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n': typeof types.AddPlayerToBenchDocument;
  '\n  mutation RemoveFromLineup($gameEventId: ID!) {\n    removeFromLineup(gameEventId: $gameEventId)\n  }\n': typeof types.RemoveFromLineupDocument;
  '\n  mutation UpdatePlayerPosition($gameEventId: ID!, $position: String!) {\n    updatePlayerPosition(gameEventId: $gameEventId, position: $position) {\n      id\n      position\n    }\n  }\n': typeof types.UpdatePlayerPositionDocument;
  '\n  mutation SubstitutePlayer($input: SubstitutePlayerInput!) {\n    substitutePlayer(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n': typeof types.SubstitutePlayerDocument;
  '\n  mutation RecordGoal($input: RecordGoalInput!) {\n    recordGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n': typeof types.RecordGoalDocument;
  '\n  mutation DeleteGoal($gameEventId: ID!) {\n    deleteGoal(gameEventId: $gameEventId)\n  }\n': typeof types.DeleteGoalDocument;
  '\n  mutation DeleteSubstitution($gameEventId: ID!) {\n    deleteSubstitution(gameEventId: $gameEventId)\n  }\n': typeof types.DeleteSubstitutionDocument;
  '\n  mutation DeletePositionSwap($gameEventId: ID!) {\n    deletePositionSwap(gameEventId: $gameEventId)\n  }\n': typeof types.DeletePositionSwapDocument;
  '\n  mutation DeleteStarterEntry($gameEventId: ID!) {\n    deleteStarterEntry(gameEventId: $gameEventId)\n  }\n': typeof types.DeleteStarterEntryDocument;
  '\n  query GetDependentEvents($gameEventId: ID!) {\n    dependentEvents(gameEventId: $gameEventId) {\n      dependentEvents {\n        id\n        eventType\n        gameMinute\n        gameSecond\n        playerName\n        description\n      }\n      count\n      canDelete\n      warningMessage\n    }\n  }\n': typeof types.GetDependentEventsDocument;
  '\n  mutation DeleteEventWithCascade($gameEventId: ID!, $eventType: String!) {\n    deleteEventWithCascade(gameEventId: $gameEventId, eventType: $eventType)\n  }\n': typeof types.DeleteEventWithCascadeDocument;
  '\n  mutation ResolveEventConflict(\n    $conflictId: ID!\n    $selectedEventId: ID!\n    $keepAll: Boolean\n  ) {\n    resolveEventConflict(\n      conflictId: $conflictId\n      selectedEventId: $selectedEventId\n      keepAll: $keepAll\n    ) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      conflictId\n      eventType {\n        id\n        name\n      }\n    }\n  }\n': typeof types.ResolveEventConflictDocument;
  '\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n': typeof types.UpdateGoalDocument;
  '\n  mutation SwapPositions($input: SwapPositionsInput!) {\n    swapPositions(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n': typeof types.SwapPositionsDocument;
  '\n  query GetPlayerPositionStats($gameTeamId: ID!) {\n    playerPositionStats(gameTeamId: $gameTeamId) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n    }\n  }\n': typeof types.GetPlayerPositionStatsDocument;
  '\n  query GetPlayerStats($input: PlayerStatsInput!) {\n    playerStats(input: $input) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n      goals\n      assists\n      gamesPlayed\n      yellowCards\n      redCards\n      saves\n      isOnField\n      lastEntryGameSeconds\n    }\n  }\n': typeof types.GetPlayerStatsDocument;
  '\n  subscription GameEventChanged($gameId: ID!) {\n    gameEventChanged(gameId: $gameId) {\n      action\n      gameId\n      event {\n        id\n        gameTeamId\n        gameMinute\n        gameSecond\n        position\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      deletedEventId\n      conflict {\n        conflictId\n        eventType\n        gameMinute\n        gameSecond\n        conflictingEvents {\n          eventId\n          playerName\n          playerId\n          recordedByUserName\n        }\n      }\n    }\n  }\n': typeof types.GameEventChangedDocument;
  '\n  subscription GameUpdated($gameId: ID!) {\n    gameUpdated(gameId: $gameId) {\n      id\n      name\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n    }\n  }\n': typeof types.GameUpdatedDocument;
  '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetTeamsDocument;
  '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n': typeof types.GetTeamByIdDocument;
  '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateTeamDocument;
  '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.UpdateTeamDocument;
  '\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateUnmanagedTeamDocument;
  '\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.FindOrCreateUnmanagedTeamDocument;
  '\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetManagedTeamsDocument;
  '\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetUnmanagedTeamsDocument;
  '\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetTeamsByManagedStatusDocument;
  '\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetMyTeamsDocument;
  '\n  query GetAllUsers {\n    users {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n': typeof types.GetAllUsersDocument;
  '\n  query GetUsersByTeam($teamId: ID!) {\n    usersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      email\n      phone\n      isActive\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n': typeof types.GetUsersByTeamDocument;
  '\n  query SearchUsersByName($name: String!) {\n    usersByName(name: $name) {\n      id\n      firstName\n      lastName\n      email\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n      }\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n': typeof types.SearchUsersByNameDocument;
  '\n  query GetUsersComplete {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n': typeof types.GetUsersCompleteDocument;
  '\n  query GetPlayersByTeam($teamId: ID!) {\n    playersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n    }\n  }\n': typeof types.GetPlayersByTeamDocument;
  '\n  query GetPlayersByPosition($position: String!) {\n    playersByPosition(position: $position) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        team {\n          name\n        }\n      }\n    }\n  }\n': typeof types.GetPlayersByPositionDocument;
  '\n  query SearchPlayersByName($name: String!) {\n    playersByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n        jerseyNumber\n      }\n    }\n  }\n': typeof types.SearchPlayersByNameDocument;
  '\n  query GetCoaches {\n    coaches {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n': typeof types.GetCoachesDocument;
  '\n  query GetCoachesByTeam($teamId: ID!) {\n    coachesByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n': typeof types.GetCoachesByTeamDocument;
  '\n  query GetCoachesByRole($role: String!) {\n    coachesByRole(role: $role) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        startDate\n        team {\n          name\n        }\n      }\n    }\n  }\n': typeof types.GetCoachesByRoleDocument;
  '\n  query SearchCoachesByName($name: String!) {\n    coachesByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n': typeof types.SearchCoachesByNameDocument;
  '\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n': typeof types.GetUserByIdDocument;
  '\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateUserDocument;
  '\n  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {\n    updateUser(id: $id, updateUserInput: $updateUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n': typeof types.UpdateUserDocument;
  '\n  mutation RemoveUser($id: ID!) {\n    removeUser(id: $id)\n  }\n': typeof types.RemoveUserDocument;
  '\n  mutation AddPlayerToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $jerseyNumber: String\n    $primaryPosition: String\n    $joinedDate: DateTime\n  ) {\n    addPlayerToTeam(\n      userId: $userId\n      teamId: $teamId\n      jerseyNumber: $jerseyNumber\n      primaryPosition: $primaryPosition\n      joinedDate: $joinedDate\n    ) {\n      id\n      jerseyNumber\n      primaryPosition\n      joinedDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n': typeof types.AddPlayerToTeamDocument;
  '\n  mutation RemoveUserFromTeam($userId: ID!, $teamId: ID!, $leftDate: DateTime) {\n    removePlayerFromTeam(userId: $userId, teamId: $teamId, leftDate: $leftDate)\n  }\n': typeof types.RemoveUserFromTeamDocument;
  '\n  mutation AddCoachToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $role: String!\n    $startDate: DateTime!\n  ) {\n    addCoachToTeam(\n      userId: $userId\n      teamId: $teamId\n      role: $role\n      startDate: $startDate\n    ) {\n      id\n      role\n      startDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n': typeof types.AddCoachToTeamDocument;
  '\n  mutation RemoveCoachFromTeam($userId: ID!, $teamId: ID!, $endDate: DateTime) {\n    removeCoachFromTeam(userId: $userId, teamId: $teamId, endDate: $endDate)\n  }\n': typeof types.RemoveCoachFromTeamDocument;
  '\n  mutation CreateUserAccount($createPlayerInput: CreateUserInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateUserAccountDocument;
  '\n  mutation CreateCoach($createCoachInput: CreateUserInput!) {\n    createCoach(createCoachInput: $createCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateCoachDocument;
  '\n  mutation UpdateUserAccount($id: ID!, $updatePlayerInput: UpdateUserInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n': typeof types.UpdateUserAccountDocument;
  '\n  mutation UpdateCoach($id: ID!, $updateCoachInput: UpdateUserInput!) {\n    updateCoach(id: $id, updateCoachInput: $updateCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n': typeof types.UpdateCoachDocument;
  '\n  subscription UserUpdated {\n    userUpdated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      updatedAt\n    }\n  }\n': typeof types.UserUpdatedDocument;
  '\n  subscription UserCreated {\n    userCreated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      createdAt\n    }\n  }\n': typeof types.UserCreatedDocument;
};
const documents: Documents = {
  '\n  query GetUsersForList {\n    users {\n      ...UserCard\n    }\n  }\n':
    types.GetUsersForListDocument,
  '\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n':
    types.PlayerCardDataFragmentDoc,
  '\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.DebugGetTeamsDocument,
  '\n  query GetMyTeamsForList {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetMyTeamsForListDocument,
  '\n  fragment UserCard on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      team {\n        id\n        name\n        shortName\n      }\n    }\n  }\n':
    types.UserCardFragmentDoc,
  '\n  mutation QuickCreateTeam($input: CreateTeamInput!) {\n    createTeam(createTeamInput: $input) {\n      id\n      name\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n    }\n  }\n':
    types.QuickCreateTeamDocument,
  '\n  fragment GameEventFragment on GameEvent {\n    id\n    gameMinute\n    gameSecond\n    position\n    playerId\n    externalPlayerName\n    externalPlayerNumber\n    eventType {\n      id\n      name\n      category\n    }\n  }\n':
    types.GameEventFragmentFragmentDoc,
  '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGameFormatsDocument,
  '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGamesDocument,
  '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n          isManaged\n          teamPlayers {\n            id\n            userId\n            jerseyNumber\n            primaryPosition\n            isActive\n            user {\n              id\n              email\n              firstName\n              lastName\n            }\n          }\n        }\n        gameEvents {\n          id\n          gameMinute\n          gameSecond\n          position\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGameByIdDocument,
  '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateGameDocument,
  '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.UpdateGameDocument,
  '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n':
    types.RemoveGameDocument,
  '\n  query GetGameLineup($gameTeamId: ID!) {\n    gameLineup(gameTeamId: $gameTeamId) {\n      gameTeamId\n      formation\n      starters {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      bench {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      currentOnField {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n    }\n  }\n':
    types.GetGameLineupDocument,
  '\n  query GetEventTypes {\n    eventTypes {\n      id\n      name\n      category\n      description\n      requiresPosition\n      allowsParent\n    }\n  }\n':
    types.GetEventTypesDocument,
  '\n  mutation AddPlayerToLineup($input: AddToLineupInput!) {\n    addPlayerToLineup(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n':
    types.AddPlayerToLineupDocument,
  '\n  mutation AddPlayerToBench($input: AddToBenchInput!) {\n    addPlayerToBench(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n':
    types.AddPlayerToBenchDocument,
  '\n  mutation RemoveFromLineup($gameEventId: ID!) {\n    removeFromLineup(gameEventId: $gameEventId)\n  }\n':
    types.RemoveFromLineupDocument,
  '\n  mutation UpdatePlayerPosition($gameEventId: ID!, $position: String!) {\n    updatePlayerPosition(gameEventId: $gameEventId, position: $position) {\n      id\n      position\n    }\n  }\n':
    types.UpdatePlayerPositionDocument,
  '\n  mutation SubstitutePlayer($input: SubstitutePlayerInput!) {\n    substitutePlayer(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n':
    types.SubstitutePlayerDocument,
  '\n  mutation RecordGoal($input: RecordGoalInput!) {\n    recordGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n':
    types.RecordGoalDocument,
  '\n  mutation DeleteGoal($gameEventId: ID!) {\n    deleteGoal(gameEventId: $gameEventId)\n  }\n':
    types.DeleteGoalDocument,
  '\n  mutation DeleteSubstitution($gameEventId: ID!) {\n    deleteSubstitution(gameEventId: $gameEventId)\n  }\n':
    types.DeleteSubstitutionDocument,
  '\n  mutation DeletePositionSwap($gameEventId: ID!) {\n    deletePositionSwap(gameEventId: $gameEventId)\n  }\n':
    types.DeletePositionSwapDocument,
  '\n  mutation DeleteStarterEntry($gameEventId: ID!) {\n    deleteStarterEntry(gameEventId: $gameEventId)\n  }\n':
    types.DeleteStarterEntryDocument,
  '\n  query GetDependentEvents($gameEventId: ID!) {\n    dependentEvents(gameEventId: $gameEventId) {\n      dependentEvents {\n        id\n        eventType\n        gameMinute\n        gameSecond\n        playerName\n        description\n      }\n      count\n      canDelete\n      warningMessage\n    }\n  }\n':
    types.GetDependentEventsDocument,
  '\n  mutation DeleteEventWithCascade($gameEventId: ID!, $eventType: String!) {\n    deleteEventWithCascade(gameEventId: $gameEventId, eventType: $eventType)\n  }\n':
    types.DeleteEventWithCascadeDocument,
  '\n  mutation ResolveEventConflict(\n    $conflictId: ID!\n    $selectedEventId: ID!\n    $keepAll: Boolean\n  ) {\n    resolveEventConflict(\n      conflictId: $conflictId\n      selectedEventId: $selectedEventId\n      keepAll: $keepAll\n    ) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      conflictId\n      eventType {\n        id\n        name\n      }\n    }\n  }\n':
    types.ResolveEventConflictDocument,
  '\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n':
    types.UpdateGoalDocument,
  '\n  mutation SwapPositions($input: SwapPositionsInput!) {\n    swapPositions(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n':
    types.SwapPositionsDocument,
  '\n  query GetPlayerPositionStats($gameTeamId: ID!) {\n    playerPositionStats(gameTeamId: $gameTeamId) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n    }\n  }\n':
    types.GetPlayerPositionStatsDocument,
  '\n  query GetPlayerStats($input: PlayerStatsInput!) {\n    playerStats(input: $input) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n      goals\n      assists\n      gamesPlayed\n      yellowCards\n      redCards\n      saves\n      isOnField\n      lastEntryGameSeconds\n    }\n  }\n':
    types.GetPlayerStatsDocument,
  '\n  subscription GameEventChanged($gameId: ID!) {\n    gameEventChanged(gameId: $gameId) {\n      action\n      gameId\n      event {\n        id\n        gameTeamId\n        gameMinute\n        gameSecond\n        position\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      deletedEventId\n      conflict {\n        conflictId\n        eventType\n        gameMinute\n        gameSecond\n        conflictingEvents {\n          eventId\n          playerName\n          playerId\n          recordedByUserName\n        }\n      }\n    }\n  }\n':
    types.GameEventChangedDocument,
  '\n  subscription GameUpdated($gameId: ID!) {\n    gameUpdated(gameId: $gameId) {\n      id\n      name\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n    }\n  }\n':
    types.GameUpdatedDocument,
  '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetTeamsDocument,
  '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n':
    types.GetTeamByIdDocument,
  '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateTeamDocument,
  '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.UpdateTeamDocument,
  '\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateUnmanagedTeamDocument,
  '\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.FindOrCreateUnmanagedTeamDocument,
  '\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetManagedTeamsDocument,
  '\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetUnmanagedTeamsDocument,
  '\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetTeamsByManagedStatusDocument,
  '\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetMyTeamsDocument,
  '\n  query GetAllUsers {\n    users {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n':
    types.GetAllUsersDocument,
  '\n  query GetUsersByTeam($teamId: ID!) {\n    usersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      email\n      phone\n      isActive\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n':
    types.GetUsersByTeamDocument,
  '\n  query SearchUsersByName($name: String!) {\n    usersByName(name: $name) {\n      id\n      firstName\n      lastName\n      email\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n      }\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n':
    types.SearchUsersByNameDocument,
  '\n  query GetUsersComplete {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n':
    types.GetUsersCompleteDocument,
  '\n  query GetPlayersByTeam($teamId: ID!) {\n    playersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n    }\n  }\n':
    types.GetPlayersByTeamDocument,
  '\n  query GetPlayersByPosition($position: String!) {\n    playersByPosition(position: $position) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        team {\n          name\n        }\n      }\n    }\n  }\n':
    types.GetPlayersByPositionDocument,
  '\n  query SearchPlayersByName($name: String!) {\n    playersByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n        jerseyNumber\n      }\n    }\n  }\n':
    types.SearchPlayersByNameDocument,
  '\n  query GetCoaches {\n    coaches {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n':
    types.GetCoachesDocument,
  '\n  query GetCoachesByTeam($teamId: ID!) {\n    coachesByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n':
    types.GetCoachesByTeamDocument,
  '\n  query GetCoachesByRole($role: String!) {\n    coachesByRole(role: $role) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        startDate\n        team {\n          name\n        }\n      }\n    }\n  }\n':
    types.GetCoachesByRoleDocument,
  '\n  query SearchCoachesByName($name: String!) {\n    coachesByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n':
    types.SearchCoachesByNameDocument,
  '\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n':
    types.GetUserByIdDocument,
  '\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateUserDocument,
  '\n  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {\n    updateUser(id: $id, updateUserInput: $updateUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n':
    types.UpdateUserDocument,
  '\n  mutation RemoveUser($id: ID!) {\n    removeUser(id: $id)\n  }\n':
    types.RemoveUserDocument,
  '\n  mutation AddPlayerToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $jerseyNumber: String\n    $primaryPosition: String\n    $joinedDate: DateTime\n  ) {\n    addPlayerToTeam(\n      userId: $userId\n      teamId: $teamId\n      jerseyNumber: $jerseyNumber\n      primaryPosition: $primaryPosition\n      joinedDate: $joinedDate\n    ) {\n      id\n      jerseyNumber\n      primaryPosition\n      joinedDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n':
    types.AddPlayerToTeamDocument,
  '\n  mutation RemoveUserFromTeam($userId: ID!, $teamId: ID!, $leftDate: DateTime) {\n    removePlayerFromTeam(userId: $userId, teamId: $teamId, leftDate: $leftDate)\n  }\n':
    types.RemoveUserFromTeamDocument,
  '\n  mutation AddCoachToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $role: String!\n    $startDate: DateTime!\n  ) {\n    addCoachToTeam(\n      userId: $userId\n      teamId: $teamId\n      role: $role\n      startDate: $startDate\n    ) {\n      id\n      role\n      startDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n':
    types.AddCoachToTeamDocument,
  '\n  mutation RemoveCoachFromTeam($userId: ID!, $teamId: ID!, $endDate: DateTime) {\n    removeCoachFromTeam(userId: $userId, teamId: $teamId, endDate: $endDate)\n  }\n':
    types.RemoveCoachFromTeamDocument,
  '\n  mutation CreateUserAccount($createPlayerInput: CreateUserInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateUserAccountDocument,
  '\n  mutation CreateCoach($createCoachInput: CreateUserInput!) {\n    createCoach(createCoachInput: $createCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateCoachDocument,
  '\n  mutation UpdateUserAccount($id: ID!, $updatePlayerInput: UpdateUserInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n':
    types.UpdateUserAccountDocument,
  '\n  mutation UpdateCoach($id: ID!, $updateCoachInput: UpdateUserInput!) {\n    updateCoach(id: $id, updateCoachInput: $updateCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n':
    types.UpdateCoachDocument,
  '\n  subscription UserUpdated {\n    userUpdated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      updatedAt\n    }\n  }\n':
    types.UserUpdatedDocument,
  '\n  subscription UserCreated {\n    userCreated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      createdAt\n    }\n  }\n':
    types.UserCreatedDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetUsersForList {\n    users {\n      ...UserCard\n    }\n  }\n'
): (typeof documents)['\n  query GetUsersForList {\n    users {\n      ...UserCard\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n'
): (typeof documents)['\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetMyTeamsForList {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetMyTeamsForList {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  fragment UserCard on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      team {\n        id\n        name\n        shortName\n      }\n    }\n  }\n'
): (typeof documents)['\n  fragment UserCard on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      team {\n        id\n        name\n        shortName\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation QuickCreateTeam($input: CreateTeamInput!) {\n    createTeam(createTeamInput: $input) {\n      id\n      name\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n    }\n  }\n'
): (typeof documents)['\n  mutation QuickCreateTeam($input: CreateTeamInput!) {\n    createTeam(createTeamInput: $input) {\n      id\n      name\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  fragment GameEventFragment on GameEvent {\n    id\n    gameMinute\n    gameSecond\n    position\n    playerId\n    externalPlayerName\n    externalPlayerNumber\n    eventType {\n      id\n      name\n      category\n    }\n  }\n'
): (typeof documents)['\n  fragment GameEventFragment on GameEvent {\n    id\n    gameMinute\n    gameSecond\n    position\n    playerId\n    externalPlayerName\n    externalPlayerNumber\n    eventType {\n      id\n      name\n      category\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n          isManaged\n          teamPlayers {\n            id\n            userId\n            jerseyNumber\n            primaryPosition\n            isActive\n            user {\n              id\n              email\n              firstName\n              lastName\n            }\n          }\n        }\n        gameEvents {\n          id\n          gameMinute\n          gameSecond\n          position\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n          isManaged\n          teamPlayers {\n            id\n            userId\n            jerseyNumber\n            primaryPosition\n            isActive\n            user {\n              id\n              email\n              firstName\n              lastName\n            }\n          }\n        }\n        gameEvents {\n          id\n          gameMinute\n          gameSecond\n          position\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n'
): (typeof documents)['\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGameLineup($gameTeamId: ID!) {\n    gameLineup(gameTeamId: $gameTeamId) {\n      gameTeamId\n      formation\n      starters {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      bench {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      currentOnField {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetGameLineup($gameTeamId: ID!) {\n    gameLineup(gameTeamId: $gameTeamId) {\n      gameTeamId\n      formation\n      starters {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      bench {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n      currentOnField {\n        gameEventId\n        playerId\n        playerName\n        firstName\n        lastName\n        externalPlayerName\n        externalPlayerNumber\n        position\n        isOnField\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetEventTypes {\n    eventTypes {\n      id\n      name\n      category\n      description\n      requiresPosition\n      allowsParent\n    }\n  }\n'
): (typeof documents)['\n  query GetEventTypes {\n    eventTypes {\n      id\n      name\n      category\n      description\n      requiresPosition\n      allowsParent\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation AddPlayerToLineup($input: AddToLineupInput!) {\n    addPlayerToLineup(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation AddPlayerToLineup($input: AddToLineupInput!) {\n    addPlayerToLineup(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation AddPlayerToBench($input: AddToBenchInput!) {\n    addPlayerToBench(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation AddPlayerToBench($input: AddToBenchInput!) {\n    addPlayerToBench(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemoveFromLineup($gameEventId: ID!) {\n    removeFromLineup(gameEventId: $gameEventId)\n  }\n'
): (typeof documents)['\n  mutation RemoveFromLineup($gameEventId: ID!) {\n    removeFromLineup(gameEventId: $gameEventId)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdatePlayerPosition($gameEventId: ID!, $position: String!) {\n    updatePlayerPosition(gameEventId: $gameEventId, position: $position) {\n      id\n      position\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdatePlayerPosition($gameEventId: ID!, $position: String!) {\n    updatePlayerPosition(gameEventId: $gameEventId, position: $position) {\n      id\n      position\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation SubstitutePlayer($input: SubstitutePlayerInput!) {\n    substitutePlayer(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation SubstitutePlayer($input: SubstitutePlayerInput!) {\n    substitutePlayer(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RecordGoal($input: RecordGoalInput!) {\n    recordGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation RecordGoal($input: RecordGoalInput!) {\n    recordGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation DeleteGoal($gameEventId: ID!) {\n    deleteGoal(gameEventId: $gameEventId)\n  }\n'
): (typeof documents)['\n  mutation DeleteGoal($gameEventId: ID!) {\n    deleteGoal(gameEventId: $gameEventId)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation DeleteSubstitution($gameEventId: ID!) {\n    deleteSubstitution(gameEventId: $gameEventId)\n  }\n'
): (typeof documents)['\n  mutation DeleteSubstitution($gameEventId: ID!) {\n    deleteSubstitution(gameEventId: $gameEventId)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation DeletePositionSwap($gameEventId: ID!) {\n    deletePositionSwap(gameEventId: $gameEventId)\n  }\n'
): (typeof documents)['\n  mutation DeletePositionSwap($gameEventId: ID!) {\n    deletePositionSwap(gameEventId: $gameEventId)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation DeleteStarterEntry($gameEventId: ID!) {\n    deleteStarterEntry(gameEventId: $gameEventId)\n  }\n'
): (typeof documents)['\n  mutation DeleteStarterEntry($gameEventId: ID!) {\n    deleteStarterEntry(gameEventId: $gameEventId)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetDependentEvents($gameEventId: ID!) {\n    dependentEvents(gameEventId: $gameEventId) {\n      dependentEvents {\n        id\n        eventType\n        gameMinute\n        gameSecond\n        playerName\n        description\n      }\n      count\n      canDelete\n      warningMessage\n    }\n  }\n'
): (typeof documents)['\n  query GetDependentEvents($gameEventId: ID!) {\n    dependentEvents(gameEventId: $gameEventId) {\n      dependentEvents {\n        id\n        eventType\n        gameMinute\n        gameSecond\n        playerName\n        description\n      }\n      count\n      canDelete\n      warningMessage\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation DeleteEventWithCascade($gameEventId: ID!, $eventType: String!) {\n    deleteEventWithCascade(gameEventId: $gameEventId, eventType: $eventType)\n  }\n'
): (typeof documents)['\n  mutation DeleteEventWithCascade($gameEventId: ID!, $eventType: String!) {\n    deleteEventWithCascade(gameEventId: $gameEventId, eventType: $eventType)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation ResolveEventConflict(\n    $conflictId: ID!\n    $selectedEventId: ID!\n    $keepAll: Boolean\n  ) {\n    resolveEventConflict(\n      conflictId: $conflictId\n      selectedEventId: $selectedEventId\n      keepAll: $keepAll\n    ) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      conflictId\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation ResolveEventConflict(\n    $conflictId: ID!\n    $selectedEventId: ID!\n    $keepAll: Boolean\n  ) {\n    resolveEventConflict(\n      conflictId: $conflictId\n      selectedEventId: $selectedEventId\n      keepAll: $keepAll\n    ) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      conflictId\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateGoal($input: UpdateGoalInput!) {\n    updateGoal(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n      childEvents {\n        id\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation SwapPositions($input: SwapPositionsInput!) {\n    swapPositions(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation SwapPositions($input: SwapPositionsInput!) {\n    swapPositions(input: $input) {\n      id\n      gameMinute\n      gameSecond\n      position\n      playerId\n      externalPlayerName\n      externalPlayerNumber\n      eventType {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPlayerPositionStats($gameTeamId: ID!) {\n    playerPositionStats(gameTeamId: $gameTeamId) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPlayerPositionStats($gameTeamId: ID!) {\n    playerPositionStats(gameTeamId: $gameTeamId) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPlayerStats($input: PlayerStatsInput!) {\n    playerStats(input: $input) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n      goals\n      assists\n      gamesPlayed\n      yellowCards\n      redCards\n      saves\n      isOnField\n      lastEntryGameSeconds\n    }\n  }\n'
): (typeof documents)['\n  query GetPlayerStats($input: PlayerStatsInput!) {\n    playerStats(input: $input) {\n      playerId\n      playerName\n      externalPlayerName\n      externalPlayerNumber\n      totalMinutes\n      totalSeconds\n      positionTimes {\n        position\n        minutes\n        seconds\n      }\n      goals\n      assists\n      gamesPlayed\n      yellowCards\n      redCards\n      saves\n      isOnField\n      lastEntryGameSeconds\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  subscription GameEventChanged($gameId: ID!) {\n    gameEventChanged(gameId: $gameId) {\n      action\n      gameId\n      event {\n        id\n        gameTeamId\n        gameMinute\n        gameSecond\n        position\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      deletedEventId\n      conflict {\n        conflictId\n        eventType\n        gameMinute\n        gameSecond\n        conflictingEvents {\n          eventId\n          playerName\n          playerId\n          recordedByUserName\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  subscription GameEventChanged($gameId: ID!) {\n    gameEventChanged(gameId: $gameId) {\n      action\n      gameId\n      event {\n        id\n        gameTeamId\n        gameMinute\n        gameSecond\n        position\n        playerId\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n          playerId\n          externalPlayerName\n          externalPlayerNumber\n          eventType {\n            id\n            name\n            category\n          }\n        }\n      }\n      deletedEventId\n      conflict {\n        conflictId\n        eventType\n        gameMinute\n        gameSecond\n        conflictingEvents {\n          eventId\n          playerName\n          playerId\n          recordedByUserName\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  subscription GameUpdated($gameId: ID!) {\n    gameUpdated(gameId: $gameId) {\n      id\n      name\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n    }\n  }\n'
): (typeof documents)['\n  subscription GameUpdated($gameId: ID!) {\n    gameUpdated(gameId: $gameId) {\n      id\n      name\n      status\n      actualStart\n      firstHalfEnd\n      secondHalfStart\n      actualEnd\n      pausedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetMyTeams {\n    myTeams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdById\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetAllUsers {\n    users {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetAllUsers {\n    users {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetUsersByTeam($teamId: ID!) {\n    usersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      email\n      phone\n      isActive\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetUsersByTeam($teamId: ID!) {\n    usersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      email\n      phone\n      isActive\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query SearchUsersByName($name: String!) {\n    usersByName(name: $name) {\n      id\n      firstName\n      lastName\n      email\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n      }\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n'
): (typeof documents)['\n  query SearchUsersByName($name: String!) {\n    usersByName(name: $name) {\n      id\n      firstName\n      lastName\n      email\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n      }\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetUsersComplete {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetUsersComplete {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPlayersByTeam($teamId: ID!) {\n    playersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPlayersByTeam($teamId: ID!) {\n    playersByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        isActive\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPlayersByPosition($position: String!) {\n    playersByPosition(position: $position) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        team {\n          name\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetPlayersByPosition($position: String!) {\n    playersByPosition(position: $position) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        id\n        jerseyNumber\n        team {\n          name\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query SearchPlayersByName($name: String!) {\n    playersByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n        jerseyNumber\n      }\n    }\n  }\n'
): (typeof documents)['\n  query SearchPlayersByName($name: String!) {\n    playersByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamPlayers {\n        team {\n          name\n        }\n        primaryPosition\n        jerseyNumber\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetCoaches {\n    coaches {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetCoaches {\n    coaches {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetCoachesByTeam($teamId: ID!) {\n    coachesByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetCoachesByTeam($teamId: ID!) {\n    coachesByTeam(teamId: $teamId) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        role\n        startDate\n        isActive\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetCoachesByRole($role: String!) {\n    coachesByRole(role: $role) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        startDate\n        team {\n          name\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetCoachesByRole($role: String!) {\n    coachesByRole(role: $role) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        id\n        startDate\n        team {\n          name\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query SearchCoachesByName($name: String!) {\n    coachesByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n'
): (typeof documents)['\n  query SearchCoachesByName($name: String!) {\n    coachesByName(name: $name) {\n      id\n      firstName\n      lastName\n      teamCoaches {\n        team {\n          name\n        }\n        role\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetUserById($id: ID!) {\n    user(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        joinedDate\n        leftDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      teamCoaches {\n        id\n        role\n        startDate\n        endDate\n        isActive\n        team {\n          id\n          name\n          shortName\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateUser($createUserInput: CreateUserInput!) {\n    createUser(createUserInput: $createUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {\n    updateUser(id: $id, updateUserInput: $updateUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {\n    updateUser(id: $id, updateUserInput: $updateUserInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemoveUser($id: ID!) {\n    removeUser(id: $id)\n  }\n'
): (typeof documents)['\n  mutation RemoveUser($id: ID!) {\n    removeUser(id: $id)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation AddPlayerToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $jerseyNumber: String\n    $primaryPosition: String\n    $joinedDate: DateTime\n  ) {\n    addPlayerToTeam(\n      userId: $userId\n      teamId: $teamId\n      jerseyNumber: $jerseyNumber\n      primaryPosition: $primaryPosition\n      joinedDate: $joinedDate\n    ) {\n      id\n      jerseyNumber\n      primaryPosition\n      joinedDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation AddPlayerToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $jerseyNumber: String\n    $primaryPosition: String\n    $joinedDate: DateTime\n  ) {\n    addPlayerToTeam(\n      userId: $userId\n      teamId: $teamId\n      jerseyNumber: $jerseyNumber\n      primaryPosition: $primaryPosition\n      joinedDate: $joinedDate\n    ) {\n      id\n      jerseyNumber\n      primaryPosition\n      joinedDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemoveUserFromTeam($userId: ID!, $teamId: ID!, $leftDate: DateTime) {\n    removePlayerFromTeam(userId: $userId, teamId: $teamId, leftDate: $leftDate)\n  }\n'
): (typeof documents)['\n  mutation RemoveUserFromTeam($userId: ID!, $teamId: ID!, $leftDate: DateTime) {\n    removePlayerFromTeam(userId: $userId, teamId: $teamId, leftDate: $leftDate)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation AddCoachToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $role: String!\n    $startDate: DateTime!\n  ) {\n    addCoachToTeam(\n      userId: $userId\n      teamId: $teamId\n      role: $role\n      startDate: $startDate\n    ) {\n      id\n      role\n      startDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n'
): (typeof documents)['\n  mutation AddCoachToTeam(\n    $userId: ID!\n    $teamId: ID!\n    $role: String!\n    $startDate: DateTime!\n  ) {\n    addCoachToTeam(\n      userId: $userId\n      teamId: $teamId\n      role: $role\n      startDate: $startDate\n    ) {\n      id\n      role\n      startDate\n      isActive\n      team {\n        id\n        name\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemoveCoachFromTeam($userId: ID!, $teamId: ID!, $endDate: DateTime) {\n    removeCoachFromTeam(userId: $userId, teamId: $teamId, endDate: $endDate)\n  }\n'
): (typeof documents)['\n  mutation RemoveCoachFromTeam($userId: ID!, $teamId: ID!, $endDate: DateTime) {\n    removeCoachFromTeam(userId: $userId, teamId: $teamId, endDate: $endDate)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateUserAccount($createPlayerInput: CreateUserInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateUserAccount($createPlayerInput: CreateUserInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateCoach($createCoachInput: CreateUserInput!) {\n    createCoach(createCoachInput: $createCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateCoach($createCoachInput: CreateUserInput!) {\n    createCoach(createCoachInput: $createCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateUserAccount($id: ID!, $updatePlayerInput: UpdateUserInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateUserAccount($id: ID!, $updatePlayerInput: UpdateUserInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateCoach($id: ID!, $updateCoachInput: UpdateUserInput!) {\n    updateCoach(id: $id, updateCoachInput: $updateCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateCoach($id: ID!, $updateCoachInput: UpdateUserInput!) {\n    updateCoach(id: $id, updateCoachInput: $updateCoachInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  subscription UserUpdated {\n    userUpdated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  subscription UserUpdated {\n    userUpdated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      updatedAt\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  subscription UserCreated {\n    userCreated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      createdAt\n    }\n  }\n'
): (typeof documents)['\n  subscription UserCreated {\n    userCreated {\n      id\n      firstName\n      lastName\n      email\n      isActive\n      createdAt\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
