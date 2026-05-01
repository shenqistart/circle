# 圆桌专家 Skill MVP - RALPLAN-DR 共识批准计划

状态：Critic APPROVE，最终批准版
日期：2026-04-30
工作目录：`/Users/yuewang/Work/br/circle`

## Evidence Snapshot

- 当前目录是 greenfield：没有 app 源码、没有 `package.json`，只有 `.omx` 状态、规格和访谈文件。
- 已澄清规格来源：
  - `.omx/context/roundtable-expert-skills-20260430T133226Z.md`
  - `.omx/specs/deep-interview-roundtable-expert-skills.md`
  - `.omx/interviews/roundtable-expert-skills-20260430T133939Z.md`
- 用户目标：给自己/团队做一个内部多专家圆桌讨论工具，不是公开平台、插件市场或多人协作产品。
- 首版必须支持：选择多个专家/persona skill、输入问题、生成真实圆桌讨论、至少 3 个专家、至少 2 轮、专家互相回应、最后主持人总结。
- 首版明确不做：专家导入/编辑、历史保存、多人协作、登录权限、发言顺序配置、GitHub 实时同步、公开平台。
- 外部参考仓库当前只做了初查，不能把其内部实现细节当作已完全核验事实；执行阶段必须逐一读取对应 `README.md` / `SKILL.md` / reference 文件后再落地 preset 与编排细节。

## Requirements Summary

### Functional Requirements

1. 提供一个真实可用的主界面，而不是营销页。
2. 用户可以从本地预设专家/persona skills 中选择至少 3 个专家。
3. 用户可以输入一个讨论问题并触发生成。
4. 系统生成不少于 2 轮圆桌讨论。
5. 每位被选专家在每轮或核心阶段都有可见发言。
6. 后续轮次必须体现对其他专家观点的点名回应、挑战、补充或让步。
7. 输出以主持人总结结束，概括共识、分歧、关键洞察和行动建议。
8. 专家 persona 应体现 thinking style，而不是复读名人语录。

### Acceptance Tiers

1. **Mock/Demo MVP（无 provider / 无 API key 时必须可交付）**
   - 使用本地 presets、domain model、prompt builder、mock/demo generator 交付完整 UI happy path。
   - 输出可为 deterministic 或半结构化模拟结果，但必须满足圆桌结构验收：至少 3 专家、至少 2 轮、Round 2 有点名回应、主持人总结完整。
   - 该层用于 UI、交互、测试、团队评审和 provider 决策前演示；不得宣称已经接入真实 LLM。
2. **真实 LLM MVP（需要执行前决策）**
   - 必须先确认 provider、API key 放置方式、是否允许本地浏览器直连、是否需要代理、是否部署给团队。
   - 真实模型输出必须通过同一套 staged generation contract 校验，失败时能进入修复或重试路径。
   - 不得把 mock/demo 验收与真实 LLM 验收混为一谈；真实 LLM MVP 的完成标准必须包含实际 provider 调用、错误态和 key 安全边界验证。

### Non-Functional Requirements

1. Greenfield scaffold 默认使用 React + Vite。
2. 先形成完整主界面设计概念/设计系统，再实现页面。
3. 本地 preset 数据应可读、可维护，后续可迁移到导入或后端，但首版不实现这些能力。
4. LLM provider/API key、部署方式、真实后端接入必须在执行前向用户确认；计划中不得擅自定死。
5. MVP 优先可用工作流和可验证输出，不追求公开产品级账号、权限或增长功能。
6. 禁止默认把商业 LLM API key 放入浏览器持久存储、源码、配置模板或提交到 repo。
7. 浏览器直连商业 LLM 只能作为用户明确确认后的本地开发模式；团队部署、共享环境或用户不接受浏览器 key 时，必须采用最小代理子方案。

## RALPLAN-DR

### Principles

