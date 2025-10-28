# 总体结构（包管理/构建）

- 合理之处
  - **pnpm monorepo** 与 workspace 划分明确：`simple-notation`（库）、`web`（站点）与 `docs`（文档）。根脚本可分别构建/预览，依赖 `workspace:*` 绑定本地库版本，方便联调。
  - **库构建**：用 Vite 打包，`vite-plugin-dts` 生成类型，`exports` 同时提供 ESM/UMD，开发/测试用 Vitest（jsdom）。
- 存在问题
  - **公开面太大**：`src/index.ts` 直接 `export *` 所有内部模块，导致不稳定内部实现成为公开 API，后续重构难度巨大。
  - **sideEffects 未声明**：`package.json` 缺少 `sideEffects: false`，会影响 tree-shaking。
  - **UMD 文件扩展名**：`main` 指向 `simple-notation.umd.cjs`，但包为 `"type": "module"`；虽然可工作，但易引发工具链误判。建议用 `exports` 条件导出替代 `main/module`，并统一扩展。
  - **打包产物/字体资源策略**：字体包含在包内（`fonts/bravura.base64.ts`/woff2），需明确是否自动注入、是否允许消费者自定义替换，避免包体过大且不可配置。
  - **版本与发布**：未看到版本管理/变更集工具（如 changesets），后续演进会影响发布节奏和回滚。

建议

- 仅在 `exports` 暴露稳定 API，删除 `export *` 向外泄漏内部实现；为内部模块标注 `@internal`。
- 在 `package.json` 增加 `"sideEffects": false`；使用条件导出完全覆盖 `main/module`。
- 将字体/样式作为可选插件或外部资源，提供默认和自定义两条路径（减少包体、提升灵活度）。
- 引入 `changesets` 进行版本/变更日志管理，配合 CI 发版。

## 库架构（核心瓶颈与风险）

核心类：`SimpleNotation`（`sn.ts`）。当前职责包含：配置初始化（`SNConfig`）、容器/根 SVG 创建、事件系统（`SNEvent`）、数据加载（`SNLoader`）、渲染/重绘（`SNBorderLayer`/`SNContent`）、自适应（`ResizeObserver`）。

- 明显问题

  - **全局单例与可变全局状态**：
    - `SNConfig`、`SNRuntime`、`SNEvent` 为单例/静态，全局共享，导致多实例场景下的相互污染、内存生命周期不可控、测试隔离困难。
    - `SNLoader`/`SNRuntime` 拥有解析后的全局数据，`SimpleNotation` 实例之间共享状态，易出现数据串扰。
  - **渲染模式为“重建式全量重绘”**：
    - `render()` 每次销毁并重建边框层与内容层，DOM 抖动大，复杂谱面/交互下性能会迅速成为瓶颈。
  - **职责耦合**：
    - `SimpleNotation` 同时承担“状态管理 + 布局 + 渲染 + 容器管理 + 事件中枢”。后续增加编辑/高亮/选择/播放同步会继续堆积在这个类。
  - **解析/布局/渲染未分离**：
    - 解析器（`parser`）与运行时（`SNRuntime`）混杂；缺少明确的“领域模型（乐谱-小节-音符-连线）”与“布局引擎（测量/排版）”分层抽象。
  - **API 表达不稳定**：
    - 对外暴露内部层（`@components`/`@layers`）易导致应用层直接依赖内部细节，重构受限。

- 设计目标
  - 多实例安全、可测试可维护、渲染高性能、API 稳定可演进、面向扩展（插件/图层/解析器/渲染后端）。

### 推荐重构设计（分层与职责）

建议按“数据-布局-渲染”三段式重构，并清理单例/全局状态。

- 数据层（纯模型+解析）
  - 领域模型：`Score` → `Section|Measure` → `Voice` → `Note|Rest|Chord|Tie|Beam|Lyric`，用不可变/只读对象描述乐谱结构。
  - 解析器接口：
    - `IParser { parse(input: string | JSON): Score }`
    - 实现：`TemplateParser`、`AbcParser` 等，彼此独立，可扩展。
  - 不要写入全局；返回纯数据结构，便于测试和缓存。
- 布局层（测量与排版）
  - 接口：`ILayoutEngine { layout(score: Score, options: LayoutOptions): LayoutTree }`
  - `LayoutTree` 为与渲染后端无关的几何树（盒模型），包含坐标/宽高/锚点/连线等。
  - 使用字体度量缓存，支持行折行、连杆规则、横向/纵向间距策略。与 `options` 解耦，便于做不同排版风格。
- 渲染层（后端实现）
  - 抽象接口：`IRenderer { mount(container: HTMLElement): void; render(tree: LayoutTree): void; update(patch: Patch): void; unmount(): void }`
  - 实现：`SvgRenderer`（现状）、将来可扩展 `CanvasRenderer`、`WebGLRenderer`。
  - 引入“保留模式”（retained mode）：渲染一次后只对变更节点做最小 DOM diff（可自行实现一个轻量 diff，或将 `LayoutTree` 映射到 keyed 节点）。
