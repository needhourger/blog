---
title: 记一次 Hyprland 下 Chrome 与 Electron 的 HDR 踩坑排查
published: 2026-11-26
description: '从外接屏全屏黑屏出发，一路深挖 Hyprland 0.57.2 的 Auto HDR、DRM modeset、203 nits 硬编码参考白，以及 Chrome 与 Electron 全家桶的 Wayland 色彩管理避坑实录。'
image: ''
tags: [Linux, Hyprland, AIGC]
category: CODE
draft: false
license:
    author: Yuuki & Antigravity
---

## Zero - 楔子与环境说明

Linux 桌面下的 Wayland 色彩管理与 HDR 生态近两年推进很快，但真落到日常多屏环境里，依然处处是「合成器、浏览器、内核驱动、显示器硬件协议」四方交织的深坑。

这次折腾的起点其实非常朴素：**外接显示器上只要把 Chrome 全屏（或者在网页里点视频全屏），屏幕就会黑屏，退出全屏过一小会儿又恢复**；而同样在外接屏全屏 `kitty` 终端没事，在笔记本内屏全屏 Chrome 也没事。

本以为只是一个顺手关掉某个开关的小问题，结果顺藤摸瓜一路查下去，从 DRM modeset、EDID 色彩空间、`wp_color_management_v1` 协议、一路查到直接反汇编 `/usr/bin/Hyprland`，最后又顺带治理了一遍本机所有 Electron 应用。这里把整条排查链路和最终方案完整记录下来，方便后来者少踩几轮重复的坑。

先交代一下本次排障的软硬件环境：

- **系统与内核**：Arch Linux，Linux `7.3.6-arch1-1`
- **显卡与驱动**：Intel Panther Lake（Arc B390），内核驱动 `xe`，Mesa `26.3.1`
- **窗口管理器**：Hyprland `0.57.2`（Lua 配置模式，Aquamarine `0.16.0`）
- **笔记本内屏 (`eDP-1`)**：3072×1920@120Hz，10-bit，配置独立 Display P3 ICC 文件，开启 VRR
- **外接显示器 (`DP-1`)**：TCL `27C2A Pro`（4K@120Hz Mini-LED，原生 10-bit RGB 4:4:4，支持 BT.2020 + ST.2084 PQ，EDID 上报峰值约 1436 nits / MaxFALL 951 nits），通过 USB-C（DP Alt Mode）连接，关闭 VRR
- **主要浏览器与衍生应用**：Chrome `158`（原生 Wayland）、VS Code（Electron 43）、QQ、Codex Desktop、飞书、Antigravity（Electron 44）

---

## First - 排除法定位：为什么外接屏全屏会黑屏？

遇到「仅全屏触发、仅特定应用触发、退出后恢复」的黑屏，Hyprland 生态里常见的头号嫌疑人通常有四个：**Direct Scanout**、**VRR（可变刷新率）**、**Tearing**，以及 **色彩管理 / Auto HDR 切换**。

先通过 `hyprctl` 和 `modetest` 逐项查运行态，不做猜测：

```bash
hyprctl monitors all
hyprctl getoption render:direct_scanout
hyprctl getoption misc:vrr
hyprctl getoption render:cm_auto_hdr
hyprctl getoption general:allow_tearing
```

逐一排除下来结果很清晰：

1. **Direct Scanout**：`render:direct_scanout` 为 `0`，运行态明确显示 `directScanoutBlockedBy: user settings,missing candidate`，**排除**。
2. **VRR**：虽然全局 `misc.vrr = 1`，但 `monitors.lua` 里对 `DP-1` 显式配置了 `vrr = 0`，运行态确认 `vrr: false`，**排除**。
3. **Tearing**：`general:allow_tearing = false`，**排除**。
4. **`render:send_content_type`**：虽然默认开启，但用 `modetest -M xe -c` 检查确认原生 DisplayPort 的 `DP-1` 不存在 `content type` 这个 DRM 属性，**排除**。