1. **MVP 边界优先**：只交付“选专家、问问题、看圆桌结果”的闭环，坚决排除导入、历史、协作、登录和 GitHub 同步。
2. **真实对话优先于并列观点**：输出必须像圆桌交锋，而不是多个专家各自写独立答案。
3. **专家风格是思考方式，不是语录模仿**：persona preset 应表达心智模型、决策启发式、边界和反模式。
4. **本地可维护优先**：greenfield 首版用本地结构化 presets 和 prompt orchestration，避免提前引入后端复杂度。
5. **可测试输出优先**：轮次、专家覆盖、互相回应、主持人总结都应能被单元测试或集成测试检查。

### Decision Drivers Top 3

1. **首版闭环速度与可用性**：尽快得到团队能实际打开、选择专家、生成圆桌讨论的工具。
2. **圆桌编排质量**：至少 2 轮、专家互相回应、主持人收敛，是产品价值核心。
3. **后续演进空间**：预设、编排器、LLM adapter 和 UI 状态要足够清晰，便于未来扩展导入、历史、后端或更多 persona。

### Viable Options

#### Option A - 纯前端 React + Vite + 本地 presets + 可插拔 LLM adapter

概要：创建 React/Vite 单页应用。专家 presets 存在本地 TypeScript/JSON 文件中；编排逻辑在前端模块中生成 prompt 和消息结构；LLM 调用经 adapter 抽象，执行前由用户确认 provider/API key 策略。若 provider 未配置，可提供 deterministic mock/demo generator 用于 UI 和测试。

优点：
- 最贴合 greenfield MVP，启动快，文件少，认知负担低。
- 不需要后端、数据库、登录或部署决策即可完成大部分 UI 与编排逻辑。
- mock generator 可让测试覆盖圆桌结构，不被 API key 阻塞。
- adapter 抽象保留后续接 OpenAI、Anthropic、本地模型或服务端代理的空间。

缺点：
- 如果直接从浏览器调用商业 LLM，API key 暴露风险高；生产使用通常需要后端代理。
- 浏览器直连不得作为默认真实 LLM 路径，只能在用户确认“仅本地开发且接受 key 暴露风险”后启用；key 不得写入 `localStorage`、源码或 repo。
- 无历史保存和服务端审计，团队长期使用能力有限。
- provider 真实流式输出、限流、错误处理能力可能只能做基础版本。

#### Option B - React + Vite 前端 + 最小 Node/Express LLM 代理

概要：仍使用 React/Vite，但增加一个本地 Node/Express API 代理，API key 只在服务端环境变量中使用；前端调用本地 API 生成圆桌讨论。

优点：
- API key 安全边界更合理，接近真实团队使用方式。
- 便于统一 provider 调用、错误处理和未来加日志/历史。
- 可更自然地接流式输出。

缺点：
- 超出“只做最小前端工具”的复杂度，新增服务启动、env、端口和部署问题。
- 用户已明确“真实后端”需要确认；不能在未确认前作为默认执行方案。
- 测试和开发脚本变多，MVP 交付成本升高。

#### Option C - 静态本地原型 + 纯 mock 输出

概要：只做静态 HTML/React UI 和本地规则生成的 mock 圆桌，不接任何真实 LLM。

优点：
- 最快验证界面和交互。
- 完全不需要 provider/API key 决策。
- 测试稳定。

缺点：
- 不满足“生成真实圆桌讨论”的产品意图，只能算交互原型。
- persona skill 的 thinking style 不能真正随用户问题动态发挥。
- 后续接真实 LLM 时可能返工编排和错误处理。

### Recommended Option

推荐 **Option A：纯前端 React + Vite + 本地 presets + 可插拔 LLM adapter**。

