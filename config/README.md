# 站点配置

本目录的每个 YAML 文件覆盖主题里的一个配置领域，构建前由代码仓的
`pnpm content:sync` 编译成 `src/user/user-config.ts`，再与主题默认值深合并。

- **只写想改的键。** 没写的键沿用主题默认值，主题升级时自动跟进。
- **对象递归合并，数组整体替换。** 想改清单里的一项，要把整个清单写全。
- **拼错的键会让构建失败**，并给出 `Did you mean ...?` 提示，不会被静默忽略。

可用文件（默认值与逐项注释见代码仓 `src/config/`）：

| 文件 | 覆盖的配置 |
| --- | --- |
| `site.yaml` | `siteConfig` |
| `permalink.yaml` | `permalinkConfig` |
| `profile.yaml` | `profileConfig` |
| `license.yaml` | `licenseConfig` |
| `expressive-code.yaml` | `expressiveCodeConfig` |
| `announcement.yaml` | `announcementConfig` |
| `post-list.yaml` | `postListConfig` |
| `article.yaml` | `articleConfig` |
| `comment.yaml` | `commentConfig` |
| `context-menu.yaml` | `contextMenuConfig` |
| `fab.yaml` | `fabConfig` |
| `sidebar.yaml` | `sidebarConfig` |
| `footer.yaml` | `footerConfig` |
| `image-bloom.yaml` | `imageBloomConfig` |
| `skills.yaml` | `skillsConfig` |
| `projects.yaml` | `projectsConfig` |
| `timeline.yaml` | `timelineConfig` |
| `devices.yaml` | `devicesConfig` |
| `games.yaml` | `gamesConfig` |
| `music.yaml` | `musicConfig` |
| `anime.yaml` | `animeConfig` |
| `font.yaml` | `fontConfig` |
| `llms.yaml` | `llmsConfig` |
| `umami.yaml` | `umamiConfig` |
| `about.yaml` | `aboutConfig` |
| `friends.yaml` | `friendsConfig` |
| `moments.yaml` | `momentsConfig` |
| `albums.yaml` | `albumsConfig` |
| `compass.yaml` | `compassConfig` |
| `i18n.yaml` | `i18nConfig` |
| `series.yaml` | `seriesConfig` |
| `nav-bar.yaml` | `navBarConfig` |
| `footer.html` | 页脚注入的自定义 HTML（需同时在 `footer.yaml` 里 `enable: true`） |

`nav-bar.yaml` 是唯一的例外：导航项要引用主题内置预设并走 i18n，
因此写的是 `- preset: Home` / `- name: 留言板` 这种声明式条目，
完整写法见代码仓 `docs/content-separation/config-overlay.md`。
