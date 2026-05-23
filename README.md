# ToolBox Lite - 轻量级在线格式转换工具站

一个面向全球用户的极简工具集合网站。提供图片、PDF、音频、视频等格式转换与处理，采用"免费试用 + 微付费终身买断 + 分享裂变 + 广告收益"的混合商业模式。

---

## 🧠 商业模式

| 收入来源             | 说明                                                                                 |
|----------------------|----------------------------------------------------------------------------------------|
| 一次性微付费 (买断制) | 四档定价：$1.99 / $2.99 / $3.99 / $4.99，终身使用，无水印高清输出 |
| 广告收益             | Google AdSense，向免费用户及试用用户展示广告，付费用户可减少广告                       |
| 分享裂变             | 用户每天可通过分享获得最多 5 次免费高清使用次数，降低获客成本，提升自然流量             |
| 邀请裂变（规划中）   | 成功邀请新用户使用，邀请者和被邀请者均可获得额外免费次数或试用资格，进一步强化病毒传播 |

---

## 🌟 核心功能

- **新用户免费试用 1 次**：全功能，但输出为**标清版本**（不高清），无水印，体验完整流程。
- **四档终身买断**：
  - `$1.99` 解锁所有图片转换工具，高清无水印。
  - `$2.99` 解锁图片 + PDF 转换工具。
  - `$3.99` 解锁图片 + PDF + 音频全部工具。
  - `$4.99` 解锁所有工具，包括**视频转GIF、图片/视频压缩、PDF合并拆分**等后续所有新增高级工具。
  - **已购买任意档位的用户，未来可补差价升级至更高档位。**
- **分享赚次数**：
  - 用户点击分享并确认后即获得 1 次免费高清使用次数（纯前端验证，每日限 5 次）。
  - 每次间隔 10 秒，数据存储于浏览器 localStorage。
- **权限与状态管理**：
  - 基于 localStorage 的激活码验证与试用状态管理。
  - 支持付费激活码解锁，无需注册登录。
  - 采用 HMAC 签名令牌防篡改，localStorage 仅作缓存。

---

## 🛠️ 技术栈

| 层级     | 技术选型                            | 说明                       |
|----------|-------------------------------------|----------------------------|
| 前端     | HTML5 / CSS3 / Vanilla JS           | 可结合 Vibe Coding 工具生成 |
| 图片处理 | `@cross/image` 或 `nouploads`       | 纯浏览器端处理，无需上传    |
| PDF 处理 | `PDF.js` / `jsPDF`                  | 客户端渲染与生成            |
| 音频处理 | `mediabunny` 或 `BeLight`           | 浏览器内格式转换            |
| 视频处理 | `FFmpeg.wasm`                       | 浏览器端视频转GIF、压缩     |
| 部署     | GitHub Pages + Cloudflare CDN       | 全球加速，免费 HTTPS        |
| 支付     | Lemon Squeezy (首选) / Paddle (备选) | 全球税务代缴，支持买断制    |
| 后端     | Cloudflare Workers + KV             | 激活码验证、HMAC 令牌签发   |
| 安全     | Web Crypto API (HMAC-SHA256)        | 权限令牌签发与防篡改校验    |
| 广告     | Google AdSense                      | 条件满足后申请              |

---

## 📁 项目结构（建议）

├── index.html # 首页，工具入口
├── tools/
│ ├── image-converter.html # 图片转换工具页
│ ├── pdf-converter.html # PDF 转换工具页
│ ├── audio-converter.html # 音频转换工具页
│ ├── video-to-gif.html # 视频转GIF工具页 (第四档)
│ ├── compress.html # 图片/视频压缩工具页 (第四档)
│ ├── pdf-merge.html # PDF合并工具页 (第四档)
│ └── pdf-split.html # PDF拆分工具页 (第四档)
├── pages/
│ ├── pricing.html # 定价与功能对比页
│ ├── privacy-policy.html # 隐私政策（AdSense 必需）
│ ├── terms.html # 使用条款
│ ├── about.html # 关于我们
│ ├── contact.html # 联系方式
│ └── tutorial/ # 各工具的详细图文教程（SEO 内容）
├── assets/
│ ├── css/
│ ├── js/
│ │ ├── license.js # 激活码验证与权限管理
│ │ ├── sharing.js # 分享换次数逻辑
│ │ ├── invite.js # (未来) 邀请新用户逻辑
│ │ ├── watermark.js # 水印与输出质量控制
│ │ └── main.js # 公共函数
│ └── images/
├── workers/ # Cloudflare Worker 代码
│ ├── worker.js # 激活码验证、令牌签发
│ └── wrangler.toml # Worker 配置
├── content/ # SEO 教程内容 (目标 15+ 篇)
│ └── blog/
│     ├── png-vs-webp.md
│     ├── pdf-compression-guide.md
│     └── ...
├── locales/ # (未来) 多语言翻译文件
│ ├── en.json
│ ├── es.json
│ ├── pt.json
│ ├── fr.json
│ ├── ja.json
│ └── ko.json
├── CNAME # 自定义域名
└── README.md

---

## 📋 开发阶段

详见 [前端模块拆解.md](./前端模块拆解.md#-推荐开发阶段)，分四个阶段推进：

1. **MVP** — 核心工具 + 试用状态机 + 部署上线
2. **付费** — Lemon Squeezy 沙盒 + Worker 令牌验证
3. **增长** — 分享裂变 + SEO 内容 + AdSense
4. **完善** — 多语言 + Paddle 评估 + 邀请裂变
