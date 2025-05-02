# familiar ^_^
my personal llm tooling!

this began as a curious fork of [llm-functions](https://github.com/sigoden/llm-functions) but started morphing into a TypeScript monorepo. this is home to memory, tools, and prompts - see [aichat](https://github.com/illbloo/aichat) for the Rust client, agent runner, etc~

### dependencies
* [jq](https://github.com/jqlang/jq/tree/master) + [yq](https://github.com/kislyuk/yq) - JSON/YAML processing
* [Bun](https://bun.sh/) - JS runtime / package manager
* [argc](https://github.com/sigoden/argc) - Bash CLI framework
* [dotfiles](https://github.com/illbloo/dotfiles) - optional(?)

## todo
- [ ] chore: finish monorepo-ifying
- [ ] chore: remove unused bash scripts
- [ ] chore: bring things closer together
- [ ] aichat: improve agent loop
- [x] aichat: read/write chat sessions to postgres
- [ ] aichat: parallel tool calls
- [ ] llmf: store system prompts + agent data
- [ ] llmf: more dynamic prompting
- [ ] llmf: add actual message queue
- [ ] llmf: scheduled prompts for reflecting, optimizing, spamming me, etc
- [ ] later: web client
- [ ] later: make familiars real
- [ ] consider: make things work on Cloudflare Workers while still being self-hostable (ws room?)
