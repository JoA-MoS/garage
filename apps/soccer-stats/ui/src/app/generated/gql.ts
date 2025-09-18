/* eslint-disable */
import * as types from './graphql';

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
  '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetGameFormatsDocument;
  '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        tacticalNotes\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n        }\n      }\n      gameEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        position\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n          email\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n': typeof types.GetGamesDocument;
  '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n        allowsSubstitutions\n        maxSubstitutions\n        description\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        tacticalNotes\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n          playersWithJersey {\n            id\n            jersey\n            depthRank\n            isActive\n            name\n            position\n          }\n        }\n      }\n      gameEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        position\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n          requiresPosition\n          allowsParent\n        }\n        player {\n          id\n          firstName\n          lastName\n          email\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        parentEvent {\n          id\n          gameMinute\n          gameSecond\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n        }\n      }\n    }\n  }\n': typeof types.GetGameByIdDocument;
  '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n        }\n      }\n    }\n  }\n': typeof types.CreateGameDocument;
  '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.UpdateGameDocument;
  '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n': typeof types.RemoveGameDocument;
  '\n  query GetPlayers {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n': typeof types.GetPlayersDocument;
  '\n  mutation CreatePlayer($createPlayerInput: CreatePlayerInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreatePlayerDocument;
  '\n  mutation AddPlayerToTeamBasic($addPlayerToTeamInput: AddPlayerToTeamInput!) {\n    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {\n      id\n      name\n    }\n  }\n': typeof types.AddPlayerToTeamBasicDocument;
  '\n  query GetPlayerById($id: ID!) {\n    player(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n        homePrimaryColor\n        homeSecondaryColor\n        awayPrimaryColor\n        awaySecondaryColor\n        logoUrl\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      performedEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        eventType {\n          id\n          name\n          category\n        }\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n': typeof types.GetPlayerByIdDocument;
  '\n  mutation UpdatePlayer($id: ID!, $updatePlayerInput: UpdatePlayerInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n': typeof types.UpdatePlayerDocument;
  '\n  mutation RemovePlayer($id: ID!) {\n    removePlayer(id: $id)\n  }\n': typeof types.RemovePlayerDocument;
  '\n  mutation RemovePlayerFromTeam($playerId: ID!, $teamId: ID!) {\n    removePlayerFromTeam(playerId: $playerId, teamId: $teamId) {\n      id\n      name\n      players {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n': typeof types.RemovePlayerFromTeamDocument;
  '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetTeamsDocument;
  '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n': typeof types.GetTeamByIdDocument;
  '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateTeamDocument;
  '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.UpdateTeamDocument;
  '\n  mutation AddPlayerToTeamWithDetails(\n    $addPlayerToTeamInput: AddPlayerToTeamInput!\n  ) {\n    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      createdAt\n      updatedAt\n      players {\n        id\n        firstName\n        lastName\n        email\n      }\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n    }\n  }\n': typeof types.AddPlayerToTeamWithDetailsDocument;
  '\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.CreateUnmanagedTeamDocument;
  '\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.FindOrCreateUnmanagedTeamDocument;
  '\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetManagedTeamsDocument;
  '\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetUnmanagedTeamsDocument;
  '\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n': typeof types.GetTeamsByManagedStatusDocument;
};
const documents: Documents = {
  '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetGameFormatsDocument,
  '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        tacticalNotes\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n        }\n      }\n      gameEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        position\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n          email\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n':
    types.GetGamesDocument,
  '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n        allowsSubstitutions\n        maxSubstitutions\n        description\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        tacticalNotes\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n          playersWithJersey {\n            id\n            jersey\n            depthRank\n            isActive\n            name\n            position\n          }\n        }\n      }\n      gameEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        position\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n          requiresPosition\n          allowsParent\n        }\n        player {\n          id\n          firstName\n          lastName\n          email\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        parentEvent {\n          id\n          gameMinute\n          gameSecond\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n        }\n      }\n    }\n  }\n':
    types.GetGameByIdDocument,
  '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n        }\n      }\n    }\n  }\n':
    types.CreateGameDocument,
  '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.UpdateGameDocument,
  '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n':
    types.RemoveGameDocument,
  '\n  query GetPlayers {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n':
    types.GetPlayersDocument,
  '\n  mutation CreatePlayer($createPlayerInput: CreatePlayerInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreatePlayerDocument,
  '\n  mutation AddPlayerToTeamBasic($addPlayerToTeamInput: AddPlayerToTeamInput!) {\n    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {\n      id\n      name\n    }\n  }\n':
    types.AddPlayerToTeamBasicDocument,
  '\n  query GetPlayerById($id: ID!) {\n    player(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n        homePrimaryColor\n        homeSecondaryColor\n        awayPrimaryColor\n        awaySecondaryColor\n        logoUrl\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      performedEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        eventType {\n          id\n          name\n          category\n        }\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n':
    types.GetPlayerByIdDocument,
  '\n  mutation UpdatePlayer($id: ID!, $updatePlayerInput: UpdatePlayerInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n':
    types.UpdatePlayerDocument,
  '\n  mutation RemovePlayer($id: ID!) {\n    removePlayer(id: $id)\n  }\n':
    types.RemovePlayerDocument,
  '\n  mutation RemovePlayerFromTeam($playerId: ID!, $teamId: ID!) {\n    removePlayerFromTeam(playerId: $playerId, teamId: $teamId) {\n      id\n      name\n      players {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n':
    types.RemovePlayerFromTeamDocument,
  '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.GetTeamsDocument,
  '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n':
    types.GetTeamByIdDocument,
  '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.CreateTeamDocument,
  '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n':
    types.UpdateTeamDocument,
  '\n  mutation AddPlayerToTeamWithDetails(\n    $addPlayerToTeamInput: AddPlayerToTeamInput!\n  ) {\n    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      createdAt\n      updatedAt\n      players {\n        id\n        firstName\n        lastName\n        email\n      }\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n    }\n  }\n':
    types.AddPlayerToTeamWithDetailsDocument,
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
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGameFormats {\n    gameFormats {\n      id\n      name\n      playersPerTeam\n      durationMinutes\n      description\n      allowsSubstitutions\n      maxSubstitutions\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').GetGameFormatsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGames {\n    games {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        tacticalNotes\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n        }\n      }\n      gameEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        position\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n        }\n        player {\n          id\n          firstName\n          lastName\n          email\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n      }\n    }\n  }\n'
): typeof import('./graphql').GetGamesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetGameById($id: ID!) {\n    game(id: $id) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n        allowsSubstitutions\n        maxSubstitutions\n        description\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        tacticalNotes\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n          playersWithJersey {\n            id\n            jersey\n            depthRank\n            isActive\n            name\n            position\n          }\n        }\n      }\n      gameEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        position\n        externalPlayerName\n        externalPlayerNumber\n        eventType {\n          id\n          name\n          category\n          requiresPosition\n          allowsParent\n        }\n        player {\n          id\n          firstName\n          lastName\n          email\n        }\n        recordedByUser {\n          id\n          firstName\n          lastName\n        }\n        parentEvent {\n          id\n          gameMinute\n          gameSecond\n        }\n        childEvents {\n          id\n          gameMinute\n          gameSecond\n        }\n      }\n    }\n  }\n'
): typeof import('./graphql').GetGameByIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateGame($createGameInput: CreateGameInput!) {\n    createGame(createGameInput: $createGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      gameFormat {\n        id\n        name\n        playersPerTeam\n        durationMinutes\n      }\n      createdAt\n      updatedAt\n      gameTeams {\n        id\n        teamType\n        formation\n        finalScore\n        team {\n          id\n          name\n          homePrimaryColor\n          homeSecondaryColor\n          awayPrimaryColor\n          awaySecondaryColor\n          logoUrl\n        }\n      }\n    }\n  }\n'
): typeof import('./graphql').CreateGameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateGame($id: ID!, $updateGameInput: UpdateGameInput!) {\n    updateGame(id: $id, updateGameInput: $updateGameInput) {\n      id\n      name\n      scheduledStart\n      notes\n      venue\n      weatherConditions\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').UpdateGameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemoveGame($id: ID!) {\n    removeGame(id: $id)\n  }\n'
): typeof import('./graphql').RemoveGameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPlayers {\n    players {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        team {\n          id\n          name\n        }\n      }\n    }\n  }\n'
): typeof import('./graphql').GetPlayersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreatePlayer($createPlayerInput: CreatePlayerInput!) {\n    createPlayer(createPlayerInput: $createPlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').CreatePlayerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation AddPlayerToTeamBasic($addPlayerToTeamInput: AddPlayerToTeamInput!) {\n    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {\n      id\n      name\n    }\n  }\n'
): typeof import('./graphql').AddPlayerToTeamBasicDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetPlayerById($id: ID!) {\n    player(id: $id) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      createdAt\n      updatedAt\n      teams {\n        id\n        name\n        shortName\n        homePrimaryColor\n        homeSecondaryColor\n        awayPrimaryColor\n        awaySecondaryColor\n        logoUrl\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        team {\n          id\n          name\n          shortName\n        }\n      }\n      performedEvents {\n        id\n        gameMinute\n        gameSecond\n        description\n        eventType {\n          id\n          name\n          category\n        }\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n'
): typeof import('./graphql').GetPlayerByIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdatePlayer($id: ID!, $updatePlayerInput: UpdatePlayerInput!) {\n    updatePlayer(id: $id, updatePlayerInput: $updatePlayerInput) {\n      id\n      firstName\n      lastName\n      email\n      dateOfBirth\n      phone\n      isActive\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').UpdatePlayerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemovePlayer($id: ID!) {\n    removePlayer(id: $id)\n  }\n'
): typeof import('./graphql').RemovePlayerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation RemovePlayerFromTeam($playerId: ID!, $teamId: ID!) {\n    removePlayerFromTeam(playerId: $playerId, teamId: $teamId) {\n      id\n      name\n      players {\n        id\n        firstName\n        lastName\n      }\n    }\n  }\n'
): typeof import('./graphql').RemovePlayerFromTeamDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetTeams {\n    teams {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').GetTeamsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetTeamById($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n      teamPlayers {\n        id\n        jerseyNumber\n        primaryPosition\n        isActive\n        joinedDate\n        leftDate\n        user {\n          id\n          firstName\n          lastName\n          email\n        }\n      }\n      teamConfiguration {\n        id\n        defaultFormation\n        defaultGameDuration\n        defaultPlayerCount\n        defaultGameFormat {\n          id\n          name\n          playersPerTeam\n          durationMinutes\n        }\n      }\n      gameTeams {\n        id\n        teamType\n        finalScore\n        formation\n        game {\n          id\n          name\n          scheduledStart\n        }\n      }\n    }\n  }\n'
): typeof import('./graphql').GetTeamByIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateTeam($createTeamInput: CreateTeamInput!) {\n    createTeam(createTeamInput: $createTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').CreateTeamDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateTeam($id: ID!, $updateTeamInput: UpdateTeamInput!) {\n    updateTeam(id: $id, updateTeamInput: $updateTeamInput) {\n      id\n      name\n      shortName\n      description\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').UpdateTeamDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation AddPlayerToTeamWithDetails(\n    $addPlayerToTeamInput: AddPlayerToTeamInput!\n  ) {\n    addPlayerToTeam(addPlayerToTeamInput: $addPlayerToTeamInput) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      createdAt\n      updatedAt\n      players {\n        id\n        firstName\n        lastName\n        email\n      }\n      playersWithJersey {\n        id\n        name\n        position\n        jersey\n        depthRank\n        isActive\n      }\n    }\n  }\n'
): typeof import('./graphql').AddPlayerToTeamWithDetailsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateUnmanagedTeam($name: String!, $shortName: String) {\n    createUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').CreateUnmanagedTeamDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation FindOrCreateUnmanagedTeam($name: String!, $shortName: String) {\n    findOrCreateUnmanagedTeam(name: $name, shortName: $shortName) {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').FindOrCreateUnmanagedTeamDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetManagedTeams {\n    managedTeams {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').GetManagedTeamsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetUnmanagedTeams {\n    unmanagedTeams {\n      id\n      name\n      shortName\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').GetUnmanagedTeamsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query GetTeamsByManagedStatus($isManaged: Boolean!) {\n    teamsByManagedStatus(isManaged: $isManaged) {\n      id\n      name\n      shortName\n      homePrimaryColor\n      homeSecondaryColor\n      awayPrimaryColor\n      awaySecondaryColor\n      logoUrl\n      isActive\n      isManaged\n      sourceType\n      createdAt\n      updatedAt\n    }\n  }\n'
): typeof import('./graphql').GetTeamsByManagedStatusDocument;

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
