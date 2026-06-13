# 游戏时间看板 Handoff 交接文档

生成日期：2026-06-13  
当前本机项目路径：`/Users/tuomai/Documents/家庭管理`

## 1. 项目现状

### 项目类型与技术栈

这是一个离线优先的家庭行为管理 PWA，名称为“游戏时间看板”。

- 前端框架：React 19
- 构建工具：Vite 7
- 语言：JavaScript / JSX / CSS
- 数据存储：浏览器 `localStorage`
- 后端：无
- 登录：无
- PWA：有 `manifest.webmanifest` 和 `service worker`
- 主要目标设备：iPad Safari / Chrome，横屏优先

当前本机运行时：

```bash
node -v
# v23.4.0

npm -v
# 10.9.2
```

GitHub Actions 工作流里配置的 Node 版本是 `22`，建议新电脑使用 Node 22 LTS 或更高版本。

### 关键目录和文件

```text
.
├── .github/workflows/deploy-pages.yml  # 本地源码版的 GitHub Pages 构建工作流
├── .gitignore
├── README.md
├── HANDOFF.md
├── index.html                          # Vite 入口 HTML
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js                           # PWA service worker，当前本地缓存名 game-time-board-v6
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── components/
│   │   ├── AppShell.jsx
│   │   ├── Checklist.jsx
│   │   ├── ChildCard.jsx
│   │   ├── DeviceReturnStatus.jsx
│   │   ├── FamilyPromiseGate.jsx       # 开机家庭团队承诺页，当前倒计时 20 秒
│   │   ├── RulesPage.jsx
│   │   ├── ScreenTimeTimer.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── TaskIllustration.jsx        # checklist 平面图像
│   │   ├── TimerPage.jsx
│   │   ├── TodayDashboard.jsx
│   │   └── WeeklySummary.jsx
│   ├── data/defaults.js
│   ├── hooks/
│   └── utils/
├── dist/                               # 构建产物，已被 .gitignore 排除，可重新生成
└── node_modules/                       # 依赖目录，已被 .gitignore 排除，迁移后用 npm 安装
```

### 依赖清单文件

依赖文件：

```text
package.json
package-lock.json
```

当前直接依赖：

```text
@vitejs/plugin-react 5.2.0
react 19.2.7
react-dom 19.2.7
vite 7.3.5
```

### 配置、环境变量、密钥

已检查当前项目根目录及常见命名模式，未发现：

```text
.env
.env.*
*.pem
*.p12
*secret*
*key*
```

当前项目不需要后端密钥、数据库密码或 API token。

需要注意：如果未来配置 GitHub CLI、部署 token 或私有密钥，不要写入仓库；迁移时通过私密渠道单独传输，并在新电脑上手动填入。

## 2. Git 状态

### 当前分支

```bash
git status --short --branch
# ## public-main
#  M public/sw.js
#  M src/App.jsx
#  M src/components/Checklist.jsx
#  M src/styles.css
# ?? src/components/FamilyPromiseGate.jsx
# ?? src/components/TaskIllustration.jsx
```

当前本地分支：

```bash
git branch -vv
#   main        61be501 Use privacy-safe default child names
# * public-main 7db1299 Initial public GitHub Pages PWA
```

`public-main` 没有 upstream：

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
# fatal: no upstream configured for branch 'public-main'
```

### 未提交改动

当前有未提交源码改动，迁移前必须处理：

```text
已修改：
public/sw.js
src/App.jsx
src/components/Checklist.jsx
src/styles.css

