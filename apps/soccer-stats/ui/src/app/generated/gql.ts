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
  '\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n': typeof types.PlayerCardDataFragmentDoc;
  '\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.DebugGetTeamsDocument;
  '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGameFormatsDocument;
  '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGamesDocument;
  '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGameByIdDocument;
  '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateGameDocument;
  '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.UpdateGameDocument;
  '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n': typeof types.RemoveGameDocument;
  '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetTeamsDocument;
  '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n': typeof types.GetTeamByIdDocument;
  '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateTeamDocument;
  '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.UpdateTeamDocument;
  '\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateUnmanagedTeamDocument;
  '\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.FindOrCreateUnmanagedTeamDocument;
  '\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetManagedTeamsDocument;
  '\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetUnmanagedTeamsDocument;
  '\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetTeamsByManagedStatusDocument;
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
  '\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n':
    types.PlayerCardDataFragmentDoc,
  '\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.DebugGetTeamsDocument,
  '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGameFormatsDocument,
  '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGamesDocument,
  '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGameByIdDocument,
  '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateGameDocument,
  '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.UpdateGameDocument,
  '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n':
    types.RemoveGameDocument,
  '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetTeamsDocument,
  '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n':
    types.GetTeamByIdDocument,
  '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
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
  source: '\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n'
): (typeof documents)['\n  fragment PlayerCardData on User {\n    id\n    firstName\n    lastName\n    email\n    phone\n    dateOfBirth\n    isActive\n    teamPlayers {\n      id\n      jerseyNumber\n      primaryPosition\n      isActive\n      team {\n        id\n        name\n      }\n    }\n    # Note: Game stats would need to be computed from performedEvents\n    # This might require a custom resolver field for aggregated stats\n    # performedEvents {\n    #   id\n    #   eventType {\n    #     name\n    #   }\n    #   gameMinute\n    #   game {\n    #     id\n    #   }\n    # }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query DebugGetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n\n      createdAt\n      updatedAt\n    }\n  }\n'];
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
  source: '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        team {\n          id\n          name\n          shortName\n          homePrimaryColor\n          homeSecondaryColor\n        }\n      }\n      createdAt\n      updatedAt\n    }\n  }\n'];
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
  source: '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'];
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
  source: '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): (typeof documents)['\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'];
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