- 控制层（外观/外部 API）

  - `SimpleNotation` 精简为编排器（facade）：组合 `parser + layout + renderer`，并托管状态容器（非全局）。
  - 提供明确 API：
    - `load(data, type)`
    - `setOptions(partialOptions)`
    - `updateScore(mutator | patch)`（编辑场景）
    - `on(event, handler)/off(...)`（事件非单例，实例隔离）
    - `getParsedScore()` → 返回只读数据结构
  - 事件系统实例化到实例作用域；移除 `SNEvent.getInstance()` 单例。

- 插件与图层系统

  - 定义插件协议：`SNEffectPlugin`, `SNLayerPlugin`（如：指法、力度标记、和弦框、歌词排版、光标/选择、播放进度指示）。
  - 插件仅依赖 `LayoutTree` 与渲染接口，不触碰私有实现；通过 `register(plugin)` 扩展。

- 配置管理
  - 移除全局 `SNConfig` 静态字段；改为实例级 `options`，并通过依赖注入传入各子模块（parser/layout/renderer），避免隐式全局状态。
  - 选项变更生成 `PartialOptions` → 影响布局或仅影响样式的选项分别触发 `layout` 或 `style-only update`，避免全量重排。

### 对现有代码的具体落地建议

- 去单例
  - `SNConfig` → `class Config`（实例字段），在 `SimpleNotation` 构造时创建并传入各子模块。
  - `SNRuntime` → 干掉全局，解析返回 `Score`；`SimpleNotation` 内部保存 `this.score`。
  - `SNEvent` → `new EventBus()`（实例私有），`on/off/emit` 作用于实例范围。
- 渲染改造
  - 现在 `render()` 每次 `new SNBorderLayer`/`new SNContent` 并销毁旧节点。改为：
    - 首次：`renderer.mount()` + `renderer.render(initialLayout)`
    - 更新：比较新旧 `LayoutTree`，生成 `Patch`，`renderer.update(patch)` 最小更新。
  - 层（`layers/*`）改为“声明式映射器”，将 `LayoutTree` 中相应节点映射为具体渲染指令，而不是直接持有 DOM 并在每次重渲染销毁重建。
- API 收敛
  - `src/index.ts` 改为只导出：`SimpleNotation`、类型定义（`SNOptions`、`SNData`、`SNDataType`）与必要的扩展点（`registerParser`/`registerRenderer`）。
  - 内部模块通过 `@internal` 或不导出，避免外部硬依赖。
- 类型与测试
  - 为 `Score/Measure/Note/LayoutTree` 增加显式类型，避免 `any`。
  - 单元测试层次：
    - 解析测试：文本/模板 → `Score` 快照
    - 布局测试：`Score` → `LayoutTree` 快照（不依赖 DOM）
    - 渲染测试：`LayoutTree` → SVG 片段快照（jsdom）
    - 回归测试：典型乐谱样例（仓库 `public/score`）作为金样。
- 性能与并发
  - 解析/布局可搬到 Web Worker（尤其大谱面与编辑器联动时）。主线程仅做渲染与交互。
  - 字体度量与图元缓存（音符头/符干/旗帜/连线弧形路径）提高复用。
- 播放器与编辑
  - `core/player.ts` 建议作为独立模块（可选包 `@simple-notation/player`），暴露基于 `Score` 的时间轴和事件，避免与渲染耦合。
  - 编辑模型（选择/插入/删除）建议基于 `Score` 的不可变更新，生成 patch 驱动 `Layout`/`Render`，统一数据流。

### 目录切分建议（逐步演进，不必一次拆完）

- 当前包继续迭代，等架构稳定后再考虑多包：
  - `@simple-notation/core`（模型+解析+布局）
  - `@simple-notation/renderer-svg`
  - `@simple-notation/player`
  - `@simple-notation/plugins/*`（歌词、和弦、装饰音等）
  - 先在单包内用子目录划分，API 稳定后再物理拆包，降低动荡成本。

### 短期迭代计划（建议按顺序执行）

1. API 收敛

   - 收紧导出面，仅导出 `SimpleNotation` 与类型；在 `package.json` 设置 `sideEffects:false`。

2. 移除单例/全局

   - 将 `SNConfig/SNRuntime/SNEvent` 改为实例内对象；构造函数注入。

3. 数据/布局/渲染分层

   - 提炼 `Score` 与 `LayoutTree` 类型；将 `SNContent` 渲染逻辑收敛为 `Renderer`，引入最小更新。

4. 性能基线

   - 用 3-5 个典型乐谱建立快照测试与性能测量，验证重绘→增量更新收益。

5. 插件点

   - 先把“边框层/指针/连音线”等做成 `LayerPlugin`，通过注册组装，验证扩展性。

6. 并发与大谱优化

   - 将解析/布局放入 Worker，主线程渲染；引入度量缓存。
