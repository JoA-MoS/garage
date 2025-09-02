/**
 * GraphQL Mutations Script - Modern Node.js Version (ES Modules)
 * This script automatically creates 2 teams with 14 players each and links them with jersey numbers
 *
 * Prerequisites: Node.js 18+ (uses built-in fetch)
 * Usage: node create-soccer-data.mjs
 */

const GRAPHQL_URL = 'http://localhost:3333/graphql';

// GraphQL mutation runner
async function runMutation(query, operationName) {
  try {
    console.log(`Running: ${operationName}`);

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error(`❌ Error in ${operationName}:`, result.errors);
      return null;
    } else {
      console.log(`✅ ${operationName} completed successfully`);
      console.log(JSON.stringify(result.data, null, 2));
      return result.data;
    }
  } catch (error) {
    console.error(`❌ Network error in ${operationName}:`, error.message);
    return null;
  }
}

// Sleep function for rate limiting
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createSoccerData() {
  console.log('🏟️ Starting Soccer Stats Data Creation...');
  console.log('======================================');

  // Storage for IDs
  const teamIds = {};
  const playerIds = [];

  try {
    // Create Teams
    console.log('\n📋 Creating Teams...');
    console.log('===================');

    const team1Result = await runMutation(
      `
            mutation CreateTeam1 {
                createTeam(createTeamInput: {
                    name: "Manchester United"
                    colors: "Red and White"
                    logo: "https://logos.world/images/ManUtd/ManUtd-logo.png"
                }) {
                    id
                    name
                    colors
                    logo
                    createdAt
                }
            }
        `,
      'Manchester United'
    );

    if (team1Result?.createTeam?.id) {
      teamIds.manchester = team1Result.createTeam.id;
      console.log(`💾 Stored Manchester United ID: ${teamIds.manchester}`);
    }

    await sleep(100); // Small delay between requests

    const team2Result = await runMutation(
      `
            mutation CreateTeam2 {
                createTeam(createTeamInput: {
                    name: "Arsenal FC"
                    colors: "Red and White"
                    logo: "https://logos.world/images/Arsenal-FC/Arsenal-FC-logo.png"
                }) {
                    id
                    name
                    colors
                    logo
                    createdAt
                }
            }
        `,
      'Arsenal FC'
    );

    if (team2Result?.createTeam?.id) {
      teamIds.arsenal = team2Result.createTeam.id;
      console.log(`💾 Stored Arsenal FC ID: ${teamIds.arsenal}`);
    }

    // Manchester United Players
    console.log('\n⚽ Creating Manchester United Players...');
    console.log('====================================');

    const manchesterPlayers = [
      { name: 'David De Gea', position: 'Goalkeeper', jersey: 1 },
      { name: 'Harry Maguire', position: 'Defender', jersey: 5 },
      { name: 'Luke Shaw', position: 'Defender', jersey: 23 },
      { name: 'Raphael Varane', position: 'Defender', jersey: 19 },
      { name: 'Aaron Wan-Bissaka', position: 'Defender', jersey: 29 },
      { name: 'Lisandro Martinez', position: 'Defender', jersey: 6 },
      { name: 'Bruno Fernandes', position: 'Midfielder', jersey: 8 },
      { name: 'Paul Pogba', position: 'Midfielder', jersey: 39 },
      { name: 'Casemiro', position: 'Midfielder', jersey: 18 },
      { name: 'Christian Eriksen', position: 'Midfielder', jersey: 14 },
      { name: 'Fred', position: 'Midfielder', jersey: 17 },
      { name: 'Marcus Rashford', position: 'Forward', jersey: 10 },
      { name: 'Anthony Martial', position: 'Forward', jersey: 9 },
      { name: 'Jadon Sancho', position: 'Forward', jersey: 25 },
    ];

    for (const player of manchesterPlayers) {
      const playerResult = await runMutation(
        `
                mutation CreatePlayer {
                    createPlayer(createPlayerInput: {
                        name: "${player.name}"
                        position: "${player.position}"
                    }) {
                        id
                        name
                        position
                    }
                }
            `,
        player.name
      );

      if (playerResult?.createPlayer?.id) {
        playerIds.push({
          id: playerResult.createPlayer.id,
          name: player.name,
          team: 'manchester',
          jersey: player.jersey,
        });
      }

      await sleep(100); // Small delay between requests
    }

    // Arsenal FC Players
    console.log('\n🔴 Creating Arsenal FC Players...');
    console.log('===============================');

    const arsenalPlayers = [
      { name: 'Aaron Ramsdale', position: 'Goalkeeper', jersey: 1 },
      { name: 'William Saliba', position: 'Defender', jersey: 12 },
      { name: 'Gabriel Magalhaes', position: 'Defender', jersey: 6 },
      { name: 'Ben White', position: 'Defender', jersey: 4 },
      { name: 'Kieran Tierney', position: 'Defender', jersey: 3 },
      { name: 'Takehiro Tomiyasu', position: 'Defender', jersey: 18 },
      { name: 'Thomas Partey', position: 'Midfielder', jersey: 5 },
      { name: 'Granit Xhaka', position: 'Midfielder', jersey: 34 },
      { name: 'Martin Odegaard', position: 'Midfielder', jersey: 8 },
      { name: 'Emile Smith Rowe', position: 'Midfielder', jersey: 10 },
      { name: 'Bukayo Saka', position: 'Midfielder', jersey: 7 },
      { name: 'Gabriel Jesus', position: 'Forward', jersey: 9 },
      { name: 'Eddie Nketiah', position: 'Forward', jersey: 14 },
      { name: 'Gabriel Martinelli', position: 'Forward', jersey: 11 },
    ];

    for (const player of arsenalPlayers) {
      const playerResult = await runMutation(
        `
                mutation CreatePlayer {
                    createPlayer(createPlayerInput: {
                        name: "${player.name}"
                        position: "${player.position}"
                    }) {
                        id
                        name
                        position
                    }
                }
            `,
        player.name
      );

      if (playerResult?.createPlayer?.id) {
        playerIds.push({
          id: playerResult.createPlayer.id,
          name: player.name,
          team: 'arsenal',
          jersey: player.jersey,
        });
      }

      await sleep(100); // Small delay between requests
    }

    // Create TeamPlayer Associations
    console.log('\n👥 Creating Team-Player Associations...');
    console.log('=====================================');

    for (const player of playerIds) {
      const teamId =
        player.team === 'manchester' ? teamIds.manchester : teamIds.arsenal;

      if (teamId) {
        await runMutation(
          `
                    mutation AddPlayerToTeam {
                        addPlayerToTeam(addPlayerToTeamInput: {
                            teamId: "${teamId}"
                            playerId: "${player.id}"
                            jersey: ${player.jersey}
                        }) {
                            id
                            name
                        }
                    }
                `,
          `${player.name} (Jersey #${player.jersey}) to ${
            player.team === 'manchester' ? 'Manchester United' : 'Arsenal FC'
          }`
        );

        await sleep(100); // Small delay between requests
      }
    }

    // Verification Queries
    console.log('\n🔍 Running Verification Queries...');
    console.log('================================');

    await runMutation(
      `
            query CheckTeams {
                teams {
                    id
                    name
                    colors
                    players {
                        id
                        name
                        position
                        teamPlayers {
                            jersey
                        }
                    }
                }
            }
        `,
      'Teams with Players'
    );

    await runMutation(
      `
            query CheckGoalkeepers {
                playersByPosition(position: "Goalkeeper") {
                    id
                    name
                    position
                }
            }
        `,
      'Goalkeepers Count'
    );

    await runMutation(
      `
            query CheckDefenders {
                playersByPosition(position: "Defender") {
                    id
                    name
                    position
                }
            }
        `,
      'Defenders Count'
    );

    await runMutation(
      `
            query CheckMidfielders {
                playersByPosition(position: "Midfielder") {
                    id
                    name
                    position
                }
            }
        `,
      'Midfielders Count'
    );

    await runMutation(
      `
            query CheckForwards {
                playersByPosition(position: "Forward") {
                    id
                    name
                    position
                }
            }
        `,
      'Forwards Count'
    );

    console.log('\n🎉 Data creation completed!');
    console.log('=========================');
    console.log('Summary:');
    console.log('- 2 Teams created (Manchester United, Arsenal FC)');
    console.log('- 28 Players created (14 per team)');
    console.log('- 28 Team-Player associations created with jersey numbers');
    console.log('- Positions: 2 GK, 10 DEF, 10 MID, 6 FWD');
    console.log('');
    console.log('🌐 Visit GraphQL Playground: http://localhost:3333/graphql');
    console.log('');
    console.log('📋 Team IDs for reference:');
    console.log(`   Manchester United: ${teamIds.manchester}`);
    console.log(`   Arsenal FC: ${teamIds.arsenal}`);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
createSoccerData().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
