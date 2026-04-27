# Who Touched Production Singleplayer

Singleplayer deduction game set in a software project delivery scene.

You play one role inside a small dev team and try to survive a round of project chaos before release. The normal side must keep the project stable and identify the saboteur. The impostor side tries to create incidents, waste time, and survive the vote.

## Current Version

This repo currently contains a playable singleplayer version with:

- 1 human player + 4 AI teammates
- 5 roles: developer, backend, QA, software manager, intern
- 5 rooms and lighter project language
- Hidden faction assignment
- Incident handling, meetings, voting, and win/lose endings
- Role-specific interaction choices for task and repair actions
- Desktop portable packaging support

## Rules Snapshot

- Crew characters get 1 action node per round
- Impostor characters get 2 action nodes per round
- Task and repair actions require choosing 1 of 3 role-specific interactions
- Interactions cannot be retried
- Higher risk means lower success rate and higher reward
- If the player is voted out, the run ends immediately

## Project Structure

- `app/`: main playable project
- `docs/`: project docs, archives, and design materials

Docs entry points:

- `docs/README.md`: docs index
- `docs/project-design-document.md`: current project design document
- `docs/project-raw-data-document.md`: current raw data and rule data document
- `docs/agent-conversation-log.md`: reconstructed agent collaboration record
- `docs/main-conversation-archive.md`: major implementation and delivery archive
- `docs/programmer-werewolf-design.md`: historical design notes

Important app files:

- `app/src/App.tsx`: main UI and flow
- `app/src/game.ts`: game state machine and AI logic
- `app/src/types.ts`: core data types
- `app/src/styles.css`: visual styling
- `app/electron/main.mjs`: desktop shell entry
- `app/scripts/make-desktop-portable.ps1`: portable desktop packaging

## Local Development

From `app/`:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Delivery Outputs

Static release:

```bash
npm run release
```

Portable desktop build:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\make-desktop-portable.ps1
```

Generated outputs are ignored from git on purpose:

- `app/dist/`
- `app/release/`

## Notes

- This repository tracks source files, not build artifacts
- The desktop package can be regenerated locally from source
- The docs folder keeps the design context for the project
- Main implementation history is summarized in `docs/main-conversation-archive.md`
- The Chinese project documentation set now includes design, raw data, and agent conversation records in `docs/`