理由：
- 它最符合当前 greenfield 和 MVP 边界：不引入后端、登录、历史或部署前提。
- 通过 `RoundtableOrchestrator`、`ExpertPreset` 和 `LLMAdapter` 的清晰边界，可以先实现 UI、preset、prompt 编排和 mock 验证，再在执行前询问用户 provider/API key。
- 对 API key 安全的风险不隐藏：若用户要真实团队部署或避免浏览器 key 暴露，执行阶段应升级到 Option B 或使用已有安全代理。
- 推荐范围默认只承诺 Mock/Demo MVP；真实 LLM MVP 只有在 provider/API key 与安全模式确认后才进入执行。

## Proposed Greenfield Structure

拟议路径如下，执行者可按框架生成结果微调：

```text
package.json
index.html
vite.config.ts
tsconfig.json
src/
  main.tsx
  App.tsx
  styles/
    tokens.css
    app.css
  data/
    expertPresets.ts
  domain/
    types.ts
    roundtableOrchestrator.ts
    promptBuilder.ts
    roundtableContract.ts
    mockRoundtableGenerator.ts
  services/
    llmAdapter.ts
  components/
    ExpertSelector.tsx
    QuestionComposer.tsx
    RoundtableControls.tsx
    DiscussionView.tsx
    ModeratorSummary.tsx
  tests/
    roundtableContract.test.ts
    mockRoundtableGenerator.test.ts
    promptBuilder.test.ts
    app-smoke.test.tsx
```

## Expert Preset Guidance

首版预设不应虚构“资料库里有但未核验”的 persona。执行者应先检查用户提供的参考仓库，再把实际可用 persona 或适合本地种子的专家风格提炼为 presets。

预设结构建议：

```ts
type ExpertPreset = {
  id: string;
  name: string;
  shortLabel: string;
  source: "nuwa-skill" | "zhuzi-skill" | "multi-perspective-analysis" | "cangjie-skill" | "local";
  sourceUrl?: string;
  evidenceRefs: string[];
  provenanceStatus: "initially-reviewed" | "execution-needs-verification" | "local-derived";
  thinkingStyle: string;
  mentalModels: string[];
  decisionHeuristics: string[];
  antiPatterns: string[];
  honestyBoundary: string;
  responseStyle: string;
};
```

首版应至少提供 3 个可选专家；更理想是 5-8 个本地 presets，让用户能多选但默认推荐 3 个。`cangjie-skill` 不适合首版现场拆书，可只作为未来“书本型专家”扩展方向或本地 preset 灵感。

### External Repo Evidence Status

核验日期：2026-04-30。HEAD 仅作为计划时点锚点；执行阶段仍应读取目标文件内容并遵守仓库许可。

| 来源 | URL / HEAD | 已初查到的事实 | 执行阶段仍需核验的内容 |
| --- | --- | --- | --- |
| `nuwa-skill` | `https://github.com/alchaincyf/nuwa-skill` / `ea4b9abfe0e60e5051ed946c70e51434402d3545` | README/SKILL 显示其目标是蒸馏人物或主题的思维方式，强调心智模型、决策启发式、表达 DNA、反模式和诚实边界；公开页面列出若干已蒸馏人物 skill。 | 逐一核验可用 persona skill 的真实仓库、许可、字段结构、是否适合直接转成本地 preset；不得仅凭 README 示例虚构专家资料。 |
| `zhuzi-skill` | `https://github.com/linzzzzzz/zhuzi-skill` / `cb550fbd9ee72e5e74e2a81c063c81b7336dea71` | README/SKILL 显示其负责组织多 persona 结构化辩论，默认 3 轮 opening / rebuttal / closing，Round 2 要点名挑战他人观点，支持 isolated / inline 模式与主持人 synthesis。 | 核验其 `SKILL.md` 最新执行协议、轮次字段、输出 transcript 结构；确认是否有可复用 prompt 或仅作为设计参考。 |
| `multi-perspective-analysis` | `https://github.com/yunshu0909/yunshu_skillshub/tree/master/multi-perspective-analysis` / repo HEAD `17eca94c7b1468d0810364825683918f3a3cb829` | 目录下有 `SKILL.md` 和 `reference/`；SKILL 描述 10 个独立 sub-agent 并行分析，再交叉汇总共识、分歧、独家洞察和行动建议。 | 核验 reference 文件是否存在且许可可用；首版只借鉴汇总结构，不默认复制 10-agent 深度报告或引用具体 reference 内容。 |
| `cangjie-skill` | `https://github.com/kangarooking/cangjie-skill` / `96c51ad1e8f0b6b76afdd8043f583e9f4b9f7323` | README/SKILL 显示其是 book2skill：把书的方法论蒸馏为原子化、可调用、可测试的 skill；明确不是书摘、读后感或作者角色扮演。 | 核验具体模板与测试格式是否可借鉴；首版不做现场拆书，不把书本 skill 当作人物专家，最多作为未来“书本型专家/方法论包”扩展来源。 |

