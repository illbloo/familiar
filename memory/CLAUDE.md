# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Development Commands
- `pnpm build` - Compile TypeScript code
- `pnpm start` - Start the application
- `pnpm test` - Run tests with Vitest
- `pnpm test path/to/test.ts` - Run a single test file
- `pnpm db:generate` - Generate Drizzle ORM migrations
- `pnpm db:migrate` - Apply database migrations
- `pnpm db:studio` - Launch Drizzle database studio

## Code Style Guidelines
- **Imports**: Use ES modules syntax; group and order imports logically
- **Types**: Strong TypeScript typing using Zod schemas; export types with `z.infer<typeof schema>`
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces, snake_case for DB columns
- **Error Handling**: Use try/catch with specific error types; log with console.error; propagate with throw
- **Database**: Use Drizzle ORM patterns; export Select/Insert/Update schema variants
- **File Structure**: Group by feature; follow established patterns in existing modules
- **Functions**: Prefer async/await; use typed parameters; maintain consistent return types
- **API Routes**: Follow Hono patterns with zod validation middleware