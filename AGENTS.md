# AGENTS.md — WeekToDo 桌面组件分支

## 项目概况

- 仓库：https://github.com/11HAN/weektodo（fork 自 `manuelernestog/weektodo`）
- 当前开发分支：`feature/desktop-widget`，同步快进到 `origin/main`
- 仅提供 Windows 版本
- 构建产物：`dist_electron\WeekToDo Setup X.Y.Z.exe`、`dist_electron\win-unpacked\WeekToDo.exe`
- 用户数据：`%APPDATA%\WeekToDo`（`config.json`、`desktop-widget.log`）；渲染进程配置在 localStorage。**不要重置用户配置。**

## 桌面层与输入法架构（改动前必读）

- 组件正常挂载在桌面的 `SHELLDLL_DefView` 子窗口上。
- 桌面处于活动状态时，组件保持为顶层窗口，`owner = Progman`，这样 Chromium 才能把光标位置报给输入法；切换到其他应用后自动重新挂回桌面层。
- 相关文件：
  - `src/desktopLayer.js`：`SetParent`、owner、`detachWindow`、窗口坐标
  - `src/background.js`：桌面 shell watcher、文本编辑模式、`shell mode:` / `text edit:` 日志
  - `src/main.js`：焦点桥、双击编辑预解绑、IME 过渡处理
- 不要回退成“每次编辑都解绑/重绑”，否则会闪屏。
- 不要恢复 always-on-top / lower() 的伪桌面方案。
- 日志：`%APPDATA%\WeekToDo\desktop-widget.log`。

## 默认工作流（代码改动后）

除非用户另有要求，代码改动完成后按以下顺序执行：

1. `git status`；不要 reset 工作区，不要覆盖用户配置。
2. `yarn lint`。
3. 关闭正在运行的 WeekToDo：
   `Get-Process WeekToDo -ErrorAction SilentlyContinue | Stop-Process -Force`
4. 构建：
   ```powershell
   $env:NODE_OPTIONS='--openssl-legacy-provider'
   yarn electron:build
   ```
5. 用 `dist_electron\win-unpacked\WeekToDo.exe` 实机验证；涉及输入法或桌面交互的改动必须验证。
6. 更新 `package.json` 的 `version`，并同步 `README.md` / `README.en.md` 中的安装包文件名。
7. 提交；代码修复和版本发布分开，例如：
   - `fix: ...`
   - `release: X.Y.Z`
8. 推送：
   ```powershell
   git push origin feature/desktop-widget
   git checkout main
   git merge --ff-only feature/desktop-widget
   git push origin main
   git checkout feature/desktop-widget
   ```
9. 汇报版本号、提交、构建路径和验证结果。

默认**不要**发布 GitHub Release、不要安装到 `%LOCALAPPDATA%\Programs\WeekToDo`、不要重启用户正在使用的实例。只有用户明确说“发布 / 发版 / 发 Release”时才执行发布流程。

## 发布流程（用户明确要求时）

- tag：`vX.Y.Z-desktop-widget`
- Release 名称：`WeekToDo X.Y.Z Desktop Widget (Windows)`
- 上传 `dist_electron\WeekToDo Setup X.Y.Z.exe`
- 使用 git credential manager 中的 GitHub token；**不要把 token 打印到输出**
- 安装：`WeekToDo Setup X.Y.Z.exe /S` 覆盖 `%LOCALAPPDATA%\Programs\WeekToDo`，然后重启 `win-unpacked`
- 验证安装包 URL 返回 200，且 `/releases/latest` 指向新 tag

## 常用命令

```powershell
# 依赖（Node 24）
yarn install --ignore-engines

# 开发
yarn electron:serve

# 检查 + 打包
$env:NODE_OPTIONS='--openssl-legacy-provider'
yarn lint
yarn electron:build

# 只生成免安装目录
yarn electron:build --dir
```

## 禁止事项

- 不要提交 `dist_electron/`、`dist_electron_verify/`、`node_modules/`、临时截图或临时脚本。
- 不要用 `LVM_SETITEMSTATE` 清桌面图标选中状态（会导致 explorer 重启）；使用 MSAA `accSelect`。
- 不要在没有实机验证的情况下提交输入法 / 桌面层相关改动。
