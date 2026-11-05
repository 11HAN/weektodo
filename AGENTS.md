# WeekToDo 项目默认工作流

本文件是项目级指令。新会话接手本项目时，先阅读并遵守这里的默认流程。

## 项目概况

- 仓库：`11HAN/weektodo`，上游：`manuelernestog/weektodo`
- 这是 WeekToDo 的 **Windows 桌面组件分支**，当前只提供 Windows 版本
- 技术栈：Vue 3 + Electron 25（Chromium 114）+ electron-builder
- 当前版本号以 `package.json` 为准；最近发布版本为 `2.2.8`
- 运行产物：
  - 安装包：`dist_electron\WeekToDo Setup <version>.exe`
  - 免安装：`dist_electron\win-unpacked\WeekToDo.exe`
- 用户配置：`%APPDATA%\WeekToDo\config.json`
- 日志：`%APPDATA%\WeekToDo\desktop-widget.log`
- 用户日常使用的路径：`F:\Code\WeekToDo\dist_electron\win-unpacked`

## 桌面组件架构（不要破坏）

- 正常状态下，组件是 Windows 桌面 `SHELLDLL_DefView` 的真实子窗口
- 桌面处于活动状态时，组件会切换为顶层窗口，并把 owner 设为 `Progman`，以便：
  - 输入法能拿到光标位置，候选框跟随输入框
  - 点击桌面壁纸时组件不会被 `Progman` 盖住
- 切换到其他应用后，组件自动重新挂回 `SHELLDLL_DefView`
- 桌面层 / 顶层模式切换有约 700ms 的稳定期判断，避免 `Win+D` 期间反复重挂导致闪烁
- 输入框获得焦点前，会先在鼠标按下阶段切换顶层，避免输入法在子窗口状态下初始化
- 桌面图标选中清除使用 MSAA `IAccessible::accSelect(SELFLAG_REMOVESELECT)`
  - **严禁使用 `LVM_SETITEMSTATE`**，会导致 explorer.exe 重启/闪屏
- 窗口位置/大小保存在 `desktopWidgetBounds`（DIP）

## 默认流程 A：构建 + 提交 + 推送

当用户说“按默认流程处理”时，代码改完后执行：

1. `git status`
   - 工作区可能已有其他会话的未提交改动
   - **不要** `reset`、`checkout` 或覆盖不属于本次任务的改动
2. 运行 lint：

   ```powershell
   $env:NODE_OPTIONS='--openssl-legacy-provider'
   yarn lint
   ```

3. 关闭正在运行的 WeekToDo：

   ```powershell
   Get-Process WeekToDo -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

4. 构建安装包：

   ```powershell
   $env:NODE_OPTIONS='--openssl-legacy-provider'
   yarn electron:build
   ```

5. 用当前构建实测：
   - 路径：`dist_electron\win-unpacked\WeekToDo.exe`
   - 需要自动化测试时可以加 `--remote-debugging-port=9222`
   - 至少确认组件能挂载、相关功能可用、日志没有异常
6. 如果本次是用户可见改动：
   - 更新 `package.json` 的 `version`
   - 同步 `README.md` / `README.en.md` 里的安装包文件名
   - 默认**不**发布 GitHub Release
7. 只暂存本次改动的文件并提交，使用 Conventional Commits，例如：
   - `fix: ...`
   - `feat: ...`
   - `docs: ...`
   - `release: 2.2.9`
8. 推送并同步 main：

   ```powershell
   git push origin feature/desktop-widget
   git checkout main
   git merge --ff-only feature/desktop-widget
   git push origin main
   git checkout feature/desktop-widget
   ```

9. 汇报：提交号、构建产物、测试结果、是否有未处理的改动

默认 A **不包含**：

- 创建 GitHub Release
- 上传安装包
- 安装到 `%LOCALAPPDATA%\Programs\WeekToDo`
- 重启用户正在运行的应用

只有用户明确说“发布 / 发版 / 打包发布 / 安装重启”时才做发布流程。

## 发布流程（仅明确要求时）

1. 按默认流程 A 完成版本号、README、构建、提交、推送
2. 创建 GitHub Release：
   - tag：`v<version>-desktop-widget`
   - 标题：`WeekToDo <version> Desktop Widget (Windows)`
   - 上传安装包：`dist_electron\WeekToDo Setup <version>.exe`
3. 通过 git credential manager 读取 GitHub token：
   - 不打印 token
   - 不把 token 写入仓库、日志或回复
4. 发布后验证：
   - `https://github.com/11HAN/weektodo/releases/latest` 指向新版本
   - 安装包下载 URL 返回 200
5. 安装新版并重启：

   ```powershell
   Get-Process WeekToDo -ErrorAction SilentlyContinue | Stop-Process -Force
   Start-Process -FilePath "dist_electron\WeekToDo Setup <version>.exe" -ArgumentList "/S" -Wait
   Start-Sleep -Seconds 3
   Get-Process WeekToDo -ErrorAction SilentlyContinue | Stop-Process -Force
   Start-Process -FilePath "dist_electron\win-unpacked\WeekToDo.exe"
   ```

6. 检查 `%APPDATA%\WeekToDo\desktop-widget.log` 有 `attached to ... SHELLDLL_DefView`

## 构建 / 环境注意事项

- Node 24 下必须带 `NODE_OPTIONS=--openssl-legacy-provider`
- 依赖安装：`yarn install --ignore-engines`
- 只生成免安装目录：`yarn electron:build --dir`
- 不要提交：
  - `dist_electron/`
  - `dist_electron_verify/`
  - `node_modules/`
- 不要重置用户配置：
  - 主题、字体、窗口位置、`localStorage`、`config.json`
- 不要为了截图或测试往用户数据里添加真实任务
- README 截图使用空白未来周，避免暴露个人任务

## 已知功能点

- 设置 → 关于：版本、作者、GitHub 仓库、上游项目、许可证、运行环境
- 输入法：中文候选框跟随输入框；桌面活动时组件保持顶层
- 点击桌面壁纸不会隐藏组件（owner=Progman）
- 切换应用时组件自动回到桌面层
- `Win+D` 不应反复触发窗口重挂
- 桌面组件支持拖动、缩放、锁定；位置持久化
- 液态玻璃主题、系统字体、字体颜色、字重、实时配置同步

## 新会话建议话术

普通修复并构建提交：

```text
按 AGENTS.md 的默认流程处理：修改 <问题>，完成后 lint、构建、提交并推送，先不要发布 Release。
```

只改文档：

```text
按 AGENTS.md 处理：只改文档，不需要构建和发布，提交并推送即可。
```

需要发布：

```text
按 AGENTS.md 发布 <版本号>：构建、提交、推送、发布 GitHub Release、安装并重启。
```

排查桌面组件 / 输入法问题：

```text
按 AGENTS.md 处理：修改 <问题>，用 dist_electron\win-unpacked 实测，完成后构建并提交，先不要发布。
```
