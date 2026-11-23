# LoopForge demo frontend

A deliberately tiny vanilla-JS task app. No dependencies, no build tool, no framework.
It exists for one purpose: to give [LoopForge](https://github.com/Tencent/LoopForge)
a real repository with real tests so you can exercise its delivery SOP end to end.

**Start here:** [`GITHUB_SETUP.md`](GITHUB_SETUP.md) has the full walkthrough —
push to GitHub, connect LoopForge, run the bug-fix SOP, approve at the human
gate, merge the PR and see the requirement flip to done. The sections below
are the short version.

## What is in here

| Path | Purpose |
| --- | --- |
| `src/tasks.js` | Pure task-model logic. Contains **one intentional bug**. |
| `src/app.js` | Minimal DOM layer that calls `src/tasks.js`. |
| `index.html`, `styles.css` | The UI. |
| `tests/tasks.test.js` | 8 tests using `node:test`; 2 fail until the bug is fixed. |
| `scripts/build.mjs` | Copies the static site into `dist/`. |
| `scripts/serve.mjs` | Serves the app on port 4173. |

## Run it locally

Requires Node.js 18 or newer.

```bash
npm test          # expect 2 failures
npm run build     # writes dist/
npm run serve     # open http://localhost:4173
```

## The intentional bug

`filterTasks()` in `src/tasks.js` inverts the status filter:

- `status: 'done'` drops completed tasks instead of returning them
- `status: 'todo'` drops pending tasks instead of returning them

These are covered by the two failing tests
`filterTasks: status=done returns only completed tasks` and
`filterTasks: status=todo returns only pending tasks`.
The other six tests pass from the start. After a correct fix, all eight pass.

Do not fix the bug before running the LoopForge SOP — the failing tests are
what make the run meaningful.

## Validate LoopForge with it

### 1. Make it a git repository

```bash
cd loopforge-demo-frontend
git init
git add .
git commit -m "chore: seed demo project with failing tests"
git remote add origin <your-internal-git-url>
git push -u origin main
```

### 2. Start LoopForge and bind the repo

Follow the LoopForge README (`git clone`, `./start.sh`), create the first
account (it becomes admin), then:

- In personal settings, add an executor key (Codex, Claude Code or OpenCode
  all work; this project does not need CodeBuddy).
- Connect your Git host: GitHub device-flow OAuth, or SSH keys for
  GitLab/Gitea/Gogs.
- Add this repository to a project in LoopForge.

### 3. Run the built-in bug-fix SOP

- Open **流程模板** and copy the built-in **通用缺陷修复** SOP into the project.
- Create a requirement describing the bug, for example:
  "切换“已完成 / 待办”筛选后列表内容反了，请修复并跑测试。"
- Dispatch the requirement to the SOP and watch the run:
  the script node runs `npm test` and should fail, the implementation role
  edits `src/tasks.js`, a separate review role checks the diff, the script
  node runs `npm test` again, and the run pauses at the human gate.
- Approve at **待我确认**, then check that the final node opens a PR/MR
  against your repository.

### 4. What to verify

| LoopForge capability | What to look for |
| --- | --- |
| Script gate | `npm test` exit code is used, not the agent's claim |
| Role separation | The reviewer is a different role from the implementer |
| Human gate | The run stops and waits for your approval |
| Artifacts | Per-node logs and the test output are attached to the run |
| Cost | Token usage is reported for the run |
| Delivery | A PR/MR is opened on this repository |

### 5. Re-run after a fix

Revert `src/tasks.js` to its buggy state to try again:

```bash
git checkout -- src/tasks.js
git commit --amend --no-edit
git push --force-with-lease
```

## License

MIT — use it however you like.
