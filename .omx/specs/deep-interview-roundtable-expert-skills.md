# Execution Spec: Roundtable Expert Skills MVP

## Metadata

- Source workflow: `$deep-interview`
- Profile: standard
- Context type: greenfield
- Final ambiguity: 12.25%
- Threshold: 20%
- Context snapshot: `.omx/context/roundtable-expert-skills-20260430T133226Z.md`
- Transcript: `.omx/interviews/roundtable-expert-skills-20260430T133939Z.md`

## Source References

The user provided these repositories as reference material:

- Persona skills: `https://github.com/alchaincyf/nuwa-skill`
- Roundtable discussion: `https://github.com/linzzzzzz/zhuzi-skill`
- Roundtable discussion: `https://github.com/yunshu0909/yunshu_skillshub/tree/master/multi-perspective-analysis`
- Book skill: `https://github.com/kangarooking/cangjie-skill`

Do not claim repository internals without inspecting them in a later planning/execution phase.

## Intent

Build an internal/team tool for multi-expert discussion. This is not initially a public platform, marketplace, or reusable plugin product.

## Desired Outcome

Create a roundtable page where a user can:

1. Select multiple expert/persona skills.
2. Enter a question.
3. Generate a realistic roundtable discussion.
4. See multiple rounds of expert dialogue where experts respond to each other.
5. See a final moderator summary.

## In Scope

- A minimum viable page/workflow.
- Expert selection UI based on predefined expert skill presets.
- Question input.
- Roundtable output view.
- At least 3 selectable experts in the happy path.
- At least 2 rounds of discussion in generated output.
- Expert messages should visibly respond to prior participants, not merely answer in isolation.
- Moderator/facilitator summary at the end.

## Out Of Scope / Non-goals

For the first version, do not build:

- Expert skill import or editing UI.
- Discussion history persistence.
- Multi-user real-time collaboration.
- Login, accounts, roles, or permission management.
- Configurable speaking order.
- Live GitHub synchronization/update flow.
- Public platform or plugin marketplace features.

## Decision Boundaries

The implementation/planning agent may decide without further confirmation:

- Frontend framework and local project structure.
- Page layout and interaction details.
- How to represent expert presets in local data.
- How to extract/adapt initial expert preset content from the reference repositories, after inspecting them.
- Default discussion round count.
- Moderator prompt and roundtable orchestration prompt shape.
- Styling direction, as long as it serves a usable internal tool.

The agent must ask before deciding:

- LLM provider and API key strategy.
- Deployment target or hosting strategy.
- Whether to connect a real backend.
- Any change that expands beyond the MVP scope above.

## Constraints

- Current working directory has no existing app source; treat this as a greenfield scaffold unless a later instruction points to an existing app.
- Deep-interview mode must not directly implement; use this spec as the handoff source of truth.
- Since the user wants a useful internal tool, prioritize a working workflow over public-product polish.

## Testable Acceptance Criteria

The MVP is acceptable when:

1. A user can open the page and select at least 3 expert skills.
2. A user can enter one question and trigger generation.
3. The result includes at least 2 discussion rounds.
4. Each selected expert contributes to the discussion.
5. At least some expert turns explicitly respond to or build on another expert's prior point.
6. The result ends with a moderator summary.
7. The first version does not include the listed non-goal features.

## Assumptions Exposed And Resolved

- Assumption: "Roundtable" might mean independent expert summaries.
  - Resolution: Rejected. The user wants realistic multi-round dialogue with mutual response and a moderator summary.
- Assumption: The first version might need skill management, persistence, collaboration, auth, configurable order, or GitHub sync.
  - Resolution: Rejected for MVP.
- Assumption: The agent needs user confirmation for all technical choices.
  - Resolution: Rejected. The agent may decide ordinary product/technical details; only provider/API key, deployment, backend, or scope expansion require confirmation.

## Pressure-Pass Findings

The main pressure pass revisited the phrase "一起来讨论一个问题". The clarified meaning is not parallel viewpoints; it is orchestrated dialogue with at least two rounds, mutual response, and a moderator synthesis. This should drive planning and testing.

## Brownfield Evidence Vs Inference

- Evidence: Current directory contains only `.omx` state/log files and no package manifest or app source.
- Inference: This should be treated as a greenfield frontend/web app scaffold unless the user points to another repository.

## Technical Context Findings

- No existing `package.json`, app directory, or source files were found in `/Users/yuewang/Work/br/circle`.
- Reference repositories are external and still need inspection during planning or execution before using their actual skill contents.

## Recommended Handoff

Recommended next step: `$ralplan` using this spec, because repository references and LLM/orchestration choices benefit from architecture and feasibility planning before implementation.

Suggested invocation:

```text
$plan --consensus --direct .omx/specs/deep-interview-roundtable-expert-skills.md
```

Alternative execution lanes:

- `$autopilot .omx/specs/deep-interview-roundtable-expert-skills.md` if direct planning plus execution is desired.
- `$ralph .omx/specs/deep-interview-roundtable-expert-skills.md` if persistent sequential completion is preferred.
- `$team .omx/specs/deep-interview-roundtable-expert-skills.md` if the work is split into parallel lanes after planning.
- Refine further if the user wants stronger detail before handoff.
