# 游戏时间看板

离线优先的家庭行为管理 PWA。数据保存在设备本地，不需要后端或登录。

## iPad 安装

1. 用 iPad Safari 打开 GitHub Pages 的 HTTPS 地址。
2. 点分享按钮。
3. 选择“添加到主屏幕”。
4. 打开主屏幕图标使用。

第一次安装需要联网。安装后，清单、孩子名字和计时记录保存在 iPad 本机。

默认名字是 Child 1-4。真实名字建议在 iPad 的 Settings 页面里修改，这样不会发布到 GitHub 仓库。

## 本地运行

```bash
npm install
npm run dev
```

## 发布

推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

---

# Family Hub · 家庭中控日历（PWA 原型）

闲置 iPad 横屏全屏运行的「家庭运营看板」，灵感来自 Skylight Calendar，但**不复制其品牌、商标和 UI**。它把日历、家务、清单、餐食计划和「星星兑换 screen time」放在一块公共屏幕上，让全家一眼看到：今天谁去哪、谁还没做家务、晚饭吃什么。

> **现状**：已接入 **Supabase**（云端数据库 + Realtime 实时同步），并提供一个 **Cloudflare Worker** 定时把 Gmail 学校邮件解析成待确认日历事件（见下方「Gmail 自动导入」）。若未配置 Supabase 环境变量，应用自动回退到纯 `localStorage` 离线模式（原「游戏时间看板」不受影响）。

## 入口

家庭中控是和原「游戏时间看板」并存的**第二个页面**，独立全屏运行：

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 游戏时间看板（原项目） | `/` (`index.html`) | 原有的行为管理 / 计时看板 |
| **家庭中控日历** | **`/family/`**（兼容 `/family.html`） | 本次新增的家庭中控屏 |

## 线上地址（已部署）

- **家庭中控（iPad 常驻入口）**：<https://family-hub-5rp.pages.dev/family/>（兼容旧地址 `/family.html`）
- **Gmail 同步 Worker**：`https://family-hub-gmail-sync.dmq1219.workers.dev`（Cron 每 15 分钟；`/run` 需 `RUN_TOKEN`，详见 [`worker/`](worker/README.md)）

> 🔒 **访问门禁（已加）**：线上构建配置了 `VITE_FAMILY_PIN`，进 `/family` 需先输入 PIN（验证后存 `localStorage`，kiosk 不必每次重输）。这挡住孩子和路人，但**是应用层门禁**——Supabase anon key 仍在公开 bundle 里，懂技术的人绕过前端仍可直连数据库。
>
> ⚠️ **敏感数据须知**：要真正做服务端防护，请额外**开启 Supabase RLS**（当前关闭）。PIN 门禁 + RLS 才是完整方案。PIN 配置见下方「访问 PIN 门禁」。

## 技术栈说明（与需求的差异）

需求里写的是 **Next.js + Tailwind**。但本仓库已经是一个可用的 **Vite + React PWA**，需求也注明「维护太难的话可以协调」。为了**不在同一个仓库里维护两套构建工具链**，家庭中控沿用了现有的 **Vite + React + 原生 CSS**，同样满足：可安装 PWA、可 Add to Home Screen、可部署 Vercel。后续若要迁移到 Next.js，组件与数据层（`src/family/`）可整体平移。

- **构建**：Vite 多页面（`index.html` + `family.html` 两个入口，共用一份依赖 chunk）。
- **状态/存储**：React state + **Supabase**（`src/family/hooks/useFamilyData.js`）。乐观更新 + Postgres Realtime 跨设备同步；首次启动自动播种 mock 数据。无环境变量时回退到 `localStorage`。
- **样式**：原生 CSS（`src/family/styles.css`），大字号、强对比、儿童可读，不依赖 UI 库。

### 连接 Supabase（可选）

把项目根目录的 `.env.example` 复制为 `.env.local` 并填入你的 Supabase `URL` 和 `anon key`（控制台 → Settings → API），重启 `npm run dev` 即可。需要的数据表见 `src/family/lib/mappers.js` 里的字段映射；`import_candidates` / `events` 等已开启 Realtime。

### 访问 PIN 门禁（可选）

在 `.env.local` 设 `VITE_FAMILY_PIN=你的数字PIN`（4–6 位）即开启：进 `/family` 先输 PIN，验证后存 `localStorage`，kiosk 不会每次重输。留空则不拦截（dev/离线无摩擦）。

