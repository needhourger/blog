# Shirone Content

这是 Shirone 站点的内容仓库，只保存文章、说说、页面数据实体、站点配置和用户图片。
主题实现、依赖、构建与部署由代码仓库负责。

## 目录边界

| 内容仓库 | 代码仓库物化路径 |
| --- | --- |
| `content/` | `src/content/` |
| `config/` | 编译进 `src/user/user-config.ts`（见本目录 README） |
| `data/` | `src/data/` |
| `assets/` | `src/assets/` |
| `public/` | `public/` |

`README.md`、`docs/` 和本仓库的 `.github/` 不会被物化，也不会触发站点重建。

## 发布流程

1. 在本仓库修改 `content/`、`data/`、`assets/` 或 `public/`；
2. 提交并推送 `main` 分支；
3. `.github/workflows/trigger-build.yml` 向代码仓发送 `content-updated` 事件；
4. 代码仓 Actions 物化内容、构建并部署。

## 本地预览

在代码仓执行（PowerShell）：

```powershell
$env:CONTENT_DIR = "<本仓库的本地路径>"
pnpm content:sync
pnpm dev
```

边写边看时可以另开一个终端运行 `pnpm content:watch`。

当前共 21 篇文章、2 个系列。