真正的线索直接藏在 Hyprland 会话日志 `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/hyprland.log` 里。在系统完成启动之后，全屏进出瞬间日志里多出了连续的 `DP-1` 模式重设记录：

```text
DEBUG from aquamarine ]: drm: Modesetting DP-1 with 3840x2160@120.00Hz
DEBUG from aquamarine ]: drm: page-flip on DP-1 cancelled by modeset, clearing flip state
DEBUG from aquamarine ]: drm: Modesetting DP-1 with 3840x2160@120.00Hz
```

看到这两行基本就真相大白了：

- **进入全屏时**：Hyprland 的 `render:cm_auto_hdr = 1` 被触发，向内核提交 `Colorspace`（BT.2020）和 `HDR_OUTPUT_METADATA` 变更，引发 `DP-1` 的一次 **DRM modeset**。外接 Mini-LED 显示器收到信号格式变化后必须重新握手锁频，表现为黑屏/闪烁 1~3 秒；如果期间叠加浏览器表面频繁重提交，甚至会连续触发多次 modeset 导致短暂卡黑。
- **退出全屏时**：再次 modeset 切回 SDR，显示器二次握手后画面恢复。
- **为什么 `kitty` 不触发**：一方面 `kitty` 不会像 Chromium 141+ 那样默认通过 `wp_color_management_v1` 上报色彩表面描述；另一方面非完全不透明窗口也难以触发全屏色彩透传。

临时热验证一句即刻见效：

```bash
hyprctl keyword render:cm_auto_hdr 0
```

关闭 `cm_auto_hdr` 后，外接屏上 Chrome 全屏与视频全屏黑屏立刻消失。

---

## Second - 概念厘清与 `cm_auto_hdr` 的「鸡生蛋」死锁

黑屏虽然消失了，但新问题紧跟着来了：**显示器明明是一块素质不错的 1400+ nits Mini-LED，能不能让全屏 Auto HDR 正常工作，既不乱黑屏、看 YouTube HDR 视频又能正确点亮？**

在这一轮折腾里，先厘清了几个非常容易被名字误导的 Hyprland 色彩管理参数：

### 1. `supports_hdr` 是三态值，不是布尔开关

反查 Hyprland `0.57.2` 的 `Monitor::CMonitor::supportsHDR()` 实现可知，`supports_hdr` 的语义是：

| 取值 | 含义 |
| :--- | :--- |
| `-1` | 强制关闭 HDR（`return false`） |
| `0` | 自动按 EDID 检测（**默认值**，不是关闭） |
| `1` | 强制开启 HDR（`return true`） |

### 2. `hdr` vs `hdredid` vs `dp3` / `dcip3`

很多人（包括最开始的我）容易把广色域预设和 HDR 混为一谈，实际上它们解决的是两个维度的问题：

| `cm` 预设 | 传输函数 | 目标原色 | 实际效果 |
| :--- | :--- | :--- | :--- |
| `srgb` | SDR | sRGB | 标准 SDR 桌面 |
| `dcip3` | SDR | 影院 DCI-P3（约 6300K 偏绿白点） | 仅 SDR 广色域，不发 HDR 元数据 |
| `dp3` | SDR | Display P3（D65 标准白点） | 消费级显示器日常 SDR 广色域首选 |
| `hdr` (`cm_auto_hdr = 1`) | **HDR10 (ST.2084 PQ)** | 标准 BT.2020 | 按 BT.2020 输出，由**显示器固件**映射到面板色域 |
| `hdredid` (`cm_auto_hdr = 2`) | **HDR10 (ST.2084 PQ)** | **显示器 EDID 原生三原色** | 由 **Hyprland 合成器侧**按面板 EDID 原色做色域映射 |

> [!TIP]
> 实操判断很简单：如果显示器固件本身能正确把 BT.2020 映射到面板原生色域，用 `hdr` 最准（此时用 `hdredid` 反而可能叠加二次压缩略显偏淡）；如果开 `hdr` 发现明显爆红/过饱和，再换成 `hdredid`。另外日常如果只想让 SDR 桌面用满广色域，应选 `dp3` 而非 `dcip3`。