> PIN 是**构建期变量**，会打进公开 JS bundle —— **别用重要密码**，它只是挡住孩子/路人的应用层门禁，不是服务端防护。改 PIN 需重新 `npm run build` + 部署。换设备/忘了已解锁状态时，清掉浏览器该站点的 `localStorage` 即可重新弹出门禁。

## 页面结构

顶部栏（家庭名称、日期、实时时钟、mock 天气）+ 导航条（**Dashboard / Meal Plan / Import / Photos** 四页 + 永远可见的「下一条重要事件」），下面切换四个页面。

### Dashboard 首页（一眼看全）

- **左侧日历**：Today / Week / Month 三视图切换，可前后翻页、回到今天。
  - Today = 6:00–22:00 时间轴，事件按成员颜色排布并自动处理重叠分栏。
  - Week = 7 天分栏，每天列出彩色事件条。
  - Month = 整月网格，每格显示彩色事件块。
- **右侧成员栏**：每位家庭成员今天的安排，按各自颜色区分。
- **添加 / 编辑事件弹窗**：标题、分配成员（彩色选择）、日期、全天、起止时间、地点；可删除。点击日历空白处或成员旁的 `+` 也能快速新建。
- **下方面板**：Chores（勾选完成给成员加星）、To-Do、Grocery、Meals（今晚 + 明早 + 待购数量）、Rewards。
- 首页一眼可见：今天安排、本周/本月日历、今天晚餐、家务任务、奖励星星、**下一条重要事件**（顶部 Next up）。

### 三个核心模块

**1) Photo Screensaver 照片屏保** — 闲置 **3 分钟**（`settings.screensaverMinutes` 可配）后自动进入电子相框：全屏轮播照片、大时钟、今天日期、**下一条重要事件**；**轻触任意处返回**。
- **Photos 管理页**：上传（多选，自动压缩到 ≤1280px；接入 Supabase 时优先写入 Storage，便于跨设备同步）、收藏 ★（收藏优先轮播）、删除、立即预览屏保。
- 第一版自带 `/public/photos/` 5 张示例图；旧版上传过的照片可能仍以 base64 形式存在 `photos.src`，新版会在可用时后台迁移到 Storage。

**2) Meal Planning 每周餐食** — `Meal Plan` 页按 Monday–Sunday × Breakfast / Lunch / Dinner 展示，每格点开可编辑菜名、备注、食材。
- **自动生成 Grocery List**：每个 meal 的食材可一键「Add to shopping list」，自动去重并带来源标签（如 `Tue · Dinner`）；也能手动增删。Grocery 支持 checkbox。
- 首页显示：今天晚餐、明天早餐、本周还未购买的食材数量。

**3) Magic Import 邮件 / PDF 转日历** — `Import` 页把学校邮件 / 通知转成**待确认**日历事件，详见下方「Magic Import：现状与升级路径」。

- **Rewards 星星奖励**：完成家务累计星星，`5⭐ = 30 分钟` 兑换 screen time（比例见 `src/family/data/familyData.js` 的 `REWARD_RATE`）。
- 底部还有 **Rename family**、**Photo mode**（立即进屏保）、**Reset demo**（重置 mock 数据）。

> Mock 数据每次首次加载以「今天」为基准生成，所以日历永远是满的。

## Magic Import：现状与升级路径

把邮件 / 通知文本「粘贴 → 解析 → 审核 → 批准」后才写入日历，避免脏数据直接进日程。

**v1 现在能做：**
- **Paste email text**（已实现）：纯前端规则解析器（`src/family/data/parsers.js`）提取 event title / date / start / end / location / child / notes，支持「March 12, 2026」「3/20」「Friday」「tomorrow」等日期与「9:00 AM to 2:30 PM」时间区间，可识别家庭成员名字。
- **Review 审核页**：每条识别结果都可 **edit / 分配成员（即换颜色）/ approve / reject**，点 approve 才写入本地 calendar events。
- **Duplicate detection**：同一天 + 同标题 + 同开始时间，会提示 **"Possible duplicate"**。
- **Upload PDF / Upload image**：第一版是占位（显示「parsing coming soon」），但 parser adapter 已按统一契约接好（`PARSERS.pdf` / `PARSERS.image`）。

