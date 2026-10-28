/* Art Style Library — pure static frontend */
(function () {
  "use strict";

  const INDEX_FALLBACK = [
    {
      id: "sung-choi-concord",
      name: "Sung Choi × Concord",
      artist: "Sung Choi",
      project: "Concord",
      tags: ["科幻", "环境概念", "硬表面", "复古未来", "游戏美术"],
      category: "环境概念",
      cover: "styles/sung-choi-concord/cover.jpg",
      path: "styles/sung-choi-concord"
    }
  ];

  const state = {
    index: [],
    category: "全部",
    query: "",
    detail: null
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1600);
  }

  async function copyText(text) {
    if (!text) {
      toast("无内容可复制");
      return false;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast("已复制到剪贴板");
      return true;
    } catch (e) {
      toast("复制失败，请手动选中");
      return false;
    }
  }

  function resolveCopy(key) {
    const s = state.detail;
    if (!s || !key) return "";
    if (key === "prompt_full_example") return s.prompt_full_example || "";
    if (key === "negative") return s.negative || "";
    if (key === "example_subject") return s.example_subject || "";
    if (key.indexOf("module:") === 0) {
      const mk = key.slice(7);
      return (s.modules && s.modules[mk]) || "";
    }
    return "";
  }

  async function loadIndex() {
    try {
      const res = await fetch("styles/index.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("bad index");
      return data;
    } catch (e) {
      console.warn("index.json fetch failed, using fallback", e);
      return INDEX_FALLBACK.slice();
    }
  }

  async function loadStyle(path) {
    const url = path.replace(/\/$/, "") + "/style.json";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("无法加载 " + url);
    return res.json();
  }

  function categoriesFrom(index) {
    const cats = ["全部"];
    const seen = new Set(["全部"]);
    index.forEach((s) => {
      if (s.category && !seen.has(s.category)) {
        cats.push(s.category);
        seen.add(s.category);
      }
    });
    index.forEach((s) => {
      (s.tags || []).forEach((t) => {
        if (!seen.has(t)) {
          cats.push(t);
          seen.add(t);
        }
      });
    });
    return cats;
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return state.index.filter((s) => {
      const catOk =
        state.category === "全部" ||
        s.category === state.category ||
        (s.tags || []).includes(state.category);
      if (!catOk) return false;
      if (!q) return true;
      const hay = [s.name, s.artist, s.project, ...(s.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function renderFilters() {
    const box = $("#filters");
    if (!box) return;
    const cats = categoriesFrom(state.index);
    box.innerHTML = "";
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (c === state.category ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", () => {
        state.category = c;
        renderFilters();
        renderGrid();
      });
      box.appendChild(b);
    });
  }

  function renderGrid() {
    const grid = $("#grid");
    const count = $("#count");
    const list = filtered();
    if (count) count.textContent = "共 " + list.length + " 个风格";
    if (!grid) return;
    grid.innerHTML = "";
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "没有匹配的风格，试试清空筛选或搜索。";
      grid.appendChild(empty);
      return;
    }
    list.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.setAttribute("data-id", s.id);
      btn.innerHTML =
        '<div class="card-cover" style="background-image:url(\'' +
        escAttr(s.cover) +
        '\')"></div>' +
        '<div class="card-body">' +
        '<div class="card-artist">' +
        esc(s.artist || "") +
        "</div>" +
        '<h3 class="card-title">' +
        esc(s.name) +
        "</h3>" +
        '<div class="tags">' +
        (s.tags || []).map((t) => '<span class="tag">' + esc(t) + "</span>").join("") +
        "</div></div>";
      btn.addEventListener("click", () => openDetail(s));
      grid.appendChild(btn);
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escAttr(s) {
    return esc(s).replace(/'/g, "&#39;");
  }

  async function openDetail(entry) {
    const backdrop = $("#modal-backdrop");
    const body = $("#modal-body");
    const hero = $("#modal-hero");
    if (!backdrop || !body) return;
    body.innerHTML = '<p style="color:var(--muted)">加载中…</p>';
    hero.style.backgroundImage = "url('" + escAttr(entry.cover) + "')";
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    location.hash = entry.id;

    try {
      const style = await loadStyle(entry.path);
      state.detail = style;
      renderDetail(style, entry);
    } catch (e) {
      body.innerHTML =
        '<p style="color:#d46a5a">加载失败：' +
        esc(e.message) +
        "。请用 <code>python3 -m http.server</code> 在站点根目录启动本地服务后再打开。</p>";
    }
  }

  function closeDetail() {
    const backdrop = $("#modal-backdrop");
    if (backdrop) backdrop.classList.remove("open");
    document.body.style.overflow = "";
    state.detail = null;
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function renderDetail(style, entry) {
    const body = $("#modal-body");
    const base = (entry.path || "").replace(/\/$/, "") + "/";
    const modules = style.modules || {};
    const moduleOrder = [
      "style_lock",
      "render_clean",
      "scale",
      "light",
      "palette",
      "camera",
      "mood"
    ];

    const paletteHtml = (style.palette || [])
      .map(function (p) {
        return (
          '<div class="swatch"><div class="swatch-color" style="background:' +
          escAttr(p.hex) +
          '"></div><div class="swatch-meta"><code>' +
          esc(p.hex) +
          "</code>" +
          esc(p.name || "") +
          "</div></div>"
        );
      })
      .join("");

    const modulesHtml = moduleOrder
      .filter(function (k) {
        return modules[k];
      })
      .map(function (k) {
        return (
          '<div class="module"><div class="module-head"><span class="module-name">' +
          esc(k) +
          '</span><button type="button" class="btn" data-copy-key="module:' +
          escAttr(k) +
          '">复制</button></div><pre>' +
          esc(modules[k]) +
          "</pre></div>"
        );
      })
      .join("");

    const refsHtml = (style.refs || [])
      .map(function (r) {
        const src = base + r;
        return (
          '<button type="button" class="ref-thumb" data-src="' +
          escAttr(src) +
          '" style="background-image:url(\'' +
          escAttr(src) +
          '\')" aria-label="查看参考图"></button>'
        );
      })
      .join("");

    body.innerHTML =
      '<div class="modal-meta">' +
      "<span>" +
      esc(style.artist || "") +
      "</span>" +
      "<span>" +
      esc(style.project || "") +
      "</span>" +
      "<span>" +
      esc(style.category || "") +
      "</span>" +
      "<span>" +
      esc(style.aspect || "") +
      "</span>" +
      "<span>Aiart " +
      esc((style.aiart && style.aiart.mode) || "gpt") +
      " · 建议 refs " +
      ((style.aiart && style.aiart.recommended_refs) || 3) +
      "</span>" +
      "</div>" +
      "<h2>" +
      esc(style.name) +
      "</h2>" +
      '<div class="tags">' +
      (style.tags || []).map(function (t) {
        return '<span class="tag">' + esc(t) + "</span>";
      }).join("") +
      "</div>" +
      (style.notes_zh
        ? '<div class="notes">' + esc(style.notes_zh) + "</div>"
        : "") +
      '<div class="section-label"><h3>色板</h3></div>' +
      '<div class="palette">' +
      (paletteHtml || "<span style='color:var(--muted)'>无</span>") +
      "</div>" +
      '<div class="section-label"><h3>完整示例提示词</h3>' +
      '<button type="button" class="btn primary" data-copy-key="prompt_full_example">一键复制正向</button></div>' +
      '<div class="prompt-box"><pre>' +
      esc(style.prompt_full_example || "") +
      "</pre></div>" +
      '<div class="section-label"><h3>负向提示词</h3>' +
      '<button type="button" class="btn" data-copy-key="negative">复制负向</button></div>' +
      '<div class="prompt-box"><pre>' +
      esc(style.negative || "") +
      "</pre></div>" +
      '<div class="section-label"><h3>模块提示词</h3></div>' +
      '<div class="modules">' +
      modulesHtml +
      "</div>" +
      (style.example_subject
        ? '<div class="section-label"><h3>示例 SUBJECT</h3>' +
          '<button type="button" class="btn" data-copy-key="example_subject">复制</button></div>' +
          '<div class="prompt-box"><pre>' +
          esc(style.example_subject) +
          "</pre></div>"
        : "") +
      '<div class="section-label"><h3>参考图（' +
      (style.refs || []).length +
      "）</h3></div>" +
      '<div class="refs-grid">' +
      (refsHtml || "<span style='color:var(--muted)'>无</span>") +
      "</div>" +
      '<p style="margin-top:22px;color:var(--faint);font-size:12px">' +
      esc(style.copyright || "") +
      "</p>";

    $$("[data-copy-key]", body).forEach(function (btn) {
      btn.addEventListener("click", function () {
        copyText(resolveCopy(btn.getAttribute("data-copy-key")));
      });
    });
    $$(".ref-thumb", body).forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLightbox(btn.getAttribute("data-src"));
      });
    });
  }

  function openLightbox(src) {
    const lb = $("#lightbox");
    const img = $("#lightbox-img");
    if (!lb || !img || !src) return;
    img.src = src;
    lb.classList.add("open");
  }
  function closeLightbox() {
    const lb = $("#lightbox");
    if (lb) lb.classList.remove("open");
  }

  async function boot() {
    state.index = await loadIndex();
    renderFilters();
    renderGrid();

    const search = $("#search");
    if (search) {
      search.addEventListener("input", function () {
        state.query = search.value;
        renderGrid();
      });
    }

    const closeBtn = $("#modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeDetail);
    const backdrop = $("#modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function (e) {
        if (e.target.id === "modal-backdrop") closeDetail();
      });
    }
    const lb = $("#lightbox");
    if (lb) lb.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if ($("#lightbox") && $("#lightbox").classList.contains("open")) closeLightbox();
        else closeDetail();
      }
    });

    const hash = (location.hash || "").replace(/^#/, "");
    if (hash) {
      const entry = state.index.find(function (s) {
        return s.id === hash;
      });
      if (entry) openDetail(entry);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
