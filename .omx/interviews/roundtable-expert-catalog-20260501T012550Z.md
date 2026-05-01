# Deep Interview Transcript: roundtable-expert-catalog

Metadata:
- Profile: standard
- Context type: greenfield delta on approved roundtable MVP plan
- Final ambiguity: 16%
- Threshold: 20%
- Context snapshot: `.omx/context/roundtable-expert-catalog-20260501T011035Z.md`
- Base spec: `.omx/specs/deep-interview-roundtable-expert-skills.md`
- Base approved plan: `.omx/plans/roundtable-expert-skills-ralplan-final.md`

## Summary

The user clarified an incremental requirement for the roundtable expert skills MVP:

- Ship with 13 built-in expert/persona skill presets.
- Use the user's question to recommend more than one expert.
- Default recommendation should be Top 3 experts from built-in presets plus user-added presets.
- Users may manually add or edit local skill presets.
- `npx skills add ...` commands are stored/displayed as source metadata only.
- The app must not execute `npx skills add`, install external skills, or automatically parse GitHub skill contents in the first pass.
- Users can adjust the recommended experts before generation, but final discussion generation requires at least 2 selected experts.

## Clarity Breakdown

| Dimension | Score | Notes |
| --- | ---: | --- |
| Intent | 0.90 | Enrich the expert catalog and make expert selection smarter. |
| Outcome | 0.90 | Auto-recommend Top 3 multi-expert panel, with user adjustment and manual preset additions. |
| Scope | 0.86 | Manual local preset management is in scope; automated install/parse is out. |
| Constraints | 0.85 | No command execution from UI; source commands are metadata only. |
| Success | 0.86 | Default Top 3, user override, minimum 2 selected experts, and local add/edit are testable. |

Weighted ambiguity: approximately `11.95%`; conservative delta ambiguity recorded as `16%` because this amends a previously approved plan.

## Transcript

### Round 1

Target: Scope boundary

Question: 这些 `npx skills add ...` 清单，你希望首版怎么处理：把 13 个专家作为内置可选专家 presets 固定放进页面，还是要在页面里提供“安装/添加 skill”的能力？

Answer: 可以变为基于问题判断用这13个专家其中的一个，同时允许用户增加skill的能力

### Round 2

Target: User-added skill boundary

Question: “允许用户增加 skill”在首版里应该做到哪一层：只是让用户手动填写一个 skill 名称/描述/安装命令并保存成本地 preset，还是要真的执行 `npx skills add ...`、读取安装后的 skill 内容并自动解析成专家？

Answer: 哪种效果更好呢

Recommendation given: The better first-pass approach is manual local skill preset addition. Automated `npx skills add` execution and parsing should be deferred due to command execution, trust, parsing compatibility, and scope risk.

### Round 3

Target: Scope confirmation

Question: 是否按这个边界定稿：首版允许用户手动新增本地 skill preset，但 `npx skills add` 只作为来源命令保存和展示，不在页面里执行？

Answer: 是的

### Round 4

Target: Routing outcome

Question: 基于问题自动判断时，你希望系统默认只选出“最适合的 1 个专家”来回答，还是推荐“最适合的 3 个专家”自动组成圆桌讨论？

Answer: 大于1个专家

### Round 5

Target: Success criteria

Question: 是否把首版验收线定为：输入问题后，系统默认从内置 13 个 + 用户新增 presets 中推荐 `Top 3` 专家组成圆桌；用户可以手动增减推荐结果，但最终至少保留 2 个专家再生成讨论？

Answer: 是的

## Pressure-Pass Findings

The pressure pass tested whether "allow users to add skill" should mean actual command execution and automatic parsing. That path was rejected for the first pass. The clarified first-pass value is editable local presets plus source metadata, not a trusted installer/importer.

