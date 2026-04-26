# Main Conversation Archive

This file records the main implementation and delivery milestones for the current project direction.

## Project Direction

The project was narrowed into a singleplayer deduction game built around a software delivery team scenario.

Core target:

- Make a playable 1-player version quickly
- Package it into a distributable desktop form
- Simplify language into common software project wording
- Preserve enough deduction, incident, and meeting flow to feel like a complete round

## Major Milestones

### 1. Singleplayer Playable Loop

The project was first pushed from prototype status into a playable browser version.

Key outcomes:

- Human player plus AI teammates
- Core round loop with action, meeting, vote, and ending
- Incident handling and suspicion tracking
- Build verified successfully

Primary code areas:

- `app/src/App.tsx`
- `app/src/game.ts`
- `app/src/types.ts`

### 2. Static Delivery Package

The browser build was turned into a static distributable package.

Key outcomes:

- Relative asset paths for direct local opening
- Release script support
- Zip-style delivery folder generation

Primary script areas:

- `app/scripts/make-release.ps1`
- `app/scripts/make-desktop-release.ps1`

### 3. Desktop Portable Packaging

The project was then packaged as a portable Electron desktop build.

Key outcomes:

- Electron desktop shell entry added
- Portable packaging script added
- Black screen issue fixed by restoring correct `dist/assets` structure
- Packaging script later improved to reuse runtime from an existing portable build

Primary files:

- `app/electron/main.mjs`
- `app/scripts/make-desktop-portable.ps1`

### 4. Lighter 5-Player Rule Set

The original larger setup was simplified into a lighter match.

Key outcomes:

- Reduced to 5 total players
- Reduced to 5 rooms
- Language rewritten into common software project wording
- Opening guide and rules explanation added

### 5. Role-Specific Interactions

The old generic minigame interaction system was replaced.

New direction:

- Crew gets 1 action node per round
- Impostor gets 2 action nodes per round
- Each role has 3 role-matched interaction options
- No retry
- Success/failure is random
- Higher reward means lower success probability

Example changes:

- Product role renamed to software manager
- Developer interactions became code refactor / code review / code optimization style choices
- Similar high/medium/low risk choices were added for other roles

### 6. Round-End and UX Fixes

Several gameplay and UI fixes were applied after hands-on testing.

Key fixes:

- If the human player is voted out, the game ends immediately
- Repair action wording changed from awkward phrasing into more natural text
- Each character now uses a distinct visual accent color
- Character cards and speech cards are easier to scan by color

### 7. GitHub Delivery

The local project was prepared and uploaded to GitHub.

Key outcomes:

- Git installed locally
- Repository initialized from source
- Root `.gitignore` added for source-only tracking
- Remote bound to `who-touched-production-singleplayer`
- Git push issue diagnosed as command-line proxy mismatch
- Local repository Git proxy configured to reuse Clash at `127.0.0.1:7890`
- Repository overview README added and pushed

## Important Delivery Decisions

### Source Tracking Policy

The repository intentionally tracks source files only.

Ignored outputs:

- `app/node_modules/`
- `app/.npm-cache/`
- `app/dist/`
- `app/release/`
- `app/*.tsbuildinfo`

### Desktop Packaging Policy

The desktop package is treated as a generated artifact, not a repository-tracked asset.

This keeps the GitHub repository smaller and makes source review cleaner.

### Network / Git Notes

The environment could open GitHub in the browser, but command-line Git initially failed on port 443.

Final fix:

- Detect local Clash usage
- Use proxy `http://127.0.0.1:7890`
- Store proxy in local repo Git config so future push/pull works inside this repository

## Current State

At the time of this archive:

- The project source has been pushed to GitHub
- The root README has been organized for repository visitors
- The docs folder now contains a clean archive entry for the main implementation history

## Suggested Next Archive Topics

- Add screenshots or GIFs for the GitHub front page
- Add release workflow notes for future builds
- Add balancing notes for role interactions and AI behavior
- Add a desktop distribution checklist

