# 预言家教程站

这是一个 Astro 静态教程站。教程正文放在 Markdown 文件里，构建后会输出到 `dist/`，可以直接交给宝塔或任意静态网站服务。

## 常用命令

```powershell
npm.cmd install
npm.cmd run import:yuque
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

## 部署说明

- 构建产物在 `dist/`，宝塔静态站点目录指向这个文件夹即可。
- 每次构建前会生成 `public/version.json`，构建后输出为 `dist/version.json`。用户打开旧页面时，前端会定时检查这个文件；发现新版本后会自动刷新到最新页面。
- 推送到 GitHub 后，`.github/workflows/deploy-pages.yml` 会自动构建并发布到 GitHub Pages。

## 新增教程

1. 在 `src/content/guides/` 新增一篇 `.md` 文件。
2. 在文件开头填写 frontmatter：

```markdown
---
title: "教程标题"
description: "一句话说明"
date: "2026-05-28"
order: 2
slug: "your-guide-slug"
---
```

3. 图片放到 `public/assets/你的教程目录/`，正文里用 `/assets/你的教程目录/图片名.png` 引用。
4. 运行 `npm.cmd run build` 检查是否能正常构建。
