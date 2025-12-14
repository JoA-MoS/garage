#!/usr/bin/env node

// Simple test script to verify our updated GraphQL queries
// Using built-in fetch (Node.js 18+)

const GRAPHQL_ENDPOINT = 'http://localhost:3333/graphql';

async function testQuery(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ Query failed:', result.errors);
      return false;
    } else {
      console.log('✅ Query successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing updated GraphQL queries...\n');

  // Test 1: Get Game Formats
  console.log('1. Testing GET_GAME_FORMATS...');
  const success1 = await testQuery(`
    query GetGameFormats {
      gameFormats {
        id
        name
        playersPerTeam
        durationMinutes
        description
        allowsSubstitutions
        maxSubstitutions
        createdAt
        updatedAt
      }
    }
  `);

  // Test 2: Get Teams
  console.log('\n2. Testing GET_TEAMS...');
  const success2 = await testQuery(`
    query GetTeams {
      teams {
        id
        name
        shortName
        description
        homePrimaryColor
        homeSecondaryColor
        awayPrimaryColor
        awaySecondaryColor
        logoUrl
        isActive
        isManaged
        sourceType
        createdAt
        updatedAt
      }
    }
  `);

  // Test 3: Get Players
  console.log('\n3. Testing GET_PLAYERS...');
  const success3 = await testQuery(`
    query GetPlayers {
      players {
        id
        firstName
        lastName
        email
        dateOfBirth
        phone
        isActive
        createdAt
        updatedAt
      }
    }
  `);

  // Test 4: Get Games
  console.log('\n4. Testing GET_GAMES...');
  const success4 = await testQuery(`
    query GetGames {
      games {
        id
        name
        scheduledStart
        notes
        venue
        weatherConditions
        gameFormat {
          id
          name
          playersPerTeam
          durationMinutes
        }
        createdAt
        updatedAt
      }
    }
  `);

  const totalTests = 4;
  const passedTests = [success1, success2, success3, success4].filter(
    Boolean
  ).length;

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All queries are working correctly!');
  } else {
    console.log('⚠️ Some queries need fixing.');
  }
}

runTests().catch(console.error);
