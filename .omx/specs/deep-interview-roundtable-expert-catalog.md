# Execution Spec Addendum: Roundtable Expert Catalog And Routing

## Metadata

- Source workflow: `$deep-interview`
- Profile: standard
- Context type: greenfield delta
- Final ambiguity: 16%
- Threshold: 20%
- Context snapshot: `.omx/context/roundtable-expert-catalog-20260501T011035Z.md`
- Transcript: `.omx/interviews/roundtable-expert-catalog-20260501T012550Z.md`
- Base spec: `.omx/specs/deep-interview-roundtable-expert-skills.md`
- Base approved plan: `.omx/plans/roundtable-expert-skills-ralplan-final.md`

## Intent

Amend the roundtable MVP so it ships with a richer expert catalog and can automatically recommend multiple relevant experts for a user's question, while preserving the first-pass safety boundary around external skill installation.

## Desired Outcome

The MVP should:

1. Include 13 built-in expert/persona presets.
2. Let the user enter a question.
3. Recommend `Top 3` experts from built-in plus user-added presets.
4. Let the user manually add or edit local skill presets.
5. Let the user manually adjust the recommended expert set before generating a discussion.
6. Require at least 2 selected experts to generate the roundtable.

## Built-In Expert Presets

The first-pass catalog should include:

| Expert | Domain | Skill id | Source command metadata |
| --- | --- | --- | --- |
| Paul Graham | 创业 / 写作 / 产品 / 人生哲学 | `paul-graham-skill` | `npx skills add alchaincyf/paul-graham-skill` |
| 张一鸣 | 产品 / 组织 / 全球化 / 人才 | `zhang-yiming-skill` | `npx skills add alchaincyf/zhang-yiming-skill` |
| Karpathy | AI / 工程 / 教育 / 开源 | `karpathy-skill` | `npx skills add alchaincyf/karpathy-skill` |
| Ilya Sutskever | AI安全 / scaling / 研究品味 | `ilya-sutskever-skill` | `npx skills add alchaincyf/ilya-sutskever-skill` |
| MrBeast | 内容创造 / YouTube方法论 | `mrbeast-skill` | `npx skills add alchaincyf/mrbeast-skill` |
| 特朗普 | 谈判 / 权力 / 传播 / 行为预判 | `trump-skill` | `npx skills add alchaincyf/trump-skill` |
| 乔布斯 | 产品 / 设计 / 战略 | `steve-jobs-skill` | `npx skills add alchaincyf/steve-jobs-skill` |
| 马斯克 | 工程 / 成本 / 第一性原理 | `elon-musk-skill` | `npx skills add alchaincyf/elon-musk-skill` |
| 芒格 | 投资 / 多元思维 / 逆向思考 | `munger-skill` | `npx skills add alchaincyf/munger-skill` |
| 费曼 | 学习 / 教学 / 科学思维 | `feynman-skill` | `npx skills add alchaincyf/feynman-skill` |
| 纳瓦尔 | 财富 / 杠杆 / 人生哲学 | `naval-skill` | `npx skills add alchaincyf/naval-skill` |
| 塔勒布 | 风险 / 反脆弱 / 不确定性 | `taleb-skill` | `npx skills add alchaincyf/taleb-skill` |
| 张雪峰 | 教育 / 职业规划 / 阶层流动 | `zhangxuefeng-skill` | `npx skills add alchaincyf/zhangxuefeng-skill` |

The `npx skills add ...` value is source metadata only in the first pass.

## In Scope

- Built-in seed catalog with the 13 expert presets above.
- Question-based expert routing that recommends `Top 3` experts.
- Routing should consider both built-in presets and user-added local presets.
- User can manually add or edit local skill presets.
- User-added preset fields should include at least:
  - name
  - skill id or slug
  - domain/tags
  - short description
  - thinking style / response style
  - optional source repo
  - optional install command metadata
- User can manually adjust the recommended expert list before generation.
- Generation is enabled only when at least 2 experts are selected.

## Out Of Scope / Non-goals

For the first version, do not build:

- Executing `npx skills add ...` from the app.
- Installing external skills from the UI.
- Automatically parsing installed skills or GitHub repositories into presets.
- Live GitHub sync.
- A general plugin marketplace.
- Permissioned command execution, sandboxing, or local filesystem automation.
- Treating boundary-generation or book-distillation skills as normal roundtable experts unless explicitly converted into local expert presets.

This amends the prior non-goal of "no expert import/edit UI": manual local preset add/edit is now in scope, but automated install/import remains out of scope.

## Decision Boundaries

Implementation/planning agents may decide:

- Exact routing algorithm for first pass, such as keyword/tag scoring, embedding-free heuristics, or LLM-assisted routing through the existing adapter.
- Exact fields and UI layout for manual local preset add/edit.
- Whether user-added presets are kept in local app state, localStorage, or a simple exportable JSON mechanism, as long as no backend is introduced without confirmation.
- Ranking display details and explanation copy for why experts were recommended.

Agents must ask before:

- Executing install commands.
- Adding a backend, database, or account system.
- Pulling/parsing live GitHub content at runtime.
- Treating helper skills for boundary generation or book distillation as automatic runtime tools rather than reference/preset material.

## Testable Acceptance Criteria

1. The app exposes 13 built-in expert presets listed above.
2. A user can enter a question and trigger expert recommendation before generation.
3. The system defaults to recommending `Top 3` experts.
4. Recommendations are drawn from both built-in and user-added local presets.
5. The user can manually add a local skill preset with source metadata.
6. The app stores/displays `installCommand` as metadata only and does not execute it.
7. The user can manually adjust recommended experts.
8. Generation is blocked or clearly disabled when fewer than 2 experts are selected.
9. A generated roundtable uses the final selected expert set.
10. The first pass does not include external install, automatic GitHub parsing, live sync, backend, accounts, or marketplace behavior.

## Assumptions Exposed And Resolved

- Assumption: "Add skills" means the app should execute `npx skills add`.
  - Resolution: Rejected for first pass. Add/edit local preset manually; store install command as metadata only.
- Assumption: Auto-routing should select one best expert.
  - Resolution: Rejected. It should recommend multiple experts; default `Top 3`.
- Assumption: User-added skills should be part of routing.
  - Resolution: Accepted. Routing should consider built-in and user-added presets.

## Handoff Guidance

This addendum should be applied on top of:

- `.omx/specs/deep-interview-roundtable-expert-skills.md`
- `.omx/plans/roundtable-expert-skills-ralplan-final.md`

Recommended next step: run `$ralplan` again only if you want the approved implementation plan updated formally. If proceeding directly, execution should treat this addendum as a binding delta to the approved plan.

Suggested planning invocation:

```text
$plan --consensus --direct .omx/specs/deep-interview-roundtable-expert-catalog.md
```

