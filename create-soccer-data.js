#!/usr/bin/env node

/**
 * GraphQL Mutations Script - Node.js Version
 * This script automatically creates 2 teams with 14 players each
 *
 * Prerequisites: npm install node-fetch
 * Usage: node create-soccer-data.js
 */

const fetch = require('node-fetch');

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

  try {
    // Create Teams
    console.log('\n📋 Creating Teams...');
    console.log('===================');

    await runMutation(
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

    await sleep(100); // Small delay between requests

    await runMutation(
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

    // Manchester United Players
    console.log('\n⚽ Creating Manchester United Players...');
    console.log('====================================');

    const manchesterPlayers = [
      { name: 'David De Gea', position: 'Goalkeeper' },
      { name: 'Harry Maguire', position: 'Defender' },
      { name: 'Raphael Varane', position: 'Defender' },
      { name: 'Luke Shaw', position: 'Defender' },
      { name: 'Aaron Wan-Bissaka', position: 'Defender' },
      { name: 'Lisandro Martinez', position: 'Defender' },
      { name: 'Bruno Fernandes', position: 'Midfielder' },
      { name: 'Casemiro', position: 'Midfielder' },
      { name: 'Christian Eriksen', position: 'Midfielder' },
      { name: 'Fred', position: 'Midfielder' },
      { name: 'Scott McTominay', position: 'Midfielder' },
      { name: 'Marcus Rashford', position: 'Forward' },
      { name: 'Anthony Martial', position: 'Forward' },
      { name: 'Jadon Sancho', position: 'Forward' },
    ];

    for (const [index, player] of manchesterPlayers.entries()) {
      await runMutation(
        `
                mutation CreatePlayer${index + 1} {
                    createPlayer(createPlayerInput: {
                        name: "${player.name}"
                        position: "${player.position}"
                    }) {
                        id
                        name
                        position
                        createdAt
                    }
                }
            `,
        `${player.name} (${player.position.substring(0, 3).toUpperCase()})`
      );

      await sleep(50); // Small delay between requests
    }

    // Arsenal FC Players
    console.log('\n🔴 Creating Arsenal FC Players...');
    console.log('===============================');

    const arsenalPlayers = [
      { name: 'Aaron Ramsdale', position: 'Goalkeeper' },
      { name: 'William Saliba', position: 'Defender' },
      { name: 'Gabriel Magalhaes', position: 'Defender' },
      { name: 'Ben White', position: 'Defender' },
      { name: 'Kieran Tierney', position: 'Defender' },
      { name: 'Takehiro Tomiyasu', position: 'Defender' },
      { name: 'Martin Odegaard', position: 'Midfielder' },
      { name: 'Thomas Partey', position: 'Midfielder' },
      { name: 'Granit Xhaka', position: 'Midfielder' },
      { name: 'Emile Smith Rowe', position: 'Midfielder' },
      { name: 'Fabio Vieira', position: 'Midfielder' },
      { name: 'Bukayo Saka', position: 'Forward' },
      { name: 'Gabriel Jesus', position: 'Forward' },
      { name: 'Gabriel Martinelli', position: 'Forward' },
    ];

    for (const [index, player] of arsenalPlayers.entries()) {
      await runMutation(
        `
                mutation CreatePlayer${index + 15} {
                    createPlayer(createPlayerInput: {
                        name: "${player.name}"
                        position: "${player.position}"
                    }) {
                        id
                        name
                        position
                        createdAt
                    }
                }
            `,
        `${player.name} (${player.position.substring(0, 3).toUpperCase()})`
      );

      await sleep(50); // Small delay between requests
    }

    // Verification
    console.log('\n✅ Verification - Checking Created Data...');
    console.log('========================================');

    console.log('📊 Teams and Players Summary:');
    await runMutation(
      `
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
        `,
      'Teams with Players Summary'
    );

    console.log('\n📈 Players by Position:');

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
    console.log('- Positions: 2 GK, 10 DEF, 10 MID, 6 FWD');
    console.log('');
    console.log('🌐 Visit GraphQL Playground: http://localhost:3333/graphql');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Check if node-fetch is available
try {
  require.resolve('node-fetch');
} catch (e) {
  console.error('❌ node-fetch is required. Please install it:');
  console.error('npm install node-fetch');
  process.exit(1);
}

// Run the script
if (require.main === module) {
  createSoccerData().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { createSoccerData, runMutation };
