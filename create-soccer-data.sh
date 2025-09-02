#!/bin/bash

# GraphQL Mutations Script - Bash/Curl Version
# This script automatically creates 2 teams with 14 players each and links them with jersey numbers
#
# NOTE: For full TeamPlayer association functionality with jersey numbers,
# use the Node.js version: node create-soccer-data.mjs
# This shell script creates the basic data but linking players to teams
# requires complex ID tracking that is better handled in the Node.js version.

GRAPHQL_URL="http://localhost:3333/graphql"
CONTENT_TYPE="Content-Type: application/json"

# Storage for IDs
TEMP_DIR="/tmp/soccer-data-$$"
mkdir -p "$TEMP_DIR"

echo "🏟️ Starting Soccer Stats Data Creation..."
echo "======================================"
echo "ℹ️  Note: This creates teams and players only."
echo "   For full team-player linking with jersey numbers, use:"
echo "   node create-soccer-data.mjs"
echo ""

# Function to run GraphQL mutation and capture result
run_mutation_with_capture() {
    local query="$1"
    local name="$2"
    local output_file="$3"
    
    echo "Running: $name"
    
    response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "$CONTENT_TYPE" \
        -d "$query")
    
    # Save response to file if specified
    if [ -n "$output_file" ]; then
        echo "$response" > "$TEMP_DIR/$output_file"
    fi
    
    # Check if the response contains errors
    if echo "$response" | grep -q "errors"; then
        echo "❌ Error in $name:"
        echo "$response" | jq '.errors'
        return 1
    else
        echo "✅ $name completed successfully"
        echo "$response" | jq '.data'
        return 0
    fi
}

# Function to run GraphQL mutation
run_mutation() {
    run_mutation_with_capture "$1" "$2" ""
}

# Create Teams
echo ""
echo "📋 Creating Teams..."
echo "==================="

# Team 1 - Manchester United
run_mutation_with_capture '{
    "query": "mutation CreateTeam1 { createTeam(createTeamInput: { name: \"Manchester United\", colors: \"Red and White\", logo: \"https://logos.world/images/ManUtd/ManUtd-logo.png\" }) { id name colors logo createdAt } }"
}' "Manchester United" "team1.json"

# Extract team ID
TEAM1_ID=$(cat "$TEMP_DIR/team1.json" | jq -r '.data.createTeam.id')
echo "💾 Stored Manchester United ID: $TEAM1_ID"

# Team 2 - Arsenal FC
run_mutation_with_capture '{
    "query": "mutation CreateTeam2 { createTeam(createTeamInput: { name: \"Arsenal FC\", colors: \"Red and White\", logo: \"https://logos.world/images/Arsenal-FC/Arsenal-FC-logo.png\" }) { id name colors logo createdAt } }"
}' "Arsenal FC" "team2.json"

# Extract team ID
TEAM2_ID=$(cat "$TEMP_DIR/team2.json" | jq -r '.data.createTeam.id')
echo "💾 Stored Arsenal FC ID: $TEAM2_ID"

echo ""
echo "⚽ Creating Manchester United Players..."
echo "======================================"

# Manchester United Players
run_mutation '{
    "query": "mutation CreatePlayer1 { createPlayer(createPlayerInput: { name: \"David De Gea\", position: \"Goalkeeper\" }) { id name position createdAt } }"
}' "David De Gea (GK)"

run_mutation '{
    "query": "mutation CreatePlayer2 { createPlayer(createPlayerInput: { name: \"Harry Maguire\", position: \"Defender\" }) { id name position createdAt } }"
}' "Harry Maguire (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer3 { createPlayer(createPlayerInput: { name: \"Raphael Varane\", position: \"Defender\" }) { id name position createdAt } }"
}' "Raphael Varane (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer4 { createPlayer(createPlayerInput: { name: \"Luke Shaw\", position: \"Defender\" }) { id name position createdAt } }"
}' "Luke Shaw (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer5 { createPlayer(createPlayerInput: { name: \"Aaron Wan-Bissaka\", position: \"Defender\" }) { id name position createdAt } }"
}' "Aaron Wan-Bissaka (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer6 { createPlayer(createPlayerInput: { name: \"Lisandro Martinez\", position: \"Defender\" }) { id name position createdAt } }"
}' "Lisandro Martinez (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer7 { createPlayer(createPlayerInput: { name: \"Bruno Fernandes\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Bruno Fernandes (MID)"

run_mutation '{
    "query": "mutation CreatePlayer8 { createPlayer(createPlayerInput: { name: \"Casemiro\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Casemiro (MID)"

run_mutation '{
    "query": "mutation CreatePlayer9 { createPlayer(createPlayerInput: { name: \"Christian Eriksen\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Christian Eriksen (MID)"

run_mutation '{
    "query": "mutation CreatePlayer10 { createPlayer(createPlayerInput: { name: \"Fred\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Fred (MID)"

run_mutation '{
    "query": "mutation CreatePlayer11 { createPlayer(createPlayerInput: { name: \"Scott McTominay\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Scott McTominay (MID)"

