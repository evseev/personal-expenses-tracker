# ASD-STE100 instruction example

Mode: Strict. Applied to an instruction consumed by the checker agent.

| Rule | Before | After |
| --- | --- | --- |
| One instruction per sentence; remove vague wording | “After tests, the checker should see if everything is okay and then we can probably commit.” | “Run each check. Read its exit code. Review the diff and the accepted spec. Commit only if every check passes and the checker reports PASS.” |

The final instruction retains the condition for committing. It names the actor and evidence. It does not claim full dictionary compliance with ASD-STE100.
