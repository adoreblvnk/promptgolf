# LeetCode-Style Product UI Evidence

## Objective

Make PromptGolf read immediately as an online judge for AI-era software specifications: dense problem discovery, a split problem/spec workspace, submission-oriented results, and PromptGolf golf scoring as the differentiated layer.

## Public Research

- LeetCode problem set: https://leetcode.com/problemset/
- LeetCode Two Sum workspace: https://leetcode.com/problems/two-sum/description/
- LeetCode coding-practice guide: https://support.leetcode.com/hc/en-us/articles/360012016874-Start-your-Coding-Practice
- LeetCode quick-start guide: https://support.leetcode.com/hc/en-us/articles/360012067053-LeetCode-QuickStart-Guide
- LeetCode contests: https://leetcode.com/contest/
- HackerRank algorithms catalogue: https://www.hackerrank.com/domains/algorithms
- HackerRank challenge workspace: https://www.hackerrank.com/challenges/solve-me-first/problem?isFullScreen=true
- Codeforces problem set: https://codeforces.com/problemset
- AtCoder task list: https://atcoder.jp/contests/abc414/tasks
- AtCoder problem statement: https://atcoder.jp/contests/abc414/tasks/abc414_a

Direct browser access to LeetCode's problem-set and problem routes was challenged by Cloudflare in the research environment. Public page extraction returned shell metadata only, so structural evidence came from LeetCode's official help documentation and comparison against directly accessible HackerRank, Codeforces, and AtCoder pages.

## Extracted Conventions

- Catalogues prioritize dense rows, status, title, taxonomy, difficulty, acceptance/solves, and sortable numeric metadata.
- Problem workspaces separate the statement from the editable submission surface and keep both available without route changes.
- Description, solution/guide, submissions/results, discussion, and editorial/evaluation are stable tab concepts across judges.
- Run is a debugging or preflight action; when no non-consequential execution path exists, label local checks precisely instead of presenting a fake Run action. Submit is the consequential judged action and receives stronger emphasis.
- Results distinguish execution state from final verdict and retain submission history rather than replacing it.
- Problem statements use predictable sections: statement, requirements or constraints, examples, and metadata.
- Mobile interfaces collapse panes deliberately rather than shrinking a desktop split or turning every row into a large card.

PromptGolf-specific choices: amber marks the consequential golf/submission action; green marks passing and under-par; scorecards retain round, par, strokes, handicap, hidden checks, and prompt efficiency. No LeetCode logos, trademarks, proprietary assets, or source code were copied.

## Local Reference

Read-only reference: `/home/adoreblvnk/Documents/promptgolf`.

Useful ideas inspected: dense `catalog-board.tsx` rows, `arena-shell.tsx` mobile pane switching, compact shell navigation, challenge metadata, golf score terminology, and the rule that game imagery should not leak into task-focused surfaces.

No assets were copied. The reference repository had no root license file.

## Screenshots

Before and after captures are stored under:

- `evidence/leetcode-product-ui/before/desktop/`
- `evidence/leetcode-product-ui/before/mobile/`
- `evidence/leetcode-product-ui/after/desktop/`
- `evidence/leetcode-product-ui/after/mobile/`

Captured routes cover `/challenges`, `/challenges/mini-checkout-promo-engine`, `/runs/naive-checkout`, `/runs`, and `/leaderboard` where applicable. No OpenAI or Daytona run was started for visual verification.

## Post-review verification

- Replaced fabricated acceptance data with optional measured metadata; unavailable values render as `—`.
- Scoped worked contracts to the challenge that owns them.
- Renamed seeded-run verdicts from `Accepted` to `Scored` because partial hidden-test runs remain valid benchmark rounds.
- Replaced the length-only `Run` affordance with an explicit `Check length` action and corrected the `Ctrl/⌘ Enter` shortcut label.
- Replaced the mobile live-problem checkmark with an availability indicator.
- `npm test`: 18 files, 129 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed, 28 pages generated.
- Focused desktop/mobile Playwright verification: 8 route/viewport checks passed, with no console errors, failed requests, horizontal overflow, leaked checkout contracts, fabricated acceptance, or false Accepted verdicts.
