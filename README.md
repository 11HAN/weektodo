[English](README.en.md) | **简体中文**

# WeekToDo | 自由开源的极简周计划应用

---

![GitHub all releases](https://img.shields.io/github/downloads/11HAN/weektodo/total)
[![vue3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)

WeekToDo 是一款注重隐私的免费极简周计划应用。你可以用待办列表和日历安排任务与项目。

> 本分支将周视图做成常驻 Windows 桌面的组件，并增加了液态玻璃主题、系统字体选择和多项桌面端布局改进。当前仅提供 Windows 版本，基于[原版 WeekToDo](https://github.com/manuelernestog/weektodo)二次开发。

[![下载 Windows 版](https://img.shields.io/badge/Download-Windows-2ea44f?logo=windows)](https://github.com/11HAN/weektodo/releases/latest)

## 截图

### Windows 桌面组件

<p align="center">
  <img src="docs/screenshots/desktop-widget.png" alt="Windows 上的 WeekToDo 桌面组件" width="100%" />
</p>

<p align="center">
  <sub>截图展示的是空白的未来周，避免暴露个人任务数据。</sub>
</p>

### 设置

<p align="center">
  <img src="docs/screenshots/settings-font.png" alt="WeekToDo 设置中的系统字体选项" width="70%" />
</p>

## 功能

- Windows 交互式桌面组件（挂载到桌面层，Win+D 后仍显示）
- 浅色 / 深色模式切换
- 自定义待办列表
- 拖放
- 液态玻璃、磨砂、亚克力和纸质桌面主题
- 系统字体、字体颜色和字重选择
- 组件与设置窗口之间实时同步配置
- 多语言
- 子任务
- Markdown 支持
- 可自定义界面
- 本地存储
- 任务颜色
- 任务时间
- 重复任务
- 通知与提醒

## 路线图

- 触屏模式
- 多显示器适配
- 跨设备同步
- 工作区

## 赞助商

WeekToDo 是一个 GPL 许可的开源项目，其持续开发完全依靠用户的支持和赞助。如果你愿意提供帮助，可以考虑[赞助 WeekToDo 的开发](https://weektodo.me/sponsor-us/)或[进行捐赠](https://weektodo.me/support-us/)。

<p align="center">
  <h3 align="center">钻石赞助商</h3>
</p>

<p align="center">
  <a target="_blank" href="https://password.link">
  <img alt="Password.link - 一键安全分享敏感信息和机密文档" src="https://weektodo.me/img/sponsors/passwordlink/wide.webp" width="350">
  </a>
</p>

<p align="center">
  <h3 align="center">白银赞助商</h3>
</p>

<p align="center">
  <a target="_blank" href="https://www.snapclear.app/">
    <img alt="Snapclear - 免费一键移除图片背景" src="https://weektodo.me/img/sponsors/snapclear/wide.webp" width="150">
  </a>
  <a target="_blank" href="https://chrome.google.com/webstore/detail/easyfiller-automatic-form/oaphggcbnpminjffkjgldfepehcdjndp?hl=es&authuser=0">
    <img alt="Easyfiller - 免费一键填写表单" src="https://weektodo.me/img/sponsors/easyfiller/wide.webp" width="150">
  </a>
</p>

## 桌面组件（Windows）

在 Windows 上，WeekToDo 可以直接在桌面上运行一个紧凑的周视图。它挂载到 Shell 的桌面窗口树（`SHELLDLL_DefView`），而不是用置顶或“降到底层”的方式伪装，因此它始终位于普通应用窗口之下，并且在按 Win+D 后仍然显示。它被放在桌面图标列表之上、自己的矩形区域内，鼠标点击、文本输入和任务拖放都能正常工作。

应用只启动桌面组件，不再创建原来的普通 WeekToDo 窗口。可通过托盘菜单打开设置、开关组件或退出。

- 解锁后可拖动组件顶部栏移动位置。顶部栏只作为拖动把手，顶边和顶部两个角不是缩放区域。
- 锁按钮用于锁定 / 解锁位置和缩放。锁定后，周视图、任务和按钮仍然可以正常点击。
- 可从左 / 右边缘、底边和两个底角缩放。位置和大小会被记住。
- 组件始终显示 7 天，起始日为周一或周日，可在“设置 → 桌面组件”中配置。
- 点击某天任务列表下方的空白区域，或通过三点菜单添加任务。桌面组件中没有常驻的新建任务按钮。
- 输入任务时组件会临时前置为普通窗口，让输入法候选框跟随光标；输入框失焦后自动回到桌面层。
- 每天的任务列表可用鼠标滚轮滚动，外层卡片保持固定。滚动条已隐藏，日期标题和输入区域保持不动。组件高度最小可缩到 320 DIP。
- 齿轮按钮和托盘中的“设置”会打开一个独立的无边框可缩放设置窗口。其顶部“设置”栏可拖动，并带有关闭按钮。
- 外观包含磨砂、亚克力、纸质、液态玻璃（纯玻璃）、液态玻璃·浅白和液态玻璃·暗色主题，并提供实时不透明度滑块。液态玻璃主题在外层卡片、顶部栏和日列上使用 SVG 折射，并配合 CSS 高光。
- 显示设置可以选择已安装的 Windows 字体、自定义字体颜色，以及 300–1000 的字重。设置会保存，并在组件和设置窗口之间实时同步。
- 任务文本换行使用悬挂缩进，悬停详情卡保持不透明，方便阅读。
- 旧版本中的调色板式按钮已替换为齿轮设置按钮。

组件通过 `PrintWindow(Progman)` 抓取桌面壁纸并模糊后放在卡片后面，因此它的颜色会跟随实际壁纸，同时 Electron 窗口保持不透明且可交互。如果无法挂载到 Windows 桌面层，组件会自动禁用；应用不会退回到普通顶层窗口。

## 下载与安装

### Windows

从 [Releases](https://github.com/11HAN/weektodo/releases/latest) 下载最新版安装包：

- `WeekToDo Setup 2.2.4.exe`（x64）

双击安装后，应用会直接以桌面组件运行。通过托盘菜单可以打开设置、开关组件或退出。

> 安装包暂未签名，Windows SmartScreen 可能会提示；选择“更多信息 → 仍要运行”即可。

### 系统要求

- Windows 10 / 11（x64）
- 安装包已包含 Electron，无需单独安装运行时

当前版本没有 macOS / Linux 安装包。

## 从源码构建

### 环境要求

- Windows 10 / 11
- [Node.js](https://nodejs.org/)（本仓库在 Node 24 下验证；其他版本可能需要 `yarn install --ignore-engines`）
- [Yarn](https://yarnpkg.com/)
- Git

### 构建步骤

```powershell
git clone https://github.com/11HAN/weektodo
cd weektodo
yarn install --ignore-engines
yarn lint

$env:NODE_OPTIONS='--openssl-legacy-provider'
yarn electron:build
```

产物：

- 安装包：`dist_electron\WeekToDo Setup 2.2.4.exe`
- 免安装目录：`dist_electron\win-unpacked\WeekToDo.exe`

只想生成免安装目录时，使用 `yarn electron:build --dir`。打包前请先退出正在运行的 WeekToDo。

## 参考与致谢

- [manuelernestog/weektodo](https://github.com/manuelernestog/weektodo) — 原版 WeekToDo，本分支的上游项目。
- [bubu-LZY/desktop_todo_Calendar](https://github.com/bubu-LZY/desktop_todo_Calendar) — 桌面上常驻的待办日历，Mica / Acrylic 玻璃主题和桌面嵌入交互的参考。
- [archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass) — 液态玻璃边缘折射的参考实现（MIT 许可），原始声明保留在 `src/helpers/liquidGlass.js`。

## 参与贡献

WeekToDo 是开源的，欢迎 Pull Request 和贡献！有两种参与方式：领取一个已标记为 `accepted` 的[缺陷报告](https://github.com/manuelernestog/weektodo/issues?q=is%3Aopen+is%3Aissue+label%3Abug)或[功能建议](https://github.com/manuelernestog/weektodo/issues?q=is%3Aissue+is%3Aopen+label%3Afeature)，然后开始处理。

更多信息请阅读 [Contributing.md](/CONTRIBUTING.md)。

### 翻译

目前系统已支持多种语言。你可以提交错误修正，也可以添加尚未支持的语言。

英文基础文件在[这里](src/assets/languages/en.json)。

要添加新语言，请 Fork 仓库并创建 Pull Request，新增一个基于 `src/assets/languages/en.json` 的文件，并按照[语言代码](https://gist.github.com/Josantonius/b455e315bc7f790d14b136d61d9ae469)命名。

如果这太麻烦，也可以下载这个[文件](src/assets/languages/en.json)，翻译后发送到 contact@weektodo.me。

## 许可证

本分支基于 GNU General Public License v3 分发，详见 [LICENSE](LICENSE)。原版 WeekToDo 项目由 [Manuel Ernesto Garcia](https://manuelernestogr.bio.link/) 创建。

液态玻璃折射代码改编自 Archis Vaze 的 MIT 许可项目 [liquid-glass](https://github.com/archisvaze/liquid-glass) 演示。原始 MIT 声明保留在 `src/helpers/liquidGlass.js` 中。

## 作者

- [Manuel Ernesto Garcia](https://manuelernestogr.bio.link/)

## 贡献者

- Logo 重塑由 [hallgraph](https://twitter.com/hallgraph) 完成
- [翻译者](https://weektodo.me/about/)

<a href="https://github.com/manuelernestog/weektodo/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=manuelernestog/weektodo" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
