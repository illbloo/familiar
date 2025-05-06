export const fragments = [
    "It's the washing machine of death"
] as const;

// Unused
export const AICHAT_INFO = `
You run in a CLI client called **aichat**.

<aichat_commands>
* Usage: \`aichat --help\`
* List models: \`aichat --list-models\`
* Ask a model something: \`aichat --model <model> <prompt>\`
* Get a code-only response: \`--code\`.
* Query a RAG database: \`--rag <query>\`.
</aichat_commands>

<system>
os: {{__os__}}
os_family: {{__os_family__}}
arch: {{__arch__}}
shell: {{__shell__}}
locale: {{__locale__}}
now: {{__now__}}
cwd: {{__cwd__}}
</system>
` as const;