### 3. 为什么 YouTube HDR 视频只给 `bt709`，切全屏反而更暗？

把 `DP-1` 设成日常 `cm = "dp3"` + `cm_auto_hdr = 1` 之后，遇到了两个非常诡异的现象：

1. 全屏看视频依然会闪黑一下；
2. 打开专门找的 YouTube 4K HDR 测试片，右键「详细统计信息（Stats for nerds）」一看，**`Color` 栏居然写着 `bt709 / bt709`**（纯 SDR 流），而且全屏切完之后画面甚至比窗口化 SDR 还暗！

原因正好卡在 **Chrome 与 Hyprland `cm_auto_hdr` 的「先有鸡还是先有蛋」死锁** 上：

1. Chrome 不会仅凭显示器硬件支持 HDR 就向 YouTube 要 HDR 流，而是通过 `wp_color_management_v1` 询问合成器当前输出是否为 HDR，进而决定网页 `window.matchMedia('(dynamic-range: high)').matches` 的返回值。
2. 平时 `DP-1` 在 `dp3`（SDR），`quirks:prefer_hdr` 默认为 `0`，Chrome 拿到的是 SDR → `dynamic-range: high` 为 `false` → YouTube 根本不下发 `bt2020 / smpte2084` 流。
3. 更致命的是，即使把 Hyprland 官方专门用于破局的 `quirks:prefer_hdr` 设为 `1`，在 Chrome 全屏播视频时实时抓取 `hyprctl monitors all`，直接抓到了实锤：

```text
solitary: 0
solitaryBlockedBy: not opaque,subsurfaces
colorManagementPreset: srgb
```

Chrome 在原生 Wayland 下播放视频时会创建 Wayland 子表面（`subsurfaces`）且根表面被判定为非完全不透明（`not opaque`），导致 Hyprland 拒绝让它进入 `solitary` 独占状态——而 `cm_auto_hdr` 恰恰依赖这套检测机制。结果就是：**要么根本不触发切 HDR，要么在播放 `bt709` SDR 流时误切进了一个默认 `sdrMaxLuminance = 80`（80 尼特）的 HDR 容器里，画面自然又闪又暗。**

> [!NOTE]
> 此外从硬件协议本身来看，**「动态 SDR ↔ HDR 切换」与「0 黑屏闪烁」天生互斥**。只要发生 SDR 与 HDR 的动态切换，DisplayPort 就必须通过 DRM modeset 重发 `Colorspace` 与 `HDR_OUTPUT_METADATA`，显示器缩放芯片必须重新锁频——Windows 下也一样。真正实现「全屏看 HDR 完全不闪」的唯一路径，从来都是 **显示器常驻 HDR 模式，全屏时不发生 modeset**。

把 `DP-1` 改为常驻 `cm = "hdr"` 并重启 Chrome 后，实测立刻见效：**YouTube 清晰度齿轮里马上出现了 `2160p60 HDR`，`Stats for nerds` 变为 `bt2020 / smpte2084`，全屏进出也彻底不再黑屏闪烁。**

---

## Third - 常驻 HDR 后的新难题：Chrome 网页灰暗与反汇编实锤

原以为常驻 `cm = "hdr"` 就大功告成了，结果立刻撞上了下一堵硬墙：

刚切到 `cm = "hdr"` 时，整个外接屏的 SDR 内容暗得离谱。查运行态立刻能看到第一层原因：`DP-1` 的 `sdrMaxLuminance` 默认只有 **80 尼特**（`sdrBrightness: 1`、`sdrMinLuminance: 0.2`）。在 SDR 模式下，纯白直接吃满 Mini-LED 背光（日常经常 300~450 nits）；切进 ST.2084 PQ 绝对亮度编码后，80 尼特就是实打实的 80 尼特。

