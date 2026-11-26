# 个人博客写作与维护规范（konnoyuuki.cc）

本规则适用于 `konnoyuuki.cc` 个人博客（Shirone 双仓架构）下的文章撰写、配置修改、本地校验与发布。

## 1. 仓库边界与写入位置

- **内容仓为唯一编辑源**：文章一律写在 `blog/content/posts/<文章目录名>/index.md`（单篇独立目录 + 同目录相对路径配图）；站点配置与数据修改（`blog/config/*.yaml`、`blog/data/*.ts`、`blog/content/spec/` 等）同样只在 `blog/` 内进行。
- **严禁编辑代码仓物化副本**：不要直接修改或提交 `Shirone/src/content/posts/` 下的物化文件，不要手改自动生成的 `Shirone/src/user/user-config.ts`，也不要直接用 `Shirone` 的 `pnpm new-post` 落盘到代码仓。

## 2. AI 标识、署名与分类标签

- **AI 标识与署名**：凡包含 Agent 生成或整理的博客文章，frontmatter 必须包含：
  - `tags` 中加入 `AIGC`（与主题标签并列，不与技术主题 `AI` 混淆）；
  - `category` 沿用正常内容分类（技术类 `CODE`、生活类 `LIFE`）；
  - 覆写版权作者字段：`license.author` 设为 `Yuuki & <当前Agent名>`（如 `Yuuki & Antigravity`、`Yuuki & Codex`、`Yuuki & Claude`）。
- **标签克制与复用**：除 `AIGC` 外通常保持 2~3 个核心主题标签，优先复用 `blog/content/posts/` 既有标签（如 `Linux`、`Python`、`数据库`、`AI`、`LLM`、`K8S`、`Security` 等），避免同义词碎片化。
- **目录与路由命名**：当前站点关闭了全局自定义 permalink，目录名直接决定默认 URL（`/posts/<文章目录名>/`），命名应简洁规范，避免路径敏感字符。

## 3. Frontmatter、安全与配图约束

- **日期与时区强校验**：`published` 使用 `YYYY-MM-DD`，严格对齐站点时区 `Asia/Singapore`；若填写 `publishedAt` / `updatedAt`，必须与对应日历日期在同一天（`updatedAt` 不能脱离 `updated` 单独存在）。
- **YAML 格式与内部字段**：空字符串与含特殊字符的字段显式加引号（如 `image: ''`、`description: '...'`）；禁止手写 `prevUrl`、`nextUrl`、`prevTitle`、`prevSlug`、`nextTitle`、`nextSlug` 等系统内部字段；当前 `series` 功能已关闭（`blog/config/series.yaml` 为 `enable: false`），一般无需填写。
- **配图与资源路径**：文章插图与封面放同文章目录并用相对路径引用（如 `![](./cover.png)`、`image: './cover.png'`）；严禁写入 `/_image/`、`/@fs/` 或本机绝对路径。
- **脱敏与安全红线**：默认脱敏本机用户名路径、设备序列号及敏感凭据；严禁向公开仓库提交带真实明文密码的加密文章（`encrypted` / `password`）或任何 API Token / 密钥。

## 4. 正文风格、事实核实与 Markdown 扩展

- **分节与文风**：技术实战与排障复盘类文章优先沿用既有递进分节风格（如 `## Zero - ...`、`## First - ...`、`## Second - ...`、`## Final - ...`），行文务实克制，避免模板化 AI 腔；所有代码块必须标注语言标识。
- **事实核实**：基于本地会话记录、代码或外部资料撰写技术文章时，凡引用软件版本号、命令参数、日志/反汇编片段、上游 GitHub Issue/PR 编号及状态，必须先只读核实，禁止编造未验证结论；存在尚未解决的遗留限制时须如实标注。
- **Shirone 扩展语法**：可直接使用原生扩展语法（如 `> [!NOTE]` / `> [!TIP]` / `> [!WARNING]`、表格、折叠面板、KaTeX、Mermaid）；若使用 `@[code-tree]` 或 `<!-- @include: ... -->`，在双仓模式下须填写物化后相对于代码仓根目录的路径（如 `src/content/posts/<目录名>/...`）。

## 5. 本地校验与命令约定

- **校验流程**：在 `Shirone/` 目录下依次执行 `pnpm content:validate` → `pnpm content:sync` → `pnpm exec astro check`（须 0 errors）；正式发布前可按需执行 `pnpm build` 验证生产产物与字体子集。
- **Linux 工具链约束**：`Shirone/AGENTS.md` 中的 `.cmd` 后缀为上游 Windows 约定；本机为 Linux，一律使用 `pnpm` / `pnpm exec`（不用 `.cmd`、`npm`、`npx`）。
- **受限沙箱回退**：若沙箱无外网导致 `pnpm` 或 Astro telemetry 受阻，可直接调用 `node scripts/content/sync.mjs --dry-run`、`node scripts/content/sync.mjs` 与 `ASTRO_TELEMETRY_DISABLED=1 XDG_CONFIG_HOME=/tmp/astro-config ./node_modules/.bin/astro check`。

## 6. 草稿默认、提交与发布边界

- **默认草稿与只写不提交**：若用户未明确指定 `draft` 状态，默认设为 `draft: true`；除非用户明确要求，否则只完成 Markdown 编写与本地校验，不执行 `git commit` 或 `git push`。
- **提交规范（仅在用户明确要求时）**：只在内容仓 `blog/` 中精准暂存 `git add content/posts/<文章目录名>`（禁止 `git add -A`，严禁在 `Shirone/` 提交任何物化副本）；Commit Message 遵循 Conventional Commits（如 `feat(posts): ...`、`fix(posts): ...`、`docs(posts): ...`）。
- **实际发布链路**：推送 `blog` 仓库 `main` 分支后，由 `blog/.github/workflows/trigger-cloudflare.yml` 触发 Cloudflare Pages 自动构建上线（旧的 `trigger-build.yml` 已停用，勿被旧文档误导）。
