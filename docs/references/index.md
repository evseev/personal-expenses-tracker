# References and skill provenance

- [OpenAI harness engineering](https://openai.com/index/harness-engineering/): short `AGENTS.md`, repository knowledge map, executable constraints.
- [Course rubric](https://github.com/koldovsky/2026-agentic-engineering-crash-course-capstone/blob/main/RUBRIC.md): linkable evidence for each claimed practice.
- [Vercel React Best Practices](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices): React implementation and review.
- [ASD-STE100 skill](https://github.com/danyuchn/asd-ste100-skill): clear English for agent instructions.
- [fallow](https://github.com/fallow-rs/fallow): codebase intelligence.

Installed repository-local skills on 2026-10-01 using the Codex skill installer:

- `skills/vercel-react-best-practices/`: upstream `vercel-labs/agent-skills`, skill version 1.0.0. Applied rules: `bundle-barrel-imports` through direct imports, `rerender-derived-state-no-effect` through render-time monthly calculations, and `client-event-listeners` through one scoped online/offline subscription.
- `skills/asd-ste100-skill/`: upstream `danyuchn/asd-ste100-skill` at `master`, skill version 0.4.0. See [the instruction rewrite](../evidence/ste100-example.md).