## Roundtable Orchestration Design

1. Mock/Demo 默认可一次性结构化生成完整 `RoundtableResult`，便于 deterministic 测试和 UI 验收。
2. 真实 LLM 默认优先分轮调用：Round 1 生成初始立场，Round 2 基于 Round 1 transcript 生成点名回应，Round 3 生成让步与收敛，最后单独生成主持人总结。
3. 如果真实 LLM 首版因成本/延迟选择一次性结构化生成，也必须执行 generate -> validate -> repair：先校验 round/expert/respondsToExpertId/summary contract，不满足则最多 repair 2 次；仍失败必须进入错误态，不得展示为成功结果。
4. Domain model 必须支持 staged generation contract，不能只支持“一段文本一次性展示”。
5. 默认轮次建议为 3 轮，继承 `zhuzi-skill` 的 opening / rebuttal / closing 思路；验收底线是不少于 2 轮。
6. Round 1：每位专家基于自身 thinking style 给出初始立场，`responseMode` 为 `opening`。
7. Round 2：每位专家必须点名回应至少一位其他专家，形式包括 challenge / build / concede / reframe，必须记录 `respondsToExpertId` 和 `responseMode`。
8. Round 3（如启用）：每位专家给出收敛后的最终立场，必须包含“保留意见/让步”和“建议”，`responseMode` 为 `closing`。
9. 主持人总结：输出共识、分歧、独家洞察、建议行动，参考 multi-perspective-analysis 的汇总结构，但不要做 10-agent 深度报告。
10. 发言顺序可以内部轮换以减少顺序偏差，但首版不提供 UI 配置。

## Implementation Steps

1. **Scaffold 与基础工具链**
   - 创建 React + Vite + TypeScript 项目。
   - 配置 lint/test/build 脚本。
   - 验收：`npm run build` 和测试命令可运行；首屏加载 React app。

2. **主界面设计系统与布局**
   - 先定义工具型 UI 设计概念：紧凑工作台、左侧专家选择/参数、右侧问题与讨论输出，避免营销页。
   - 建立颜色、间距、字号、按钮、输入框、专家卡片、讨论气泡、状态条的基础 tokens。
   - 验收：首屏即为可操作工具；移动和桌面布局无文本溢出或明显重叠。

3. **本地专家 presets**
   - 检查参考仓库实际可用 persona/skill 内容。
   - 提炼至少 3 个专家 preset，优先表达 thinking style、mental models、heuristics、boundaries。
   - 验收：UI 中至少 3 个专家可选；preset 内容不依赖未经核验的虚构来源。

4. **圆桌领域模型与编排器**
   - 实现 `ExpertPreset`、`RoundtableRequest`、`DiscussionRound`、`ExpertTurn`、`ModeratorSummary`、`StagedGenerationContract` 等类型。
   - `ExpertTurn` 至少包含 `expertId`、`roundId`、`responseMode`、`respondsToExpertId?`、`content`；真实 LLM 和 mock 都必须返回同一结构。
   - 实现 prompt builder、contract validator 和 orchestrator，保证轮次、专家覆盖、回应要求和主持人总结结构。
   - 验收：单元测试能断言至少 2 轮、每个专家发言、Round 2 包含 `respondsToExpertId` 和合法 `responseMode`、结果有 moderator summary。