未跟踪：
src/components/FamilyPromiseGate.jsx
src/components/TaskIllustration.jsx
```

这些改动包含最近功能：

- 开机“家庭团队承诺”阅读页
- 启动页 20 秒倒计时
- 20 秒结束后才能点击“开始 / Start”
- checklist 项的平面图像
- PWA 缓存版本更新

### 远程仓库

当前 remote：

```bash
git remote -v
# origin https://dmq1219@github.com/dmq1219/game-time-board.git (fetch)
# origin https://dmq1219@github.com/dmq1219/game-time-board.git (push)
```

远程分支检查结果：

```bash
git ls-remote --heads origin
# fecb768fcb2c3e2195da41269dc4a7a37d47efc5 refs/heads/main
```

临时浅克隆远程 `main` 后发现，远程仓库当前只包含部署后的静态文件：

```text
icon.svg
index.html
manifest.webmanifest
sw.js
```

重要结论：**当前 GitHub 远程仓库不能完整恢复本地 React/Vite 源码。**  
如果只在新电脑执行 `git clone`，拿到的是线上部署文件，不是完整开发工程。

### .gitignore

当前 `.gitignore`：

```text
node_modules
dist
.DS_Store
```

这些文件/目录不进 Git：

- `node_modules/`：不要手动迁移，使用 `npm install` 或 `npm ci` 重装
- `dist/`：构建产物，可用 `npm run build` 重新生成
- `.DS_Store`：macOS 系统文件，无需迁移

## 3. 新电脑恢复步骤

### 推荐路线 A：迁移完整源码目录

因为远程仓库目前不包含完整源码，最稳妥方式是把本机项目目录复制到新电脑。

建议复制这些文件和目录：

```text
.github/
.gitignore
README.md
HANDOFF.md
index.html
package.json
package-lock.json
public/
src/
vite.config.js
```

不要复制：

```text
node_modules/
dist/
.DS_Store
```

复制方式：

- U 盘
- AirDrop
- 局域网共享
- 加密压缩包
- 私密云盘

在新电脑上：

```bash
cd /path/to/迁移后的/家庭管理
npm install
npm run dev
```

本地启动后访问：

```text
http://localhost:5173/
```

如果指定端口：

```bash
npm run dev -- --host 127.0.0.1 --port 4174
```

### 推荐路线 B：先把完整源码推送到 GitHub，再在新电脑 clone

当前远程只有静态部署文件，因此建议在旧电脑上先提交并推送一个源码分支，例如 `source-main`。

旧电脑上执行：

```bash
git switch public-main
git add public/sw.js src/App.jsx src/components/Checklist.jsx src/components/FamilyPromiseGate.jsx src/components/TaskIllustration.jsx src/styles.css
git commit -m "Add promise gate and visual checklist source"
git branch source-main
git push origin source-main
```

注意：当前这台电脑之前 HTTPS/SSH 推送认证不稳定。推送前需要确认 GitHub 认证可用。敏感 token 不要写入文件，只在 GitHub CLI、系统钥匙串或 Git 凭据管理器中配置。

新电脑上 clone：

```bash
git clone https://github.com/dmq1219/game-time-board.git
cd game-time-board
git switch source-main
npm ci
npm run dev
```

如果新电脑只 clone 当前远程 `main`：

```bash
git clone https://github.com/dmq1219/game-time-board.git
cd game-time-board
```

会得到静态部署文件，缺少 `src/`、`package.json`、`vite.config.js` 等源码文件，无法继续正常开发 React/Vite 项目。

### 环境要求

建议安装：

```text
Node.js 22 LTS 或更高
npm 10 或更高
Git
```

可选工具：

```text
GitHub CLI：gh
VS Code 或其他编辑器
Chrome / Safari，用于 PWA 验证
```

### 安装依赖

有 `package-lock.json` 时，推荐：

```bash
npm ci
```

如果 `npm ci` 因 Node 版本或 lockfile 状态失败：

```bash
npm install
```

### 启动、构建、预览

开发模式：

```bash
npm run dev
```

指定 host/port：

```bash
npm run dev -- --host 127.0.0.1 --port 4174
```

生产构建：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

指定预览端口：

```bash
npm run preview -- --host 127.0.0.1 --port 4174
```

### 测试

当前项目没有配置自动化测试脚本。验证方式主要是：

```bash
npm run build
```

然后在浏览器手动检查：

- 开机“家庭团队承诺”页是否显示
- 倒计时是否从 20 秒开始
- 倒计时结束前“开始 / Start”是否禁用
- 倒计时结束后能否进入 Today Dashboard
- 4 个孩子卡片是否显示
- checklist 图像是否显示
- 5 项完成后 screen time timer 是否出现
- Timer Page 到点是否响铃
- Settings 是否能编辑孩子名字/checklist
- JSON/CSV 导出是否可用

### 本地配置和密钥

当前无需手动创建 `.env`。

如果未来添加环境变量，请在新电脑手动创建：

```bash
touch .env
```

示例内容：

```env
# 当前项目暂不需要
# VITE_EXAMPLE_KEY=需手动填入
```

敏感信息只写“需手动填入”，不要写入真实值。

### 数据库 / 本地服务初始化

当前无数据库、无后端服务、无登录系统。

应用数据存在浏览器或 iPad 的 `localStorage` 中：

- 孩子名字
- checklist 状态
- timer 状态
- 每日记录
- settings

这些数据不在项目文件里，也不会跟随 Git 迁移。需要保留数据时，在旧设备 App 的 Settings 里先导出 JSON/CSV。当前应用有导出功能，但没有导入功能。

## 4. 当前进度与待办

### 当前进度

已完成：

- React + Vite PWA 基础应用
- GitHub Pages 线上访问
- iPad 可添加到主屏幕
- localStorage 本地数据保存
- 4 个孩子卡片，两列大方块布局
- checklist 5 项
- checklist 完成后显示 screen time timer
- 倒计时到点后提示归还设备并响铃
- Timer Page
- Rules Page
- Weekly Summary
- Settings 编辑孩子名字/checklist/时间
- JSON/CSV 导出
- 彩色儿童友好 UI
- checklist 平面图像
- 开机“家庭团队承诺”阅读页
- 开机阅读页倒计时已改为 20 秒

### 最近在做什么

最近改动集中在：

- `src/components/FamilyPromiseGate.jsx`
- `src/components/TaskIllustration.jsx`
- `src/App.jsx`
- `src/components/Checklist.jsx`
- `src/styles.css`
- `public/sw.js`

线上 GitHub Pages 已通过手动网页方式更新过静态 `index.html` 和 `sw.js`。

### 已知问题 / 未完成任务

1. 本地源码改动尚未提交到 Git。
2. 远程 GitHub 仓库 `main` 只有静态部署文件，不包含完整源码。
3. GitHub Pages 线上版本和本地源码历史不同步。
4. 当前没有自动化测试。
5. 当前有导出 JSON/CSV，但没有导入功能。
6. iPad PWA 更新时可能受 service worker 缓存影响；若看到旧版本，需要联网后完全退出再打开一次。

## 5. 不在 Git 中需单独传输的文件

### 必须单独处理

当前没有 `.env`、密钥或证书文件需要传输。

### 不建议传输，迁移后重建

```text
node_modules/
dist/
.DS_Store
```

说明：

- `node_modules/`：用 `npm ci` 或 `npm install` 重新生成
- `dist/`：用 `npm run build` 重新生成
- `.DS_Store`：macOS 系统文件，无需保留

### 如果采用文件夹迁移，建议传输

```text
.github/
.gitignore
README.md
HANDOFF.md
index.html
package.json
package-lock.json
public/
src/
vite.config.js
```

建议传输方式：

- U 盘
- AirDrop
- 局域网共享
- 加密压缩包
- 私密云盘

## 6. 迁移风险警告

### 风险 1：远程仓库不是完整源码

当前远程 `main` 浅克隆后只有：

```text
icon.svg
index.html
manifest.webmanifest
sw.js
```

这意味着直接 `git clone` 不能恢复完整开发环境。迁移前必须：

- 复制本地源码目录；或
- 提交并推送完整源码分支。

### 风险 2：本地源码有未提交改动

当前未提交改动包含最新功能。如果只迁移 Git 历史而不迁移工作区文件，这些功能会丢失。

迁移前建议至少执行：

```bash
git status --short
```

确认以下文件已被提交或被复制：

```text
public/sw.js
src/App.jsx
src/components/Checklist.jsx
src/components/FamilyPromiseGate.jsx
src/components/TaskIllustration.jsx
src/styles.css
```

### 风险 3：不要强推覆盖远程 main

本地 `public-main` 和远程 `main` 历史不一致。不要在不确认的情况下执行：

```bash
git push --force
```

否则可能覆盖当前 GitHub Pages 静态线上版本。

### 风险 4：GitHub 认证需要重新配置

远程 URL 使用：

```text
https://dmq1219@github.com/dmq1219/game-time-board.git
```

新电脑如果需要 push，需要重新配置 GitHub 登录、SSH key、GitHub CLI 或 HTTPS token。token 只通过安全凭据管理器保存，不要写入项目文件。

### 风险 5：iPad 本地数据不随代码迁移

iPad 上的孩子名字、每日记录和设置存在该设备浏览器/PWA 的 `localStorage` 中。代码迁移不会迁移这些数据。

需要备份时，在 App Settings 页面导出 JSON/CSV。当前没有导入功能。
