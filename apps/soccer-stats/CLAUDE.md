# Soccer Stats Tracker

Full-stack youth soccer statistics tracking system.

**Architecture Pattern:**

- **Backend:** NestJS with GraphQL API (Apollo Server)
- **Frontend:** React with Apollo Client
- **Database:** PostgreSQL with TypeORM entities
- **Code Generation:** GraphQL Code Generator for type-safe queries/mutations

See `api/CLAUDE.md` for backend/DataLoader conventions and `ui/CLAUDE.md` for GraphQL codegen and frontend patterns.

**Key Entities & Relationships:**

- **User:** Authentication and profile
- **Team:** Can be managed (with roster) or unmanaged (ad-hoc)
- **TeamPlayer/TeamCoach:** Junction tables for team rosters
- **Game:** Tracks matches with format, teams, and statistics
- **GameFormat:** Defines rules (e.g., 3v3, 5v5, duration)