在 `monitors.lua` 里把 `sdr_max_luminance` 调到 `300`、`sdrbrightness` 调到 `1.3`、`sdr_min_luminance` 调到 `0.005` 后，**终端、Waybar、壁纸等普通 SDR 窗口立刻恢复了正常亮度，但 Chrome 里的普通网页和 UI 依然一片灰暗！**

接着查阅了最新的 `wiki.hypr.land`，尝试了专门用来强行把 sRGB 窗口按 Gamma 2.2 渲染的参数：

```bash
hyprctl keyword render:cm_sdr_eotf gamma22force
```

实测结果：**对 Chrome 完全无效。**

### 为什么所有 Hyprland SDR 参数对 Chrome 全都失效？

把「**暗**」和「**灰**」拆开看，真相就浮出水面了。为了不靠猜，直接对本机的 `/usr/bin/Hyprland`（`0.57.2`）做了只读反汇编，定位到 `Monitor::CMonitor::getHDRImageDescription(NCMType::eCMType)`，直接抓到了铁证：

```asm
Monitor::CMonitor::getHDRImageDescription(NCMType::eCMType):
  74d4cb:  mov    $0x50,%eax     ; 0x50 = 80（SDR 默认）
  74d4e2:  mov    $0xcb,%eax     ; 0xcb = 203（硬编码的 HDR 参考白亮度，不读用户配置！）
  74d540:  call   Monitor::CMonitor::getMasteringLuminances()
  74d58e:  call   NColorManagement::CImageDescription::from(SImageDescription const&)
```