5. **LLM Adapter 与 mock/demo fallback**
   - 定义 `LLMAdapter` 接口和 mock generator。
   - 在真实 provider 未确认时，用 mock/demo 生成结构化圆桌输出供 UI、测试和设计验证。
   - 执行前必须询问用户：provider/API key 策略、是否允许浏览器侧调用、是否需要后端代理。
   - API key 规则：不得提交 repo；不得写入浏览器持久存储；浏览器直连只允许用户明确确认后的本地开发态；团队部署或用户不接受浏览器 key 时，走最小 Node/Express 代理子方案。
   - 验收：无 API key 时仍能演示完整工作流；真实 provider 接入点清晰隔离；key 处理路径在 README 或执行说明中明确标注。

6. **交互流程**
   - 实现专家多选、问题输入、生成按钮、加载态、错误态、输出展示。
   - 至少限制用户选择 3 个专家或提供清晰提示；默认可预选 3 个。
   - 验收：用户可完成“选择 3 个专家 -> 输入问题 -> 生成 -> 查看多轮讨论与总结”的 happy path。

7. **输出展示**
   - 按轮次展示专家发言，明确专家身份、轮次、被回应对象或回应线索。
   - 主持人总结单独呈现，包含共识、分歧、洞察、行动建议。
   - 验收：结果不是并排摘要；能肉眼看到专家互相回应。

8. **测试与验证**
   - 单元测试覆盖 prompt builder/orchestrator。
   - `roundtableContract.test.ts` 覆盖 staged contract、`respondsToExpertId`、`responseMode`、summary 字段。
   - `mockRoundtableGenerator.test.ts` 覆盖无 provider 的 demo 输出结构。
   - 组件或集成测试覆盖选择专家、输入问题、生成 mock 结果。
   - 构建验证和浏览器 smoke test。
   - 验收：测试、构建、浏览器首屏和 happy path 均通过。

## Testable Acceptance Criteria

### Mock/Demo MVP

1. 用户打开页面后，首屏就是圆桌工具，不是营销页。
2. 页面提供至少 3 个可选专家/persona presets。
3. 用户可以选择至少 3 个专家；不足 3 个时生成按钮不可用或显示明确提示。
4. 用户可以输入一个问题并触发生成。
5. 生成结果包含至少 2 轮讨论。
6. 每位被选专家至少贡献一次发言；理想情况下每轮都有发言。
7. Round 2 或后续轮次中，至少部分发言明确点名回应其他专家观点。
8. 结果以主持人总结结束，并包含共识、分歧、关键洞察和行动建议。
9. 首版不包含专家导入/编辑、历史保存、多人协作、登录权限、发言顺序配置、GitHub 实时同步、公开平台功能。
10. `npm run build` 通过；核心 orchestration 测试通过；浏览器 smoke test 可完成 happy path。
11. 在没有 provider/API key 的环境中，mock/demo workflow 仍能稳定完成以上验收，且 UI 不声称正在使用真实模型。

### Real LLM MVP

1. 用户已确认 provider、API key 放置方式、浏览器直连或最小代理策略、部署目标。
2. API key 未进入源码、测试 fixture、浏览器持久存储或 repo 提交内容。
3. 若用户选择浏览器直连，仅作为本地开发模式，并在 UI/文档中明确其 key 暴露风险。
4. 若用于团队部署或用户不接受浏览器 key，必须实现最小代理子方案，key 只在服务端环境变量中读取。
5. 真实 LLM 输出通过 `roundtableContract` 校验；缺少轮次、专家覆盖、`respondsToExpertId`、合法 `responseMode` 或 summary 时进入修复/重试/错误态。

## Risks And Mitigations

