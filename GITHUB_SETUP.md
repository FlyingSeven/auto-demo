# Push to GitHub and run a realistic LoopForge scenario

This guide takes you from a local folder to a full LoopForge delivery run:
failing tests → agent fix → independent review → human approval → PR on GitHub →
merge detected → requirement marked done.

Everything below assumes Node.js 18+ and a working `git`.

---

## Part 1 — Push this project to GitHub

### 1a. Create an empty repository on GitHub

Do **not** add a README, `.gitignore` or license when creating it — this project
already has all three. Create it as a completely empty repository.

Note the two values GitHub shows you:
- HTTPS URL, e.g. `https://github.com/<you>/loopforge-demo-frontend.git`
- SSH URL, e.g. `git@github.com:<you>/loopforge-demo-frontend.git`

### 1b. Initialize and push from your machine

```bash
cd /Users/shaun/WorkBuddy/2026-11-23-13-44-56/loopforge-demo-frontend

git init
git add .
git commit -m "chore: seed demo project with intentional filter bug"

# Choose ONE remote style:
# HTTPS (works with the LoopForge built-in OAuth device flow):
git remote add origin https://github.com/<you>/loopforge-demo-frontend.git

# Or SSH (needs a personal key registered in LoopForge later):
# git remote add origin git@github.com:<you>/loopforge-demo-frontend.git

git branch -M main
git push -u origin main
```

### 1c. Confirm the baseline is "red"

```bash
npm test
```

Expected: **8 tests, 2 failed, 6 passed**. The two failures must be:
- `filterTasks: status=done returns only completed tasks`
- `filterTasks: status=todo returns only pending tasks`

Do not fix them. The failing tests are the whole point of the exercise.

---

## Part 2 — Configure LoopForge

### 2a. Start LoopForge (if not already running)

```bash
git clone --branch v0.4.0 https://github.com/Tencent/LoopForge.git
cd LoopForge
./start.sh
```

Open the printed address (default `http://<host>:8090`), create the first
account — it becomes the administrator. If you are on a Chinese network and
`ghcr.io` stalls: `MIRROR=ghcr.nju.edu.cn ./start.sh`.

### 2b. Add an executor key

Go to **Personal settings / 个人配置** and add credentials for one executor.
This project needs no CodeBuddy; pick one of:

- **Codex** — bundled in the image, personal key
- **Claude Code** — installed from npm on first use, personal key
- **OpenCode** — installed from npm on first use, personal key + Base URL

Set it as your default executor. Verify on the home page that a short chat
turn gets a real reply before continuing.

### 2c. Connect GitHub

In **Personal settings** click **Connect GitHub**. LoopForge uses its built-in
OAuth app with a device code — you copy the PIN, approve on GitHub, and the
grant is saved automatically. No PAT and no OAuth app registration needed.
The requested scope is `repo`, so the account needs write access to the repo.

If you use a self-managed Git host or prefer SSH, register a personal SSH key
under **Git SSH keys**, and have the administrator confirm the host key under
**Platform administration → Git SSH Host Trust**.

### 2d. Create a project and bind the repository

1. Create a project (e.g. `loopforge-validation`).
2. Add the repository: choose the GitHub repo you just pushed.
3. Copy the built-in **通用缺陷修复 / Generic bug fix** SOP from **流程模板**
   into this project. Built-in SOPs are read-only blueprints; you need a copy.

---

## Part 3 — Run the realistic scenario

### 3a. Create the requirement

Create a requirement on the project, titled for example:

> Switching the "Done / To do" filter returns the opposite list.

Description:

> On the task page, selecting "Done" shows pending tasks and selecting
> "To do" shows completed ones. Fix `filterTasks` in `src/tasks.js` and make
> sure `npm test` passes. Keep the other filter behaviours unchanged.

Acceptance criteria: `npm test` green, 8/8 tests, no change to priority or
query filtering.

### 3b. Dispatch to the SOP and watch the run

Dispatch the requirement to the copied bug-fix SOP. In the run detail page you
should observe this sequence:

| Stage | What to look for |
| --- | --- |
| Clarification / design | An agent role restates the bug and proposes a fix |
| Implementation | A different role edits `src/tasks.js` |
| Script gate | `npm test` runs as a **script node** — the exit code decides, not the agent's claim |
| Independent review | A separate reviewer role reads the diff; it is not the implementer |
| Script gate again | `npm test` now passes |
| Human gate | The run **stops** and appears in **待我确认 / Needs review** |

### 3c. Approve the human gate

Open **待我确认**, inspect the artifacts (diff, test log), then approve. If the
fix looks wrong, use "send back" to a chosen step instead — note that returned
commits are **not** automatically reverted, so check the branch history.

After approval, the delivery node commits, pushes a feature branch and opens a
PR/MR on GitHub. The run detail page shows the node status, tool traces, logs
and per-node artifacts.

### 3d. Close the loop on GitHub

Open the PR on GitHub, review and merge it into `main`. LoopForge polls PR
status, so the requirement should flip to **done** once the merge is detected.
Then check:

- **Statistics**: token usage and cost attributed to this run
- **Requirement list**: the change linked back to the original requirement
- **Run history**: the full node-by-node record

---

## Part 4 — Make it feel real (optional second run)

Once the first run is done, try a second requirement that is **not** a bug fix,
to exercise the delivery SOP rather than the bug-fix SOP:

> Add an "Urgent" priority filter option to the toolbar.

Copy the built-in **通用前端交付 / Generic frontend delivery** SOP, dispatch the
requirement, and verify the same gates apply: script tests, independent review,
human sign-off, PR.

You can also try the **Main Bot** chat path on the same repo: describe a small
change in chat, watch it open a conversation workspace, edit code, and open a
PR — then compare that with the fixed SOP path in terms of traceability.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `no model "default"` / 404 from gateway | Known issue #1226: composer sends the `default` sentinel | Hard-reload the page, or enter a concrete model ID manually |
| "Server does not have ZCode installed" | ZCode selected as executor but binary missing | Switch executor to Codex/Claude Code/OpenCode in personal settings or the role |
| Claude Code chat returns 400 | Known issue #986 (key mismatch in catalog) | Try another executor or a newer release |
| `409 repository_required` | A SOP that needs source code was run without a repo | Bind the repository to the project first |
| Executor says "need to specify model" | Known issue #994: role saved with empty model | Set an explicit model on the role |
| PR not detected after merge | Polling delay, or merge into a non-default branch | Wait, or check PR status action / MCP adapter |

---

## Reset for another dry run

To put the repository back into its original buggy state:

```bash
git checkout main
git pull
git checkout -b reset-demo
git checkout <initial-commit-sha> -- src/tasks.js
git commit -m "test: restore intentional bug"
git push origin reset-demo
```

Or simply re-clone the folder and repeat Part 1.
