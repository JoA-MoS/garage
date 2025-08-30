# GraphQL Mutations to Create 2 Teams with 14 Players Each

## First, create the teams

### Create Team 1 - Manchester United

```graphql
mutation CreateTeam1 {
  createTeam(createTeamInput: { name: "Manchester United", colors: "Red and White", logo: "https://logos.world/images/Arsenal-FC/Arsenal-FC-logo.png" }) {
    id
    name
    colors
    logo
    createdAt
  }
}
```

### Create Team 2 - Arsenal FC

```graphql
mutation CreateTeam2 {
  createTeam(createTeamInput: { name: "Arsenal FC", colors: "Red and White", logo: "https://logos.world/images/Arsenal-FC/Arsenal-FC-logo.png" }) {
    id
    name
    colors
    logo
    createdAt
  }
}
```

## Manchester United Players (14 players)

### Goalkeeper

```graphql
mutation CreatePlayer1 {
  createPlayer(createPlayerInput: { name: "David De Gea", position: "Goalkeeper" }) {
    id
    name
    position
    createdAt
  }
}
```

### Defenders

```graphql
mutation CreatePlayer2 {
  createPlayer(createPlayerInput: { name: "Harry Maguire", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer3 {
  createPlayer(createPlayerInput: { name: "Raphael Varane", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer4 {
  createPlayer(createPlayerInput: { name: "Luke Shaw", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer5 {
  createPlayer(createPlayerInput: { name: "Aaron Wan-Bissaka", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer6 {
  createPlayer(createPlayerInput: { name: "Lisandro Martinez", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

### Midfielders

```graphql
mutation CreatePlayer7 {
  createPlayer(createPlayerInput: { name: "Bruno Fernandes", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer8 {
  createPlayer(createPlayerInput: { name: "Casemiro", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer9 {
  createPlayer(createPlayerInput: { name: "Christian Eriksen", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer10 {
  createPlayer(createPlayerInput: { name: "Fred", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer11 {
  createPlayer(createPlayerInput: { name: "Scott McTominay", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

### Forwards

```graphql
mutation CreatePlayer12 {
  createPlayer(createPlayerInput: { name: "Marcus Rashford", position: "Forward" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer13 {
  createPlayer(createPlayerInput: { name: "Anthony Martial", position: "Forward" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer14 {
  createPlayer(createPlayerInput: { name: "Jadon Sancho", position: "Forward" }) {
    id
    name
    position
    createdAt
  }
}
```

## Arsenal FC Players (14 players)

### Goalkeeper

```graphql
mutation CreatePlayer15 {
  createPlayer(createPlayerInput: { name: "Aaron Ramsdale", position: "Goalkeeper" }) {
    id
    name
    position
    createdAt
  }
}
```

### Defenders

```graphql
mutation CreatePlayer16 {
  createPlayer(createPlayerInput: { name: "William Saliba", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer17 {
  createPlayer(createPlayerInput: { name: "Gabriel Magalhaes", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer18 {
  createPlayer(createPlayerInput: { name: "Ben White", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer19 {
  createPlayer(createPlayerInput: { name: "Kieran Tierney", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer20 {
  createPlayer(createPlayerInput: { name: "Takehiro Tomiyasu", position: "Defender" }) {
    id
    name
    position
    createdAt
  }
}
```

### Midfielders

```graphql
mutation CreatePlayer21 {
  createPlayer(createPlayerInput: { name: "Martin Odegaard", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer22 {
  createPlayer(createPlayerInput: { name: "Thomas Partey", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer23 {
  createPlayer(createPlayerInput: { name: "Granit Xhaka", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer24 {
  createPlayer(createPlayerInput: { name: "Emile Smith Rowe", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer25 {
  createPlayer(createPlayerInput: { name: "Fabio Vieira", position: "Midfielder" }) {
    id
    name
    position
    createdAt
  }
}
```

### Forwards

```graphql
mutation CreatePlayer26 {
  createPlayer(createPlayerInput: { name: "Bukayo Saka", position: "Forward" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer27 {
  createPlayer(createPlayerInput: { name: "Gabriel Jesus", position: "Forward" }) {
    id
    name
    position
    createdAt
  }
}
```

```graphql
mutation CreatePlayer28 {
  createPlayer(createPlayerInput: { name: "Gabriel Martinelli", position: "Forward" }) {
    id
    name
    position
    createdAt
  }
}
```

## Verification Queries

### Check all teams with their players

```graphql
query VerifyTeamsAndPlayers {
  teams {
    id
    name
    colors
    players {
      id
      name
      position
    }
  }
}
```

### Check all players with their teams

```graphql
query VerifyPlayersAndTeams {
  players {
    id
    name
    position
    teams {
      id
      name
    }
  }
}
```

### Count players by position

```graphql
query CheckGoalkeepers {
  playersByPosition(position: "Goalkeeper") {
    id
    name
    position
  }
}

query CheckDefenders {
  playersByPosition(position: "Defender") {
    id
    name
    position
  }
}

query CheckMidfielders {
  playersByPosition(position: "Midfielder") {
    id
    name
    position
  }
}

query CheckForwards {
  playersByPosition(position: "Forward") {
    id
    name
    position
  }
}
```

## Instructions

1. **Copy and run each mutation individually** in the GraphQL Playground at `http://localhost:3333/graphql`
2. **Start with the team mutations** (CreateTeam1 and CreateTeam2)
3. **Then run all the player mutations** (CreatePlayer1 through CreatePlayer28)
4. **Finally, run the verification queries** to confirm all data was created correctly

## Team Breakdown:

- **Manchester United**: 14 players (1 GK, 5 DEF, 5 MID, 3 FWD)
- **Arsenal FC**: 14 players (1 GK, 5 DEF, 5 MID, 3 FWD)
- **Total**: 2 teams, 28 players

Note: The following mutations will create the teams and players, then properly link them using TeamPlayer relationships with jersey numbers.

## Team Player Associations

### Manchester United Player Assignments (with jersey numbers)

```graphql
# David De Gea - Goalkeeper
mutation AddPlayer1ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER1_ID", jersey: 1 }) {
    id
    name
    players {
      id
      name
      teamPlayers {
        jersey
      }
    }
  }
}
```

```graphql
# Harry Maguire - Defender
mutation AddPlayer2ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER2_ID", jersey: 5 }) {
    id
    name
  }
}
```

```graphql
# Luke Shaw - Defender
mutation AddPlayer3ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER3_ID", jersey: 23 }) {
    id
    name
  }
}
```

```graphql
# Raphael Varane - Defender
mutation AddPlayer4ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER4_ID", jersey: 19 }) {
    id
    name
  }
}
```

```graphql
# Aaron Wan-Bissaka - Defender
mutation AddPlayer5ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER5_ID", jersey: 29 }) {
    id
    name
  }
}
```

```graphql
# Lisandro Martinez - Defender
mutation AddPlayer6ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER6_ID", jersey: 6 }) {
    id
    name
  }
}
```

```graphql
# Bruno Fernandes - Midfielder
mutation AddPlayer7ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER7_ID", jersey: 8 }) {
    id
    name
  }
}
```

```graphql
# Paul Pogba - Midfielder
mutation AddPlayer8ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER8_ID", jersey: 39 }) {
    id
    name
  }
}
```

```graphql
# Casemiro - Midfielder
mutation AddPlayer9ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER9_ID", jersey: 18 }) {
    id
    name
  }
}
```

```graphql
# Christian Eriksen - Midfielder
mutation AddPlayer10ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER10_ID", jersey: 14 }) {
    id
    name
  }
}
```

```graphql
# Fred - Midfielder
mutation AddPlayer11ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER11_ID", jersey: 17 }) {
    id
    name
  }
}
```

```graphql
# Marcus Rashford - Forward
mutation AddPlayer12ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER12_ID", jersey: 10 }) {
    id
    name
  }
}
```

```graphql
# Anthony Martial - Forward
mutation AddPlayer13ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER13_ID", jersey: 9 }) {
    id
    name
  }
}
```

```graphql
# Jadon Sancho - Forward
mutation AddPlayer14ToTeam1 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM1_ID", playerId: "PLAYER14_ID", jersey: 25 }) {
    id
    name
  }
}
```

### Arsenal FC Player Assignments (with jersey numbers)

```graphql
# Aaron Ramsdale - Goalkeeper
mutation AddPlayer15ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER15_ID", jersey: 1 }) {
    id
    name
  }
}
```

```graphql
# William Saliba - Defender
mutation AddPlayer16ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER16_ID", jersey: 12 }) {
    id
    name
  }
}
```

```graphql
# Gabriel Magalhaes - Defender
mutation AddPlayer17ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER17_ID", jersey: 6 }) {
    id
    name
  }
}
```

```graphql
# Ben White - Defender
mutation AddPlayer18ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER18_ID", jersey: 4 }) {
    id
    name
  }
}
```

```graphql
# Kieran Tierney - Defender
mutation AddPlayer19ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER19_ID", jersey: 3 }) {
    id
    name
  }
}
```

```graphql
# Takehiro Tomiyasu - Defender
mutation AddPlayer20ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER20_ID", jersey: 18 }) {
    id
    name
  }
}
```

```graphql
# Thomas Partey - Midfielder
mutation AddPlayer21ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER21_ID", jersey: 5 }) {
    id
    name
  }
}
```

```graphql
# Granit Xhaka - Midfielder
mutation AddPlayer22ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER22_ID", jersey: 34 }) {
    id
    name
  }
}
```

```graphql
# Martin Odegaard - Midfielder
mutation AddPlayer23ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER23_ID", jersey: 8 }) {
    id
    name
  }
}
```

```graphql
# Emile Smith Rowe - Midfielder
mutation AddPlayer24ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER24_ID", jersey: 10 }) {
    id
    name
  }
}
```

```graphql
# Bukayo Saka - Midfielder
mutation AddPlayer25ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER25_ID", jersey: 7 }) {
    id
    name
  }
}
```

```graphql
# Gabriel Jesus - Forward
mutation AddPlayer26ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER26_ID", jersey: 9 }) {
    id
    name
  }
}
```

```graphql
# Eddie Nketiah - Forward
mutation AddPlayer27ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER27_ID", jersey: 14 }) {
    id
    name
  }
}
```

```graphql
# Gabriel Martinelli - Forward
mutation AddPlayer28ToTeam2 {
  addPlayerToTeam(addPlayerToTeamInput: { teamId: "TEAM2_ID", playerId: "PLAYER28_ID", jersey: 11 }) {
    id
    name
  }
}
```

## Instructions

1. **Copy and run each mutation individually** in the GraphQL Playground at `http://localhost:3333/graphql`
2. **Start with the team mutations** (CreateTeam1 and CreateTeam2) and note their IDs
3. **Then run all the player mutations** (CreatePlayer1 through CreatePlayer28) and note their IDs
4. **Replace TEAM1_ID, TEAM2_ID, and PLAYER_IDs** in the TeamPlayer association mutations with actual IDs
5. **Run all the addPlayerToTeam mutations** to properly link players with teams and assign jersey numbers
6. **Finally, run the verification queries** to confirm all data was created correctly

## Team Breakdown:

- **Manchester United**: 14 players (1 GK, 5 DEF, 5 MID, 3 FWD) with jersey numbers
- **Arsenal FC**: 14 players (1 GK, 5 DEF, 5 MID, 3 FWD) with jersey numbers
- **Total**: 2 teams, 28 players, 28 team-player associations