1. **API key 暴露风险**
   - 风险：纯前端直接调用 LLM 会暴露 key；浏览器持久存储或 repo 提交会扩大泄露面。
   - 缓解：计划默认只定义 adapter 和 mock；执行前必须询问 provider/API key。禁止默认写入 `localStorage`、源码、配置模板或 repo。浏览器直连只允许明确确认后的本地开发态；真实团队使用或不接受浏览器 key 时，切换到最小后端代理。

2. **输出退化为并列摘要**
   - 风险：LLM 可能忽略互相回应要求。
   - 缓解：prompt 结构强制 round 2 点名回应；domain contract 检查 `respondsToExpertId` 和 `responseMode`；UI 显示被回应对象；真实 LLM 优先分轮调用，或至少 generate -> validate -> repair。

3. **persona 失真或虚构**
   - 风险：未检查仓库就声称可用 persona，或把名人风格变成语录模仿。
   - 缓解：执行阶段先检查参考仓库；preset 字段聚焦 thinking style、心智模型、启发式、边界；每个 preset 记录 `sourceUrl`、`evidenceRefs`、`provenanceStatus`，避免未经核验声称内部实现。

4. **MVP 范围膨胀**
   - 风险：导入、历史、协作、权限、部署等需求提前进入首版。
   - 缓解：以 non-goals 作为验收反向标准；任何后端/部署/范围扩展都先问用户。

5. **UI 看起来像 demo 而不是工具**
   - 风险：只做静态卡片或营销页，不能高效使用。
   - 缓解：先设计工作台布局和设计系统；首屏直接可操作；避免 hero/宣传式结构。

6. **真实 LLM 输出不稳定导致测试脆弱**
   - 风险：端到端测试依赖实时模型结果会不稳定。
   - 缓解：核心测试使用 mock generator；真实 provider 只做手动或可选集成验证。

## Verification Steps

1. **Repo baseline**
   - 确认 greenfield scaffold 生成后包含 `package.json`、Vite 配置、`src/`。
   - 确认没有引入后端、登录、历史或协作文件，除非用户后续确认。

2. **Static checks**
   - 运行 lint/typecheck/build。
   - 确认没有 TypeScript 类型错误和明显未使用核心代码。

3. **Unit tests**
   - 验证 prompt builder 包含专家、问题、轮次、互相回应和主持人总结指令。
   - 验证 `roundtableContract` 要求至少 2 轮、每专家发言、Round 2 `respondsToExpertId`、合法 `responseMode`、summary。
   - 验证 `mockRoundtableGenerator` 在无 provider 下稳定产出 demo 结构。
   - Mock/Demo 验证不得依赖 provider/API key；真实 LLM 测试只有在用户明确确认 provider、key 放置方式和安全模式后才运行。

4. **UI tests**
   - 渲染 App，选择/默认 3 个专家，输入问题，触发生成。
   - 断言输出轮次、专家名、回应线索和主持人总结。

5. **Browser smoke**
   - 启动 dev server。
   - 桌面和移动 viewport 检查首屏、选择、输入、生成、结果展示。
   - 检查文本不溢出、控件不重叠、生成按钮状态合理。

6. **Scope audit**
   - 明确检查未实现 non-goals：专家导入/编辑、历史、协作、登录、发言顺序配置、GitHub 同步、公开平台。
   - 明确检查 API key 未写入源码、repo、测试 fixture 或浏览器持久存储默认逻辑。
   - 真实 LLM repair 最多 2 次；失败路径必须是可见错误态，不得静默降级为“成功”。

## ADR Draft

### ADR-001: 首版采用 React + Vite 纯前端 MVP，并以可插拔 LLM adapter 隔离真实模型调用

**Status**：Proposed

**Context**

项目当前是 greenfield，没有现有应用结构。用户要的是内部/团队圆桌专家 skill MVP：选择多个专家、输入问题、生成多轮互相回应的圆桌讨论和主持人总结。首版不做后端、历史、登录、协作、GitHub 同步或公开平台。用户允许执行者自行决定框架、布局、preset 表示、默认轮次和主持人 prompt，但 provider/API key、部署、真实后端必须另行确认。