run_mutation '{
    "query": "mutation CreatePlayer12 { createPlayer(createPlayerInput: { name: \"Marcus Rashford\", position: \"Forward\" }) { id name position createdAt } }"
}' "Marcus Rashford (FWD)"

run_mutation '{
    "query": "mutation CreatePlayer13 { createPlayer(createPlayerInput: { name: \"Anthony Martial\", position: \"Forward\" }) { id name position createdAt } }"
}' "Anthony Martial (FWD)"

run_mutation '{
    "query": "mutation CreatePlayer14 { createPlayer(createPlayerInput: { name: \"Jadon Sancho\", position: \"Forward\" }) { id name position createdAt } }"
}' "Jadon Sancho (FWD)"

echo ""
echo "🔴 Creating Arsenal FC Players..."
echo "==============================="

# Arsenal FC Players
run_mutation '{
    "query": "mutation CreatePlayer15 { createPlayer(createPlayerInput: { name: \"Aaron Ramsdale\", position: \"Goalkeeper\" }) { id name position createdAt } }"
}' "Aaron Ramsdale (GK)"

run_mutation '{
    "query": "mutation CreatePlayer16 { createPlayer(createPlayerInput: { name: \"William Saliba\", position: \"Defender\" }) { id name position createdAt } }"
}' "William Saliba (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer17 { createPlayer(createPlayerInput: { name: \"Gabriel Magalhaes\", position: \"Defender\" }) { id name position createdAt } }"
}' "Gabriel Magalhaes (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer18 { createPlayer(createPlayerInput: { name: \"Ben White\", position: \"Defender\" }) { id name position createdAt } }"
}' "Ben White (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer19 { createPlayer(createPlayerInput: { name: \"Kieran Tierney\", position: \"Defender\" }) { id name position createdAt } }"
}' "Kieran Tierney (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer20 { createPlayer(createPlayerInput: { name: \"Takehiro Tomiyasu\", position: \"Defender\" }) { id name position createdAt } }"
}' "Takehiro Tomiyasu (DEF)"

run_mutation '{
    "query": "mutation CreatePlayer21 { createPlayer(createPlayerInput: { name: \"Martin Odegaard\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Martin Odegaard (MID)"

run_mutation '{
    "query": "mutation CreatePlayer22 { createPlayer(createPlayerInput: { name: \"Thomas Partey\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Thomas Partey (MID)"

run_mutation '{
    "query": "mutation CreatePlayer23 { createPlayer(createPlayerInput: { name: \"Granit Xhaka\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Granit Xhaka (MID)"

run_mutation '{
    "query": "mutation CreatePlayer24 { createPlayer(createPlayerInput: { name: \"Emile Smith Rowe\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Emile Smith Rowe (MID)"

run_mutation '{
    "query": "mutation CreatePlayer25 { createPlayer(createPlayerInput: { name: \"Fabio Vieira\", position: \"Midfielder\" }) { id name position createdAt } }"
}' "Fabio Vieira (MID)"

run_mutation '{
    "query": "mutation CreatePlayer26 { createPlayer(createPlayerInput: { name: \"Bukayo Saka\", position: \"Forward\" }) { id name position createdAt } }"
}' "Bukayo Saka (FWD)"

run_mutation '{
    "query": "mutation CreatePlayer27 { createPlayer(createPlayerInput: { name: \"Gabriel Jesus\", position: \"Forward\" }) { id name position createdAt } }"
}' "Gabriel Jesus (FWD)"

run_mutation '{
    "query": "mutation CreatePlayer28 { createPlayer(createPlayerInput: { name: \"Gabriel Martinelli\", position: \"Forward\" }) { id name position createdAt } }"
}' "Gabriel Martinelli (FWD)"

echo ""
echo "✅ Verification - Checking Created Data..."
echo "========================================"

# Verification queries
echo "📊 Teams and Players Summary:"
run_mutation '{
    "query": "query VerifyTeamsAndPlayers { teams { id name colors players { id name position } } }"
}' "Teams with Players Summary"

echo ""
echo "📈 Players by Position:"
run_mutation '{
    "query": "query CheckGoalkeepers { playersByPosition(position: \"Goalkeeper\") { id name position } }"
}' "Goalkeepers Count"

run_mutation '{
    "query": "query CheckDefenders { playersByPosition(position: \"Defender\") { id name position } }"
}' "Defenders Count"

run_mutation '{
    "query": "query CheckMidfielders { playersByPosition(position: \"Midfielder\") { id name position } }"
}' "Midfielders Count"

run_mutation '{
    "query": "query CheckForwards { playersByPosition(position: \"Forward\") { id name position } }"
}' "Forwards Count"

echo ""
echo "🎉 Data creation completed!"
echo "========================="
echo "Summary:"
echo "- 2 Teams created (Manchester United, Arsenal FC)"
echo "- 28 Players created (14 per team)"
echo "- Positions: 2 GK, 10 DEF, 10 MID, 6 FWD"
echo ""
echo "⚠️  Players are NOT linked to teams yet!"
echo "   To create team-player associations with jersey numbers:"
echo "   node create-soccer-data.mjs"
echo ""
echo "🌐 Visit GraphQL Playground: http://localhost:3333/graphql"

# Cleanup
rm -rf "$TEMP_DIR"
