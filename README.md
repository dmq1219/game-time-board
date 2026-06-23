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

> 这是一个**原型**：第一版只用 mock 数据 + `localStorage`，**不接** Google / iCloud / Outlook 等真实日历 API。数据结构已为后续替换 Supabase / 日历订阅预留。

## 入口

家庭中控是和原「游戏时间看板」并存的**第二个页面**，独立全屏运行：

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 游戏时间看板（原项目） | `/` (`index.html`) | 原有的行为管理 / 计时看板 |
| **家庭中控日历** | **`/family.html`** | 本次新增的家庭中控屏 |

## 技术栈说明（与需求的差异）

需求里写的是 **Next.js + Tailwind**。但本仓库已经是一个可用的 **Vite + React PWA**，需求也注明「维护太难的话可以协调」。为了**不在同一个仓库里维护两套构建工具链**，家庭中控沿用了现有的 **Vite + React + 原生 CSS**，同样满足：可安装 PWA、可 Add to Home Screen、可部署 Vercel。后续若要迁移到 Next.js，组件与数据层（`src/family/`）可整体平移。

- **构建**：Vite 多页面（`index.html` + `family.html` 两个入口，共用一份依赖 chunk）。
- **状态/存储**：React state + `localStorage`（复用现有 `src/hooks/useLocalStorage.js`）。
- **样式**：原生 CSS（`src/family/styles.css`），大字号、强对比、儿童可读，不依赖 UI 库。

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
- **Photos 管理页**：上传（多选，自动压缩到 ≤1280px 存进 localStorage）、收藏 ★（收藏优先轮播）、删除、立即预览屏保。
- 第一版自带 `/public/photos/` 5 张示例图；上传的照片存在 `familyHub.photos`。

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

**v1 当前限制：**
- 不接 Gmail、不做真正的邮件转发；只处理你**手动粘贴**的文本。
- 规则解析对非常见措辞、跨行事件、相对日期（如「下周三」中文）覆盖有限；过去的裸日期会顺延到明年。
- PDF / 图片仅 UI 占位，尚未真正抽取文字。
- 颜色跟随成员（未做独立调色板）。

**未来升级路径（已预留架构）：**
1. **PDF text extraction**（如 `pdf.js`）→ 填充 `PARSERS.pdf.parse`。
2. **OCR**（图片 flyer）→ 填充 `PARSERS.image.parse`。
3. **AI event extraction**：把规则解析换成 Claude 等模型，提升非结构化文本准确率。
4. **Gmail forward inbox**：给每个家庭一个转发地址，邮件自动落入 inbox → 解析 → Review。
5. **更强的 duplicate detection**：模糊标题 / 时间窗口匹配，跨来源去重。

所有适配器共享一个契约：`parse(input, members) -> Candidate[]`，UI 不需改动即可替换真实抽取实现。

## 本地运行

```bash
npm install
npm run dev
# 浏览器打开 http://localhost:5173/family.html
```

横屏目标分辨率已适配：1024×768、1180×820、1366×1024。

## 部署到 Vercel

仓库根目录无需额外配置（Vite 会被自动识别）：

1. 在 [vercel.com](https://vercel.com) 新建 Project，导入这个 Git 仓库。
2. Framework Preset 选 **Vite**（或保持 Other），**Build Command** `npm run build`，**Output Directory** `dist`。
3. Deploy。完成后家庭中控的地址是 `https://<your-project>.vercel.app/family.html`。

> 也可用 CLI：`npm i -g vercel && vercel`（首次按提示选 build `npm run build` / output `dist`）。原 GitHub Pages 部署不受影响，两个页面会一起构建。

## 在 iPad 上全屏使用（Kiosk Mode）

1. **打开页面**：用 iPad **Safari** 打开部署后的 `…/family.html`（必须是 HTTPS）。
2. **Add to Home Screen**：点分享按钮 → 「添加到主屏幕」。从主屏图标启动即为**全屏无地址栏**（已配置 `apple-mobile-web-app-capable` + landscape manifest）。
3. **保持常亮**：设置 → 显示与亮度 → 自动锁定，调长或设为「永不」（插电时更省心，但更耗电）。
4. **Guided Access 单应用锁定**（防止孩子退出去玩别的）：
   - 设置 → 辅助功能 → 引导式访问，打开并设密码。
   - 回到家庭中控，**连按三次侧边/主屏按钮**启动引导式访问 → 开始。
   - 结束同样连按三次并输入密码。
5. **电池保养（支持的新款 iPad）**：设置 → 电池 → 充电，开启 **80% 充电上限**，适合长期插电常驻。
6. **硬件建议**：10 寸以上 iPad、横屏支架 / 磁吸壁挂、长充电线。

## 数据与后续

所有数据存在 iPad 本机 `localStorage`，不上传、不需登录。命名空间：`familyHub.events` / `chores` / `todos` / `grocery` / `meals.v2` / `rewards` / `photos` / `members` / `settings`。后续可把 `src/family/data/familyData.js` 的 mock 读取替换为 Supabase 或 ICS / Google Calendar 订阅，组件层无需大改。

> 注意：上传照片以 data URL 存进 localStorage（单域名约 5MB 上限），适合少量照片做原型；正式版应改用对象存储 / Supabase Storage。