**Gmail 自动导入（已实现，见 `worker/`）：**
- 一个 **Cloudflare Worker** 定时（默认每 15 分钟）读取 Gmail，用 **Claude Haiku** 把学校邮件解析成事件，写入 Supabase `import_candidates`（状态 `pending`）。
- 应用通过 **Realtime** 实时收到，在 **Import → 收件箱** 区显示，导航栏出现红点徽章；你 approve 才进日历。
- 邮件被当作**不可信数据**：解析器只抽取事件、不执行邮件里的任何指令（防 prompt injection）。`processed_emails` 表去重，避免重复导入。
- 部署与配置见 [`worker/README.md`](worker/README.md)。规则解析器（`parsers.js`）仍保留，用于**手动粘贴**场景。

**当前限制：**
- 规则（粘贴）解析对跨行/非常见措辞覆盖有限；真实多行学校邮件建议走 Gmail Worker（AI 解析）。
- PDF / 图片仅 UI 占位，尚未真正抽取文字。
- Gmail Worker 用轮询（非 Pub/Sub 推送），最长约一个轮询周期的延迟。
- 颜色跟随成员（未做独立调色板）。

**未来升级路径（已预留架构）：**
1. **PDF text extraction**（如 `pdf.js`）→ 填充 `PARSERS.pdf.parse`。
2. **OCR**（图片 flyer）→ 填充 `PARSERS.image.parse`。
3. **Gmail 实时推送**：用 Gmail watch + Pub/Sub 替换轮询，做到秒级。
4. **更强的 duplicate detection**：模糊标题 / 时间窗口匹配，跨来源去重。

所有适配器共享一个契约：`parse(input, members) -> Candidate[]`，UI 不需改动即可替换真实抽取实现。

## 本地运行

```bash
npm install
npm run dev
# 浏览器打开 http://localhost:5173/family/
```

横屏目标分辨率已适配：1024×768、1180×820、1366×1024。

## 部署到 Vercel

仓库根目录无需额外配置（Vite 会被自动识别）：

1. 在 [vercel.com](https://vercel.com) 新建 Project，导入这个 Git 仓库。
2. Framework Preset 选 **Vite**（或保持 Other），**Build Command** `npm run build`，**Output Directory** `dist`。
3. Deploy。完成后家庭中控的地址是 `https://<your-project>.vercel.app/family/`（旧地址 `.../family.html` 也会跳转）。

> 也可用 CLI：`npm i -g vercel && vercel`（首次按提示选 build `npm run build` / output `dist`）。原 GitHub Pages 部署不受影响，两个页面会一起构建。

## 在 iPad 上全屏使用（Kiosk Mode）

1. **打开页面**：用 iPad **Safari** 打开部署后的 `…/family/`（必须是 HTTPS；旧 `…/family.html` 也可用）。
2. **Add to Home Screen**：点分享按钮 → 「添加到主屏幕」。从主屏图标启动即为**全屏无地址栏**（已配置 `apple-mobile-web-app-capable` + landscape manifest）。
3. **保持常亮**：设置 → 显示与亮度 → 自动锁定，调长或设为「永不」（插电时更省心，但更耗电）。
4. **Guided Access 单应用锁定**（防止孩子退出去玩别的）：
   - 设置 → 辅助功能 → 引导式访问，打开并设密码。
   - 回到家庭中控，**连按三次侧边/主屏按钮**启动引导式访问 → 开始。
   - 结束同样连按三次并输入密码。
5. **电池保养（支持的新款 iPad）**：设置 → 电池 → 充电，开启 **80% 充电上限**，适合长期插电常驻。
6. **硬件建议**：10 寸以上 iPad、横屏支架 / 磁吸壁挂、长充电线。

## 数据与后续

- **已配置 Supabase**：数据存在云端 Postgres，多设备实时同步，首次启动自动播种。表结构见 `src/family/lib/mappers.js`；写入走 `useFamilyData.js` 的乐观更新 + Realtime 回流。
- **未配置环境变量**：自动回退到 iPad 本机 `localStorage`（命名空间 `familyHub.*`），离线可用。
- **Gmail 自动导入**：`worker/` 目录的 Cloudflare Worker，定时把学校邮件解析进 `import_candidates`。

> 注意：上传照片目前以 data URL 存储（localStorage 约 5MB / Supabase 行也不宜过大），适合少量照片做原型；正式版应改用对象存储 / Supabase Storage。
