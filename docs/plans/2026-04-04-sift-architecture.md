# Sift — Architecture Overview

**Date:** 2026-04-04  
**Status:** Initial scaffold

## Purpose

Sift is a family email intelligence dashboard. It connects to Gmail accounts, processes incoming emails using Claude AI to determine importance, extracts action items, and surfaces quick-reply actions — all in a unified mobile and web interface.

## Stack

| Layer | Technology |
|---|---|
| Mobile / Web app | Expo (React Native + expo-router) |
| Styling | NativeWind (Tailwind for React Native) |
| API | NestJS 11, REST |
| Database | PostgreSQL 15 + TypeORM |
| AI | Anthropic Claude (claude-3-5-haiku for speed) |
| Email provider | Gmail API (Google OAuth2) |
| Auth | Google OAuth2 → JWT |

**Why REST over GraphQL:** Simple request/response patterns for email operations. No deeply nested relational data that would benefit from graph traversal. Keeps the API easy to reason about.

**Why Expo:** Single codebase for iOS, Android, and web. NativeWind makes Tailwind utility classes work across all targets.

## Project Structure

```
apps/sift/
├── api/          ← NestJS REST API (port 3334)
└── mobile/       ← Expo app (iOS, Android, Web)

libs/sift/
├── types/        ← Shared TypeScript interfaces & enums
└── utils/        ← Shared utility functions (date formatting, etc.)
```

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| GET | /api/auth/google | Initiate Google OAuth flow |
| GET | /api/auth/google/callback | OAuth callback, issues JWT |
| GET | /api/auth/me | Get current user (requires JWT) |

### Accounts
| Method | Path | Description |
|---|---|---|
| GET | /api/accounts | List connected email accounts |
| GET | /api/accounts/:id | Get account details |
| POST | /api/accounts | Connect a new email account |
| DELETE | /api/accounts/:id | Disconnect an account (soft delete) |

### Emails
| Method | Path | Description |
|---|---|---|
| GET | /api/emails | List emails (filter: accountId, status, importance) |
| GET | /api/emails/:id | Get email detail |
| POST | /api/emails/sync | Trigger Gmail sync for an account |
| POST | /api/emails/:id/classify | Run AI classification on an email |
| PATCH | /api/emails/:id/status | Update read/archived/actioned status |

### Actions
| Method | Path | Description |
|---|---|---|
| GET | /api/actions | List action items (filter: userId, completed) |
| GET | /api/actions/:id | Get action detail |
| PATCH | /api/actions/:id/complete | Mark action as complete |

## Data Model

### EmailAccount
- `id` (uuid)
- `userId` — owner of this account connection
- `email` — the Gmail address
- `provider` — `gmail` | `outlook`
- `accessToken`, `refreshToken`, `tokenExpiresAt` — OAuth tokens (encrypted at rest in production)
- `isActive` — soft delete flag

### Email
- `id` (uuid)
- `accountId` — which account fetched this email
- `gmailMessageId` — dedup key
- `subject`, `fromAddress`, `fromName`, `bodySnippet`, `bodyHtml`
- `receivedAt`
- `importance` — `high` | `medium` | `low` | `spam` (set by AI)
- `importanceReason` — Claude's brief explanation
- `status` — `unread` | `read` | `actioned` | `archived`
- `actionItems` — JSONB array of extracted action items
- `draftReply` — AI-drafted reply text
- `classified` — whether AI has processed this email

### Action
- `id` (uuid)
- `emailId` — source email
- `userId`
- `type` — `reply` | `forward` | `calendar_event` | `task` | `review`
- `description`
- `draftContent` — pre-written reply or calendar event details
- `dueDate`
- `completed`, `completedAt`

## AI Pipeline

1. **Fetch** — Gmail API pulls new messages for an account (triggered by sync)
2. **Store** — Emails saved raw to DB with `classified: false`
3. **Classify** — Claude prompt:
   - Input: subject, from, body snippet
   - Output: `{ importance: "high"|"medium"|"low"|"spam", reason: string, actionItems: [...], draftReply?: string }`
   - Model: `claude-3-5-haiku-20241022` (fast, cheap, handles email volume)
4. **Persist** — Update email record with AI output, create Action rows
5. **Surface** — Mobile app shows badge counts, sorted by importance

### Classification Prompt Strategy
```
You are an email triage assistant for a busy family.

Classify this email:
Subject: {subject}
From: {from}
Body: {snippet}

Respond with JSON:
{
  "importance": "high" | "medium" | "low" | "spam",
  "reason": "one sentence explanation",
  "actionItems": [{ "description": "...", "type": "reply|task|review|calendar_event", "dueDate": "ISO date or null" }],
  "draftReply": "optional pre-written reply if action type is reply"
}

High = requires action within 24-48h (deadlines, permissions, urgent requests)
Medium = informational but worth reading
Low = newsletters, shipping notifications, receipts
Spam = marketing, promotions
```

## Next Steps

1. Set up Google Cloud project → enable Gmail API + OAuth 2.0
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`
3. Implement passport-google-oauth20 in AuthModule
4. Implement Gmail API client in EmailsService (sync + fetch)
5. Implement AnthropicService for classification
6. Wire up mobile app to real API (replace placeholder data)
7. Add user entity + JWT guard to protect routes
