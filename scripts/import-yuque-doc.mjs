import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const yuqueDocPath = ["yuanyeyuanye-hjydo", "grtsig", "monbgl5w6avtv918"].join("/");
const sourceUrl = `https://www.yuque.com/${yuqueDocPath}/markdown?plain=true`;
const originalDocUrl =
  "https://guides.yuyanjia.top/guides/yuyanjia-api";
const guideSlug = "yuyanjia-api";
const assetDir = path.join(projectRoot, "public", "assets", guideSlug);
const guidePath = path.join(projectRoot, "src", "content", "guides", `${guideSlug}.md`);

const response = await fetch(sourceUrl, {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    accept: "text/markdown,text/plain,*/*"
  }
});

if (!response.ok) {
  throw new Error(`Failed to fetch Yuque markdown: ${response.status} ${response.statusText}`);
}

await mkdir(assetDir, { recursive: true });

let markdown = await response.text();
markdown = normalizeLineEndings(markdown);
markdown = convertHtmlHeadings(markdown);
markdown = convertHtmlImages(markdown);
markdown = cleanYuqueMarkdownNoise(markdown);
markdown = customizeGuideCopy(markdown);
markdown = applyLatestGuideTweaks(markdown);

const imageUrls = collectImageUrls(markdown);
const imageMap = new Map();

for (let index = 0; index < imageUrls.length; index += 1) {
  const url = imageUrls[index];
  const extension = getImageExtension(url);
  const fileName = `step-${String(index + 1).padStart(2, "0")}${extension}`;
  const localDiskPath = path.join(assetDir, fileName);
  const publicPath = `/assets/${guideSlug}/${fileName}`;

  const imageResponse = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0" }
  });

  if (!imageResponse.ok) {
    throw new Error(`Failed to download image ${url}: ${imageResponse.status}`);
  }

  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  await writeFile(localDiskPath, bytes);
  imageMap.set(url, publicPath);
}

markdown = replaceImageUrls(markdown, imageMap);
markdown = ensureHeadingSpacing(markdown);
markdown = addFrontmatter(markdown);

await writeFile(guidePath, markdown, "utf8");

console.log(`Imported ${imageMap.size} images`);
console.log(`Wrote ${guidePath}`);

function normalizeLineEndings(value) {
  return value.replace(/\r\n?/g, "\n");
}

function convertHtmlHeadings(value) {
  return value.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, rawText) => {
    const text = stripHtml(rawText).replace(/\*\*/g, "").trim();
    if (!text) return "";

    const markdownLevel = Math.min(Number(level) + 1, 6);
    return `${"#".repeat(markdownLevel)} ${text}`;
  });
}

function convertHtmlImages(value) {
  return value.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi, (_, src) => `![](${src})`);
}

function cleanYuqueMarkdownNoise(value) {
  const cleaned = value
    .replace(/\*\*([^*\n]+)\*\*\*\*/g, "**$1**")
    .replace(/\*\*([^\n*]+?)：\*\*/g, "**$1：**")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalizeBoldMarkers(cleaned);
}

function collectImageUrls(value) {
  const urls = new Set();
  const imagePattern = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g;
  let match;

  while ((match = imagePattern.exec(value))) {
    urls.add(match[1]);
  }

  return [...urls];
}

function getImageExtension(url) {
  const pathname = new URL(url).pathname;
  const extension = path.extname(pathname).toLowerCase();
  return extension || ".png";
}

function replaceImageUrls(value, imageMap) {
  let next = value;

  for (const [remoteUrl, localPath] of imageMap) {
    next = next.replaceAll(remoteUrl, localPath);
  }

  return next;
}

