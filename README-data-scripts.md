# Soccer Stats Data Creation Scripts

This repository contains automated scripts to populate your Soccer Stats API with sample data (2 teams with 14 players each).

## Prerequisites

1. **Soccer Stats API running**: Make sure your API server is running at `http://localhost:3333`
2. **Database connected**: Ensure PostgreSQL database is connected and accessible

## Scripts Available

### 1. Bash/Curl Script (Recommended)

**File**: `create-soccer-data.sh`

**Prerequisites**:

- `curl` (usually pre-installed on Linux/macOS)
- `jq` (for JSON formatting)

**Usage**:

```bash
# Make executable (already done)
chmod +x create-soccer-data.sh

# Run the script
./create-soccer-data.sh
```

**Features**:

- ✅ Beautiful colored output with emojis
- ✅ Error handling and validation
- ✅ Progress tracking
- ✅ Automatic verification queries
- ✅ No external dependencies (except jq for pretty output)

### 2. Node.js Script (Legacy)

**File**: `create-soccer-data.js`

**Prerequisites**:

- Node.js installed
- `npm install node-fetch`

**Usage**:

```bash
npm install node-fetch
node create-soccer-data.js
```

### 3. Modern Node.js Script (ES Modules)

**File**: `create-soccer-data.mjs`

**Prerequisites**:

- Node.js 18+ (uses built-in fetch)

**Usage**:

```bash
node create-soccer-data.mjs
```

**Features**:

- ✅ No external dependencies
- ✅ Modern JavaScript (ES modules)
- ✅ Built-in fetch API

## What Gets Created

### Teams (2):

1. **Manchester United**

   - Colors: Red and White
   - Players: 14 (1 GK, 5 DEF, 5 MID, 3 FWD)

2. **Arsenal FC**
   - Colors: Red and White
   - Players: 14 (1 GK, 5 DEF, 5 MID, 3 FWD)

### Players (28 total):

- **Goalkeepers**: 2 players
- **Defenders**: 10 players
- **Midfielders**: 10 players
- **Forwards**: 6 players

## Sample Output

```
🏟️ Starting Soccer Stats Data Creation...
======================================

📋 Creating Teams...
===================
Running: Manchester United
✅ Manchester United completed successfully

⚽ Creating Manchester United Players...
====================================
Running: David De Gea (GK)
✅ David De Gea (GK) completed successfully
...

🎉 Data creation completed!
=========================
Summary:
- 2 Teams created (Manchester United, Arsenal FC)
- 28 Players created (14 per team)
- Positions: 2 GK, 10 DEF, 10 MID, 6 FWD

🌐 Visit GraphQL Playground: http://localhost:3333/graphql
```

## Verification

After running any script, you can verify the data was created by:

1. **GraphQL Playground**: Visit `http://localhost:3333/graphql`
2. **Sample Query**:

```graphql
query {
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

## Error Handling

All scripts include comprehensive error handling:

- Network connectivity checks
- GraphQL error validation
- Database constraint validation
- Clear error messages with suggestions

## Notes

- **Rate Limiting**: Scripts include small delays between requests to avoid overwhelming the server
- **Idempotent**: Safe to run multiple times (will create duplicates though)
- **Clean Data**: Uses real player names from actual Premier League teams
- **Realistic Structure**: Proper football team composition with appropriate position distribution

## Troubleshooting

### Common Issues:

1. **"Connection refused"**: Make sure the API server is running
2. **"GraphQL errors"**: Check if the database schema is properly set up
3. **"jq not found"**: Install jq: `sudo apt install jq` (Linux) or `brew install jq` (macOS)

### Manual Testing:

You can test individual mutations by copying them from `sample-mutations.md` into the GraphQL Playground at `http://localhost:3333/graphql`.
