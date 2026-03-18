# Instructions

- Avoid code duplication as much as possible
- Have single sources of truth, especially for data models
- Prioritize type safety: ask for confirmation before using `as` keyword or similar escape hatches
- Use `npm run` to check available commands; never use `npx` commands directly
- After making changes to the backend endpoints, regenerate the types by using relevant backend and frontend commands
- frontend: use this [link](https://www.shadcn-svelte.com/llms.txt) to view the documentation
    - install components as needed
    - try to use components as much as possible instead of reimplementing them from scratch
    - always use `resolve` from `$app/paths` for links
    - use `+page.ts`/`+layout.ts` for loading data whenever possible
- backend
    - always validate database outputs with Zod