function ensureHeadingSpacing(value) {
  return value
    .replace(/\n(#{2,6} .+)/g, "\n\n$1")
    .replace(/(#{2,6} .+)\n(?!\n)/g, "$1\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

function addFrontmatter(value) {
  return `---\ntitle: "预言家API站指南"\ndescription: "按步骤完成购买、充值、密钥填写和模型选择。"\ndate: "2026-05-28"\norder: 1\nslug: "${guideSlug}"\nsource: "${originalDocUrl}"\n---\n\n${value}\n`;
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, "");
}

function normalizeBoldMarkers(value) {
  return value
    .split("\n")
    .map((line) => {
      let next = line;

      next = next.replace(/^\*\*(\d+\.\s*)\*\*([^*]+)\*\*\*\*\s*(.+)\*\*$/u, "**$1$2 $3**");
      next = next.replace(/^\*\*(.+?)\s*\(\*\*(.+?)\*\*\*\*\)\*\*$/u, "**$1 ($2)**");
      next = next.replace(/^\*\*([^*]+)\*\*\s+([^:：]+[：:])\*\*\s*(.+)$/u, "**$1 $2** $3");
      next = next.replace(/^\*\*([^*]+)\*\*\s+(.+?)\*\*$/u, "**$1 $2**");
      next = next.replace(/^\*\*\*\*(.+?)\*\*$/u, "**$1**");

      const boldMarkerCount = (next.match(/\*\*/g) || []).length;
      if (boldMarkerCount % 2 === 1 && next.endsWith("**")) {
        next = next.slice(0, -2);
      }

      return next;
    })
    .join("\n");
}

function customizeGuideCopy(value) {
  const intro = `:::success

## 🛍️ 购买方式说明

点击下方方案，即可直达对应教程板块。

<div class="choice-grid">
  <a class="choice-card" href="#方案一直购密钥">
    <span>方案一</span>
    <strong>直购密钥</strong>
    <em>懒人首选</em>
    <small>买完直接复制 sk- 密钥，粘贴进 APP 设置即可使用。</small>
    <b>适合：图方便、不想注册账号的同学。</b>
  </a>
  <a class="choice-card" href="#方案二注册账号充值额度">
    <span>方案二</span>
    <strong>注册账号，充值额度</strong>
    <em>掌控全场</em>
    <small>先注册 API 站账号，再用兑换码充值，可查看余额和消耗明细。</small>
    <b>适合：想看清楚钱花在哪的同学。</b>
  </a>
</div>

:::`;

  return value
    .replace(
      /:::success\s*\n+## 🛍️ 购买方式说明 \(Choose Your Plan\)[\s\S]*?\n:::/u,
      intro
    )
    .replace(/:::color4\s*\n+\*\*请大家选择自己喜欢的方式，点击标题旁的【小三角】，即可展开操作教程。\*\*\s*\n+:::\s*/u, "")
    .replace(/:::color1\s*\n+### 🧠 模型选择建议[\s\S]*?\n:::\s*\n+:::danger\s*\n+💎\*\* Gemini 系列[\s\S]*?\n:::\s*/u, "");
}

function applyLatestGuideTweaks(value) {
  const verificationCallout = `:::color1
再次打开设置时，快速预设栏会跳回自定义，不用理会它。

请核对这三项：

- **URL：** [https://api.yuyanjia.top/v1](https://api.yuyanjia.top/v1)
- **密钥：** 已粘贴刚才复制的密钥
- **模型：** 保持默认或按下方建议选择

只要这三项对上，就可以保存使用。

:::`;

  return value
    .replace(/将分类切换至API，选择自己想要的额度/u, "分类切换至【API密钥】，选择自己想要的额度")
    .replace(
      /OK，大功告成，现在就可以去聊天了！/u,
      "OK，大功告成，现在就可以去聊天了！\n\n### 🔎 密钥余额查询\n\n如果想确认直购密钥的额度是否到账，或之后想看剩余额度，可以打开 [密钥余额查询](https://balance-checker.yuyanjia.top)，粘贴刚才复制的 sk- 密钥查看。"
    )
    .replace(/在分类中选择【API】/u, "分类切换至【API站充值】")
    .replace(
      /:::color1\s*\n再次打开设置时，快速预设栏会跳回自定义，不用理会它\s*\n\*\*URL：\*\*\[https:\/\/api\.yuyanjia\.top\/v1]\(https:\/\/api\.yuyanjia\.top\/v1\)\s*\n\*{2,}密钥、模型\s*\n\*\*只需要核对这三个信息即可\*\*\s*\n:::/gu,
      verificationCallout
    )
    .replace(
      /:::danger\s*\n\*\*名称：\*\*随便填（比如“霍格沃茨”）。\s*\n\*\*过期时间：\*\*一定要选 “永不过期”。\s*\n\*\*额度：\*\*开启 【无限额度】。\s*\n\*\*访问限制：\*\*留空默认即可。\s*\n点击 【提交】\s*\n:::/u,
      `:::danger
请按下面这样填：

- **名称：** 随便填（比如“霍格沃茨”）。
- **过期时间：** 一定要选“永不过期”。
- **额度：** 开启【无限额度】。
- **访问限制：** 留空默认即可。

最后点击【提交】。

:::`
    )
    .replace(/四、\*\*APP 注入能量\*\*/u, "### 四、APP 注入能量")
    .replace(
      /\*\*直接点击顶部的 【模型广场】，在“可用令牌分组”里选择 【default】，\*\*/u,
      "**直接点击顶部的 [【模型广场】](https://api.yuyanjia.top/pricing)，在“可用令牌分组”里选择【default】。**"
    )
    .replace(
      /\n\*\*\[bus] 企业特供 \(⭐⭐⭐\)\*\*[\s\S]*?\n\*\*\[gcp] 官方正统 \(⭐⭐⭐⭐\)\*\*[\s\S]*?\n\*{4}\s*\n/u,
      "\n"
    )
    .replace(/💎\*\* Gemini 系列 \(推荐主力\)\*\*/u, "**💎 Gemini 系列 (推荐主力)**");
}