随后 Hyprland 会通过 `CWpImageDescriptionInfoV1::sendLuminances()` 把这组亮度直接按 `wp_color_management_v1` 协议发给客户端。结合 Hyprland 上游 GitHub Discussions（[#14999](https://github.com/hyprwm/Hyprland/discussions/14999)、[#15578](https://github.com/hyprwm/Hyprland/discussions/15578)、[#15836](https://github.com/hyprwm/Hyprland/discussions/15836)），整件事的责任划分一清二楚：

1. **「太暗」→ 主要是 Hyprland 的锅（Chrome 反而遵守了协议）**
   - `wp_color_management_v1` 协议规定由合成器通过 `preferred_image_description` 告知客户端 `reference_luminance`（SDR 参考白亮度）。
   - Hyprland `0.57.2` 把这个值硬编码成了 BT.2408 暗室调色标准 **`203` 尼特**，而我们在 `monitors.lua` 里配的 `sdr_max_luminance` 和 `sdrbrightness` **只作用于非色彩管理窗口**，根本不会传进协议里。
   - 对比之下，KDE Plasma（KWin）会把系统的「SDR 内容亮度」滑块联动写入 `reference_luminance`，所以同一个 Chrome 在 KWin 下就不会被锁死在 203 尼特。
2. **「发灰」→ sRGB 分段曲线的历史坑 + Chromium 自己包办转换**
   - 绝大多数显示器在 SDR 模式下实际跑的是纯 **Gamma 2.2**，而 IEC sRGB 规范在暗部有一段线性抬升。
   - Chromium 看到屏幕是 HDR 后，会把**整个窗口**都升成一块 ST.2084 PQ HDR 表面，由内部 Skia 引擎按教条的 sRGB 分段曲线 + 203 尼特把普通网页烘焙进去再交给合成器。
   - 正因为交给 Hyprland 的已经是烘焙完的 HDR 表面，Hyprland 侧针对 SDR 表面的 `sdr_max_luminance`、`sdrbrightness` 乃至 `cm_sdr_eotf = "gamma22force"` **全都插不上手**。

---

## Fourth - 柳暗花明：Chrome 的 `scRGB linear` 破局

本来以为在 Hyprland 上游合并 `reference_luminance` 配置之前只能认命（要么妥协换回 `dp3`，要么自己魔改 Hyprland 源码把 `203` 改大重编译），结果在 Chrome 的实验性选项里找到了一个非常漂亮的破局点：

打开 `chrome://flags/#force-color-profile`，将其修改为：

> **`scRGB linear (HDR where available)`**

等价的命令行参数也可以直接持久化写入 `~/.config/chrome-flags.conf`：

```text
--ozone-platform-hint=wayland
--force-color-profile=scrgb-linear
```

为什么这个参数能把前面的死结一次性解开？从底层色彩管线来看逻辑完全严丝合缝：

- **默认模式（PQ）**：Chrome 直接按 Hyprland 硬编码通告的 `203` 尼特，把网页烘焙成 **ST.2084 PQ** 绝对亮度表面交出去，合成器后续无权调整 SDR 亮度。
- **改为 `scRGB linear (HDR where available)` 后**：Chrome 改用**浮点线性 scRGB（`ext_linear`）**输出——`0.0 ~ 1.0` 代表相对 SDR 亮度范围，`> 1.0` 保留真正的 HDR 高光范围，把最终的亮度映射交回给 Hyprland 处理。

重启 Chrome 实测，最初的全部目标终于同时达成：

- 外接屏 `DP-1` 常驻 `cm = "hdr"`，全屏进出 **0 黑屏、0 闪烁**；
- YouTube 正常解锁 **`2160p60 HDR`（`bt2020 / smpte2084`）**，高光与对比度正常；
- Chrome 日常网页与 UI **不再灰暗**，阅读观感恢复通透明亮，且不需要绑定任何手动切换快捷键。

---

## Fifth - 延伸治理：Electron 全家桶的避坑与 Antigravity 彩蛋

Chrome 解决之后，马上就会发现另一个现实问题：**一旦外接屏常驻 `cm = "hdr"`，所有基于较新 Chromium/Electron 的桌面应用（VS Code、QQ、Codex Desktop、Antigravity 等）拖到外接屏上同样会出现 203 尼特灰暗问题。**

顺手把本机上的 Electron 应用挨个摸了一遍，结果坑比想象中还多：

### 1. Arch Linux 下各应用的 flags 文件并不统一

并不是写一个 `electron-flags.conf` 就能管住所有 Electron 应用，取决于软件是调用系统公共 Electron 还是自带独立二进制：

| 应用 | 实际生效的配置文件 / 入口 | 备注 |
| :--- | :--- | :--- |
| 系统公共 Electron 应用 | `~/.config/electron-flags.conf`（或 `~/.config/electron<版本>-flags.conf`） | 版本号文件优先 |
| Codex Desktop | `~/.config/electron-flags.conf` 或 `~/.config/codex-desktop/electron-flags.conf` | 启动脚本 `/opt/codex-desktop/start.sh` 依次读取两者 |
| VS Code | `~/.config/code-flags.conf` | `/usr/bin/code` 读取 |
| Linux QQ | `~/.config/qq-electron-flags.conf` | `/opt/QQ/start_normal.sh` 传入，重启前需彻底退出托盘进程 |
| 飞书 | `~/.config/feishu-flags.conf` | 底层未启用 `WaylandWpColorManagerV1`，**本身就正常** |
| Antigravity | 无 `*-flags.conf` 包装脚本 | `/usr/bin/antigravity` 直接软链到二进制，需覆盖 `~/.local/share/applications/antigravity.desktop` 或在 `~/.local/bin/` 建包装脚本 |

### 2. `--force-color-profile=scrgb-linear` 在 Electron 里无效！

一开始顺手把 `--force-color-profile=scrgb-linear` 抄进了 VS Code 和 QQ 的 flags 文件，结果发现**毫无作用**。

核查进程命令行后发现，虽然主进程收到了参数，但 Electron 并没有把 `--force-color-profile=scrgb-linear` 透传给 GPU 子进程，Wayland 下依然优先走 `WaylandWpColorManagerV1` 被锁死在 203 尼特。

对于 **VS Code、QQ、Codex 这类本来就不需要在里面看 HDR 视频的应用**，真正简单粗暴且 100% 生效的参数是直接禁用 Wayland 色彩管理协议：

```text
--disable-features=WaylandWpColorManagerV1
```

加上之后彻底重启，它们就会像飞书一样退回普通 SDR 窗口，直接吃 `monitors.lua` 里配好的 `sdr_max_luminance` 和 `sdrbrightness`，亮度瞬间恢复正常。

> [!WARNING]
> 在调整 `monitors.lua` 时，不要为了硬拉高 203 尼特的应用而把 `sdr_max_luminance` 设成显示器满血峰值（比如 `1496`）。一旦 Electron 应用成功绕过 `wp_color_management_v1`，高得离谱的 `sdr_max_luminance` 会把它们的纯白背景拉到刺眼过曝——日常建议稳妥设在 **`250` ~ `400`** 之间。

### 3. 唯一遗留的硬骨头：Antigravity

给 Antigravity 覆盖了用户级 `~/.local/share/applications/antigravity.desktop`：

```ini
Exec=/usr/bin/antigravity --disable-features=WaylandWpColorManagerV1 %U
```

结果重启后依然无效。抓了一下运行中的主进程与 GPU 子进程参数，竟然挖出了 **Antigravity 自身启动代码里的一个 Bug**：

- 主进程确实收到了 `--disable-features=WaylandWpColorManagerV1`；
- 但 Antigravity 启动初始化时执行了一句：

```js
app.commandLine.appendSwitch('disable-features', 'FedCm');
```

Electron 的 `appendSwitch('disable-features', ...)` **不会与外部命令行参数合并，而是直接覆盖**！于是我们辛辛苦苦传进去的 `WaylandWpColorManagerV1` 被 `'FedCm'` 整个洗掉了，GPU 子进程里只剩下了 `FedCm,...`。

接着对比了 Chrome 158 和 Antigravity（Electron 44 / Chrome 152）的二进制字符串，发现其内部甚至不包含 `scrgb-linear`，只有 `scrgb-linear-80-nits`、`srgb`、`display-p3-d65` 三个候选枚举；逐个实测后均无效。

在明确拒绝退回 XWayland（`--ozone-platform=x11` 在 1.5x 缩放下会发虚）且不打算魔改 `/opt/Antigravity/resources/app.asar` 的前提下，Antigravity 在纯 Wayland 外接 HDR 屏下目前算是真正排查见底了——只能等 Hyprland 上游合并 `reference_luminance` 配置，或者 Antigravity 上游修掉覆盖 `disable-features` 的代码；现阶段把它放在笔记本内屏 `eDP-1`（`cm = "dp3"`）上使用是最省心的过渡方式。

---

## Sixth - 上游追踪：Hyprland 相关 Issue / Discussion 与有望改善的 PR

截至 `2026-11-26`，结合 `hyprwm/Hyprland` 仓库的最新进展，本次踩到的两类核心问题在上游都有清晰脉络与对应的追踪入口，方便后续跟进升级节点：

### 1. 全屏 `cm_auto_hdr` 误触发黑屏 / SDR 压暗（已有明确改进 PR）

追根溯源，Hyprland `0.57.2` 里「Chrome 普通 SDR 视频全屏也触发 HDR modeset 黑屏且变暗」其实是上游一连串改动叠加出来的行为：

| 条目 | 状态 | 说明与影响 |
| :--- | :--- | :--- |
| [PR #16674](https://github.com/hyprwm/Hyprland/pull/16674) `cm: offer HDR to the fullscreen surface as the auto HDR trigger` | Merged | **直接诱因**：开启 `cm_auto_hdr` 后，会主动把 HDR 作为全屏窗口的 `preferred_image_description` 通告给客户端；导致 Chromium 等“跟随首选描述”的应用连播普通 SDR 内容时也会切进 HDR，触发烦人的 modeset 黑屏并压暗画面。 |
| [PR #16957](https://github.com/hyprwm/Hyprland/pull/16957) `cm: only prefer HDR for the fullscreen window with prefer_hdr` | Closed | 同一作者最初尝试复用 `quirks:prefer_hdr` 收敛该行为，但引入了其他副作用，已关闭并由 `#16976` 接替。 |
| **[PR #16976](https://github.com/hyprwm/Hyprland/pull/16976) `cm: make the auto HDR preference opt-in with cm_auto_hdr prefer values`** | **Open（重点关注）** | **最直接改善本问题的 PR**：把 `#16674` 的全屏 HDR 首选通告改为通过 `cm_auto_hdr` 的 `prefer` 取值按需 opt-in，避免默认开启 `cm_auto_hdr` 时让 Chromium / `mpv` 在普通 SDR 内容全屏时误切 HDR 与触发无谓的 modeset 黑屏。评论区已有 `0.57.2` Chrome 用户报告完全相同的黑屏变暗症状，并实测验证该 PR 有效。 |
| [PR #16525](https://github.com/hyprwm/Hyprland/pull/16525) `cm: don't advertise HDR headroom on SDR presets` | Merged | 修复 SDR 预设下错误向外通告 HDR headroom 的问题。 |
| [PR #16966](https://github.com/hyprwm/Hyprland/pull/16966) `renderer: HDR -> SDR tonemapping fixes` | Merged | 修复渲染管线中 HDR → SDR 色调映射相关的异常。 |

### 2. 常驻 HDR 下 Chrome / Electron 被锁死 203 nits（尚待正式 PR 落地）

真正能让「常驻 `cm = "hdr"` + 包括 Antigravity 在内的所有原生 Wayland Electron 应用亮度正常」一步到位的，是让 Hyprland 把每块显示器的 SDR 参考白亮度（`reference_luminance`）开放配置并随 `wp_color_management_v1` 通告给客户端。这一方向的当前上游状态如下：

| 条目 | 状态 | 说明与影响 |
| :--- | :--- | :--- |
| [Issue #9064](https://github.com/hyprwm/Hyprland/issues/9064) `Color management support` | Open | Hyprland 色彩管理与 HDR 管线的官方总追踪 Issue。 |
| [Discussion #14999](https://github.com/hyprwm/Hyprland/discussions/14999) `Add per-output reference_luminance to set the SDR white level for color-managed clients in HDR` | Closed as resolved | 详细论证了 `wp_color_management_v1` 客户端在 HDR 下被锁 203 nits 的根因，并提出按显示器配置 `reference_luminance` 的设计思路。 |
| [Discussion #15578](https://github.com/hyprwm/Hyprland/discussions/15578) `[Feature] Configurable SDR reference luminance for HDR (like KWin/Windows "SDR content brightness")` | Open | 呼吁对标 KWin / Windows 的「SDR 内容亮度」滑块，统一非色彩管理与原生色彩管理客户端的 SDR 白电平。 |
| [Discussion #15836](https://github.com/hyprwm/Hyprland/discussions/15836) `wp_color_management_v1 does not apply SDR brightness to preferred image description` | Open | 直指 `sdr_max_luminance` / `sdrbrightness` 未作用于 `preferred_image_description`（Chrome 实测无效）的缺陷反馈。 |
| [PR #16247](https://github.com/hyprwm/Hyprland/pull/16247) `Add per-monitor luminance ref for SDR/HDR chromium/electron issues` | Closed（未合并） | 社区开发者曾直接提交过针对 Chromium/Electron 203 nits 问题的每显示器 `reference_luminance` 修复实现，但因 Hyprland 仓库当前实行「仅接受已 vouch 贡献者 PR」的准入策略而被机器人自动关闭。 |

> [!TIP]
> **后续跟进建议**：
> - 如果你在意的是 **SDR 日常 + 动态 `cm_auto_hdr` 不再被 Chrome 误触发黑屏**，重点盯 **[PR #16976](https://github.com/hyprwm/Hyprland/pull/16976)** 合并进下一个发行版；
> - 如果你想 **彻底移除所有 Electron flags 绕过参数并一并救活 Antigravity**，则需要继续等待 Hyprland 维护者或已 vouch 的贡献者把 `reference_luminance`（对应 `#14999` / `#15578` / `#15836`）正式合入主线。

---

## Final - 最终可用配置汇总

折腾了一大圈，最后真正稳定落地的配置其实非常简洁：

### 1. Hyprland 显示器配置（`~/.config/hypr/monitors.lua`）

```lua
-- 笔记本内屏：日常 Display P3 + VRR
hl.monitor({
    output = "eDP-1",
    mode = "3072x1920@120",
    position = "auto",
    scale = 2,
    bitdepth = 10,
    cm = "dp3",
    vrr = 1,
})

-- 外接 4K@120Hz Mini-LED：常驻 HDR，彻底消除全屏 modeset 闪烁
hl.monitor({
    output = "DP-1",
    mode = "3840x2160@120",
    position = "auto-left",
    scale = "auto",
    vrr = 0,
    bitdepth = 10,
    cm = "hdr",                -- 若觉得色彩过饱和可改用 "hdredid" 对比
    supports_hdr = 1,
    supports_wide_color = 1,
    -- sdr_min_luminance = 0.005, -- 避免 HDR 下 SDR 黑位发灰, 实际观感上差别不大因此注释掉
    sdr_max_luminance = 1400,   -- 这里个人体感上感觉调整成显示器默认HDR最大亮度会比较合适
    sdrbrightness = 1,       -- SDR 亮度倍率，按需微调, 博主本人的显示器感觉保持默认值即可
    sdrsaturation = 1.0,
    disabled = false,
})
```

### 2. Hyprland 渲染配置（`~/.config/hypr/hyprland.lua`）

外接屏已经常驻 `cm = "hdr"`，不再需要 `cm_auto_hdr` 和 `prefer_hdr`：

```lua
hl.config({
    render = {
        cm_auto_hdr = 0,
    },
    quirks = {
        prefer_hdr = 0,
    },
})
```

### 3. Chrome 与 Electron 各应用 Flags

- **Chrome**（`~/.config/chrome-flags.conf` 或 `chrome://flags/#force-color-profile`）：
  ```text
  --ozone-platform-hint=wayland
  --force-color-profile=scrgb-linear
  ```
- **系统 Electron / Codex / VS Code / QQ**（分别写入 `~/.config/electron-flags.conf`、`~/.config/code-flags.conf`、`~/.config/qq-electron-flags.conf`）：
  ```text
  --disable-features=WaylandWpColorManagerV1
  ```

### 4. 最终状态清单

| 场景 / 应用 | 最终方案 | 当前状态 |
| :--- | :--- | :--- |
| 外接屏全屏黑屏 / 闪烁 | `DP-1` 常驻 `cm = "hdr"` + `cm_auto_hdr = 0` | 已彻底解决（0 闪烁） |
| Chrome（YouTube HDR + 日常网页） | `--force-color-profile=scrgb-linear` | 已完美解决 |
| VS Code / QQ / Codex | `--disable-features=WaylandWpColorManagerV1` | 已解决 |
| 飞书 | 无需额外配置 | 原生正常 |
| Antigravity | 纯 Wayland 无命令行绕过路径，暂放内屏 `eDP-1` | 待 Hyprland 或 Antigravity 上游修复 |

> [!NOTE]
> 顺带提一个排查过程中的副产物：如果在 Intel Arc 集显（`xe` 驱动）上用浏览器硬解 4K60 10-bit HDR 视频以降低 CPU 占用，别忘了确认系统安装了 `intel-media-driver`（Intel VA-API 驱动）。

回头看整个过程，其实 Linux Wayland HDR 的底层能力已经比早年成熟了太多，真正消耗人精力的往往不是「能不能点亮」，而是合成器协议默认值、浏览器自研渲染管线、以及各类 Electron 包装脚本之间的微妙错位。希望这篇记录能帮同样在 Hyprland 上折腾 HDR 的朋友少走些弯路。
