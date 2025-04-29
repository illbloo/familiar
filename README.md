# llm-functions
This repo contains some of my local LLM tooling (and by local I mean API calls and configs/data on the local filesystem). It started as a fork of [llm-functions](https://github.com/sigoden/llm-functions) and is starting to become something between dotfiles and TS monorepo.

You probably don't need anything here. This is mostly a scratchpad + I need more public things on my github lol

### dependencies
* [aichat](https://github.com/illbloo/aichat) - llm cli, stores sessions on local filesystem
* [jq](https://github.com/jqlang/jq/tree/master) + [yq](https://github.com/kislyuk/yq) - JSON/YAML processing
* [Bun](https://bun.sh/) - JS runtime / package manager
* [dotfiles](https://github.com/illbloo/dotfiles) - optional(?)

## todo
- [ ] chore: move all this stuff into one repo
- [ ] feat(aichat): improve agent loop
- [ ] feat(aichat): save sessions to postgres by default
- [ ] feat(llmf): scheduled message indexing
- [ ] feat(llmf): scheduled prompts to cache shit / email me (see memory/src/ai/)
- [ ] consider: making things work on Cloudflare Workers while still being self-hostable
