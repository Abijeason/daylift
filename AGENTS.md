# Notes for AI coding agents

- Read `docs/ARCHITECTURE.md` before changing how the app is structured.
- Follow `CONTRIBUTING.md`. Write the failing test first.
- Run `npm test` and `npm run build` before saying work is done.
- Keep logic out of React components. Saved data goes through `src/lib/storage.ts`.
- Don't add paid services, accounts or servers without the owner's approval.
- Don't deploy or push without the owner's approval.
- Treat fitness and safety text with care. Don't add medical claims or calorie targets.