**Decision**

首版推荐使用 React + Vite + TypeScript 构建单页工具。专家 presets 使用本地结构化数据，并记录 `sourceUrl`、`evidenceRefs`、`provenanceStatus`。圆桌编排、prompt building、contract validation 和结果结构化放在前端 domain 模块中。LLM 调用通过 `LLMAdapter` 接口隔离；在 provider/API key 未确认前，只承诺 mock/demo generator 支撑 UI 和测试。若用户后续确认需要真实团队部署和安全 API key，再引入最小后端代理。

**Drivers**

1. 快速交付可用 MVP 闭环。
2. 保证圆桌交锋质量和可测试性。
3. 避免未确认情况下引入后端、部署和 key 管理复杂度。

**Alternatives Considered**

1. React + Vite + 本地 presets + 可插拔 adapter：推荐。边界清晰，交付快，后续可扩展。
2. React + Vite + Node/Express 代理：API key 更安全，但当前需要用户确认真实后端，且增加 MVP 复杂度。
3. 纯静态 mock 原型：最快，但不满足真实圆桌生成意图，只适合设计预览。

**Why Chosen**

该方案最大化保留 MVP 速度，同时不把 provider/API key 和后端决策偷偷内置。它让 UI、persona preset、roundtable orchestration 和测试先落地，并为真实 LLM 接入保留明确接口。

**Consequences**

- 正向：项目结构小、易审查、易测试；可在无 API key 情况下验证完整交互。
- 负向：真实生产使用时浏览器侧 key 不安全；若需要部署给团队，必须追加后端代理工作。
- 中性：未来历史保存、导入、协作、权限都可在明确需求后再设计，不进入首版。

**Follow-ups**

1. 执行前询问用户 LLM provider/API key 策略。
2. 若选择真实 provider，确认是否接受浏览器侧 key 仅用于本地开发，或需要后端代理。
3. 执行前确认是否只做本地开发运行，还是需要部署目标。

### ADR-002: 真实 LLM 默认分轮生成，mock/demo 可一次性结构化生成

**Status**：Proposed

**Context**

圆桌质量取决于专家是否真正看到前轮 transcript 并对他人观点作出回应。一次性生成成本低、实现快，但真实 LLM 容易退化为格式正确的并列观点。分轮生成更接近 `zhuzi-skill` 的 staged debate contract，但会增加调用次数、延迟和错误处理复杂度。

**Decision**

Mock/Demo MVP 允许一次性生成完整 `RoundtableResult`。真实 LLM MVP 默认采用 staged generation：Round 1 opening、Round 2 rebuttal、Round 3 closing、Moderator summary 分阶段生成。若用户因成本或速度要求选择一次性真实生成，也必须保留 `roundtableContract` 校验与 repair prompt；repair 最多 2 次，不满足 contract 时不能直接展示为成功结果。

**Drivers**

1. 提高互相回应质量，避免并列摘要。
2. 让 domain model 支持后续流式、重试、部分失败恢复。
3. 保持 mock/demo 的执行速度和测试稳定性。

**Alternatives Considered**

1. 所有模式都一次性结构化生成：最快，但真实输出质量风险高。
2. 所有模式都分轮生成：质量边界好，但 mock/demo 与测试复杂度不必要升高。
3. Mock 一次性、真实分轮：推荐。质量与交付速度平衡最好。

**Consequences**

- 正向：真实 LLM 更容易产生可见交锋；contract validator 可在 UI 展示前拦截结构缺陷。
- 负向：真实 LLM 调用次数更多，可能需要加载态、取消态和重试策略。
- 中性：mock/demo 与真实 provider 共用最终 `RoundtableResult` 类型，降低 UI 分叉。

**Follow-ups**

