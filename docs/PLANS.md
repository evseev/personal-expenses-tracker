# Autonomous loop

The runner reads a task and its acceptance criteria, launches one maker, runs deterministic commands, then launches a fresh read-only checker with spec, diff, and command results. Failures can trigger up to two maker repair turns. It records model invocations, elapsed time, checks, and decisions. PASS requires current checks and a checker report. Missing evidence is NOT-EARNED.

The runner never uses an API key or bypasses sandbox approvals. It stops on missing authentication, repeated failure, timeout, budget exhaustion, or a checker finding that cannot be repaired within the limit. Resume uses the same checkpoint and remaining budget.

Fallow's structural gate requires zero dead-code, cycle, dependency, or boundary findings. The full audit also reports complexity and style findings to the checker. The gate prints the raw Fallow verdict, even when it differs from the structural verdict. The checker decides whether a quality finding blocks acceptance. This policy follows the accepted plan's separate structural checks and checker review.
