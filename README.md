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