1. 执行时实现 `roundtableContract.test.ts`，覆盖 `respondsToExpertId`、`responseMode`、summary。
2. 真实 provider 接入时实现至少一次 repair prompt 或明确错误态。
3. 若后续加入流式输出，把 staged contract 作为流式事件协议的基础。

## Open Questions For Execution Gate

这些问题不阻塞 Architect 审查，但阻塞真实 LLM/部署执行：

- LLM provider/API key：使用哪家 provider？API key 放在哪里？是否允许本地浏览器开发态使用？
- 部署：只需本地运行，还是要部署到 Vercel/内网/其他环境？
- 真实后端：是否需要最小后端代理来保护 key，还是首版先不接真实后端？
- 真实 LLM 编排：是否接受默认分轮调用带来的额外延迟/成本，还是选择一次性生成但启用 validate/repair？
- MVP 外扩：是否有任何必须加入首版的额外功能？默认答案应为否。

## Execution Handoff Recommendation

### Ralph 路径（推荐用于首版）

适用：希望一个持续执行 agent 顺序完成 scaffold、UI、domain orchestration、测试和浏览器验证。

建议交接：

```text
$ralph .omx/plans/roundtable-expert-skills-ralplan-final.md
```

Ralph 执行提示：
- 先确认 provider/API key/部署/后端问题；若用户未确认真实 provider，则只实现 mock/demo workflow，不把它标记为真实 LLM MVP。
- 不得把商业 LLM key 写入浏览器持久存储、源码、配置模板或 repo；浏览器直连仅限用户明确确认的本地开发态。
- 真实 LLM 默认分轮调用；若选择一次性生成，必须实现 contract validate/repair。
- 严格守住 non-goals。
- 每完成一段都跑测试和 build。
- UI 必须是工具首屏，不做营销页。

### Team 路径

适用：希望并行推进 UI、domain orchestration、preset extraction、verification。

建议交接：

```text
$team .omx/plans/roundtable-expert-skills-ralplan-final.md
```

Available agent roster：`architect` / `executor` / `researcher` / `test-engineer` / `verifier`。若使用 OMX 团队而非 Codex native subagents，可映射为架构审查、前端执行、领域执行、资料核验、验证五条 lane。

建议角色分配：
- Architect：审查 greenfield 架构、LLM adapter 边界、是否需要后端代理。
- Executor 1（Frontend）：React/Vite scaffold、设计系统、主界面、组件。
- Executor 2（Domain）：types、prompt builder、roundtable orchestrator、mock generator。
- Researcher/Explorer：检查参考仓库，提炼实际可用 persona/preset 来源，补全 `sourceUrl` / `evidenceRefs`，不虚构 persona。
- Test Engineer/Verifier：单元测试、组件 smoke、浏览器验证、scope audit。

建议 reasoning：
- Architect：high
- Frontend Executor：medium
- Domain Executor：high
- Researcher/Explorer：medium
- Test Engineer/Verifier：medium-high

Team verification path：
1. Domain lane 先交付可测试 mock roundtable 和 `roundtableContract`。
2. Frontend lane 接入 mock workflow。
3. Researcher lane 核验外部 repo 证据并标注 provenance。
4. Verifier 运行 build/test/browser smoke，并检查 `respondsToExpertId`、`responseMode`、API key 非持久化。
5. Architect 最后审查 scope、adapter 边界、non-goals、staged generation contract 和后续 provider 决策。

## Architect Review Focus

请 Architect 重点审查：

1. Option A 是否足以作为 MVP 默认方案，还是 API key 风险要求一开始就采用 Option B。
2. Mock/Demo MVP 与真实 LLM MVP 的验收分层是否清晰。
3. ExpertPreset 的字段是否能表达 thinking style，又不会过度设计。
4. 真实 LLM 默认分轮生成、一次性生成需 validate/repair 的 ADR 是否足够。
5. 测试策略是否能真实防止输出退化为并列观点，尤其是 `respondsToExpertId` 与 `responseMode`。
6. 是否有任何步骤无意中引入了 non-goal。
