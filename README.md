# Art Style Library · 私人风格库

纯静态网站：按 Cookbook 风格包结构管理你收集的美术风格，支持分类浏览、详情、一键复制正向/负向提示词、查看参考图。第一包：**Sung Choi × Concord**。

## 本地打开

在站点根目录启动本地 HTTP 服务（推荐，避免 `file://` 下 `fetch` JSON 被浏览器拦截）：

```bash
cd /workspace/art-style-library
python3 -m http.server 8765
```

浏览器打开：<http://127.0.0.1:8765/>

> 若直接用 `file://` 打开 `index.html`，首页卡片可依赖内联 fallback 显示，但详情页的 `style.json` 与参考图路径通常会失败——请用上面的 `http.server`。

## 目录结构

```
art-style-library/
├── README.md
├── index.html              # 首页：卡片墙 + 筛选 + 搜索 + 详情弹层
├── site/
│   ├── app.js
│   └── style.css
└── styles/
    ├── index.json          # 风格清单
    ├── _template/
    │   └── style.json      # 新风格空模板
    └── sung-choi-concord/  # 第一包
        ├── style.json
        ├── STYLE_ANALYSIS.md
        ├── cover.jpg
        ├── refs/           # 精选参考图（子集）
        └── prompts/
            ├── full-clean.txt
            └── negative.txt
```

## 如何新增一个风格

1. 复制模板目录并改名：
   ```bash
   cp -r styles/_template styles/<你的-id>
   mkdir -p styles/<你的-id>/refs styles/<你的-id>/prompts
   ```
2. 放入 `cover.jpg`、精选 `refs/`（建议 8–12 张）、可选 `prompts/*.txt` 与分析 Markdown。
3. 编辑 `styles/<你的-id>/style.json`（字段说明见模板与第一包）。
4. 在 `styles/index.json` **追加一条**清单项：
   ```json
   {
     "id": "你的-id",
     "name": "显示名",
     "artist": "艺术家",
     "tags": ["标签"],
     "category": "环境概念",
     "cover": "styles/你的-id/cover.jpg",
     "path": "styles/你的-id"
   }
   ```
5. 若希望 `file://` 下首页也能看到新卡，请同步更新 `site/app.js` 里的 `INDEX_FALLBACK`（用 `http.server` 时不必改）。
6. 刷新浏览器即可。

## 出图工作流（建议）

1. 在本站打开风格详情 → **一键复制正向** / **复制负向**。
2. 从参考图网格挑选约 3 张（`aiart.recommended_refs`）。
3. 本机 Aiart（推荐 gpt 模式）粘贴提示词并附上参考图生成。
4. 按 `notes_zh` 与 `STYLE_ANALYSIS.md` 检查硬边、大平面留白、尺度层级（L1/L2/L3）。

## 第一包：Sung Choi × Concord

- 分类：`环境概念`
- 标签：科幻、环境概念、硬表面、复古未来、游戏美术
- 提示词来源：干净版 clean prompt + 风格分析文档提炼
- 参考图：从原库精选 10 张代表性场景（非全量 30+）

完整原库仍在 `/workspace/sung-choi-concord/`（分析、全量图、历史出图）；本站为可浏览的精简风格包。

## 版权声明

仅供个人学习与风格研究。参考图来自 ArtStation 等平台的公开作品，版权归原作者所有；请勿用于商业发行、冒充原作或二次售卖风格资产。

本仓库不包含任何 API Key。

## 技术说明

- 纯静态，无构建步骤，无海外 CDN 字体（系统字体栈）。
- 深色界面色板借鉴 Concord 风格参考页（teal / amber）。
- 详情为同页 modal + hash 路由（如 `#sung-choi-concord`）。
