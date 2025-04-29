# llm-familiar
This repo contains some of my personal LLM tooling. It started as a fork of [llm-functions](https://github.com/sigoden/llm-functions) and is starting to become something between dotfiles and TS monorepo.

Not much to see here. This is mostly a scratchpad + public archive because I need more public things on my github lol.

### dependencies
* [aichat](https://github.com/illbloo/aichat) - llm cli client (fork)
* [jq](https://github.com/jqlang/jq/tree/master) + [yq](https://github.com/kislyuk/yq) - JSON/YAML processing
* [Bun](https://bun.sh/) - JS runtime / package manager
* [argc](https://github.com/sigoden/argc) - Bash CLI framework
* [dotfiles](https://github.com/illbloo/dotfiles) - optional(?)

## todo
- [ ] chore: finish monorepo-ifying and general cleanup
- [ ] feat(aichat): improve agent loop
- [ ] feat(aichat): read/write chat sessions to postgres
- [ ] feat(aichat): dynamic prompting
- [ ] feat(llmf): store sysprompt templates, more dynamic prompting
- [ ] feat(llmf): scheduled message indexing
- [ ] feat(llmf): scheduled prompts to cache shit / email me (see memory/src/ai/)
- [ ] consider: making things work on Cloudflare Workers while still being self-hostable
