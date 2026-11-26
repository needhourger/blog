# 个人博客写作规范（konnoyuuki.cc）

本规则适用于 `konnoyuuki.cc` 个人博客（Shirone 双仓架构）下的文章撰写、修改与校验。

## 写入位置与仓库边界

- 文章一律写在内容仓 `blog/content/posts/<文章目录名>/index.md`（单篇独立目录 + 同目录相对路径配图）。
- 不要直接修改或提交代码仓 `Shirone/src/content/posts/` 下的物化副本，也不要直接用 `Shirone` 的 `pnpm new-post` 落盘到代码仓。

## AI 标识与署名

凡包含 Agent 生成或整理的博客文章，frontmatter 必须包含：

- `tags` 中加入 `AIGC`（与精简的主题标签并列，不与技术主题 `AI` 混淆）；
- `category` 沿用正常内容分类（技术类 `CODE`、生活类 `LIFE`）；
- 覆写版权作者字段：`license.author` 设为 `Yuuki & <当前Agent名>`（如 `Yuuki & Antigravity`、`Yuuki & Codex`、`Yuuki & Claude`）。

## Frontmatter 与正文约束

- `published` 使用 `YYYY-MM-DD`，严格对齐站点时区 `Asia/Singapore`；若填写 `publishedAt` / `updatedAt`，必须与对应日历日期在同一天。
- 空字符串与含特殊字符的字段显式加引号（如 `image: ''`、`description: '...'`）。
- 所有代码块标注语言标识。
- 默认脱敏本机用户名路径、设备序列号及敏感凭据。

## 默认草稿与提交边界

- 若用户未明确指定 `draft` 状态，默认设为 `draft: true`。
- 除非用户明确要求，否则只完成 Markdown 编写与本地校验，不执行 `git commit` 或 `git push`。
