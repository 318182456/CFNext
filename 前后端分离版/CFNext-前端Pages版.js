// CFNext 前端 Pages 明文版：多后端分流与多账号配额监控，未压缩。
/* v4 frontend: 承载面板 UI + 登录 + 多后端下发（前后端分离版前端）。
 *
 * 环境变量
 *   实际部署**只需一个 L**（面板入口路径）；其余配置（后端地址、各后端密钥、映射 UUID、
 *   登录密码）都在面板里完成。下列变量仅作「兜底 / 兼容」保留，可以不设：
 *   L / ENTRY / LOGIN  面板入口路径（不带斜杠）——必需。根路径与 /<L>/ 都 302 到它。
 *   URL      单后端兜底（兼容旧 BACKEND_URL）；面板「多后端管理」保存后以 KV 为准。
 *   BACKENDS 多后端 JSON 数组兜底（面板还没保存过列表时生效）。
 *   API      密钥兜底（某行没单独填密钥时用它；兼容旧 GATE / BACKEND_GATE）。
 *   U        映射段兜底（兼容旧 UUID / BACKEND_UUID）：某行没填 UUID 时用它，再没有用 cf。
 *   ADMIN    可选。强制前端登录密码（设置后面板内改密码无效）。
 *
 * 后端不再校验路径 UUID：前端把 /<L>/api|sub/* 映射到 /<映射段>/*（映射段 = 该行 UUID
 * → env U → cf），后端只要收到正确的 API 密钥就放行任意 UUID。
 *
 * 登录语义（前端独占，后端无登录）
 *   · 未配置 ADMIN env 且 KV 无密码  → 任何访问都返回「强制设置密码」页，不设密码进不去面板；
 *   · 已配置密码（ADMIN env 或 KV）  → 未登录只看得到登录页；面板 / /backends / /becfg /
 *     /setpass / <entry>/api/* 一律要登录态，未登录返回 403 JSON。
 *   · /<entry>/sub/*（订阅下发）保持公开——客户端不会带 cookie。
 *   · POST /<entry>/api/reset（面板「重置」）除了转发后端清 config，还会清除前端登录密码
 *     （前端 KV 的 admin 键）与登录 cookie → 一键回到「设置管理密码」页。
 *
 * 职责（前后端分离）
 *   1) 自建登录（见上）；密码存前端 KV K.admin，与后端完全无关。
 *   2) 承载完整面板 UI（单文件版同一套面板，内置在本文件 PANEL_HTML），登录后返回；
 *      面板里的「管理密码」改为修改前端登录密码，与后端无关。
 *   3) 面板所有 /<entry>/api/* 与 /<entry>/sub/* 转发到后端（注入 X-CF-Api）；
 *   4) 多后端管理（面板「多后端管理」模块）：后端列表存 K.backends，对接设置存 K.becfg；
 *      multi 开时订阅聚合全部后端；balance 显式为 true 才轮换新连接，默认按节点 UUID 固定后端并保留故障切换。
 */

// ===== 登录页 / 首次设置页 =====
const LOGIN_HTML = `<!doctype html><html lang="zh-CN" data-theme="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>登录</title><style>
:root{--bg:#0d1117;--card:#151d29;--bd:#25303f;--tx:#e9eef7;--dim:#93a3b8;--ac:#7c6cff;--ac2:#22d3ee;--err:#f87171}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--tx);font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
body::before,body::after{content:"";position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none}
body::before{width:480px;height:480px;left:-140px;top:-160px;background:rgba(124,108,255,.16)}
body::after{width:420px;height:420px;right:-120px;bottom:-140px;background:rgba(34,211,238,.10)}
.box{position:relative;z-index:1;width:340px;max-width:100%;background:rgba(21,29,41,.72);border:1px solid rgba(255,255,255,.10);border-radius:20px;padding:30px 28px;box-shadow:0 24px 60px rgba(0,0,0,.35)}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:22px}
.mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--ac),var(--ac2));display:flex;align-items:center;justify-content:center}
.mark svg{width:20px;height:20px}.mark path{stroke:#fff}
.bt b{font-size:16px}.bt span{font-size:11.5px;color:var(--dim)}
h1{font-size:15px;margin-bottom:4px}p{color:var(--dim);font-size:13px;margin-bottom:18px}
input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);color:var(--tx);border-radius:12px;padding:11px 13px;font-size:14px;outline:none;margin-bottom:12px;font-family:inherit}
input:focus{border-color:var(--ac)}
button{width:100%;background:linear-gradient(135deg,rgba(124,108,255,.85),rgba(34,211,238,.75));border:1px solid rgba(255,255,255,.22);color:#fff;border-radius:12px;padding:11px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
button:active{transform:translateY(1px)}button:disabled{opacity:.6;cursor:not-allowed}
.msg{color:var(--err);font-size:13px;margin-bottom:12px;display:none;background:rgba(248,113,113,.13);padding:8px 12px;border-radius:8px}
</style></head><body>
<div class="box">
  <div class="brand"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l3-7 4 14 3-7h2"/></svg></div><div class="bt"><b>Console</b><span>CFNext 控制台</span></div></div>
  <h1>__TITLE__</h1><p>__HINT__</p>
  <div class="msg" id="msg"></div>
  <form id="form">
    <input type="password" id="pwd" placeholder="管理密码" autofocus autocomplete="current-password">
    __PWD2__
    <button type="submit" id="btn">__BTN__</button>
  </form>
</div>
<script>
(function(){
  var form = document.getElementById('form');
  var msg = document.getElementById('msg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var p1 = document.getElementById('pwd').value;
    var p2 = document.getElementById('pwd2');
    if (p2) {
      if (p1.length < 4) { msg.textContent = '密码至少 4 位'; msg.style.display='block'; return; }
      if (p1 !== p2.value) { msg.textContent = '两次输入不一致'; msg.style.display='block'; return; }
    }
    fetch(location.pathname, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ password: p1 }) })
      .then(function(r){ return r.json(); })
      .then(function(r){
        if (r && r.ok) { location.href = r.next || location.pathname; }
        else { msg.textContent = (r && r.msg) || '操作失败'; msg.style.display='block'; }
      })
      .catch(function(){ msg.textContent = '网络错误'; msg.style.display='block'; });
  });
})();
</script></body></html>`;

// 首次设置页（设置密码）
const SETUP_HTML = LOGIN_HTML.replace("<title>登录</title>", "<title>设置管理密码</title>")
  .replace("__TITLE__", "设置管理密码")
  .replace("__HINT__", "首次使用，请设置管理密码以保护面板")
  .replace(
    "__PWD2__",
    '<input type="password" id="pwd2" placeholder="再次输入密码" autocomplete="new-password">',
  )
  .replace("__BTN__", "设置并进入");

// 登录页
const LOGIN_PAGE = LOGIN_HTML.replace("<title>登录</title>", "<title>登录 · CFNext 控制台</title>")
  .replace("__TITLE__", "登录")
  .replace("__HINT__", "请输入管理密码以继续")
  .replace("__PWD2__", "")
  .replace("__BTN__", "登录");

// 未配置后端时的提示页
const HINT = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Console</title>
<style>
:root{--bg:#0d1117;--card:#151d29;--bd:#25303f;--tx:#e9eef7;--dim:#93a3b8;--ac:#7c6cff}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--tx);font-family:"PingFang SC","Microsoft YaHei","Segoe UI",system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.box{width:520px;max-width:100%;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:26px 24px}
h1{font-size:15px;font-weight:600;margin-bottom:14px}p{color:var(--dim);font-size:13px;line-height:1.75;margin-bottom:10px}
code{background:rgba(124,108,255,.14);color:#c9c2ff;padding:2px 6px;border-radius:5px;font-size:12.5px;font-family:ui-monospace,Menlo,Consolas,monospace}
b{color:var(--tx);font-weight:600}
</style></head><body><div class="box">
<h1>面板入口已就绪</h1>
<p>访问 <code>/&lt;L&gt;</code>（你在环境变量 <code>L</code> 里设置的入口路径）进入面板，登录后在「面板设置 → 多后端管理」里添加后端即可。</p>
<p>每行格式：<code>名称:地址,API密钥,UUID</code></p>
<p>本前端只需一个环境变量 <code>L</code>，其余配置（后端地址、各后端密钥、订阅 UUID、登录密码）都在面板里完成。</p>
</div></body></html>`;

// 密码哈希（简单 FNV-1a，仅用于 cookie 比对，非安全场景）
function hashPwd(p) {
  let h = 0x811c9dc5;
  for (let i = 0; i < p.length; i++) {
    h ^= p.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}
const AC = "cfn_auth";

// 规范化单个后端条目（补 name，api/uuid 只保留「显式填写」的值）
// 关键：这里**不**把环境变量 API/U 固化进条目 —— 它们由 parseBackends 在运行期兜底，
// 否则存进 KV 后会盖住以后对 env 的修改（改了 env 却不生效）。
function normBackend(it) {
  const u = String((it && it.url) || "")
    .trim()
    .replace(/\/+$/, "");
  if (!u) return null;
  return {
    name: String((it && it.name) || "").trim() || u.replace(/^https?:\/\//i, "").split(".")[0],
    url: u,
    api: String((it && (it.api || it.gate)) || "").trim(),
    uuid: String((it && it.uuid) || "")
      .trim()
      .replace(/^\/+|\/+$/g, ""),
  };
}

// 解析后端列表：优先前端 KV（K.backends），其次 env BACKENDS（JSON 数组），最后 URL 单后端
// 环境变量简写：URL=BACKEND_URL、API=GATE=BACKEND_GATE、U=BACKEND_UUID（旧名仍兼容）
// 密钥优先级：后端条目自带的 api > 环境变量 API（共享兜底）> 无（未配置 ⇒ 后端 fail-open）
// uuid 优先级：条目自带的 uuid > 环境变量 U（运行期兜底，不落 KV）> 自动发现
async function parseBackends(env) {
  const sharedApi = String(env.API || env.GATE || env.BACKEND_GATE || "").trim();
  const envUuid = String(env.U || env.UUID || env.BACKEND_UUID || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  const norm = (arr) => {
    const out = [];
    for (const it of arr) {
      const b = normBackend(it);
      if (!b) continue;
      if (b.api) b.apiExplicit = true;
      else b.api = sharedApi; // 没单独填密钥 ⇒ 用环境变量里的共享密钥
      b.envUuid = envUuid; // 运行期 uuid 兜底（仅内存，不写 KV）
      out.push(b);
    }
    return out;
  };

  // 1) 前端 KV 里持久化的后端列表（面板「多后端管理」保存的结果）优先
  try {
    if (env.K && typeof env.K.get === "function") {
      const kvRaw = await env.K.get("backends");
      if (kvRaw) {
        const kvList = norm(JSON.parse(kvRaw));
        if (kvList.length) return kvList;
      }
    }
  } catch (_) {
    /* KV 读取失败则回退 env */
  }

  // 2) env BACKENDS（JSON 数组）
  const raw = String(env.BACKENDS || "").trim();
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const list = norm(arr);
        if (list.length) return list;
      }
    } catch (_) {
      /* BACKENDS 非法则忽略 */
    }
  }

  // 3) env URL 单后端
  const base = String(env.URL || env.BACKEND_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (base) {
    return [
      {
        name: base.replace(/^https?:\/\//i, "").split(".")[0],
        url: base,
        api: sharedApi,
        uuid: "",
        envUuid,
      },
    ];
  }
  return [];
}

// 读取对接设置：K.becfg = {sel, multi, balance}；默认关闭聚合与轮询，稳定模式按节点 UUID 固定后端。
async function parseBecfg(env, len) {
  let cfg = {
    sel: 0,
    multi: false,
    balance: false,
  };
  try {
    if (env.K && typeof env.K.get === "function") {
      const raw = await env.K.get("becfg");
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o === "object") {
          if (Number.isInteger(o.sel)) cfg.sel = o.sel;
          if (typeof o.multi === "boolean") cfg.multi = o.multi;
          if (typeof o.balance === "boolean") cfg.balance = o.balance;
        }
      }
    }
  } catch (_) {
    /* 非法则用默认 */
  }
  if (cfg.sel < 0 || cfg.sel >= len) cfg.sel = 0;
  return cfg;
}

// 校验单个后端 URL 合法性
function validUrl(u) {
  return /^https?:\/\//i.test(u);
}

// 构造转发请求头：剥 host/content-length/x-cf-*，注入 api
function buildHeaders(request, api) {
  const h = new Headers();
  for (const [k, v] of request.headers) {
    const lk = k.toLowerCase();
    if (
      lk === "host" ||
      lk === "content-length" ||
      lk === "x-cf-api" ||
      lk === "x-cf-gate" ||
      lk === "x-cf-host" ||
      lk === "x-cf-tunnel-uuid"
    )
      continue;
    h.set(k, v);
  }
  if (api) h.set("x-cf-api", api);
  return h;
}

// 映射路径段（前端 → 后端）：行内显式 UUID > 环境变量 U（兼容） > 固定兜底段。
// 后端已不再校验路径 UUID（只要带对 API 密钥，任意 UUID 都放行），所以前端只需要一个
// 稳定段即可把 /<entry>/api|sub/* 映射出去；也因此不再需要「自动发现后端 UUID」
// —— 那只会给每个未填 UUID 的后端白加一次网络探测。
const FALLBACK_SEG = "cf";
function mappingSeg(b) {
  return b.uuid || b.envUuid || FALLBACK_SEG;
}
// Resolve the formats supported by aggregation without changing other client formats.
function aggregateFormat(value, userAgent) {
  const format = String(value || "").toLowerCase();
  if (["clash", "stash", "mihomo"].includes(format)) return "clash";
  if (["singbox", "sing-box", "hiddify"].includes(format)) return "singbox";
  if (format && format !== "auto") return null;
  const ua = String(userAgent || "").toLowerCase();
  if (/sing-?box|hiddify/.test(ua)) return "singbox";
  if (/clash|mihomo|stash|mozilla|applewebkit/.test(ua)) return "clash";
  return null;
}
function subscriptionNodeCount(body, format) {
  if (format === "singbox") {
    try {
      return (JSON.parse(body).outbounds || []).filter(
        (node) => node.type && !["selector", "urltest", "url-test", "direct", "block", "dns"].includes(node.type),
      ).length;
    } catch (_) { return 0; }
  }
  const start = body.startsWith("proxies:") ? 0 : body.indexOf("\nproxies:") + 1;
  if (start < 0 || !body.slice(start).startsWith("proxies:")) return 0;
  const tail = body.slice(start + "proxies:".length);
  const next = tail.search(/\n[A-Za-z][\w-]*:/);
  const nodes = next < 0 ? tail : tail.slice(0, next);
  return (nodes.match(/^  - (?:name\s*:|\{)/gm) || []).length;
}
// 聚合订阅：并行拉所有后端 /<uuid>/sub/<fmt>，合并节点（非首个后端加名称前缀），规则/组用第一个成功后端
async function aggregateSub(backends, fmt, search, frontHost, entryPath, env) {
  const u = new URL("https://local" + (search || ""));
  const qs = u.search || "";
  const blocked = await quotaBlockedBackends(env);
  const results = await Promise.all(
    backends.map(async (b) => {
      if (blocked.has(b.url))
        return {
          name: b.name,
          text: "",
          err: "Account quota threshold reached",
        };
      try {
        const uuid = mappingSeg(b);
        const subReq = new Request("https://local/", {
          headers: {
            "User-Agent": "clash.meta",
            Accept: "*/*",
          },
        });
        const h = buildHeaders(subReq, b.api);
        // 关键：聚合订阅里节点域名必须统一为「前端访问域名」，否则节点 servername 落到 *.workers.dev 被 DNS 污染
        h.set("x-cf-host", frontHost);
        const res = await fetch(b.url + "/" + uuid + "/sub/" + fmt + qs, {
          headers: h,
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok)
          return {
            name: b.name,
            text: "",
            json: null,
            err: "HTTP " + res.status,
          };
        const text = await res.text();
        return {
          name: b.name,
          text,
          json: null,
          err: "",
        };
      } catch (e) {
        return {
          name: b.name,
          text: "",
          json: null,
          err: (e && e.message) || String(e),
        };
      }
    }),
  );
  const ok = results.filter((r) => r.text);
  if (!ok.length) {
    const detail = results.map((r) => `${r.name}:${r.err}`).join("; ");
    return new Response("all backends failed: " + detail, {
      status: 502,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }
  let merged;
  if (fmt === "singbox") {
    merged = mergeSingbox(ok);
  } else {
    merged = mergeClash(ok);
  }
  return new Response(merged, {
    status: 200,
    headers: {
      "content-type": fmt === "singbox" ? "application/json; charset=utf-8" : "text/yaml; charset=utf-8",
      "cache-control": "no-store",
      "X-CFNext-Backend-Count": String(ok.length),
      "X-CFNext-Backend-Total": String(backends.length),
      "content-disposition": `attachment; filename="CFNext-aggregate.${fmt === "singbox" ? "json" : "yaml"}"`,
    },
  });
}

// 保留用户设置的节点名；只有重名时才追加后端编号，避免显示部署项目名。
function uniqueSubscriptionName(name, backendIndex, used) {
  let result = name;
  let suffix = 1;
  while (used.has(result)) {
    result = name + "·后端" + (backendIndex + 1) + (suffix > 1 ? "-" + suffix : "");
    suffix++;
  }
  used.add(result);
  return result;
}

// Clash/Karing（YAML）合并：以第一个成功后端为模板，并入其余后端节点。
function yamlName(value) {
  value = value.trim();
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch (_) {}
  }
  if (value.startsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value;
}

// Add every backend's nodes to the primary node-selection groups as well as proxies.
function mergeClash(ok) {
  let merged = ok[0].text;
  const blocks = [],
    extraNames = [],
    firstNames = [];
  const nodeSection = (text) => {
    const start = text.indexOf("\nproxies:");
    if (start < 0) return "";
    const tail = text.slice(start + "\nproxies:".length);
    const next = tail.search(/\n[A-Za-z][\w-]*:/);
    return next < 0 ? tail : tail.slice(0, next);
  };
  nodeSection(merged).replace(/^  - name:\s*(.+)$/gm, (_, name) => {
    firstNames.push(yamlName(name));
    return _;
  });
  const usedNames = new Set(firstNames);
  for (let i = 1; i < ok.length; i++) {
    const block = nodeSection(ok[i].text).replace(/^(  - name:\s*)(.+)$/gm, (_, prefix, name) => {
      const renamed = uniqueSubscriptionName(yamlName(name), i, usedNames);
      extraNames.push(renamed);
      return prefix + JSON.stringify(renamed);
    });
    if (block) blocks.push(block);
  }
  const start = merged.indexOf("\nproxies:");
  if (blocks.length && start >= 0) {
    const tail = merged.slice(start + "\nproxies:".length);
    const next = tail.search(/\n[A-Za-z][\w-]*:/);
    const end = next < 0 ? merged.length : start + "\nproxies:".length + next;
    merged = merged.slice(0, end) + blocks.join("") + merged.slice(end);
  }
  const groupStart = merged.indexOf("\nproxy-groups:");
  if (groupStart >= 0 && extraNames.length) {
    const prefix = merged.slice(0, groupStart),
      tail = merged.slice(groupStart);
    const next = tail.slice(1).search(/\n[A-Za-z][\w-]*:/);
    const end = next < 0 ? tail.length : next + 1;
    const groups = tail.slice(0, end).replace(/(^  - name:[\s\S]*?)(?=^  - name:|$(?![\s\S]))/gm, (block) => {
      if (!/^    proxies:\s*$/m.test(block)) return block;
      const membership = [...block.matchAll(/^      - (.+)$/gm)].map((m) => yamlName(m[1]));
      if (!membership.some((name) => firstNames.includes(name))) return block;
      return block.replace(
        /(^    proxies:\s*\n)((?:^      - .*\n?)*)/m,
        (_, header, members) =>
          header +
          members.replace(/\n?$/, "\n") +
          extraNames.map((name) => "      - " + JSON.stringify(name)).join("\n") +
          "\n",
      );
    });
    merged = prefix + groups + tail.slice(end);
  }
  const first = merged.split("\n")[0];
  if (first.startsWith("#")) merged = merged.replace(first, first + " · 聚合 " + ok.length + " 后端");
  return merged;
}
function mergeSingbox(ok) {
  let base;
  try {
    base = JSON.parse(ok[0].text);
  } catch (_) {
    return ok[0].text;
  }
  if (!Array.isArray(base?.outbounds)) return ok[0].text;
  const isNode = (o) => o && !["selector", "urltest", "direct", "block", "dns"].includes(o.type);
  const firstNames = new Set(base.outbounds.filter(isNode).map((o) => o.tag));
  const existing = new Set(base.outbounds.map((o) => o.tag));
  const usedNames = new Set(existing);
  const additions = [];
  for (let i = 1; i < ok.length; i++) {
    let other;
    try {
      other = JSON.parse(ok[i].text);
    } catch (_) {
      continue;
    }
    const names = new Map(
      (other.outbounds || []).filter(isNode).map((o) => [o.tag, uniqueSubscriptionName(o.tag, i, usedNames)]),
    );
    for (const outbound of other.outbounds || []) {
      if (!isNode(outbound)) continue;
      const tag = names.get(outbound.tag);
      if (!tag || existing.has(tag)) continue;
      const copy = {
        ...outbound,
        tag,
      };
      if (copy.detour && names.has(copy.detour)) copy.detour = names.get(copy.detour);
      base.outbounds.push(copy);
      additions.push(tag);
      existing.add(tag);
    }
  }
  for (const group of base.outbounds) {
    if (["selector", "urltest"].includes(group.type) && group.outbounds?.some((tag) => firstNames.has(tag))) {
      group.outbounds = [...new Set([...group.outbounds, ...additions])];
    }
  }
  return JSON.stringify(base);
}

// 「保存后端列表」写接口：body 为 { backends: [{name,url,api,uuid}] }，整体覆盖写入前端 KV K
async function saveBackends(request, env) {
  if (!env.K || typeof env.K.put !== "function") {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: "前端未绑定 KV（K），无法持久化后端列表，请用 env BACKENDS/URL 配置",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  let body;
  try {
    body = await request.json();
  } catch (_) {
    body = null;
  }
  const list = body && Array.isArray(body.backends) ? body.backends : null;
  if (!list) {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: '请求体需为 {"backends":[{name,url,api,uuid}]}',
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  const clean = [];
  for (const it of list) {
    const b = normBackend(it);
    if (b) clean.push(b);
  }
  if (!clean.length) {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: "没有有效的后端（url 必填且以 http(s):// 开头）",
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  try {
    await env.K.put("backends", JSON.stringify(clean));
    // 选中索引收敛到新列表范围
    const cfg = await parseBecfg(env, clean.length);
    await env.K.put("becfg", JSON.stringify(cfg));
    return new Response(
      JSON.stringify({
        ok: true,
        msg: "已保存 " + clean.length + " 个后端",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: "保存失败: " + ((e && e.message) || e),
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
}

// 「保存对接设置」写接口：body 为 { sel, multi, balance }，写入 K.becfg
async function saveBecfg(request, env, len) {
  if (!env.K || typeof env.K.put !== "function") {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: "前端未绑定 KV（K），无法保存对接设置",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  let body;
  try {
    body = await request.json();
  } catch (_) {
    body = null;
  }
  if (!body || typeof body !== "object") {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: '请求体需为 {"sel":0,"multi":false}',
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  let sel = Number.isInteger(body.sel) ? body.sel : 0;
  if (sel < 0 || sel >= len) sel = 0;
  const multi = !!body.multi;
  const previous = await parseBecfg(env, len);
  const balance = typeof body.balance === "boolean" ? body.balance : previous.balance;
  try {
    await env.K.put(
      "becfg",
      JSON.stringify({
        sel,
        multi,
        balance,
      }),
    );
    return new Response(
      JSON.stringify({
        ok: true,
        msg: multi
          ? "已开启多订阅聚合（" + len + " 个后端）"
          : "已切换到「" + "第 " + (sel + 1) + " 个后端」",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: "保存失败: " + ((e && e.message) || e),
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
}

// ===== 面板 HTML（构建期由 panel.html 内联，占位符 __PANEL_HTML__）=====
const PANEL_HTML = `
<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>控制台</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='3' width='18' height='18' rx='5' fill='%23f6821f'/%3E%3Cpath d='M8 15V9l8 6V9' stroke='%230d131b' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
<style>
.mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;flex:0 0 34px;box-shadow:0 4px 12px var(--accent-dim)}
.mark svg{width:18px;height:18px}
.mark path{stroke:#0d131b}
.ver-chip.has-update{color:var(--accent);background:var(--accent-dim);border-color:var(--accent)}
.ver-chip.checking{opacity:.7;pointer-events:none}
.ibtn{width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 34px}
.mbadge{margin-left:auto;padding:3px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 1px 0 rgba(255,255,255,.14);font-size:12px;color:var(--accent);white-space:nowrap}
[data-theme="light"] .mbadge{border-color:rgba(30,45,70,.10);background:rgba(255,255,255,.60);box-shadow:inset 0 1px 0 rgba(255,255,255,.90)}
.ibtn:hover{border-color:var(--accent);color:var(--accent)}
.ibtn svg{width:16px;height:16px;stroke:currentColor}
.wdwarn{display:none;background:rgba(59,130,246,.10);border-bottom:1px solid rgba(59,130,246,.35);color:var(--accent2);padding:9px 26px;font-size:12.5px;line-height:1.6;text-align:center}
[data-theme="light"] .wdwarn{color:var(--accent);background:rgba(29,95,168,.06);border-bottom-color:rgba(29,95,168,.35)}
.content{padding:22px 26px 96px;max-width:1180px;width:100%;margin:0 auto}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.view-head{margin-bottom:16px}
.view-head h2{font-size:20px;font-weight:700}
.view-head p{color:var(--dim);font-size:13px;margin-top:4px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}
.filter-region{display:flex;align-items:center;gap:14px;padding:2px 0 14px;border-bottom:1px solid var(--border);margin-bottom:14px;flex-wrap:wrap}
.filter-region-label{font-size:13px;font-weight:600;white-space:nowrap}
.filter-row{display:flex;flex-wrap:wrap}
.filter-group{flex:0 1 auto;min-width:180px;padding:0 14px;border-left:1px solid var(--border)}
.filter-group:first-child{border-left:none;padding-left:0}
.filter-group-title{font-size:12px;font-weight:600;color:var(--dim);margin-bottom:9px;letter-spacing:.3px}
.pills.nowrap{flex-wrap:nowrap;white-space:nowrap}
.pills.nowrap .spill span{padding:5px 10px;font-size:12px}
.spill input{position:absolute;opacity:0;pointer-events:none}
.spill span{display:inline-block;padding:5px 14px;border:1px solid rgba(255,255,255,.13);border-radius:999px;font-size:12.5px;color:var(--dim);cursor:pointer;background:rgba(255,255,255,.05);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 2px 8px rgba(0,0,0,.20);transition:border-color .15s,color .15s,background .15s,box-shadow .15s;user-select:none;line-height:1.5}
.spill:hover span{border-color:var(--accent);color:var(--accent)}
.spill input:checked + span{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600;border-radius:999px}
.card h3 .tick{width:3px;height:14px;border-radius:2px;background:var(--accent)}
.checkline{display:flex;align-items:center;gap:20px;padding:5px 0;font-size:13px;cursor:pointer}
.checkline input{margin:0;flex:0 0 auto;vertical-align:middle}
.checkline span{line-height:1.5}
.proto-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--border);font-size:13.5px}
.proto-row:last-child{border-bottom:none}
.switch{position:relative;display:inline-block;width:40px;height:22px;flex:0 0 40px}
.switch input{opacity:0;width:0;height:0}
.switch input:checked+.sl{background:var(--accent)}
.switch input:checked+.sl::before{transform:translateX(18px)}
.btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#201308;font-weight:600}
.btn.primary:hover{filter:brightness(1.06);color:#201308}
.btn.danger{background:var(--err-dim);border-color:transparent;color:var(--err)}
.btn.danger:hover{border-color:var(--err)}
.btn .dirty-dot{display:none;width:6px;height:6px;border-radius:50%;background:var(--warn)}
.btn.dirty .dirty-dot{display:inline-block}
.tbl-wrap{overflow-x:auto}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11.5px}
.badge.g{background:var(--ok-dim);color:var(--ok)}
.badge.r{background:var(--err-dim);color:var(--err)}
.msg.show{display:block}
.fbar{position:fixed;right:22px;bottom:22px;display:flex;gap:10px;z-index:60;align-items:center}
.fbar .btn{box-shadow:var(--shadow)}
.saved-at{font-size:11.5px;color:var(--faint);background:var(--card);border:1px solid var(--border);border-radius:8px;padding:5px 10px;box-shadow:var(--shadow);white-space:nowrap}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.sec-title{font-size:12px;color:var(--faint);letter-spacing:1px;margin:20px 0 10px;font-weight:600}
.danger-zone{border:1px solid var(--err);border-radius:12px;padding:16px;background:var(--err-dim)}
.qrbox{display:flex;justify-content:center;padding:12px 0 4px}
.qrbox img{width:168px;height:168px;image-rendering:pixelated;border-radius:8px}
.note-box{background:var(--card2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:8px;padding:12px 14px;font-size:12.5px;color:var(--dim);line-height:1.7;margin-bottom:12px}
@media (min-width:1100px){
  /* 右侧避让右下角浮动保存栏（尚未保存/重置/保存全部），避免遮挡筛选勾选项 */
  .filter-grid{padding-right:200px}
}
.mmode{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,8,13,.74)}
.mmode.show{display:flex}
.mmodebox{width:100%;max-width:820px;max-height:88vh;overflow-y:auto;background:var(--card);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:22px 22px 16px}
.mmodebox h3{margin:0 0 6px;font-size:17px}
.mmodebox .msub{color:var(--dim);font-size:12.5px;line-height:1.65;margin-bottom:16px}
.mmodegrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.mmodecard{border:1px solid rgba(255,255,255,.14);border-radius:11px;background:rgba(255,255,255,.055);color:var(--text);padding:15px 14px;cursor:pointer;text-align:left;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 8px 22px rgba(0,0,0,.30);transition:border-color .15s,transform .15s,box-shadow .15s,background .15s}
.mmodecard:hover{border-color:var(--accent);transform:translateY(-2px)}
.mmodecard b{display:block;font-size:14.5px;margin-bottom:7px}
.mmodecard span{display:block;font-size:12.5px;color:var(--dim);line-height:1.6}
.mmodecard em{display:block;font-style:normal;font-size:11.5px;color:var(--faint);margin-top:9px}
.mmodefoot{margin-top:14px;text-align:right}
.mmodefoot a{color:var(--dim);font-size:12.5px;text-decoration:none}
.mmodefoot a:hover{color:var(--accent)}
@media (max-width:760px){
  .mmodegrid{grid-template-columns:1fr}
}
*{box-sizing:border-box;margin:0;padding:0}:root{--bg:#06080d;--bg2:#090d14;--card:#0c1119;--card2:#101724;--border:#1a2331;--text:#e9eef7;--dim:#93a3b8;--faint:#61718a;--line:#131a25;--accent:#7c6cff;--accent2:#22d3ee;--accent-dim:rgba(124,108,255,.14);--ok:#22c55e;--ok-dim:rgba(34,197,94,.13);--err:#f87171;--err-dim:rgba(248,113,113,.13);--warn:#fbbf24;--sb-bg:#080c12;--sb-text:#9fb0c5;--sb-dim:#5f7292;--sb-border:#161d28;--sb-active-bg:rgba(124,108,255,.14);--sb-active-text:#ab9dff;--sb-active-bar:#7c6cff;--glass:rgba(23,32,45,.54);--glass-2:rgba(19,27,39,.62);--glass-line:rgba(255,255,255,.10);--sb-glass:rgba(20,28,41,.50);--sb-rim:rgba(255,255,255,.46);--sb-vol-a:rgba(255,255,255,.11);--sb-vol-b:rgba(0,0,0,.20);--sb-glass-m:rgba(15,21,32,.88);--glass-rim:rgba(255,255,255,.30);--glass-hi:rgba(255,255,255,.12);--glass-field:rgba(255,255,255,.045);--glass-hover:rgba(255,255,255,.07);--glass-btn:rgba(255,255,255,.09);--glass-btn-hi:rgba(255,255,255,.17);--glass-rim-sm:rgba(255,255,255,.55);--glass-field-brd:rgba(255,255,255,.09);--glass-blur:22px;--glass-sh:0 20px 48px rgba(0,0,0,.42);--glass-shx:12px 0 36px rgba(0,0,0,.30);--blob-o:.44;--shadow:0 14px 40px rgba(0,0,0,.4);color-scheme:dark}[data-theme="light"]{--bg:#f4f6fb;--bg2:#eaeef6;--card:#fff;--card2:#f7f9fd;--border:#e1e7f0;--text:#16202e;--dim:#5a6a80;--faint:#93a1b4;--line:#eaeff6;--accent:#6355f5;--accent2:#0ea5b7;--accent-dim:rgba(99,85,245,.10);--ok:#17915a;--ok-dim:rgba(23,145,90,.11);--err:#dc4c4c;--err-dim:rgba(220,76,76,.10);--warn:#b7791f;--sb-bg:#ffffff;--sb-text:#5a6a80;--sb-dim:#9aa8bb;--sb-border:#e5eaf2;--sb-active-bg:rgba(99,85,245,.10);--sb-active-text:#5546e8;--sb-active-bar:#6355f5;--glass:rgba(255,255,255,.50);--glass-2:rgba(255,255,255,.60);--glass-line:rgba(20,40,70,.10);--sb-glass:rgba(255,255,255,.46);--sb-rim:rgba(255,255,255,1);--sb-vol-a:rgba(255,255,255,.68);--sb-vol-b:rgba(20,40,70,.075);--sb-glass-m:rgba(255,255,255,.90);--glass-rim:rgba(255,255,255,.95);--glass-hi:rgba(255,255,255,.70);--glass-field:rgba(255,255,255,.62);--glass-hover:rgba(20,40,70,.055);--glass-btn:rgba(255,255,255,.86);--glass-btn-hi:#ffffff;--glass-rim-sm:rgba(255,255,255,1);--glass-field-brd:rgba(20,40,70,.11);--glass-blur:22px;--glass-sh:0 18px 44px rgba(25,45,80,.13);--glass-shx:10px 0 30px rgba(25,45,80,.09);--blob-o:.42;--shadow:0 12px 34px rgba(25,40,70,.12);color-scheme:light}html,body{min-height:100%}body{background:var(--bg);color:var(--text);font-family:"PingFang SC","Microsoft YaHei","Segoe UI",system-ui,sans-serif;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}.app{display:flex;min-height:100vh;gap:12px;padding:12px}.sidebar{width:232px;flex:0 0 232px;background:var(--sb-bg);border-right:1px solid var(--sb-border);display:flex;flex-direction:column;position:sticky;top:12px;height:calc(100vh - 24px);z-index:50}.brand{display:flex;align-items:center;gap:11px;padding:18px 18px 14px}.brand .lg{width:34px;height:34px;flex:0 0 34px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px var(--accent-dim)}.brand .lg svg{width:18px;height:18px;stroke:#0b0e14;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.brand .bt{display:flex;flex-direction:column;line-height:1.25;min-width:0}.brand .bt b{font-size:15px;font-weight:700;letter-spacing:.3px}.brand .bt span{font-size:11px;color:var(--sb-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nav{flex:1;padding:6px 10px 12px;overflow-y:auto}.nav-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;margin:2px 0;border:none;background:transparent;color:var(--sb-text);font-size:13.5px;font-family:inherit;text-align:left;cursor:pointer;border-radius:8px;position:relative;transition:.15s}.nav-item svg{width:17px;height:17px;flex:0 0 17px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.nav-item:hover{background:var(--sb-active-bg);color:var(--sb-active-text)}.nav-item.on{background:var(--sb-active-bg);color:var(--sb-active-text);font-weight:600}.nav-item.on::before{content:"";position:absolute;left:-10px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--sb-active-bar)}.side-foot{padding:12px 18px;border-top:1px solid var(--sb-border);display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--sb-dim)}.ver-chip{font-family:ui-monospace,Consolas,monospace;background:var(--accent-dim);color:var(--sb-active-text);padding:2px 8px;border-radius:6px;font-size:11px;border:1px solid transparent}.main{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}.topbar{display:flex;align-items:center;gap:14px;padding:12px 20px;border:1px solid var(--border);border-radius:18px;background:var(--bg);position:sticky;top:12px;z-index:40}.topbar h1{font-size:17px;font-weight:600;flex:1;min-width:0}.ibtn.hamb{display:none}.pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 11px;border-radius:20px;background:var(--ok-dim);color:var(--ok);white-space:nowrap}.pill.off{background:var(--err-dim);color:var(--err)}.pill i{width:6px;height:6px;border-radius:50%;background:currentColor;display:block}.ibtn{width:34px;height:34px;border-radius:9px;border:1px solid var(--border);background:var(--card2);color:var(--dim);cursor:pointer;display:flex;align-items:center;justify-content:center}.ibtn:hover{border-color:var(--accent);color:var(--accent)}.ibtn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.wrap{width:100%;max-width:1180px;margin:0 auto;padding:0 4px 96px}.view{display:none}.view.on{display:block;animation:up .2s ease}@keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.vh{margin-bottom:16px}.vh h2{font-size:20px;font-weight:700}.vh p{color:var(--dim);font-size:13px;margin-top:3px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px}.card h3{font-size:14px;font-weight:650;margin-bottom:14px;display:flex;align-items:center;gap:9px}.card h3 .dot{width:4px;height:15px;border-radius:3px;background:linear-gradient(var(--accent),var(--accent2))}.card h3 .sub{font-size:12px;color:var(--dim);font-weight:400;margin-left:auto}.kv{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed var(--line);font-size:13px}.kv:last-child{border-bottom:none}.kv .k{color:var(--dim);white-space:nowrap}.kv .v{text-align:right;word-break:break-all;font-family:ui-monospace,Consolas,monospace;font-size:12.5px}.kv .v.ok{color:var(--ok)}.kv .v.bad{color:var(--err)}.kv .v.warn{color:var(--warn)}.field{margin-bottom:13px}.field>label{display:block;font-size:12.5px;color:var(--dim);margin-bottom:6px;font-weight:500}input[type=text],input[type=password],input[type=number],select,textarea{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:9px;padding:9px 11px;font-size:13.5px;outline:none;font-family:inherit;transition:.15s}input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}textarea{resize:vertical;line-height:1.55;font-family:ui-monospace,Consolas,monospace;font-size:12.5px}select{cursor:pointer;appearance:none;-webkit-appearance:none;padding-right:30px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2393a3b8' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center}select option,select optgroup{background:var(--bg2);color:var(--text)}input,select,textarea{accent-color:var(--accent)}.hint{font-size:12px;color:var(--dim);margin-top:7px;line-height:1.7}.inrow{display:flex;gap:8px;align-items:flex-start}.inrow>div{flex:1}.sw{position:relative;display:inline-block;width:40px;height:22px;flex:0 0 40px}.sw input{opacity:0;width:0;height:0}.sw .sl{position:absolute;inset:0;background:var(--border);border-radius:22px;cursor:pointer;transition:.18s}.sw .sl::before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .18s}.sw input:checked+.sl{background:var(--accent)}.sw input:checked+.sl::before{transform:translateX(18px)}.prow{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:13.5px}.prow:last-child{border-bottom:none}.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);background:var(--card2);color:var(--text);border-radius:9px;padding:9px 15px;font-size:13px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:.15s}.btn:hover{border-color:var(--accent);color:var(--accent)}.btn:active{transform:translateY(1px)}.btn:disabled{opacity:.5;cursor:not-allowed}.btn.pri{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#0b0e14;font-weight:600}.btn.pri:hover{filter:brightness(1.07);color:#0b0e14}.btn.dgr{background:var(--err-dim);border-color:transparent;color:var(--err)}.btn.sm{padding:5px 11px;font-size:12px;border-radius:7px}.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.row .grow{flex:1;min-width:150px}.pills{display:flex;flex-wrap:wrap;gap:8px}.sp{position:relative}.sp input{position:absolute;opacity:0;pointer-events:none}.sp span{display:inline-block;padding:5px 13px;border:1px solid var(--border);border-radius:999px;font-size:12.5px;color:var(--dim);cursor:pointer;background:var(--card2);transition:.15s;user-select:none}.sp:hover span{border-color:var(--accent);color:var(--accent)}.sp input:checked+span{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}.blk{border-top:1px solid var(--line);margin-top:14px;padding-top:14px}.blk-t{font-size:12px;font-weight:600;color:var(--dim);margin-bottom:10px;letter-spacing:.4px}.tbl{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 10px;font-size:13px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--dim);font-weight:500;font-size:12px;background:var(--card2)}td.ip{font-family:ui-monospace,Consolas,monospace;font-size:12.5px}.bdg{display:inline-block;padding:2px 9px;border-radius:10px;font-size:11.5px}.bdg.g{background:var(--ok-dim);color:var(--ok)}.bdg.r{background:var(--err-dim);color:var(--err)}.mono{font-family:ui-monospace,Consolas,monospace;font-size:12.5px}.msg{display:none;margin-top:12px;padding:10px 13px;border-radius:9px;font-size:12.5px;line-height:1.65}.msg.on{display:block}.msg.ok{background:var(--ok-dim);color:var(--ok)}.msg.err{background:var(--err-dim);color:var(--err)}.msg.info{background:var(--accent-dim);color:var(--accent)}pre.code{background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:12px;font-size:11.5px;line-height:1.55;font-family:ui-monospace,Consolas,monospace;overflow:auto;max-height:280px;white-space:pre-wrap;word-break:break-all;color:var(--dim);margin-top:10px}.bar{position:fixed;right:20px;bottom:20px;display:flex;gap:10px;align-items:center;z-index:60}.bar .btn{box-shadow:var(--shadow)}.stat{font-size:11.5px;color:var(--faint);background:var(--card);border:1px solid var(--border);border-radius:9px;padding:6px 11px;box-shadow:var(--shadow);white-space:nowrap}.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(90px);background:var(--card);border:1px solid var(--border);padding:11px 20px;border-radius:11px;font-size:13px;opacity:0;transition:.25s;z-index:200;box-shadow:var(--shadow);pointer-events:none;max-width:86vw}.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}.toast.ok{border-color:var(--ok);color:var(--ok)}.toast.err{border-color:var(--err);color:var(--err)}.toast.warn{border-color:var(--warn);color:var(--warn)}.note{background:var(--card2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:9px;padding:12px 14px;font-size:12.5px;color:var(--dim);line-height:1.75}.steps{list-style:none;counter-reset:st}.steps li{counter-increment:st;position:relative;padding:0 0 15px 32px;font-size:13px;color:var(--dim)}.steps li::before{content:counter(st);position:absolute;left:0;top:1px;width:22px;height:22px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700}.steps li b{color:var(--text)}.prog{height:9px;border-radius:7px;background:var(--card2);overflow:hidden;margin:10px 0}.prog>div{height:100%;width:0;border-radius:7px;background:linear-gradient(90deg,var(--ok),var(--accent));transition:width .5s}.qr{display:flex;justify-content:center;padding:12px 0 2px}.qr img{width:170px;height:170px;image-rendering:pixelated;border-radius:10px;background:#fff;padding:8px}.dz{border:1px solid var(--err);border-radius:14px;padding:16px;background:var(--err-dim);margin-bottom:16px}.dz h3{font-size:14px;color:var(--err);margin-bottom:8px}.fgrp{border:1px solid var(--border);border-radius:11px;padding:12px;margin-bottom:12px}.fgrp-t{font-size:12px;font-weight:600;color:var(--dim);margin-bottom:9px}.bgfx{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}.bgfx i{position:absolute;display:block;border-radius:50%;filter:blur(74px);opacity:var(--blob-o);will-change:transform}.bgfx i:nth-child(1){width:46vw;height:46vw;left:-12vw;top:-16vh;background:var(--accent);animation:blob 24s ease-in-out infinite}.bgfx i:nth-child(2){width:38vw;height:38vw;right:-14vw;top:2vh;background:var(--accent2);opacity:calc(var(--blob-o) * .72);animation:blob 30s ease-in-out infinite -8s}.bgfx i:nth-child(3){width:34vw;height:34vw;left:20vw;bottom:-22vh;background:#f472b6;opacity:calc(var(--blob-o) * .55);animation:blob 27s ease-in-out infinite -14s}.bgfx i:nth-child(4){width:30vw;height:30vw;right:10vw;bottom:-16vh;background:#38bdf8;opacity:calc(var(--blob-o) * .5);animation:blob 33s ease-in-out infinite -20s}@keyframes blob{0%,100%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(4vw,4vh,0) scale(1.1)}66%{transform:translate3d(-3vw,2vh,0) scale(.94)}}.app{position:relative;z-index:1}.sidebar{background:var(--sb-glass);-webkit-backdrop-filter:blur(30px) saturate(190%);backdrop-filter:blur(30px) saturate(190%);border:1px solid var(--glass-line);border-radius:22px;corner-shape:squircle;isolation:isolate;box-shadow:var(--glass-sh),inset 0 1px 0 var(--glass-hi),0 0 0 1px rgba(255,255,255,.03)}.sidebar::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;background:radial-gradient(520px 400px at var(--mx,50%) var(--my,-16%),var(--glass-hi),transparent 62%),linear-gradient(180deg,var(--sb-vol-a) 0,rgba(0,0,0,0) 32%,rgba(0,0,0,0) 60%,var(--sb-vol-b) 100%)}.sidebar::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:1;background:linear-gradient(150deg,var(--sb-rim) 0,rgba(255,255,255,0) 34%,rgba(255,255,255,0) 66%,var(--sb-rim) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}.sidebar>*{position:relative;z-index:2}.side-foot{border-top:1px solid var(--glass-line)}.nav::-webkit-scrollbar{width:8px}.nav::-webkit-scrollbar-thumb{background:var(--glass-field-brd);border-radius:8px}.nav-item{border-radius:12px}.nav-item:hover{background:var(--glass-hover)}.nav-item.on{background:var(--sb-active-bg);box-shadow:inset 0 1px 0 var(--glass-hi),0 6px 18px rgba(0,0,0,.16)}.topbar{background:var(--glass-2);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);border:1px solid var(--glass-line);box-shadow:var(--glass-sh),inset 0 1px 0 var(--glass-hi)}.topbar::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;background:linear-gradient(150deg,var(--glass-rim) 0,rgba(255,255,255,0) 36%,rgba(255,255,255,0) 64%,var(--glass-rim) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}.ibtn{position:relative;background:var(--glass-field);border:1px solid var(--glass-field-brd);border-radius:11px;box-shadow:inset 0 1px 0 var(--glass-hi);transition:.18s cubic-bezier(.34,1.4,.64,1)}.ibtn:hover{background:var(--glass);border-color:var(--glass-rim);color:var(--accent);transform:translateY(-1px)}.ibtn:active{transform:translateY(0) scale(.96)}.card{position:relative;background:var(--glass);-webkit-backdrop-filter:blur(var(--glass-blur)) saturate(170%);backdrop-filter:blur(var(--glass-blur)) saturate(170%);border:1px solid var(--glass-line);border-radius:20px;corner-shape:squircle;box-shadow:var(--glass-sh),inset 0 1px 0 var(--glass-hi)}.card>*{position:relative;z-index:1}.card::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;background:radial-gradient(440px 260px at var(--mx,50%) var(--my,-12%),var(--glass-hi),transparent 68%)}.card::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:0;background:linear-gradient(150deg,var(--glass-rim) 0,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 64%,var(--glass-rim) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}.fgrp{background:var(--glass-field);border:1px solid var(--glass-field-brd);border-radius:14px;corner-shape:squircle}.note{background:var(--glass-field);border:1px solid var(--glass-field-brd);border-left:3px solid var(--accent);border-radius:14px}pre.code{background:var(--glass-field);border:1px solid var(--glass-field-brd);border-radius:14px}.msg{border-radius:13px}input[type=text],input[type=password],input[type=number],select,textarea{background:var(--glass-field);border:1px solid var(--glass-field-brd);border-radius:12px;box-shadow:inset 0 1px 0 var(--glass-hi)}.sp span{background:var(--glass-field);border:1px solid var(--glass-field-brd)}th{background:var(--glass-field)}.btn{background:var(--glass-field);border:1px solid var(--glass-field-brd);border-radius:13px;position:relative;box-shadow:inset 0 1px 0 var(--glass-hi),0 4px 14px rgba(0,0,0,.16);transition:.18s cubic-bezier(.34,1.4,.64,1)}.btn:hover{background:var(--glass);border-color:var(--glass-rim);color:var(--text);transform:translateY(-1px)}.btn:active{transform:translateY(0) scale(.985)}.btn.sm{border-radius:10px}.btn.pri{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#0b0e14;box-shadow:0 8px 24px var(--accent-dim),inset 0 1px 0 rgba(255,255,255,.45);overflow:hidden}.btn.pri:hover{color:#0b0e14;filter:brightness(1.06)}.btn.pri::after{content:"";position:absolute;top:-60%;left:-40%;width:36%;height:220%;pointer-events:none;transform:rotate(16deg);background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.6),rgba(255,255,255,0));opacity:0;transition:opacity .2s}.btn.pri:hover::after{opacity:1;animation:sheen .85s cubic-bezier(.4,0,.2,1)}@keyframes sheen{from{left:-40%}to{left:130%}}.bar .stat{background:var(--glass);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);border:1px solid var(--glass-line);border-radius:14px;box-shadow:var(--glass-sh)}.toast{background:var(--glass);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-line);border-radius:16px;box-shadow:var(--glass-sh)}.pill{box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}.btn::before,.ibtn::before,.sp span::before,.pill::before,.nav-item.on::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;background:linear-gradient(160deg,var(--glass-rim-sm) 0,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,var(--glass-rim-sm) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}.btn{background:var(--glass-btn);border-radius:13px;box-shadow:inset 0 1px 0 var(--glass-hi),0 6px 18px rgba(0,0,0,.20),0 1px 2px rgba(0,0,0,.18)}.btn:hover{background:var(--glass-btn-hi);border-color:var(--glass-rim-sm);color:var(--text);transform:translateY(-1px);box-shadow:inset 0 1px 0 var(--glass-hi),0 10px 26px rgba(0,0,0,.26)}.bar .btn{box-shadow:inset 0 1px 0 var(--glass-hi),var(--glass-sh)}.ibtn{background:var(--glass-btn);box-shadow:inset 0 1px 0 var(--glass-hi),0 4px 12px rgba(0,0,0,.16)}.ibtn:hover{background:var(--glass-btn-hi)}.sp span{position:relative;background:var(--glass-btn);box-shadow:inset 0 1px 0 var(--glass-hi)}.sp input:checked+span{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 4px 14px var(--accent-dim)}.pill{position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}.ver-chip{position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.20)}.nav-item{border-radius:12px}.nav-item.on{background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,0)),var(--sb-active-bg);box-shadow:inset 0 1px 0 var(--glass-hi),0 8px 20px rgba(0,0,0,.18)}.sw .sl{background:var(--glass-field);border:1px solid var(--glass-field-brd);box-shadow:inset 0 1px 2px rgba(0,0,0,.16)}.sw input:checked+.sl{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;box-shadow:inset 0 1px 0 rgba(255,255,255,.40),0 2px 10px var(--accent-dim)}.sw .sl::before{box-shadow:0 1px 4px rgba(0,0,0,.40)}.bdg{box-shadow:inset 0 1px 0 rgba(255,255,255,.20)}.fgrp,.note,pre.code{box-shadow:inset 0 1px 0 var(--glass-hi)}.msg{box-shadow:inset 0 1px 0 rgba(255,255,255,.14)}.prog{background:var(--glass-field);border:1px solid var(--glass-field-brd);box-shadow:inset 0 1px 2px rgba(0,0,0,.14)}.steps li::before{background:var(--accent-dim);box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}.dz{background:var(--err-dim);border:1px solid rgba(248,113,113,.30);border-radius:18px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:var(--glass-sh)}@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.sidebar,.topbar{background:var(--card2)}.card{background:var(--card)}.btn,.ibtn,.sp span{background:var(--card2)}.bar .stat,.toast{background:var(--card)}}@media(prefers-reduced-motion:reduce){.bgfx i{animation:none}.btn.pri:hover::after{animation:none;opacity:0}.ibtn:hover,.btn:hover{transform:none}.view.on{animation:none}}@media(max-width:640px){:root{--glass-blur:14px}.sidebar{-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%)}.bgfx i:nth-child(3),.bgfx i:nth-child(4){display:none}}@media(max-width:960px){.sidebar{position:fixed;left:12px;top:12px;height:calc(100vh - 24px);background:var(--sb-glass-m);transform:translateX(calc(-100% - 28px));transition:transform .22s ease;z-index:70;box-shadow:var(--glass-sh),inset 0 1px 0 var(--glass-hi)}.sidebar.open{transform:translateX(0)}.ibtn.hamb{display:flex}.app{padding:10px;gap:10px}.wrap{padding:0 2px 92px}.topbar{padding:10px 14px;top:10px}}@media(max-width:560px){.topbar .pill{display:none}}[data-style="material"]{--bg:var(--m-surface);--bg2:var(--m-surface-container);--card:var(--m-surface-container-low);--card2:var(--m-surface-container);--border:var(--m-outline-variant);--line:var(--m-outline-variant);--text:var(--m-on-surface);--dim:var(--m-on-surface-variant);--faint:var(--m-outline);--accent:var(--m-primary);--accent2:var(--m-tertiary);--accent-dim:var(--m-primary-container);--ok:var(--m-primary);--ok-dim:var(--m-primary-container);--err:var(--m-error);--err-dim:var(--m-error-container);--warn:var(--m-tertiary);--glass-rim:transparent;--glass-rim-sm:transparent;--glass-hi:transparent;--sb-rim:transparent;--sb-vol-a:transparent;--sb-vol-b:transparent;--m-e1:0 1px 2px rgba(0,0,0,.42),0 1px 3px 1px rgba(0,0,0,.24);--m-e2:0 1px 2px rgba(0,0,0,.42),0 2px 6px 2px rgba(0,0,0,.24);--m-e3:0 1px 3px rgba(0,0,0,.42),0 4px 8px 3px rgba(0,0,0,.24);--shadow:var(--m-e2);font-family:Roboto,"Roboto Flex","Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif}[data-theme="light"][data-style="material"]{--m-e1:0 1px 2px rgba(0,0,0,.16),0 1px 3px 1px rgba(0,0,0,.09);--m-e2:0 1px 2px rgba(0,0,0,.16),0 2px 6px 2px rgba(0,0,0,.09);--m-e3:0 1px 3px rgba(0,0,0,.16),0 4px 8px 3px rgba(0,0,0,.09)}[data-style="material"] .bgfx{display:none}[data-style="material"] .card::before,[data-style="material"] .card::after,[data-style="material"] .sidebar::before,[data-style="material"] .sidebar::after,[data-style="material"] .topbar::after{display:none}[data-style="material"] .sidebar{background:var(--m-surface-container-low);-webkit-backdrop-filter:none;backdrop-filter:none;border:none;border-radius:16px;box-shadow:var(--m-e1)}[data-style="material"] .brand .lg{border-radius:12px;box-shadow:none}[data-style="material"] .brand .bt b{font-weight:500}[data-style="material"] .nav-item{border-radius:28px;padding:10px 16px;font-size:14px}[data-style="material"] .nav-item.on::before{display:none}[data-style="material"] .nav-item.on{background:var(--m-secondary-container);color:var(--m-on-secondary-container);font-weight:500;box-shadow:none}[data-style="material"] .nav-item:hover{background:transparent;color:var(--text)}[data-style="material"] .side-foot{border-top:1px solid var(--m-outline-variant)}[data-style="material"] .ver-chip{background:var(--m-secondary-container);color:var(--m-on-secondary-container);border-radius:8px;box-shadow:none}[data-style="material"] .topbar{background:var(--m-surface);-webkit-backdrop-filter:none;backdrop-filter:none;border:none;border-radius:16px;box-shadow:none}[data-style="material"] .topbar h1{font-weight:400;font-size:20px}[data-style="material"] .ibtn{background:transparent;border:none;border-radius:50%;color:var(--m-on-surface-variant);box-shadow:none;overflow:hidden}[data-style="material"] .ibtn:hover{background:transparent;color:var(--m-on-surface)}[data-style="material"] .ibtn:active{transform:none}[data-style="material"] .pill{background:var(--m-secondary-container);color:var(--m-on-secondary-container);border-radius:8px;box-shadow:none;padding:5px 12px;font-weight:500}[data-style="material"] .card{background:var(--m-surface-container-low);border:none;border-radius:16px;box-shadow:var(--m-e1);-webkit-backdrop-filter:none;backdrop-filter:none}[data-style="material"] .card h3{font-weight:500}[data-style="material"] .card h3 .dot{background:var(--m-primary)}[data-style="material"] .fgrp,[data-style="material"] .note,[data-style="material"] pre.code{background:var(--m-surface-container);border:1px solid var(--m-outline-variant);border-radius:12px;box-shadow:none}[data-style="material"] .note{border-left:1px solid var(--m-outline-variant)}[data-style="material"] .msg{border-radius:12px;box-shadow:none}[data-style="material"] input[type=text],[data-style="material"] input[type=password],[data-style="material"] input[type=number],[data-style="material"] select,[data-style="material"] textarea{background:transparent;border:1px solid var(--m-outline);border-radius:8px;box-shadow:none}[data-style="material"] input:focus,[data-style="material"] select:focus,[data-style="material"] textarea:focus{border-color:var(--m-primary);box-shadow:inset 0 0 0 1px var(--m-primary)}[data-style="material"] th{background:var(--m-surface-container);font-weight:500}[data-style="material"] .bdg{box-shadow:none;background:var(--m-secondary-container);color:var(--m-on-secondary-container)}[data-style="material"] .box{background:var(--m-surface-container-high);border:none;border-radius:28px;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:var(--m-e3);corner-shape:round}[data-style="material"] .box::after{display:none}[data-style="material"] .logo{background:var(--m-primary-container);border-radius:16px;box-shadow:none}[data-style="material"] .logo svg{stroke:var(--m-on-primary-container)}[data-style="material"] .box p{color:var(--m-on-surface-variant)}[data-style="material"] .btn{background:var(--m-secondary-container);color:var(--m-on-secondary-container);border:none;border-radius:20px;box-shadow:none;font-weight:500;-webkit-mask:none;overflow:hidden}[data-style="material"] .btn:hover{background:var(--m-secondary-container);color:var(--m-on-secondary-container);transform:none;box-shadow:var(--m-e1)}[data-style="material"] .btn:active{transform:none}[data-style="material"] .btn.pri{background:var(--m-primary);color:var(--m-on-primary);box-shadow:none;border-radius:20px}[data-style="material"] .btn.pri:hover{background:var(--m-primary);color:var(--m-on-primary);box-shadow:var(--m-e1);filter:none}[data-style="material"] .btn.pri::after{display:none}[data-style="material"] .btn.sm{border-radius:18px}[data-style="material"] .btn.dgr{background:var(--m-error);color:var(--m-on-error)}[data-style="material"] .sp span{background:transparent;border:1px solid var(--m-outline);color:var(--m-on-surface-variant);border-radius:20px;box-shadow:none}[data-style="material"] .sp input:checked+span{background:var(--m-secondary-container);color:var(--m-on-secondary-container);border-color:transparent;box-shadow:none}[data-style="material"] .btn::before,[data-style="material"] .ibtn::before,[data-style="material"] .sp span::before,[data-style="material"] .nav-item::before{content:"";position:absolute;inset:0;border-radius:inherit;background:currentColor;opacity:0;-webkit-mask:none;mask:none;pointer-events:none;transition:opacity .12s}[data-style="material"] .btn:hover::before,[data-style="material"] .ibtn:hover::before,[data-style="material"] .sp span:hover::before,[data-style="material"] .nav-item:hover::before{opacity:.08}[data-style="material"] .btn:active::before,[data-style="material"] .ibtn:active::before,[data-style="material"] .sp span:active::before{opacity:.12}[data-style="material"] .card,.md-rip-host{position:relative}[data-style="material"] .nav-item,[data-style="material"] .sp span,[data-style="material"] .pill,[data-style="material"] .fgrp{position:relative;overflow:hidden}.md-rip{position:absolute;border-radius:50%;pointer-events:none;background:currentColor;opacity:0;transform:scale(0);animation:mdRip .62s cubic-bezier(.2,0,0,1) forwards}@keyframes mdRip{0%{opacity:.20;transform:scale(.25)}55%{opacity:.14}100%{opacity:0;transform:scale(1)}}@media(prefers-reduced-motion:reduce){.md-rip{display:none}}[data-style="material"] .sw .sl{background:var(--m-surface-container-highest);border:1px solid var(--m-outline);box-shadow:none}[data-style="material"] .sw input:checked+.sl{background:var(--m-primary);border-color:var(--m-primary);box-shadow:none}[data-style="material"] .sw .sl::before{box-shadow:0 1px 3px rgba(0,0,0,.30)}[data-style="material"] .prog{background:var(--m-surface-container-highest);border:none;border-radius:4px;box-shadow:none;height:8px}[data-style="material"] .prog>div{border-radius:4px;background:var(--m-primary)}[data-style="material"] .steps li::before{background:var(--m-primary-container);color:var(--m-on-primary-container);box-shadow:none}[data-style="material"] .dz{background:var(--m-error-container);border:none;border-radius:16px;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none}[data-style="material"] .dz h3{color:var(--m-on-error-container)}[data-style="material"] .dz p{color:var(--m-on-error-container)}[data-style="material"] .bar .stat,[data-style="material"] .toast{background:var(--m-surface-container-high);-webkit-backdrop-filter:none;backdrop-filter:none;border:none;border-radius:12px;box-shadow:var(--m-e3);color:var(--text)}[data-style="material"] .bar .btn{box-shadow:var(--m-e2)}[data-style="material"] .qr img{border-radius:12px}.seg{display:flex;gap:8px;flex-wrap:wrap}.seg button{flex:1;min-width:120px;justify-content:center}.seg button.on{background:var(--accent);color:#fff;border-color:transparent}[data-style="material"] .seg button.on{background:var(--m-primary);color:var(--m-on-primary)}.md-sw{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.md-sw i{width:30px;height:30px;border-radius:50%;cursor:pointer;display:block;box-shadow:0 0 0 1px var(--border);transition:transform .15s}.md-sw i:hover{transform:scale(1.1)}.md-sw i.on{box-shadow:0 0 0 2px var(--accent),0 0 0 4px var(--bg2)}.md-pal{margin-top:14px;border:1px solid var(--border);border-radius:12px;overflow:hidden}.md-pal .r{display:flex;align-items:center;gap:2px;padding:3px 6px}.md-pal .r b{width:66px;flex:0 0 66px;font-size:10.5px;font-weight:500;color:var(--dim);font-family:ui-monospace,Consolas,monospace}.md-pal .r i{flex:1;height:20px;border-radius:4px;display:block;cursor:pointer;position:relative;z-index:0;transition:transform .12s ease,box-shadow .12s ease}.md-pal .r:hover b{color:var(--text)}.md-pal .r i:hover{transform:scale(1.16);z-index:3;box-shadow:0 0 0 1.5px var(--text),0 4px 10px rgba(0,0,0,.45)}.md-pal .r i.on{z-index:2;box-shadow:inset 0 0 0 2px rgba(255,255,255,.94),inset 0 0 0 4px rgba(0,0,0,.56)}.md-pal .r:first-child i{border-radius:6px 6px 4px 4px}.md-pal .r:last-child i{border-radius:4px 4px 6px 6px}.md-out{display:flex;align-items:center;gap:9px;margin-top:10px;flex-wrap:wrap;font-size:12px}.md-out .chip{width:20px;height:20px;border-radius:6px;flex:0 0 20px;display:block;box-shadow:0 0 0 1px var(--border)}.md-out .hx{font-family:ui-monospace,Consolas,monospace;color:var(--text);cursor:pointer;letter-spacing:.4px;padding:3px 7px;border-radius:7px;background:var(--bg2);box-shadow:0 0 0 1px var(--border)}.md-out .hx:hover{background:var(--card2)}.md-out .tag{color:var(--faint)}.md-seed{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.md-seed i{width:34px;height:34px;border-radius:9px;cursor:pointer;display:block;box-shadow:0 0 0 1px var(--border);transition:transform .15s}.md-seed i:hover{transform:scale(1.08)}.md-seed i.on{box-shadow:0 0 0 2px var(--accent),0 0 0 4px var(--bg2)}

/* ===== CFNext 自有组件层：对齐参考面板视觉 ===== */
.view-head{margin-bottom:16px}
.view-head h2{font-size:20px;font-weight:700}
.view-head p{color:var(--dim);font-size:13px;margin-top:4px}
.mark{width:34px;height:34px;flex:0 0 34px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px var(--accent-dim)}
.mark svg{width:19px;height:19px}
.mark path{stroke:#fff}
.fold{display:none}
.fold.open{display:block}
.foldbtn{margin-left:auto;flex:0 0 26px;width:26px;height:26px;padding:0;border:1px solid var(--border);border-radius:8px;background:var(--card2);color:var(--dim);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color .18s,border-color .18s,background .18s}
.foldbtn:hover{color:var(--text);border-color:var(--accent);background:var(--accent-dim)}
.foldbtn svg{width:14px;height:14px;transition:transform .2s ease}
.foldbtn[data-open="1"] svg{transform:rotate(180deg)}
.foldbtn path{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.card h3 .tick{width:4px;height:15px;border-radius:3px;background:linear-gradient(var(--accent),var(--accent2))}
.btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#fff;font-weight:600}
.btn.primary:hover{filter:brightness(1.06);color:#fff}
.spill input:checked + span{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
.note-box{background:var(--card2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:10px;padding:12px 14px;font-size:12.5px;color:var(--dim);line-height:1.7;margin-bottom:12px}
.danger-zone{border:1px solid var(--err);border-radius:14px;padding:16px;background:var(--err-dim)}
.steps li::before{background:var(--accent-dim);color:var(--accent)}
[data-theme="light"] .steps li::before{color:var(--accent)}
.msg.info{background:var(--accent-dim);color:var(--accent)}
[data-theme="light"] .msg.info{color:var(--accent)}
.qrbox img{border-radius:12px}
.mmodebox{border-radius:16px}
.mmodecard{border-radius:14px}
/* 开关滑块本体：CFNext 的 DOM 是 label.switch>span.sl（无 .sw 祖先），nimbus 的 .sw .sl 不匹配，须单独补回 */
.switch .sl{position:absolute;inset:0;background:var(--glass-field);border:1px solid var(--glass-field-brd);border-radius:22px;cursor:pointer;transition:.18s;box-shadow:inset 0 1px 2px rgba(0,0,0,.16)}
.switch .sl::before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .18s;box-shadow:0 1px 4px rgba(0,0,0,.40)}
.switch input:checked+.sl{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;box-shadow:inset 0 1px 0 rgba(255,255,255,.40),0 2px 10px var(--accent-dim)}
.switch input:checked+.sl::before{transform:translateX(18px)}
[data-style="material"] .switch .sl{background:var(--m-surface-container-highest);border:1px solid var(--m-outline);box-shadow:none}
[data-style="material"] .switch input:checked+.sl{background:var(--m-primary);border-color:var(--m-primary);box-shadow:none}
[data-style="material"] .switch .sl::before{box-shadow:0 1px 3px rgba(0,0,0,.30)}
/* 按钮统一液态玻璃：半透明 + 模糊 + 内高光，与卡片/输入框同一材质 */
.btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:var(--text);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 2px 8px rgba(0,0,0,.18);transition:border-color .15s,color .15s,box-shadow .15s,transform .15s}
[data-theme="light"] .btn{background:rgba(255,255,255,.55);border:1px solid rgba(30,45,70,.10);box-shadow:inset 0 1px 0 rgba(255,255,255,.90),0 2px 8px rgba(30,45,70,.06)}
.btn:hover{border-color:var(--accent);color:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 14px var(--accent-dim)}
.btn.pri,.btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:rgba(255,255,255,.18);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 6px 18px var(--accent-dim)}
.btn.pri:hover,.btn.primary:hover{filter:brightness(1.08);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 22px var(--accent-dim)}
.btn.dgr,.btn.danger{background:var(--err-dim);border-color:rgba(248,113,113,.28);color:var(--err);box-shadow:inset 0 1px 0 rgba(255,255,255,.10)}
.ibtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,.14)}
[data-theme="light"] .ibtn{background:rgba(255,255,255,.55);border-color:rgba(30,45,70,.10);box-shadow:inset 0 1px 0 rgba(255,255,255,.90)}
.nav-item{background:transparent;border-color:transparent}
.nav-item.on,.nav-item:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
[data-theme="light"] .nav-item.on,[data-theme="light"] .nav-item:hover{background:rgba(255,255,255,.55);border-color:rgba(30,45,70,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.90)}
@media (max-width:960px){.grid2,.grid3{grid-template-columns:1fr}}

</style>
</head>
<body><div class="bgfx" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
<div class="app">

<!-- ===== 侧边栏 ===== -->
<aside class="sidebar" id="sidebar">
  <div class="brand">
    <div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l3-7 4 14 3-7h2"/></svg></div>
    <div class="bt"><b>CFNext</b><span>Cloudflare 隧道面板</span></div>
  </div>
  <nav class="nav" id="nav"></nav>
  <div class="side-foot">
    <span>部署版本</span>
    <span class="ver-chip" id="sideVer" title="点击检测更新" onclick="checkUpdate()">v—</span>
  </div>
</aside>

<!-- ===== 主区 ===== -->
<div class="main">
  <div class="topbar">
    <button class="ibtn hamb" id="hamb" title="菜单"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <h1 id="pageTitle">仪表盘</h1>
    <span class="pill" id="connPill"><span class="dot"></span><span id="connText">连接中</span></span>
    <button class="ibtn" id="themeBtn" title="切换日间 / 夜间"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path id="themeIcon" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button><button class="ibtn" id="exitBtn" title="退出当前模式，回到模式选择" onclick="exitMode()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></button>
  </div>
  <div class="wdwarn" id="wdwarn">当前运行在 *.workers.dev 域名上：订阅与节点下发功能正常；若遇连接不稳或访问受限，建议在 Cloudflare 面板绑定自定义域名后使用。</div>

  <div class="wrap" id="content">
    <!-- ===== 视图：仪表盘 ===== -->
    <section class="view" data-view="dashboard">
      <div class="view-head"><h2>仪表盘</h2><p>快速开始、订阅管理、配额速览与运行状态</p></div>
      <div class="card">
        <h3><span class="tick"></span>快速开始</h3>
        <ol class="steps">
          <li><b>部署即用</b>：绑定域名后客户端订阅即可获得海量节点（内置 300 条优选 IP 与地区域名源），默认已配好大陆直连分流（大陆应用、微软、苹果直连，国外服务走出口）。</li>
          <li><b>调优节点</b>：在「优选配置」在线测速，把最优 IP 加入优选列表（自定义订阅模式内置常用订阅源，可自行增删，可追加内置优选池与默认节点）。</li>
          <li><b>保障额度</b>：在「配额安全」开启用量监控与自动调节，防止免费额度超支（需在面板设置中配置 Cloudflare 账户 ID 与 API 令牌）。</li>
        </ol>
      </div>
      <div class="card">
        <h3><span class="tick"></span>订阅地址</h3>
        <div class="row" style="margin-bottom:12px">
          <div class="field grow" style="margin:0"><label>订阅格式</label>
            <select id="subFmt">
              <option value="auto">自动识别</option>
              <option value="clash">Clash / Mihomo</option>
              <option value="singbox">Sing-box</option>
              <option value="karing">Karing</option>
              <option value="surge">Surge</option>
              <option value="surfboard">Surfboard</option>
              <option value="loon">Loon</option>
              <option value="quanx">Quantumult X</option>
              <option value="v2ray">v2rayN / Shadowrocket</option>
              <option value="stash">Stash</option>
              <option value="plain">明文 vless</option>
            </select>
          </div>
        </div>
        <div class="field"><label>订阅链接</label>
          <div class="inrow">
            <input type="text" id="subUrl" readonly onclick="this.select()">
            <button class="btn sm" onclick="copySub()">复制</button>
            <button class="btn sm" onclick="toggleQR()">二维码</button>
            <button class="btn sm" onclick="downloadSub()">下载</button>
            <button class="btn sm primary" onclick="previewSub()">预览</button>
          </div>
        </div>
        <div id="qrWrap" style="display:none"></div>
        <p class="hint" style="margin-top:12px" id="subHint"></p>
        <div id="subPrev" style="display:none;margin-top:12px">
          <div class="kv"><span class="k">订阅类型</span><span class="v" id="prevType">—</span></div>
          <div class="kv"><span class="k">节点数量</span><span class="v" id="prevCount">—</span></div>
          <pre class="code" id="prevBody" style="margin-top:10px"></pre>
        </div>
      </div>
      <div class="card" id="cardFilter">
        <h3><span class="tick"></span>地区与线路筛选</h3>
        <div class="filter-region">
          <span class="filter-region-label">节点地区</span>
          <div class="pills">
            <label class="spill"><input type="checkbox" id="fl-region-all" checked><span>全部地区</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-HK"><span>香港</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-TW"><span>台湾</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-US"><span>美国</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-SG"><span>新加坡</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-JP"><span>日本</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-KR"><span>韩国</span></label>
            <label class="spill"><input type="checkbox" id="fl-region-DE"><span>德国</span></label>
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <div class="filter-group-title">IP 类型</div>
            <div class="pills">
              <label class="spill"><input type="checkbox" id="fl-ip4" checked><span>IPv4</span></label>
              <label class="spill"><input type="checkbox" id="fl-ip6"><span>IPv6</span></label>
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-group-title">IPv6 下发</div>
            <div class="pills nowrap">
              <label class="spill"><input type="radio" name="ip6mode" id="ip6-off" value="off" checked><span>不下发</span></label>
              <label class="spill"><input type="radio" name="ip6mode" id="ip6-tail" value="tail"><span>仅备胎</span></label>
              <label class="spill"><input type="radio" name="ip6mode" id="ip6-full" value="full"><span>等权混合</span></label>
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-group-title">运营商偏好</div>
            <div class="pills">
              <label class="spill"><input type="checkbox" id="fl-isp-m" checked><span>移动</span></label>
              <label class="spill"><input type="checkbox" id="fl-isp-c" checked><span>联通</span></label>
              <label class="spill"><input type="checkbox" id="fl-isp-t" checked><span>电信</span></label>
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-group-title">地址来源</div>
            <div class="pills nowrap">
              <label class="spill"><input type="checkbox" id="fl-native"><span>原生地址</span></label>
              <label class="spill"><input type="checkbox" id="fl-pref-domain" checked><span>优选域名</span></label>
              <label class="spill"><input type="checkbox" id="fl-pref-ip" checked><span>优选 IP</span></label>
              <label class="spill"><input type="checkbox" id="fl-custom-pref"><span>自定义优选</span></label>
              <label class="spill"><input type="checkbox" id="fl-random-pref"><span>随机优选</span></label>
            </div>
          </div>
        </div>
        <p class="hint" style="margin-top:12px">「节点地区」多选过滤地区；「运营商偏好」按节点名称中的运营商标记过滤（移动/联通/电信），无标记时不生效；「地址来源」控制下发来源（原生地址/优选域名/优选 IP/自定义优选/随机优选）。任一维度无节点时自动放宽，保证订阅非空。<br>
          <b>IPv6 下发</b>（清单质量）：IPv6 到 CF 的可达性取决于客户端所在网络，不少家庭宽带 v6 到 CF 的路径比 v4 差甚至不通，IPv6 节点在客户端逐节点测延迟时会被大量超时项拖长。<b>「不下发」为默认</b>——即使勾选了「IPv6」也不进清单；「仅备胎」= 占比封顶 10% 且整体排到列表尾部，IPv4 打头；「等权混合」= 旧行为。仅勾选 IPv6（单选）时策略自动让位，保证订阅不为空。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>配额速览 <span class="sub" id="dbSub">未配置监控</span></h3>
        <div id="dbWrap" style="display:none">
          <div class="kv"><span class="k">当日请求量</span><span class="v" id="dbReq">—</span></div>
          <div style="margin:10px 0 6px;height:8px;border-radius:6px;background:var(--card2);overflow:hidden">
            <div id="dbBar" style="height:100%;width:0%;border-radius:6px;background:linear-gradient(90deg,var(--ok),var(--accent));transition:width .5s"></div>
          </div>
          <div class="kv"><span class="k">已用额度</span><span class="v" id="dbPct">—</span></div>
        </div>
        <p class="hint" style="margin-top:10px">免费计划按 Cloudflare 账号计算：每个账号每天共用 100,000 次 Workers / Pages Functions 请求额度。同账号下所有项目合并计算，不同账号分别统计；请在「配额安全 → 多账号配额监控」查看各账号用量。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>运行状态</h3>
        <div class="kv"><span class="k">协议</span><span class="v" id="stProto">—</span><span class="mbadge" id="stMode">—</span></div>
        <div class="kv"><span class="k">KV 持久化</span><span class="v" id="stKv">—</span></div>
        <div class="kv"><span class="k">面板入口</span><span class="v" id="stEntry">—</span></div>
      </div>
    </section>

    <!-- ===== 视图：节点配置（协议 / TLS / ECH / 落地出站） ===== -->
    <section class="view" data-view="nodes">
      <div class="view-head"><h2>节点配置</h2><p>协议、TLS/ECH、负载均衡与落地出站（保存后立即生效）</p></div>
      <div class="grid3">
        <div class="card">
          <h3><span class="tick"></span>协议开关</h3>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="en-vless" checked><span class="sl"></span></label><span>VLESS 协议（默认开启）</span></div>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="en-trojan"><span class="sl"></span></label><span>Trojan 协议（支持Mihomo内核）</span></div>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="en-xhttp"><span class="sl"></span></label><span>XHTTP 协议（支持Mihomo内核，须绑定域名开启gRPC）</span></div>
          <div class="field" style="margin-top:12px"><label>Trojan 密码（留空使用 UUID）</label><input type="text" id="tp-pass" placeholder="Trojan 密码" autocomplete="off"></div>
        </div>
        <div class="card">
          <h3><span class="tick"></span>TLS 与传输</h3>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="tls-only"><span class="sl"></span></label><span>仅 TLS 端口（跳过 80/8080 等明文端口）</span></div>
          <div class="field" style="margin-top:12px"><label>ALPN 协商（h2 / http/1.1，逗号分隔）</label><input type="text" id="alpn" placeholder="留空自动，如 h2,http/1.1" autocomplete="off"></div>
          <p class="hint">明文端口节点（80/8080/8880/2052/2082/2086/2095）开启「仅 TLS」后从订阅剔除。</p>
        </div>
      </div>
      <div class="grid2">
        <div class="card">
          <h3><span class="tick"></span>负载均衡</h3>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="q-lb-on"><span class="sl"></span></label><span>负载均衡（打乱下发顺序）</span></div>
          <p class="hint" style="margin-top:12px">每次订阅对节点顺序随机轮换（Fisher-Yates），连接分散避免集中踩同一批头部 IP；关闭则固定顺序。<br>
            <b>保底前置</b>：「优选IP-Sxx」（实测高存活 IP）/「内置·保底-XX」/「隧道前置-XX」始终保留在清单头部（组内仍随机轮换），
            其余节点整体乱序——既保证客户端「取第一个」就是稳定节点，又不牺牲分散连接的收益；同时避免这批最稳的节点在节点数封顶时被尾部截断砍掉。</p>
        </div>
        <div class="card">
          <h3><span class="tick"></span>国家标注</h3>
          <div class="field" style="margin-top:10px"><label>无名节点默认国家</label><select id="q-clabel">
            <option value="">按订阅时机房实测（默认）</option>
            <option value="OFF">不标注</option>
            <option value="HK">固定：香港</option>
            <option value="TW">固定：台湾</option>
            <option value="MO">固定：澳门</option>
            <option value="JP">固定：日本</option>
            <option value="SG">固定：新加坡</option>
            <option value="KR">固定：韩国</option>
            <option value="US">固定：美国</option>
            <option value="DE">固定：德国</option>
            <option value="GB">固定：英国</option>
            <option value="FR">固定：法国</option>
            <option value="CA">固定：加拿大</option>
            <option value="AU">固定：澳大利亚</option>
            <option value="SE">固定：瑞典</option>
            <option value="NL">固定：荷兰</option>
            <option value="FI">固定：芬兰</option>
            <option value="IN">固定：印度</option>
            <option value="TR">固定：土耳其</option>
            <option value="BR">固定：巴西</option>
          </select></div>
          <p class="hint" style="margin-top:12px">仅影响无法从名字识别地区的节点（优选IP/保留N/自定名等）。「机房实测」= 真实路由落点，随运营商线路变化（同一网络下全部同名是正常现象）；「固定」只改节点名，不改变实际落地。订阅链接可加 ?country=HK 或 ?country=off 临时覆盖（优先于本设置）。</p>
        </div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>ECH 加密（可选）</h3>
        <div class="proto-row"><label class="switch"><input type="checkbox" id="ech-on"><span class="sl"></span></label><span>启用 ECH 加密（需绑定自定义域名）</span></div>
        <div class="grid2" style="margin-top:12px">
          <div class="field" style="margin-bottom:0"><label>ECH 域名（留空用默认 cloudflare-ech.com）</label><input type="text" id="ech-host" placeholder="cloudflare-ech.com" autocomplete="off"></div>
          <div class="field" style="margin-bottom:0"><label>自定义 ECH DNS（DoH 地址，留空用客户端默认）</label><input type="text" id="ech-dns" placeholder="https://223.5.5.5/dns-query" autocomplete="off"></div>
        </div>
        <p class="hint">开启后订阅节点附带 ech 参数与 alpn 协商，客户端需支持 ECH 才生效。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>落地与出站</h3>
        <div class="field"><label>反代 / 落地（可填多个，英文逗号分隔；支持域名与 IP，可带两位国家代码；留空则直连失败后走内置地区出口）</label><input type="text" id="s-proxyIP" placeholder="如：Proxy-HK.a.com,HK.43.132.231.159:443,8.219.155.125:443#JP" autocomplete="off"></div>
        <p class="hint">多条时按节点落地国家自动匹配。带国家代码的条目只用于该国节点，两种写法等价：域名把国家代码放在名字里（如 Proxy-HK.… 里的 HK），IP 写成前缀式 HK.1.2.3.4:443 或后缀式 1.2.3.4:443#HK（IPv6 用方括号，如 HK.[2001:db8::1]:443）。不带国家代码的条目（含纯 IP）作为通用候选，按填写顺序依次尝试。某国无对应条目时退回列表首条；只填一条时行为与旧版一致。</p>
        <div class="field"><label>出站（可选）</label><input type="text" id="s-outbound" placeholder="socks5://user:pass@1.2.3.4:1080 或 ss://chacha20-ietf-poly1305:密码@1.2.3.4:8388" autocomplete="off"></div>
        <p class="hint">支持 socks5://（可带 user:pass@）、http(s)://、ss:// 或 host:port（默认按 socks5，端口 1080）。SS 加密支持 aes-128-gcm / aes-256-gcm / chacha20-ietf-poly1305。</p>
        <div class="field" style="margin-bottom:0"><label>出站方式</label>
          <select id="s-outmode">
            <option value="">默认（优先出口，失败直连）</option>
            <option value="no">直连优先（no）</option>
            <option value="only">仅走出口（only）</option>
          </select>
        </div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>保存与生效</h3>
        <div class="note-box" style="margin:0">配置修改后点右下角「保存全部」写入 KV 并生效，订阅与节点构成立即更新；「重置」清空后端 KV 配置并退出登录（含清除前端登录密码），回到「设置管理密码」页。</div>
      </div>
    </section>

    <!-- ===== 视图：优选配置 ===== -->
    <section class="view" data-view="optimizer">
      <div class="view-head"><h2>优选配置</h2><p>拉取候选 IP → 本地测速 → 最优节点加入订阅</p></div>
      <div class="card">
        <h3><span class="tick"></span>在线优选</h3>
        <div class="grid3">
          <div class="field" style="grid-column:span 2;margin:0"><label>数据源</label>
            <select id="o-source">
              <option value="wetest_v4">微测网 IPv4</option>
              <option value="wetest_v6">微测网 IPv6</option>
              <option value="bestcf">优选 IP 列表（bestcf）</option>
              <option value="hostmonit">HostMonit 优选</option>
              <option value="cidr">内置 Cloudflare 地址段</option>
              <option value="custom">自定义 URL</option>
            </select>
          </div>
          <div class="field" style="margin:0"><label>默认端口 <span style="font-weight:400;color:var(--faint)">（源未带端口时用）</span></label>
            <select id="o-port" onchange="onPortSel()">
              <optgroup label="HTTPS"><option value="443">443</option><option value="2053">2053</option><option value="2083">2083</option><option value="2087">2087</option><option value="2096">2096</option><option value="8443">8443</option></optgroup>
              <optgroup label="HTTP"><option value="80">80</option><option value="8080">8080</option><option value="8880">8880</option><option value="2052">2052</option><option value="2082">2082</option><option value="2086">2086</option><option value="2095">2095</option></optgroup>
              <option value="custom">自定义…</option>
            </select>
            <input type="text" id="o-portC" style="display:none;margin-top:8px" placeholder="自定义端口号" autocomplete="off">
          </div>
        </div>
        <div class="field" id="o-customWrap" style="display:none;margin-top:12px"><label>自定义数据源 URL <span style="font-weight:400;color:var(--faint)">（多个用换行或分号隔开，上限 50 个，并发拉取；URL 查询串中的逗号原样保留）</span></label><input type="text" id="o-sourceURL" placeholder="https://example.com/ip.txt（多个用换行/分号隔开）" autocomplete="off"></div>
        <div class="field" style="margin-top:8px"><label>兜底优选池 URL <span style="font-weight:400;color:var(--faint)">（可选，换行/分号分隔，上限 10 个；URL 查询串中的逗号原样保留；留空用内置 bestcf 地区池）</span></label><input type="text" id="o-fbpool" placeholder="https://a.example/ips.txt;https://b.example/ips.txt" autocomplete="off"></div>
        <div class="grid3" style="margin-top:6px">
          <div class="field" style="margin:0"><label>并发线程（1-50）</label><input type="number" id="o-threads" min="1" max="50" value="5"></div>
          <div class="field" style="margin:0"><label>候选数量</label><input type="number" id="o-count" min="1" value="20"></div>
          <div class="field" style="margin:0"><label>随机补足（0 关闭）</label><input type="number" id="o-fill" min="0" value="0"></div>
        </div>
        <div class="row" style="margin-top:14px">
          <label class="switch"><input type="checkbox" id="o-useCidr" checked><span class="sl"></span></label>
          <span style="font-size:13px;color:var(--dim)">候选不足时用 Cloudflare 地址段随机补足（未经本地测速，可能不可用；建议保持 0）</span>
          <span style="flex:1"></span>
          <button class="btn primary" onclick="runPick()">开始优选</button>
          <button class="btn" onclick="addAllBest()">全部加入最优</button>
        </div>
        <div class="msg" id="oMsg"></div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>测速结果 <span class="sub">本地（浏览器）→ 目标 IP</span></h3>
        <div class="tbl-wrap">
          <table><colgroup><col style="width:42%"><col style="width:18%"><col style="width:16%"><col style="width:24%"></colgroup>
          <thead><tr><th>IP : 端口</th><th>延迟</th><th>状态</th><th>操作</th></tr></thead>
          <tbody id="oTableBody"><tr><td colspan="4" style="text-align:center;color:var(--faint)">尚未测速 — 点击「开始优选」拉取候选</td></tr></tbody></table>
        </div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>优选节点</h3>
        <div class="grid2">
          <div class="field" style="margin:0"><label>订阅模式</label>
            <select id="o-submode" onchange="onSubMode()">
              <option value="">关闭（使用面板默认节点池）</option>
              <option value="custom">自定义订阅（支持汇聚）</option>
              <option value="random">随机候选模式（未测速）</option>
            </select>
          </div>
          <div class="field" style="margin:0"><label>自定义模式下追加默认节点</label>
            <select id="o-subinc">
              <option value="0">关闭（仅自定义节点）</option>
              <option value="1">开启（追加内置优选池与默认地区源）</option>
            </select>
          </div>
        </div>
        <div class="field" id="sm-custom" style="margin-top:14px;display:none">
          <label>优选节点（域名 / 优选 API / IP，每行一个；IP 格式 IP:端口#名称）</label>
          <textarea id="f-preferred" rows="6" placeholder="*.cloudflare.182682.xyz&#10;104.25.246.53:443#香港&#10;https://bestcf.pages.dev/random-region/HK/100.txt"></textarea>
          <div class="hint">开启「自定义订阅」后生效；域名与优选 API 保存后自动解析为 IP 下发；测速「加入优选」写入此列表，保存后生效。</div>
          <button class="btn sm" style="margin-top:8px" onclick="fetchDomains()">拉取微测网优选域名</button>
        </div>
        <div class="field" id="sm-random" style="margin-top:14px;display:none">
          <label>随机优选数量（1-99）</label>
          <input type="number" id="o-rand" min="1" max="99" value="16">
          <div class="hint">从 Cloudflare 地址段随机生成候选地址，未经本地连通性或速度验证；大陆网络可能大量超时。建议使用本地实测可用的自定义 IP。节点上限仅限制数量，不会自动补足。</div>
        </div>
      </div>
    </section>

    <!-- ===== 视图：配额安全 ===== -->
    <section class="view" data-view="quota">
      <div class="view-head"><h2>配额安全</h2><p>监控 Cloudflare 账户当日用量，按免费额度自动调节下发规模（需在面板设置中配置 Cloudflare 账户 ID 及 API 令牌）</p></div>
      <div class="card">
        <h3><span class="tick"></span>Cloudflare 用量监控 <span class="sub" id="qQuotaSub">未配置</span></h3>
        <div id="qQuotaWrap">
          <div class="kv"><span class="k">当日请求量</span><span class="v" id="qReq">—</span></div>
          <div style="margin:10px 0 6px;height:10px;border-radius:6px;background:var(--card2);overflow:hidden">
            <div id="qBar" style="height:100%;width:0%;border-radius:6px;background:linear-gradient(90deg,var(--ok),var(--accent));transition:width .5s"></div>
          </div>
          <div class="kv"><span class="k">已用额度</span><span class="v" id="qPct">—</span></div>
          <div class="kv"><span class="k">剩余额度</span><span class="v" id="qRemain">—</span></div>
          <div class="kv"><span class="k">CPU 时间</span><span class="v" id="qCpu">—</span></div>
          <div class="kv"><span class="k">子请求数</span><span class="v" id="qSub">—</span></div>
          <div class="kv"><span class="k">数据更新</span><span class="v" id="qAt">—</span></div>
        </div>
        <div id="qQuotaEmpty" style="display:none">
          <div class="note-box" style="margin:0">尚未配置 Cloudflare 监控：在「面板设置」填写 Cloudflare 账户 ID 与 API 令牌（或部署时配置环境变量 CF_ACCOUNT_ID / CF_API_TOKEN），即可实时查看当日请求量并启用自动调节。</div>
        </div>
        <div id="qQuotaErr" style="display:none">
          <div class="note-box" style="margin:0;border-left-color:var(--err)" id="qQuotaErrText">用量查询失败</div>
        </div>
        <div class="row" style="margin-top:14px">
          <label class="switch"><input type="checkbox" id="q-auto-on"><span class="sl"></span></label>
          <span style="font-size:13px">自动调节：当日用量 ≥ 60% 时按比例收缩节点上限（保护账户免费额度）</span>
          <span style="flex:1"></span>
          <button class="btn sm" onclick="refreshQuota()">刷新用量</button>
        </div>
        <p class="hint">自动调节：用量达免费额度 60% 后节点上限按比例收缩（60%→1000 条、70%→750、80%→500、90%→250、100%→100 条保底），用量越高下发越少。</p>
        <div class="row" style="margin-top:10px">
          <label class="switch"><input type="checkbox" id="q-strict-on"><span class="sl"></span></label>
          <span style="font-size:13px">严格模式：当日用量高于 95% 时停止下发任何节点（保护账户免费额度）</span>
        </div>
        <p class="hint">严格模式：开启后，当日用量超过 95% 时订阅将不再下发任何节点（次日自动恢复）；关闭则沿用上方自动调节的比例收缩策略。需先在「面板设置」配置 Cloudflare 账户 ID 与 API 令牌。</p>
      </div>
      <div class="grid2">
        <div class="card">
          <h3><span class="tick"></span>下发控制</h3>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="q-nl-on"><span class="sl"></span></label><span>精确节点数量控制</span></div>
          <div class="field" style="margin-top:10px"><label>精确节点上限（1-1000）</label><input type="number" id="q-nl-count" min="1" max="1000" value="300"></div>
          <p class="hint">默认开启：所有格式订阅精确下发到设定数量（默认 300，范围 1-1000），替代原 300/800 分档；勾选三种协议时总数仍为设定值。</p>
        </div>
        <div class="card">
          <h3><span class="tick"></span>CPU 超额限制</h3>
          <div class="proto-row"><label class="switch"><input type="checkbox" id="q-cpu-on"><span class="sl"></span></label><span>启用 CPU 超额限制（默认关闭）</span></div>
          <p class="hint" style="margin-top:12px">默认关闭：按设定数量完整下发。开启后对订阅生成降载 —— 节点按上限的 60% 下发（削减 40%），单次订阅请求的 CPU 消耗实测下降约 25%，用于规避免费计划 10ms/请求 的超额风险；代价是下发的节点数量相应减少。</p>
        </div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>当前下发策略</h3>
        <div class="grid3">
          <div class="field" style="margin:0"><div class="kv"><span class="k">节点数量控制</span><span class="v" id="qNl">—</span></div><div class="kv"><span class="k">精确节点上限</span><span class="v" id="qNlCount">—</span></div></div>
          <div class="field" style="margin:0"><div class="kv"><span class="k">CPU 超额限制</span><span class="v" id="qCpuLimit">—</span></div><div class="kv"><span class="k">负载均衡</span><span class="v" id="qLb">—</span></div></div>
          <div class="field" style="margin:0"><div class="kv"><span class="k">IPv6 下发</span><span class="v" id="qIp6">—</span></div></div>
        </div>
        <p class="hint" style="margin-top:10px">每次订阅请求消耗 Worker CPU（免费计划 10ms/请求）。面板按「免费额度 → 节点数」逐层设防。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>保护机制说明</h3>
        <div class="note-box">三道防线（优先级从高到低）：① 用量监控；② 自动调节（用量 ≥60% 时按比例收缩节点上限，只收紧不放大）；③ 数量上限精确限制。可选「CPU 超额限制」在以上基础上再降载。各层上限冲突取较小值，CPU 消耗始终在免费额度内。</div>
      </div>
    </section>

    <!-- ===== 视图：面板设置 ===== -->
    <!-- ===== 视图：WARP 模式 ===== -->
    <section class="view" data-view="warp">
      <div class="view-head"><h2>WARP 配置</h2><p>下发 WARP（WireGuard）节点由客户端直连：本服务只做配置解析与格式转换，不承载流量。WireGuard 走 UDP 2408，部分运营商屏蔽 UDP 时表现为全部超时</p></div>
      <div class="card" style="border-color:var(--accent)">
        <h3><span class="tick"></span>接入进度</h3>
        <div class="hint">面板与配置存储已就绪；切到本模式后订阅即下发 WARP 节点（客户端直连）。注册在首次拉取订阅时自动完成，之后一直复用。</div>
      </div>
      <div class="grid3">
        <div class="card">
          <h3><span class="tick"></span>凭据（自动生成）</h3>
          <div class="field"><label class="spill"><input type="checkbox" id="w-on"> 启用 WARP 节点下发</label></div>
          <div class="field"><label>注册状态</label><div class="hint" id="w-stat" style="margin:0">—</div></div>
          <div class="field"><label>节点名称</label><input type="text" id="w-name" placeholder="WARP"></div>
          <div class="field"><label>对端候选（可选，一行一个「IP:端口」，最多 50 个）</label>
            <textarea id="w-eps" rows="4" placeholder="留空则使用内置 50 个官方 anycast 接入点"></textarea>
          </div>
          <div class="inrow"><button class="btn sm" onclick="regenWarp()">重新生成凭据</button></div>
          <div class="hint">部署后无需任何填写：首次拉取订阅时本服务会自动完成注册并写入你的存储，之后一直复用。凭据只保存在你自己的存储中，不外发。若换客户端后连不上，可点上方按钮重签一次。</div>
        </div>
      </div>
    </section>

    <!-- ===== 视图：家宽模式 ===== -->
    <section class="view" data-view="home">
      <div class="view-head"><h2>家宽模式</h2><p>VPN Gate OpenVPN 家宽出口，经隧道前置拨号（仅 Mihomo 内核）</p></div>
      <div class="card" style="border-color:var(--accent)">
        <h3><span class="tick"></span>家宽出口</h3>
        <div class="proto-row"><label class="switch"><input type="checkbox" id="hw-on"><span class="sl"></span></label><span>VPN Gate OpenVPN （仅Mihomo内核）</span></div>
        <p class="hint">- 该开关由运行模式自动控制：选「家宽模式」自动打开，切到其它模式自动关闭。<br>- 每日拉取，取最快 100 台，仅留 TCP 家宽节点（「家宽 + 地区」、同区编号；UDP 剔除）。<br>- 缓存 30 分钟；&lt;30 台强制刷新，失败用旧缓存。<br>- 家宽须经隧道前置拨号；隧道节点 Worker 自动生成、自动测活、不受筛选。<br>- 开启后订阅仅含家宽 + 隧道节点；默认节点不下发（自定义订阅除外）。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>VPN Gate 手写参数</h3>
        <div class="field"><label>每行一条：主机 端口 协议 地区（空格或冒号分隔，留空则自动拉取）</label>
          <textarea id="hw-cfg" rows="7" placeholder="116.12.3.63 1357 tcp JP&#10;219.100.37.10 1194 udp KR&#10;1.2.3.4:443:tcp:US"></textarea></div>
        <p class="hint" style="margin-top:8px">- 手写参数<b>优先级高于自动拉取</b>：填了就不再访问 VPN Gate 列表，订阅里出现的就是你手写的这几台。<br>- 两种写法：① 直接粘贴 VPN Gate 的 base64 配置（可加地区码前缀，如 JP: 开头）；② 主机 端口 协议 地区，同时在本框内用 ca: / cert: / key: 给出证书。<br>- 内核要求 openvpn 必须带内联证书，<b>缺少证书的行会被忽略</b>（可先点「试用并预览」看解析结果）。<br>- 端口省略默认 1194；协议省略默认 tcp（只认 tcp / udp）；地区省略默认 XX，节点名形如「家宽JP」。<br>- 认证沿用 VPN Gate 公共账号 vpn / vpn；仅 Mihomo 内核支持 openvpn 出站。</p>
        <div class="inrow" style="margin-top:10px">
          <button class="btn sm" onclick="hwCustomApply()">试用并预览</button>
          <span class="hint" id="hw-cfg-stat" style="margin:0"></span>
        </div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>使用说明</h3>
        <p class="hint" style="margin:0">本模式是 Worker 模式里的「家宽模式」独立而来，逻辑与原先完全一致：开启后订阅仅下发家宽出口与隧道前置节点。切换到其它模式即恢复对应形态，互不影响。</p>
      </div>
    </section>

    <!-- ===== 视图：MASQUE 模式 ===== -->
    <section class="view" data-view="masque">
      <div class="view-head"><h2>MASQUE 配置</h2><p>下发 MASQUE 节点由客户端直连：需 Mihomo 内核支持（Clash Verge Rev 建议在「设置 → 内核」切到 Alpha；ClashMi / FlClash / Shadowrocket 亦可）。不支持的内核会整份配置拒载</p></div>
      <div class="card" style="border-color:var(--accent)">
        <h3><span class="tick"></span>接入进度</h3>
        <div class="hint">MASQUE 走<b>证书认证</b>：本服务会在首次拉取订阅时<b>自动完成注册</b>并把凭据写入你的存储，之后一直复用。你也可以在下面手工填入自己生成的凭据（优先级更高）；两者都没有时才回落到 WARP 节点，保证订阅不会空。</div>
      </div>
      <div class="grid3">
        <div class="card">
          <h3><span class="tick"></span>凭据（自动注册，可覆盖）</h3>
          <div class="field"><label class="spill"><input type="checkbox" id="x-on"> 启用 MASQUE 节点下发</label></div>
          <div class="field"><label>粘贴本地生成的凭据（EC 私钥 / 公钥）</label>
            <textarea id="x-conf" rows="6" placeholder="留空则由本服务自动注册；注册失败时回落到 WARP 节点"></textarea>
          </div>
          <div class="field"><label>节点名称</label><input type="text" id="x-name" placeholder="MASQUE"></div>
          <div class="hint">不填也能用：留空时本服务自动注册。凭据只保存在你自己的存储中，不外发。</div>
        </div>
        <div class="card">
          <h3><span class="tick"></span>对端候选</h3>
          <div class="field"><label>一行一个「IP:端口」，按填写顺序尝试（最多 50 个）</label>
            <textarea id="x-eps" rows="6" placeholder="留空则使用内置官方端点组合"></textarea>
          </div>
          <div class="hint">MASQUE 的 IP 与端口和 WARP 不同，串用会连不上；留空即用内置的官方端点组合。</div>
        </div>
        <div class="card">
          <h3><span class="tick"></span>客户端兼容</h3>
          <div class="hint">本模式产出的节点<b>只被部分客户端支持</b>。支持 MASQUE 的客户端为 <b>Mihomo / Clash Meta 内核系</b>：<b>Clash Verge Rev</b>（需在「设置 → 内核」里切到 <b>Alpha</b> 内核）、<b>ClashMi</b>、<b>FlClash</b>、<b>Mihomo Party</b>、<b>Clash Meta for Android</b> 等；MASQUE 节点只随 <code>clash</code> 格式下发，sing-box / v2rayN / Shadowrocket / Surge / Loon 等格式不包含它。其余客户端导入后会看不到节点，或直接忽略该节点。</div>
          <div class="hint">若你的客户端不在支持范围内，请改用 Worker 模式或 WARP 模式。</div>
        </div>
      </div>
    </section>

    <section class="view" data-view="account">
      <div class="view-head"><h2>面板设置</h2><p>部署基础信息（UUID、订阅路径、管理密码）与运行模式</p></div>
      <div class="card">
        <h3><span class="tick"></span>基础配置</h3>
        <div class="field"><label>UUID（订阅节点身份）</label>
          <div class="inrow">
            <input type="text" id="a-uuid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off">
            <button class="btn sm" onclick="genUuid()">生成</button>
          </div>
        </div>
        <div class="field"><label>自定义订阅路径（只填 UUID/别名段，如 AAZ；留空用 UUID）</label><input type="text" id="a-suburl" placeholder="AAZ" autocomplete="off"></div>
        <div class="field"><label>管理密码（留空则面板免登录）</label><input type="password" id="a-admin" placeholder="设置后访问面板需登录" autocomplete="new-password"></div>
        <p class="hint" style="margin-top:4px">部署后首次访问强制要求设置管理密码；设置后此处留空并保存可恢复免登录。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>运行模式</h3>
        <div class="field"><label>当前模式（四种模式互不影响，可随时切换）</label>
          <div class="inrow">
            <select id="a-mode">
              <option value="worker">Worker 模式 — 使用内置节点，由本服务承载转发</option>
              <option value="warp">WARP 模式 — 下发 WARP 节点，客户端直连</option>
              <option value="masque">MASQUE 模式 — 下发 MASQUE 节点，客户端直连</option>
              <option value="home">家宽模式 — 下发 VPN Gate 家宽出口，经隧道前置拨号</option>
            </select>
            <button class="btn sm" onclick="switchModeFromPanel()">切换</button>
          </div>
        </div>
        <div class="field"><label>WARP / MASQUE 前置节点（可选）</label>
          <textarea id="a-front" rows="2" spellcheck="false" placeholder="粘贴一个节点链接，例：vless://uuid@host:443?security=tls&type=ws&path=/&host=example.com#前置" style="width:100%;min-height:60px;background:var(--glass-field);color:var(--tx);border:1px solid var(--glass-field-brd);border-radius:10px;padding:10px;font:12.5px/1.7 ui-monospace,Consolas,monospace;resize:vertical"></textarea>
          <p class="hint" style="margin:6px 0 0">填了以后，WARP / MASQUE 的原生节点会经这个节点中转（mihomo 的 <code>dialer-proxy</code>）：<b>你的设备 → 前置节点 → WARP</b>。支持 <code>vless</code> / <code>trojan</code> / <code>ss</code> / <code>socks5</code> / <code>http(s)</code> 链接。<b>前置必须能承载 UDP</b>，否则 WARP 依然连不上；链接解析失败时会自动忽略（不影响其他节点）。留空则直连 WARP。仅对 <code>clash</code> 格式生效。</p>
        </div>
        <div class="hint" id="modeHint">切换后左侧导航与各模式的配置区块会随之改变。</div>
      </div>
      <div class="card"><h3><span class="tick"></span>外观风格<button class="foldbtn" id="mdFoldBtn" onclick="toggleMdFold()" data-open="0" title="展开色彩设置"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button></h3><p class="hint" style="margin:0 0 12px">两种设计语言并存，切换只影响本机显示，不改动 Worker 配置。</p><div class="field"><label>设计语言</label><div class="inrow seg" id="styleSeg"><button class="btn" data-s="glass" onclick="setStyle('glass')">液态玻璃</button><button class="btn" data-s="material" onclick="setStyle('material')">Material</button></div></div><div id="mdBox" class="fold"><div class="field"><label>种子色（单一来源色，其余 64 色由它派生）</label><div class="inrow"><div><input type="text" id="mdSeed" placeholder="#6750A4" autocomplete="off" spellcheck="false"></div><button class="btn sm" onclick="resetSeed()">默认</button></div><div class="md-seed" id="mdSeedRow"></div></div><div class="field"><label>主题方案</label><div class="inrow seg" id="mdVarSeg"></div><p class="hint" id="mdVarDesc" style="margin:8px 0 0"></p></div><div class="md-pal" id="mdPal"></div><div class="md-out" id="mdPalOut"></div><p class="hint" style="margin:10px 0 0">单击任意色块，即把该色设为新的种子色；白圈标出当前种子色在色板中的落点。采样 AOSP「Material 设计」规范：来源色经 CAM16/HCT 展开为 5 个色调调色盘 × 13 个色调共 65 色，再按文档的颜色角色表映射。标号 N 对应 HCT 色调 (1000−N)/10。</p></div></div>
      <div class="card">
        <h3><span class="tick"></span>Telegram 用量通知</h3>
        <div class="grid2">
          <div class="field" style="margin:0"><label>Bot Token</label><input type="text" id="q-tgtoken" placeholder="123456789:AAxxxx..." autocomplete="off"></div>
          <div class="field" style="margin:0"><label>Chat ID</label><input type="text" id="q-tgchat" placeholder="123456789" autocomplete="off"></div>
        </div>
        <p class="hint">填好后推送规则：80%、85%、90% 各提醒一次；90% 后每涨 1% 提醒一次（91-99）；达 99% 自动停用订阅（次日自动恢复）。需当前后端已配置 Cloudflare 账户监控；停用与恢复不依赖 TG，通知依赖 TG。</p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>备份与恢复</h3>
        <p class="hint" style="margin-top:0;margin-bottom:12px">以 JSON 导出/导入全部面板设置（协议、优选、筛选、配额监控），可保存或迁移；导入后点「保存全部」生效。</p>
        <div class="inrow">
          <button class="btn" onclick="exportConfig()">导出配置</button>
          <button class="btn" onclick="$('importFile').click()">导入配置</button>
          <input type="file" id="importFile" accept=".json,application/json" style="display:none" onchange="importConfig(this)">
        </div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>运行信息</h3>
        <div class="kv"><span class="k">面板版本</span><span class="v" id="aVer">—</span></div>
        <div class="kv"><span class="k">KV 持久化</span><span class="v" id="aKv">—</span></div>        <div class="kv"><span class="k">构建日期</span><span class="v">2026-09-21</span></div>
      </div>
      <div class="danger-zone">
        <h3 style="margin-bottom:8px;color:var(--err)">危险操作</h3>
        <p style="font-size:13px;color:var(--dim);margin-bottom:12px">重置将清空后端 KV 配置（面板配置 + 已下发节点记录），并清除前端登录密码、退出登录，面板回到「设置管理密码」页。不可恢复。</p>
        <button class="btn danger" onclick="resetAll()">重置全部数据</button>
      </div>
    </section>

    <!-- ===== 视图：关于 ===== -->
    <section class="view" data-view="about">
      <div class="view-head"><h2>关于项目</h2><p>CFNext — Cloudflare 边缘管理面板（独立界面 + 独立实现）</p></div>
      <div class="card">
        <h3><span class="tick"></span>相关链接</h3>
        <p style="font-size:13px;color:var(--dim)">YouTube @数字派：<a href="https://www.youtube.com/@PAI_CN" target="_blank" rel="noopener">youtube.com/@PAI_CN</a></p>
        <p style="font-size:13px;color:var(--dim);margin-top:6px">Telegram 交流群：<a href="https://t.me/SZ_PAI" target="_blank" rel="noopener">t.me/SZ_PAI</a></p>
      </div>
      <div class="card">
        <h3><span class="tick"></span>特别鸣谢</h3>
        <p style="font-size:13px;color:var(--dim);margin-bottom:10px">感谢以下开源项目的启发与支持（界面与代码均为独立实现）</p>
        <div class="tbl-wrap"><table>
          <colgroup><col style="width:34%"><col style="width:66%"></colgroup>
          <thead><tr><th>开源项目</th><th>地址</th></tr></thead>
          <tbody>
            <tr><td>IonRh/Cloudflare-BestIP</td><td><a href="https://github.com/IonRh/Cloudflare-BestIP" target="_blank" rel="noopener">github.com/IonRh/Cloudflare-BestIP</a></td></tr>
            <tr><td>zvos/CF-Workers-Monitor</td><td><a href="https://github.com/zvos/CF-Workers-Monitor" target="_blank" rel="noopener">github.com/zvos/CF-Workers-Monitor</a></td></tr>
            <tr><td>MetaCubeX/meta-rules-dat</td><td><a href="https://github.com/MetaCubeX/meta-rules-dat" target="_blank" rel="noopener">github.com/MetaCubeX/meta-rules-dat</a></td></tr>
            <tr><td>666OS/rules</td><td><a href="https://github.com/666OS/rules" target="_blank" rel="noopener">github.com/666OS/rules</a></td></tr>
            <tr><td>DustinWin/ruleset_geodata</td><td><a href="https://github.com/DustinWin/ruleset_geodata" target="_blank" rel="noopener">github.com/DustinWin/ruleset_geodata</a></td></tr>
            <tr><td>blackmatrix7/ios_rule_script</td><td><a href="https://github.com/blackmatrix7/ios_rule_script" target="_blank" rel="noopener">github.com/blackmatrix7/ios_rule_script</a></td></tr>
            <tr><td>TG-Twilight/AWAvenue-Ads-Rule</td><td><a href="https://github.com/TG-Twilight/AWAvenue-Ads-Rule" target="_blank" rel="noopener">github.com/TG-Twilight/AWAvenue-Ads-Rule</a></td></tr>
            <tr><td>Koolson/Qure</td><td><a href="https://github.com/Koolson/Qure" target="_blank" rel="noopener">github.com/Koolson/Qure</a></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="card">
        <h3><span class="tick"></span>调用接口</h3>
        <div class="tbl-wrap"><table>
          <colgroup><col style="width:40%"><col style="width:60%"></colgroup>
          <thead><tr><th>用途</th><th>接口</th></tr></thead>
          <tbody>
            <tr><td>HostMonit 优选</td><td class="mono">stock.hostmonit.com/CloudFlareYes</td></tr>
            <tr><td>优选 IP 列表</td><td class="mono">cf.090227.xyz/ip.164746.xyz</td></tr>
            <tr><td>bestcf 地区优选池</td><td class="mono">bestcf.pages.dev/random-region/{HK|TW|JP|SG|US|KR}/100.txt</td></tr>
            <tr><td>DoH 解析</td><td class="mono">cloudflare-dns.com / dns.alidns.com / doh.pub</td></tr>
            <tr><td>Cloudflare 用量监控（GraphQL）</td><td class="mono">api.cloudflare.com/client/v4/graphql</td></tr>
            <tr><td>版本更新检测</td><td class="mono">raw.githubusercontent.com/PAICNI/CFNext/...</td></tr>
            <tr><td>远程规则集（sing-box / Clash）</td><td class="mono">raw.githubusercontent.com/MetaCubeX/meta-rules-dat/...</td></tr>
            <tr><td>面板二维码库</td><td class="mono">cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js</td></tr>
          </tbody>
        </table></div>
      </div>
    </section>
  </div>
</div>
</div>

<div class="fbar">
  <span class="saved-at" id="savedAt">尚未保存</span>
  <button class="btn danger" id="resetBtn" onclick="resetAll()">重置</button>
  <button class="btn primary" id="saveBtn" onclick="saveAll()"><span class="dirty-dot"></span>保存全部</button>
</div>
<div class="mmode" id="mMode">
  <div class="mmodebox">
    <h3>选择运行模式</h3>
    <div class="msub">四种模式互不影响，之后可随时在「面板设置」里切换。模式决定面板形态与订阅下发内容，请按你的实际情况选择。</div>
    <div class="mmodegrid">
      <button class="mmodecard" onclick="pickMode('worker')">
        <b>Worker 模式</b>
        <span>使用内置节点，由本服务承载转发。开箱即用，无需额外准备任何东西。</span>
        <em>适合：先跑通、看重即开即用</em>
      </button>
      <button class="mmodecard" onclick="pickMode('warp')">
        <b>WARP 模式</b>
        <span>下发 WARP 节点，由客户端直连，流量不经过本服务。凭据由本服务自动注册并保管，无需自备配置。</span>
        <em>适合：想给本服务减负、少暴露</em>
      </button>
      <button class="mmodecard" onclick="pickMode('masque')">
        <b>MASQUE 模式</b>
        <span>下发 MASQUE 节点，同样由客户端直连。仅部分客户端支持，凭据同样自动生成与保管，无需自备配置。</span>
        <em>适合：明确知道自己的客户端支持</em>
      </button>
      <button class="mmodecard" onclick="pickMode('home')">
        <b>家宽模式</b>
        <span>下发 VPN Gate OpenVPN 家宽出口，经隧道前置拨号，客户端直连。</span>
        <em>适合：需要真实家宽出口（仅 Mihomo 内核）</em>
      </button>
    </div>
    <div class="mmodefoot"><a href="javascript:;" onclick="pickMode('worker')">先用 Worker 模式（默认）</a></div>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
/* ===== 基础 ===== */
var APIPATH = location.pathname.replace(/\\/+$/, '');
var CFG = null;
var LAST = [];
var toastTimer = null;
function $(id){ return document.getElementById(id); }
function api(p, opts){
  return fetch(APIPATH + '/api/' + p, opts).then(function(r){ return r.json(); });
}
function toast(t, ty){
  var el = $('toast');
  el.textContent = t;
  el.className = 'toast show ' + (ty || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.className = 'toast'; }, 2600);
}
function showMsg(id, t, ty){
  var el = $(id);
  el.textContent = t;
  el.className = 'msg show ' + (ty || 'info');
}
function copyText(t){
  var done = false;
  function fin(ok2){
    if (done) return; done = true;
    toast(ok2 ? '已复制' : '复制失败，请手动复制', ok2 ? 'ok' : 'err');
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    var p = null;
    try { p = navigator.clipboard.writeText(t); } catch (e) { fin(fallbackCopy(t)); return; }
    if (p && typeof p.then === 'function') {
      p.then(function(){ fin(true); }, function(){ fin(fallbackCopy(t)); });
      setTimeout(function(){ fin(fallbackCopy(t)); }, 600); // 剪贴板 API 悬空（无权限等）时回退
    } else { fin(true); }
  } else {
    fin(fallbackCopy(t));
  }
}
function fallbackCopy(t){
  var ta = document.createElement('textarea');
  ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  var ok2 = false;
  try { ok2 = document.execCommand('copy'); } catch (e) { ok2 = false; }
  document.body.removeChild(ta);
  return ok2;
}
function copySub(){ copyText($('subUrl').value || makeSub()); }
function markDirty(){
  $('saveBtn').classList.add('dirty');
  $('savedAt').textContent = '有未保存的修改';
}

/* ===== 导航 ===== */
var NAV = [
  { id:'dashboard', name:'仪表盘', icon:'<path d="M4 4h7v7H4zM13 4h7v4h-7zM4 13h7v7H4zM13 11h7v9h-7z"/>' },
  { id:'warp', name:'WARP 配置', icon:'<path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"/>' },
  { id:'masque', name:'MASQUE 配置', icon:'<path d="M4 7l8-4 8 4v10l-8 4-8-4zM12 3v18"/>' },
  { id:'home', name:'家宽配置', icon:'<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>' },
  { id:'nodes', name:'节点配置', icon:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5"/>' },
  { id:'optimizer', name:'优选配置', icon:'<path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 8v4l2.5 2.5M3 3l3 3"/>' },
  { id:'quota', name:'配额安全', icon:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4"/>' },
  { id:'account', name:'面板设置', icon:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-3.5 3.6-6 8-6s8 2.5 8 6"/>' },
  { id:'about', name:'关于项目', icon:'<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01"/>' }
];
var TITLES = { dashboard:'仪表盘', warp:'WARP 配置', masque:'MASQUE 配置', home:'家宽配置', nodes:'节点配置', optimizer:'优选配置', quota:'配额安全', account:'面板设置', about:'关于项目' };

/* ===== 运行模式（四种模式互不影响，可随时切换） ===== */
var MODE_NAV = {
  worker: ['dashboard', 'nodes', 'optimizer', 'quota', 'account', 'about'],
  warp: ['dashboard', 'warp', 'account', 'about'],
  masque: ['dashboard', 'masque', 'account', 'about'],
  home: ['dashboard', 'home', 'account', 'about']
};
var MODE_SHORT = { worker: 'Worker', warp: 'WARP', masque: 'MASQUE', home: '家宽' };
var MODE_LABEL = { worker: 'Worker 模式', warp: 'WARP 模式', masque: 'MASQUE 模式', home: '家宽模式' };
var MODE_DESC = {
  worker: '使用内置节点，由本服务承载转发，开箱即用。',
  warp: '下发 WARP 节点，客户端直连，流量不经过本服务。',
  masque: '下发 MASQUE 节点，客户端直连；仅部分客户端支持。',
  home: 'VPN Gate OpenVPN 家宽出口，经隧道前置拨号（仅 Mihomo 内核）。'
};
function curMode(){ var m = CFG && CFG.mode; return MODE_NAV[m] ? m : 'worker'; }
function applyMode(){
  var m = curMode(), nav = MODE_NAV[m];
  buildNav();
  var active = document.querySelector('.nav-item.on');
  if (!active || nav.indexOf(active.getAttribute('data-v')) < 0) switchView(nav[0]);
  var h = $('modeHint');
  if (h) h.innerHTML = '当前：<b>' + MODE_LABEL[m] + '</b> — ' + MODE_DESC[m];
  var sel = $('a-mode');
  if (sel) sel.value = m;
  // 地区与线路筛选只对内置 CF 节点池有意义：WARP / MASQUE 的节点由客户端直连，不参与地区/来源筛选
  var cf = $('cardFilter');
  if (cf) cf.style.display = (m === 'worker') ? '' : 'none';
  var sm = $('stMode');
  if (sm) sm.textContent = MODE_SHORT[m] || 'Worker';
}
function exitMode(){ showMode(); }
function showMode(){ $('mMode').classList.add('show'); }
function closeMode(){ $('mMode').classList.remove('show'); }
/* ===== WARP 凭据状态与重签（自动生成，无需手填） ===== */
function setWStat(){
  var el = $('w-stat');
  if (!el) return;
  var c = null;
  try { c = JSON.parse(String(CFG.warpConf || '')); } catch (e) { c = null; }
  if (!c || !c.p || !c.a4) { el.textContent = '尚未生成 · 首次拉取订阅时会自动注册（无需任何填写）'; el.style.color = 'var(--warn)'; return; }
  var d = '';
  if (c.at) { try { d = ' · ' + new Date(c.at).toLocaleString('zh-CN'); } catch (e) { d = ''; } }
  el.textContent = '已就绪 · 内网地址 ' + String(c.a4).split('/')[0] + ' · 对端 ' + c.h + ':' + c.pt + d;
  el.style.color = 'var(--ok)';
}
function regenWarp(){
  if (!window.confirm('重新生成会作废当前凭据并重新注册，客户端需重新拉取订阅。继续？')) return;
  api('config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ warpConf: '' }) })
    .then(function(r){
      if (!r || !r.ok) { toast((r && r.msg) || '重签失败', 'err'); return; }
      CFG = r.data; setWStat(); toast('已清空凭据 · 下次拉取订阅时自动重新注册', 'ok');
    })
    .catch(function(){ toast('重签失败', 'err'); });
}
function pickMode(m){
  if (!MODE_NAV[m]) return;
  var same = (m === curMode());
  api('config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: m }) })
    .then(function(r){
      if (!r || !r.ok) { toast((r && r.msg) || '保存失败', 'err'); return; }
      CFG = r.data;
      closeMode();
      fillForm();
      renderAll();
      applyMode();
      switchView(m === 'worker' ? 'dashboard' : m);
      toast(same ? '已应用当前模式' : ('已切换到 ' + MODE_LABEL[m]), 'ok');
    })
    .catch(function(){ toast('保存失败：无法连接服务器', 'err'); });
}
function switchModeFromPanel(){
  var m = $('a-mode').value;
  if (!MODE_NAV[m]) return;
  if (m === curMode()) { toast('已是当前模式'); return; }
  if (!confirm('切换到「' + MODE_LABEL[m] + '」？\\n\\n' + MODE_DESC[m] + '\\n\\n各模式的面板形态与订阅内容会随之改变，可随时切回。')) {
    $('a-mode').value = curMode();
    return;
  }
  pickMode(m);
}
function buildNav(){
  var nav = MODE_NAV[curMode()];
  var html = '';
  NAV.forEach(function(n){
    if (nav.indexOf(n.id) < 0) return;
    html += '<button class="nav-item" data-v="' + n.id + '" onclick="switchView(\\'' + n.id + '\\')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + n.icon + '</svg>' + n.name + '</button>';
  });
  $('nav').innerHTML = html;
}
function switchView(id){
  document.querySelectorAll('.nav-item').forEach(function(b){
    b.classList.toggle('on', b.getAttribute('data-v') === id);
  });
  document.querySelectorAll('.view').forEach(function(x){
    x.classList.toggle('on', x.getAttribute('data-view') === id);
  });
  $('pageTitle').textContent = TITLES[id] || '';
  $('sidebar').classList.remove('open');
  if (id === 'account' && typeof mdPaint === 'function') mdPaint();
}
$('hamb').addEventListener('click', function(){ $('sidebar').classList.toggle('open'); });

/* ===== Material 动态取色（移植自参考面板） ===== */
/* ---------- sRGB ↔ XYZ ↔ CAM16 ↔ HCT ---------- */
var MD_WP = [95.047, 100.0, 108.883];
var MD_XYZ2SRGB = [
  [3.2413774792388685, -1.5376652402851851, -0.49885366846268053],
  [-0.9691452513005321, 1.8758853451067872, 0.04156585616912061],
  [0.05562093689691305, -0.20395524564742123, 1.0571799111220335]
];
var MD_PI = Math.PI;
function mdClamp(a, b, x) { return x < a ? a : (x > b ? b : x); }
function mdSign(x) { return x < 0 ? -1 : (x > 0 ? 1 : 0); }
function mdDeg(d) { d = d % 360; return d < 0 ? d + 360 : d; }
var MD_LE = 216 / 24389, MD_LK = 24389 / 27;
function mdLabF(t) { return t > MD_LE ? Math.cbrt(t) : (MD_LK * t + 16) / 116; }
function mdLabInv(ft) { var f3 = ft * ft * ft; return f3 > MD_LE ? f3 : (116 * ft - 16) / MD_LK; }
function mdYFromLstar(l) { return 100 * mdLabInv((l + 16) / 116); }
function mdLstarFromY(y) { return 116 * mdLabF(y / 100) - 16; }
function mdLinear(c) { var n = c / 255; return n <= 0.040449936 ? n / 12.92 * 100 : Math.pow((n + 0.055) / 1.055, 2.4) * 100; }
function mdDelinear(c) { var n = c / 100; var d = n <= 0.0031308 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - 0.055; return mdClamp(0, 255, Math.round(d * 255)); }

/* 观看条件：D65 白点、适应亮度 11.73、背景 L*50、平均环绕，只算一次 */
var MD_VC = (function () {
  var la = (200 / MD_PI) * mdYFromLstar(50) / 100;
  var rW = MD_WP[0] * 0.401288 + MD_WP[1] * 0.650173 + MD_WP[2] * -0.051461;
  var gW = MD_WP[0] * -0.250268 + MD_WP[1] * 1.204414 + MD_WP[2] * 0.045854;
  var bW = MD_WP[0] * -0.002079 + MD_WP[1] * 0.048952 + MD_WP[2] * 0.953127;
  var f = 1.0, cc = 0.69;
  var d = mdClamp(0, 1, f * (1 - (1 / 3.6) * Math.exp((-la - 42) / 92)));
  var rgbD = [d * (100 / rW) + 1 - d, d * (100 / gW) + 1 - d, d * (100 / bW) + 1 - d];
  var k = 1 / (5 * la + 1), k4 = k * k * k * k, k4F = 1 - k4;
  var fl = k4 * la + 0.1 * k4F * k4F * Math.cbrt(5 * la);
  var n = mdYFromLstar(50) / MD_WP[1];
  var z = 1.48 + Math.sqrt(n);
  var nbb = 0.725 / Math.pow(n, 0.2);
  var af = [Math.pow(fl * rgbD[0] * rW / 100, 0.42), Math.pow(fl * rgbD[1] * gW / 100, 0.42), Math.pow(fl * rgbD[2] * bW / 100, 0.42)];
  var aa = [400 * af[0] / (af[0] + 27.13), 400 * af[1] / (af[1] + 27.13), 400 * af[2] / (af[2] + 27.13)];
  return { n: n, aw: (2 * aa[0] + aa[1] + 0.05 * aa[2]) * nbb, nbb: nbb, ncb: nbb, c: cc, nc: f, rgbD: rgbD, fl: fl, fLRoot: Math.pow(fl, 0.25), z: z };
})();

/* 正向：8 位 sRGB → { h 色相, c 色度, t 色调 } */
function mdHctFromRgb(r, g, b) {
  var rl = mdLinear(r), gl = mdLinear(g), bl = mdLinear(b);
  var x = 0.41233895 * rl + 0.35762064 * gl + 0.18051042 * bl;
  var y = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  var z = 0.01932141 * rl + 0.11916382 * gl + 0.95034478 * bl;
  var rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
  var gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
  var bC = -0.002079 * x + 0.048952 * y + 0.953127 * z;
  var rD = MD_VC.rgbD[0] * rC, gD = MD_VC.rgbD[1] * gC, bD = MD_VC.rgbD[2] * bC;
  var rAF = Math.pow(MD_VC.fl * Math.abs(rD) / 100, 0.42);
  var gAF = Math.pow(MD_VC.fl * Math.abs(gD) / 100, 0.42);
  var bAF = Math.pow(MD_VC.fl * Math.abs(bD) / 100, 0.42);
  var rA = mdSign(rD) * 400 * rAF / (rAF + 27.13);
  var gA = mdSign(gD) * 400 * gAF / (gAF + 27.13);
  var bA = mdSign(bD) * 400 * bAF / (bAF + 27.13);
  var a = (11 * rA - 12 * gA + bA) / 11;
  var bb = (rA + gA - 2 * bA) / 9;
  var u = (20 * rA + 20 * gA + 21 * bA) / 20;
  var p2 = (40 * rA + 20 * gA + bA) / 20;
  var hue = mdDeg(Math.atan2(bb, a) * 180 / MD_PI);
  var J = 100 * Math.pow(p2 * MD_VC.nbb / MD_VC.aw, MD_VC.c * MD_VC.z);
  var hp = hue < 20.14 ? hue + 360 : hue;
  var eHue = 0.25 * (Math.cos(hp * MD_PI / 180 + 2) + 3.8);
  var p1 = (50000 / 13) * eHue * MD_VC.nc * MD_VC.ncb;
  var t = (p1 * Math.sqrt(a * a + bb * bb)) / (u + 0.305);
  var alpha = Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, MD_VC.n), 0.73);
  return { h: hue, c: alpha * Math.sqrt(J / 100), t: mdLstarFromY(y) };
}

/* 逆向：CAM16 (J, C, H) → 线性 sRGB（未裁剪，用于色域判定） */
function mdCamToLinear(j, c, h) {
  var alpha = (c === 0 || j === 0) ? 0 : c / Math.sqrt(j / 100);
  var t = Math.pow(alpha / Math.pow(1.64 - Math.pow(0.29, MD_VC.n), 0.73), 1 / 0.9);
  var hRad = h * MD_PI / 180;
  var eHue = 0.25 * (Math.cos(hRad + 2) + 3.8);
  var ac = MD_VC.aw * Math.pow(j / 100, 1 / MD_VC.c / MD_VC.z);
  var p1 = eHue * (50000 / 13) * MD_VC.nc * MD_VC.ncb;
  var p2 = ac / MD_VC.nbb;
  var hSin = Math.sin(hRad), hCos = Math.cos(hRad);
  var gamma = (23 * (p2 + 0.305) * t) / (23 * p1 + 11 * t * hCos + 108 * t * hSin);
  var a = gamma * hCos, b = gamma * hSin;
  var rA = (460 * p2 + 451 * a + 288 * b) / 1403;
  var gA = (460 * p2 - 891 * a - 261 * b) / 1403;
  var bA = (460 * p2 - 220 * a - 6300 * b) / 1403;
  var rB = Math.max(0, 27.13 * Math.abs(rA) / (400 - Math.abs(rA)));
  var gB = Math.max(0, 27.13 * Math.abs(gA) / (400 - Math.abs(gA)));
  var bB = Math.max(0, 27.13 * Math.abs(bA) / (400 - Math.abs(bA)));
  var rC = mdSign(rA) * (100 / MD_VC.fl) * Math.pow(rB, 1 / 0.42);
  var gC = mdSign(gA) * (100 / MD_VC.fl) * Math.pow(gB, 1 / 0.42);
  var bC = mdSign(bA) * (100 / MD_VC.fl) * Math.pow(bB, 1 / 0.42);
  var rF = rC / MD_VC.rgbD[0], gF = gC / MD_VC.rgbD[1], bF = bC / MD_VC.rgbD[2];
  var X = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF;
  var Y = 0.38752654 * rF + 0.62144744 * gF - 0.00897398 * bF;
  var Z = -0.01584150 * rF - 0.03412294 * gF + 1.04996444 * bF;
  return [
    MD_XYZ2SRGB[0][0] * X + MD_XYZ2SRGB[0][1] * Y + MD_XYZ2SRGB[0][2] * Z,
    MD_XYZ2SRGB[1][0] * X + MD_XYZ2SRGB[1][1] * Y + MD_XYZ2SRGB[1][2] * Z,
    MD_XYZ2SRGB[2][0] * X + MD_XYZ2SRGB[2][1] * Y + MD_XYZ2SRGB[2][2] * Z
  ];
}
function mdInGamut(v) {
  return v[0] >= -0.01 && v[0] <= 100.01 && v[1] >= -0.01 && v[1] <= 100.01 && v[2] >= -0.01 && v[2] <= 100.01;
}
function mdLinToRgb(v) { return [mdDelinear(v[0]), mdDelinear(v[1]), mdDelinear(v[2])]; }

/* 求出让量化后色调等于 tone 的 CAM16 明度 J */
function mdJForTone(h, c, tone) {
  var lo = 0.01, hi = 99.9, i, mid, rgb, lt;
  for (i = 0; i < 24; i++) {
    mid = (lo + hi) / 2;
    rgb = mdLinToRgb(mdCamToLinear(mid, c, h));
    lt = mdLstarFromY(mdLinear(rgb[0]) * 0.2126 + mdLinear(rgb[1]) * 0.7152 + mdLinear(rgb[2]) * 0.0722);
    if (lt < tone) { lo = mid; } else { hi = mid; }
  }
  return (lo + hi) / 2;
}
/* HCT → sRGB：先把色度收敛到色域内（保住色调、牺牲色度），再解明度 */
function mdRgbFromHct(hue, chroma, tone) {
  var h = mdDeg(hue), t = mdClamp(0, 100, tone);
  if (!(chroma >= 1e-4) || t >= 99.9999 || t <= 0.0001) {
    var g = mdDelinear(mdYFromLstar(t));
    return [g, g, g];
  }
  var lo = 0, hi = chroma, i, mid;
  for (i = 0; i < 16; i++) {
    mid = (lo + hi) / 2;
    if (mdInGamut(mdCamToLinear(mdJForTone(h, mid, t), mid, h))) { lo = mid; } else { hi = mid; }
  }
  if (lo < 1e-4) { var g2 = mdDelinear(mdYFromLstar(t)); return [g2, g2, g2]; }
  return mdLinToRgb(mdCamToLinear(mdJForTone(h, lo, t), lo, h));
}

/* ---------- 十六进制互转 ---------- */
function mdHexToRgb(hx) {
  var s = String(hx || '').replace(/[^0-9a-fA-F]/g, '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  if (s.length !== 6) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function mdRgbToHex(v) {
  return '#' + v.map(function (x) { var s = mdClamp(0, 255, Math.round(x)).toString(16); return s.length < 2 ? '0' + s : s; }).join('');
}
function mdHctFromHex(hx) { var v = mdHexToRgb(hx); return v ? mdHctFromRgb(v[0], v[1], v[2]) : { h: 0, c: 0, t: 50 }; }
function mdHexFromHct(h, c, t) { return mdRgbToHex(mdRgbFromHct(h, c, t)); }

/* ---------- 色调与主题方案 ---------- */
/* 文档的 13 个色调标号 0/10/50/100/200…1000 ↔ HCT 色调 100/99/95/90/80…0 */
var MD_TONE_LABELS = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
function mdLabelToTone(L) { return (1000 - L) / 10; }
var MD_TONES = MD_TONE_LABELS.map(mdLabelToTone);

/* 主题方案：hue 为各调色盘相对来源色的色相偏移，chroma 为色度，
   n 为 neutral1/neutral2 色度，cap 为高色调（≥90）的色度上限。
   TONAL_SPOT 完全按文档：accent1 色度 48、高色调 40；accent2 16；accent3 色相 +60、色度 32；
   neutral1 色度 4；neutral2 色度 8。 */
var MD_VARIANTS = [
  { id: 'TONAL_SPOT', name: '色调点', desc: 'Android 默认方案，低到中等彩度', hue: [0, 0, 60], chroma: [48, 16, 32], n: [4, 8], cap: 40 },
  { id: 'VIBRANT', name: '鲜艳', desc: '次色与三色与主色同类，整体更饱和', hue: [0, 0, 60], chroma: [64, 32, 48], n: [6, 10], cap: 40 },
  { id: 'EXPRESSIVE', name: '表现力', desc: '高彩度，色相间拉开距离', hue: [0, 15, -45], chroma: [72, 36, 56], n: [8, 12], cap: 44 },
  { id: 'SPRITZ', name: '灰调', desc: '去饱和，接近灰阶', hue: [0, 0, 60], chroma: [14, 8, 18], n: [3, 5], cap: 14 }
];
function mdVariant(id) {
  for (var i = 0; i < MD_VARIANTS.length; i++) { if (MD_VARIANTS[i].id === id) return MD_VARIANTS[i]; }
  return MD_VARIANTS[0];
}

/* ---------- 由来源色派生 5 个色调调色盘 ---------- */
function mdPalettes(seedHex, variantId) {
  var src = mdHctFromHex(seedHex);
  /* 文档要求来源色的 CAM16 色度不低于 5，否则色相不稳 */
  var hue = src.h, chroma = Math.max(5, src.c);
  var V = mdVariant(variantId);
  var cap = function (c, t) { return t >= 90 ? Math.min(c, V.cap) : c; };
  var P = {
    a1: { h: hue, c: V.chroma[0] },
    a2: { h: mdDeg(hue + V.hue[1]), c: V.chroma[1] },
    a3: { h: mdDeg(hue + V.hue[2]), c: V.chroma[2] },
    n1: { h: hue, c: V.n[0] },
    n2: { h: hue, c: V.n[1] },
    err: { h: 25, c: 84 }
  };
  for (var k in P) { P[k].at = function (t) { return mdHexFromHct(this.h, cap(this.c, t), t); }; }
  P.err.at = function (t) { return mdHexFromHct(this.h, this.c, t); };
  P.seed = seedHex;
  P.sourceChroma = chroma;
  return P;
}
/* 65 色：5 个调色盘 × 13 个色调，键为文档标号 */
function mdTonal(seedHex, variantId) {
  var P = mdPalettes(seedHex, variantId);
  var out = {};
  ['a1', 'a2', 'a3', 'n1', 'n2'].forEach(function (k) {
    var row = {};
    MD_TONE_LABELS.forEach(function (L) { row[L] = P[k].at(mdLabelToTone(L)); });
    out[k] = row;
  });
  return out;
}

/* ---------- 颜色角色映射（文档「Material 库颜色属性更新」表） ---------- */
/* [角色, 调色盘, 浅色主题色调, 深色主题色调] —— 标号 N ↔ 色调 (1000-N)/10 */
var MD_ROLE_MAP = [
  ['primary', 'a1', 600, 200], ['onPrimary', 'a1', 0, 800],
  ['primaryContainer', 'a1', 100, 700], ['onPrimaryContainer', 'a1', 900, 900],
  ['secondary', 'a2', 600, 200], ['onSecondary', 'a2', 0, 800],
  ['secondaryContainer', 'a2', 100, 700], ['onSecondaryContainer', 'a2', 900, 900],
  ['tertiary', 'a3', 600, 200], ['onTertiary', 'a3', 0, 800],
  ['tertiaryContainer', 'a3', 100, 700], ['onTertiaryContainer', 'a3', 900, 900],
  ['error', 'err', 600, 200], ['onError', 'err', 0, 800],
  ['errorContainer', 'err', 100, 700], ['onErrorContainer', 'err', 900, 900],
  ['background', 'n1', 10, 900],
  ['onBackground', 'n1', 900, 100],
  ['surface', 'n1', 10, 900], ['onSurface', 'n1', 900, 100],
  ['surfaceContainerLowest', 'n1', 0, 1000], ['surfaceContainerLow', 'n1', 100, 900],
  ['surfaceContainer', 'n1', 200, 800], ['surfaceContainerHigh', 'n1', 300, 700],
  ['surfaceContainerHighest', 'n1', 400, 600],
  ['surfaceVariant', 'n2', 100, 700], ['onSurfaceVariant', 'n2', 700, 200],
  ['outline', 'n2', 500, 400], ['outlineVariant', 'n2', 200, 700],
  ['inverseSurface', 'n1', 800, 100], ['inverseOnSurface', 'n1', 100, 800],
  ['inversePrimary', 'a1', 200, 600],
  /* 遮罩与投影不随深浅翻转：M3 规定两者在任何主题下都是纯黑 */
  ['scrim', 'n1', 1000, 1000], ['shadow', 'n1', 1000, 1000],
  /* 状态层与状态内容（文档第二张表） */
  ['primaryStateContent', 'a1', 700, 200], ['primaryStateLayer', 'a1', 600, 300],
  ['secondaryStateContent', 'a2', 700, 200], ['secondaryStateLayer', 'a2', 600, 300],
  ['onPrimaryStateContent', 'a1', 0, 800], ['onPrimaryStateLayer', 'a1', 900, 800],
  ['onSecondaryStateContent', 'a2', 0, 800], ['onSecondaryStateLayer', 'a2', 900, 800],
  ['onSurfaceStateContent', 'n1', 900, 100], ['onSurfaceStateLayer', 'n1', 900, 100],
  ['onSurfaceVariantStateContent', 'n2', 700, 200], ['onSurfaceVariantStateLayer', 'n2', 700, 200],
  ['errorStateContent', 'err', 800, 200]
];
function mdRoleKey(role) {
  return role.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
/* 生成整套颜色角色；dark 为真时取深色主题列 */
function mdRoles(seedHex, variantId, dark) {
  var P = mdPalettes(seedHex, variantId);
  var out = {};
  MD_ROLE_MAP.forEach(function (row) {
    var pal = P[row[1]], L = dark ? row[3] : row[2];
    out[row[0]] = pal.at(mdLabelToTone(L));
  });
  return out;
}
/* 把角色写成 CSS 变量 */
function mdApply(seedHex, variantId, dark) {
  var r = mdRoles(seedHex, variantId, dark);
  var st = document.documentElement.style;
  for (var k in r) { st.setProperty('--m-' + mdRoleKey(k), r[k]); }
  return r;
}

/* ---------- Material 外观 ---------- */
var MD_SEED_DEF = '#6750A4';
var MD_PNAME = { a1: 'accent1', a2: 'accent2', a3: 'accent3', n1: 'neutral1', n2: 'neutral2' };
function storedStyle(){ try { return localStorage.getItem('nb_style') || 'glass'; } catch (e) { return 'glass'; } }
function storedSeed(){
  try { var v = localStorage.getItem('nb_seed'); return (v && mdHexToRgb(v)) ? v : MD_SEED_DEF; } catch (e) { return MD_SEED_DEF; }
}
function storedVariant(){ try { return localStorage.getItem('nb_variant') || 'TONAL_SPOT'; } catch (e) { return 'TONAL_SPOT'; } }
function savePref(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
function normHex(hx){ var v = mdHexToRgb(hx); return v ? mdRgbToHex(v) : null; }

/* 派生 65 色角色写入 CSS 变量；变量就绪后才挂 data-style，避免首帧闪烁 */
function mdSync(){
  var roles = mdApply(storedSeed(), storedVariant(), resolveTheme(storedTheme()) !== 'light');
  document.documentElement.setAttribute('data-style', storedStyle());
  return roles;
}
function setStyle(s){ savePref('nb_style', s); mdSync(); mdPaint(); }
function setSeed(hx){
  var v = normHex(hx); if (!v) return false;
  savePref('nb_seed', v); mdSync(); mdPaint(); return true;
}
function setVariant(id){ savePref('nb_variant', id); mdSync(); mdPaint(); }
function resetSeed(){ var i = $('mdSeed'); var s = setSeed(MD_SEED_DEF); if (i) i.value = storedSeed(); return s; }

/* ---------- 外观风格：色彩设置折叠（从「种子色」起收起） ---------- */
function mdFoldSet(open){
  var b = $('mdFoldBtn'), d = $('mdBox');
  if (!b || !d) return;
  d.classList[open ? 'add' : 'remove']('open');
  b.setAttribute('data-open', open ? '1' : '0');
  b.title = open ? '收起色彩设置' : '展开色彩设置';
}
function mdFoldInit(){
  var open = false;
  try { open = localStorage.getItem('nb_mdfold') === '1'; } catch (e) {}
  mdFoldSet(open);
}
function toggleMdFold(){
  var b = $('mdFoldBtn');
  var open = !(b && b.getAttribute('data-open') === '1');
  try { localStorage.setItem('nb_mdfold', open ? '1' : '0'); } catch (e) {}
  mdFoldSet(open);
  if (open && typeof mdPaint === 'function') mdPaint();
}

function buildOnce(el, html){
  if (!el || el.getAttribute('data-built')) return;
  el.innerHTML = html; el.setAttribute('data-built', '1');
}
/* 渲染外观卡片：风格段选、种子色板、方案段选、65 色预览 */
function mdPaint(){
  var seed = storedSeed(), variant = storedVariant(), style = storedStyle();
  var seg = document.querySelectorAll('#styleSeg button');
  for (var i = 0; i < seg.length; i++) seg[i].classList.toggle('on', seg[i].getAttribute('data-s') === style);

  var sr = $('mdSeedRow');
  if (sr) {
    buildOnce(sr, ["#6750A4","#0B57D0","#006A6A","#006E1C","#7A5900","#8B5000","#BA1A1A","#B90063","#7C6CFF","#5F6368"].map(function (c) {
      return '<i data-c="' + c + '" style="background:' + c + '" title="' + c + '"></i>';
    }).join(''));
    var its = sr.querySelectorAll('i');
    for (var j = 0; j < its.length; j++) {
      its[j].classList.toggle('on', normHex(its[j].getAttribute('data-c')) === normHex(seed));
    }
    if (!sr.getAttribute('data-bound')) {
      sr.setAttribute('data-bound', '1');
      sr.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.tagName === 'I') { var c = t.getAttribute('data-c'); var inp = $('mdSeed'); if (inp) inp.value = c; setSeed(c); }
      });
    }
  }
  var vs = $('mdVarSeg');
  if (vs) {
    buildOnce(vs, MD_VARIANTS.map(function (v) {
      return '<button class="btn sm" data-v="' + v.id + '" onclick="setVariant(\\'' + v.id + '\\')">' + v.name + '</button>';
    }).join(''));
    var vb = vs.querySelectorAll('button');
    for (var m = 0; m < vb.length; m++) vb[m].classList.toggle('on', vb[m].getAttribute('data-v') === variant);
  }
  var dsc = $('mdVarDesc');
  if (dsc) dsc.textContent = mdVariant(variant).desc;

  var pal = $('mdPal');
  if (pal) {
    buildOnce(pal, ['a1', 'a2', 'a3', 'n1', 'n2'].map(function (row) {
      return '<div class="r"><b>' + MD_PNAME[row] + '</b>' + MD_TONE_LABELS.map(function (L) {
        return '<i data-p="' + row + '" data-l="' + L + '"></i>';
      }).join('') + '</div>';
    }).join(''));
    var T = mdTonal(seed, variant);
    var cells = pal.querySelectorAll('i');
    var srgb = mdHexToRgb(seed), best = null, bestD = 1e9;
    for (var n = 0; n < cells.length; n++) {
      var cp = cells[n].getAttribute('data-p'), cl = cells[n].getAttribute('data-l');
      var hx = T[cp][cl], c = mdHexToRgb(hx);
      cells[n].style.background = hx;
      cells[n].setAttribute('data-hex', hx);
      cells[n].title = MD_PNAME[cp] + ' · ' + cl + ' · ' + hx + '\\n单击设为种子色';
      cells[n].classList.remove('on');
      var d = Math.abs(c[0] - srgb[0]) + Math.abs(c[1] - srgb[1]) + Math.abs(c[2] - srgb[2]);
      if (d < bestD) { bestD = d; best = cells[n]; }   /* 种子色在色板中的落点 */
    }
    if (best) best.classList.add('on');
    /* 单击任一色块 → 该色成为新的种子色（与上方预设色板同一套交互） */
    if (!pal.getAttribute('data-bound')) {
      pal.setAttribute('data-bound', '1');
      pal.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'I') return;
        var hx = t.getAttribute('data-hex');
        if (!hx || !mdHexToRgb(hx)) return;
        if (normHex(hx) === normHex(storedSeed())) { toast('已是当前种子色 ' + hx); return; }
        var i = $('mdSeed'); if (i) i.value = hx;
        setSeed(hx);
        toast('种子色已更新 · ' + hx);
      });
    }
  }
  var po = $('mdPalOut');
  if (po) {
    var found = null;
    if (pal) {
      var cs = pal.querySelectorAll('i');
      for (var k = 0; k < cs.length; k++) if (cs[k].classList.contains('on')) { found = cs[k]; break; }
    }
    po.innerHTML = '<i class="chip" style="background:' + seed + '"></i>' +
      '<span class="hx" title="点击复制" onclick="copySeed()">' + seed + '</span>' +
      '<span class="tag">当前种子色' + (found
        ? ' · 落点 ' + MD_PNAME[found.getAttribute('data-p')] + ' · ' + found.getAttribute('data-l')
        : '') + '　单击色块即可改用该色</span>';
  }
  var inp = $('mdSeed');
  if (inp && document.activeElement !== inp) inp.value = seed;
}

/* 复制当前种子色 */
function copySeed(){ copyText(storedSeed()); }

/* ---------- 涟漪（Material 触控反馈） ---------- */
function mdRipple(e){
  if (storedStyle() !== 'material') return;
  if (!e.target || !e.target.closest) return;
  var host = e.target.closest('.btn,.ibtn,.nav-item,.sp span,.pill,.fgrp');
  if (!host) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var r = host.getBoundingClientRect();
  if (!r.width || !r.height) return;
  var d = Math.max(r.width, r.height) * 2;
  var sp = document.createElement('span');
  sp.className = 'md-rip';
  sp.style.width = sp.style.height = d + 'px';
  sp.style.left = (e.clientX - r.left - d / 2) + 'px';
  sp.style.top = (e.clientY - r.top - d / 2) + 'px';
  host.appendChild(sp);
  setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 640);
}

/* ===== 主题 ===== */
function systemIsLight(){ return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; }
function storedTheme(){ var t = 'dark'; try { t = localStorage.getItem('tp_theme') || 'dark'; } catch(e) {} return t; }
function resolveTheme(t){ if (t === 'auto') return systemIsLight() ? 'light' : 'dark'; return t; }
function setThemeIcon(t){
  var p = document.getElementById('themeIcon');
  if (!p) return;
  if (t === 'light') p.setAttribute('d', 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4');
  else p.setAttribute('d', 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z');
}
function applyTheme(){
  var t = resolveTheme(storedTheme());
  document.documentElement.setAttribute('data-theme', t);
  setThemeIcon(t);
  if (typeof mdSync === 'function') mdSync();
}
function setTheme(t){
  try { localStorage.setItem('tp_theme', t); } catch(e) {}
  applyTheme();
  toast(t === 'auto' ? '已切换为跟随系统' : (t === 'light' ? '已切换为日间模式' : '已切换为夜间模式'), 'ok');
}
$('themeBtn').addEventListener('click', function(){
  var cur = storedTheme();
  var next = (cur === 'light') ? 'dark' : 'light';
  setTheme(next);
});
applyTheme();
if (typeof mdFoldInit === 'function') mdFoldInit();

/* ===== 更新检测 ===== */
var topVerText = 'v—';
function legacyCopy(t){
  try {
    var ta = document.createElement('textarea');
    ta.value = t;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok2 = false;
    try { ok2 = document.execCommand('copy'); } catch (e) { ok2 = false; }
    document.body.removeChild(ta);
    return ok2;
  } catch (e) { return false; }
}
function copyClipboard(t){
  return new Promise(function(ok){
    var done = false;
    function finish(v){ if (done) return; done = true; ok(v); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var p = null;
        try { p = navigator.clipboard.writeText(t); } catch (e) { finish(legacyCopy(t)); return; }
        if (p && typeof p.then === 'function') {
          p.then(function(){ finish(true); }, function(){ finish(legacyCopy(t)); });
          setTimeout(function(){ finish(legacyCopy(t)); }, 600); // 剪贴板 API 悬空（无权限等）时回退
        } else { finish(true); }
      } else {
        finish(legacyCopy(t));
      }
    } catch (e) { finish(legacyCopy(t)); }
  });
}
function checkUpdate(){
  var sv = $('sideVer');
  if (sv.classList.contains('checking')) return;
  sv.classList.add('checking');
  sv.textContent = '检测中…';
  api('update').then(function(r){
    sv.classList.remove('checking');
    if (!r || !r.ok || !r.data) { sv.textContent = topVerText; toast('检测更新失败，请稍后重试', 'err'); return; }
    var d = r.data;
    var kindName = '前后端分离版';   // 分离版固定形态，不随后端构建形态变化
    topVerText = 'v' + d.current + kindName;
    sv.textContent = topVerText;
    if (d.hasUpdate && d.code) {
      sv.classList.add('has-update');
      var kind = (d.kind === '小说混淆') ? '小说混淆' : (d.kind === '混淆') ? '混淆' : '明文';
      copyClipboard(d.code).then(function(copied){
        toast(copied ? '检测到更新，已复制最新' + kind + '代码到剪贴板' : '检测到更新（v' + d.latest + '），复制失败，请前往仓库获取', copied ? 'ok' : 'err');
      });
    } else if (d.hasUpdate) {
      toast('检测到更新（v' + d.latest + '），但未能获取代码', 'err');
    } else if (d.latest) {
      sv.classList.remove('has-update');
      toast('已是最新版本（v' + d.current + ' ' + kindName + '）', 'ok');
    } else {
      toast('检测更新失败：' + (d.error || '仓库暂不可达'), 'err');
    }
  }).catch(function(){
    sv.classList.remove('checking');
    sv.textContent = topVerText;
    toast('检测更新失败，请稍后重试', 'err');
  });
}

/* ===== 配置加载与回填 ===== */
function loadAll(){
  updateFreeDomainWarn();
  api('status').then(function(r){
    if (r && r.ok) renderStatus(r.data);
  }).catch(function(){});
  api('config').then(function(r){
    if (r && r.ok){
      CFG = r.data;
      fillForm();
      renderAll();
      applyMode();
      if (!CFG.mode) showMode();
      makeSub(false);
      setConn(true);
      refreshQuota();
      toast('配置已加载', 'ok');
    } else if (r && r.status === 403) {
      location.reload();
    } else {
      setConn(false);
      toast('无法连接服务器', 'err');
    }
  }).catch(function(){
    setConn(false);
    toast('无法连接服务器', 'err');
  });
}
function setConn(ok){
  var p = $('connPill');
  p.className = 'pill ' + (ok ? '' : 'off');
  $('connText').textContent = ok ? '运行中' : '无法连接';
}
// 免费域名（*.workers.dev / *.pages.dev）大陆直连被阻断：命中即提示绑定自定义域名
function isFreeSubDomain(h){
  return /\\.(workers\\.dev|pages\\.dev)$/i.test(String(h || ''));
}
function updateFreeDomainWarn(){
  var effHost = (CFG && CFG.host) ? String(CFG.host) : location.hostname;
  var wd = isFreeSubDomain(location.hostname) || isFreeSubDomain(effHost);
  // Pages 部署（*.pages.dev）不展示那条 *.workers.dev 横幅：域名与文案不符
  var isPages = /\\.pages\\.dev$/i.test(String(location.hostname || ''));
  $('wdwarn').style.display = wd && !isPages ? 'block' : 'none';
  $('subHint').textContent = wd
    ? '节点 SNI / 订阅域名使用 *.pages.dev 或 *.workers.dev 免费域名：大陆直连会被阻断——订阅导入与更新需挂梯子，节点测延迟与连接可能全部失败。解决：在 Cloudflare 控制台为本项目绑定自定义域名，再用自定义域名打开面板重新复制订阅链接。'
    : '';
}
function renderStatus(d){
  $('stEntry').textContent = location.origin + '/' + (d.path || d.uuid || '');
  updateFreeDomainWarn();
  var kv = d.kv;
  var kvTxt = kv ? '已绑定（配置持久化）' : '未绑定（配置仅内存）';
  $('stKv').textContent = kvTxt;
  $('stKv').className = 'v ' + (kv ? 'ok' : 'bad');
  $('aKv').textContent = kvTxt;
  $('aKv').className = 'v ' + (kv ? 'ok' : 'bad');
  var v = d.version || '—';
  var kindName = '前后端分离版';   // 分离版固定形态，不随后端构建形态变化
  $('sideVer').textContent = 'v' + v + kindName;
  topVerText = 'v' + v + kindName;
  $('aVer').textContent = v + kindName;
}
function protoText(){
  if (!CFG) return '—';
  var a = [];
  if (CFG.enableVless !== false) a.push('VLESS');
  if (CFG.enableTrojan) a.push('Trojan');
  if (CFG.enableXhttp) a.push('XHTTP');
  return a.length ? a.join(' / ') : '未启用';
}
function renderAll(){
  $('stProto').textContent = protoText();
  renderQuota();
}
function renderQuota(){
  var nl = !!(CFG && CFG.nodeLimit);
  $('qNl').textContent = nl ? '已开启' : '关闭（默认分档上限）';
  $('qNl').className = 'v ' + (nl ? 'ok' : '');
  $('qNlCount').textContent = nl ? (CFG.nodeLimitCount || 300) + ' 节点' : '—';
  var pc = !!(CFG && CFG.cpuLimit);
  $('qCpuLimit').textContent = pc ? '已开启（降载下发，按上限 60% 下发）' : '关闭（按设定数量完整下发）';
  $('qCpuLimit').className = 'v ' + (pc ? 'ok' : '');
  var lb = !(CFG && CFG.loadBalance === false);
  $('qLb').textContent = lb ? '已开启（随机轮换）' : '关闭（固定顺序）';
  $('qLb').className = 'v ' + (lb ? 'ok' : 'ok');
  // IPv6 下发策略：'full'（旧行为）标黄提醒——v6 备胎会拖慢客户端逐节点测延迟
  var i6 = (CFG && CFG.ipv6Mode) || 'off';
  $('qIp6').textContent = i6 === 'full' ? '等权混合（旧行为）' : (i6 === 'tail' ? '仅备胎（≤10%，排尾部）' : '不下发');
  $('qIp6').className = 'v ' + (i6 === 'full' ? 'warn' : 'ok');
}
function fmtNum(n){
  if (n == null || isNaN(n)) return '—';
  n = Number(n);
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}
function showQuotaState(kind, text){
  $('qQuotaWrap').style.display = (kind === 'data') ? '' : 'none';
  $('qQuotaEmpty').style.display = (kind === 'empty') ? '' : 'none';
  $('qQuotaErr').style.display = (kind === 'err') ? '' : 'none';
  if (kind === 'err') $('qQuotaErrText').textContent = quotaErrText(text);
  if (kind === 'data'){ $('qQuotaEmpty').style.display = 'none'; }
}
function quotaErrText(e){
  var m = String(e || '');
  if (m.indexOf('401') >= 0) return '认证失败（CF API 401）：请检查账户 ID 是否为 32 位十六进制、API 令牌是否有效且勾选 Account Analytics 读取权限';
  if (m.indexOf('403') >= 0) return '无权限（CF API 403）：API 令牌缺少账户 Analytics 读取权限';
  if (m.indexOf('429') >= 0) return 'CF API 限流（429）：已自动退避 15 分钟，期间沿用缓存数据';
  if (m.indexOf('未找到账户') >= 0) return m + '：请核对 dash.cloudflare.com 右侧栏的 32 位账户 ID';
  return m || '用量查询失败';
}
function renderQuotaData(d){
  updDbQuota(d);
  if (!d || !d.configured){
    $('qQuotaSub').textContent = '未配置';
    showQuotaState('empty');
    return;
  }
  if (d.error && !d.stale){
    $('qQuotaSub').textContent = '查询失败';
    showQuotaState('err', d.error);
    return;
  }
  $('qQuotaSub').textContent = d.stale ? '缓存数据' : '已连接';
  showQuotaState('data');
  $('qReq').textContent = fmtNum(d.today.requests) + ' / ' + fmtNum(d.limit);
  var p = d.percent || 0;
  $('qBar').style.width = Math.min(100, p) + '%';
  $('qBar').style.background = p >= 90 ? 'linear-gradient(90deg,var(--err),var(--warn))' : (p >= 60 ? 'linear-gradient(90deg,var(--warn),var(--accent))' : 'linear-gradient(90deg,var(--ok),var(--accent))');
  $('qPct').textContent = p + '%';
  $('qPct').className = 'v ' + (p >= 90 ? 'bad' : (p >= 60 ? '' : 'ok'));
  $('qRemain').textContent = fmtNum(d.remaining != null ? d.remaining : (d.limit - d.today.requests));
  $('qCpu').textContent = (d.today.cpuTime != null) ? (d.today.cpuTime / 1000).toFixed(2) + ' s' : '—';
  $('qSub').textContent = fmtNum(d.today.subrequests);
  $('qAt').textContent = (d.updatedAt ? String(d.updatedAt).replace('T', ' ').replace('Z', '') + ' UTC' : '—') + (d.stale ? '（限流缓存）' : '');
}
function updDbQuota(d){
  if (!d || !d.configured){ $('dbSub').textContent = '未配置监控'; $('dbWrap').style.display = 'none'; return; }
  if (d.error && !d.stale){ $('dbSub').textContent = '查询失败'; $('dbWrap').style.display = 'none'; return; }
  $('dbSub').textContent = d.stale ? '缓存数据' : '已连接';
  $('dbWrap').style.display = '';
  $('dbReq').textContent = fmtNum(d.today.requests) + ' / ' + fmtNum(d.limit);
  var p = d.percent || 0;
  $('dbBar').style.width = Math.min(100, p) + '%';
  $('dbBar').style.background = p >= 90 ? 'linear-gradient(90deg,var(--err),var(--warn))' : (p >= 60 ? 'linear-gradient(90deg,var(--warn),var(--accent))' : 'linear-gradient(90deg,var(--ok),var(--accent))');
  $('dbPct').textContent = p + '%';
  $('dbPct').className = 'v ' + (p >= 90 ? 'bad' : (p >= 60 ? '' : 'ok'));
}
function refreshQuota(){
  $('qQuotaSub').textContent = '查询中…';
  api('quota').then(function(r){
    if (r && r.ok) renderQuotaData(r.data);
    else { $('qQuotaSub').textContent = '查询失败'; showQuotaState('err', (r && r.msg) || '查询失败'); }
  }).catch(function(){ $('qQuotaSub').textContent = '查询失败'; showQuotaState('err', '无法连接服务器'); });
}
function parseIps(t){
  var out = [];
  String(t || '').split(/[\\n,;]+/).map(function(s){ return s.trim(); }).filter(Boolean).forEach(function(s){
    var name = '';
    if (s.indexOf('#') >= 0){ var a = s.split('#'); s = a[0]; name = a[1]; }
    var m;
    if ((m = s.match(/^\\[([0-9a-fA-F:]+)\\](?::(\\d+))?$/))){ out.push({ ip: m[1], port: parseInt(m[2]) || 443, name: name }); return; }
    if ((m = s.match(/^(\\d+\\.\\d+\\.\\d+\\.\\d+)(?::(\\d+))?$/))){ out.push({ ip: m[1], port: parseInt(m[2]) || 443, name: name }); }
  });
  return out;
}
function renderPreferred(){
  if (!CFG) return;
  var lines = [];
  String(CFG.preferredDomains || '').split(/[\\n;]+/).map(function(s){ return s.trim(); }).filter(Boolean).forEach(function(s){ lines.push(s); });  // URL 感知：含查询串逗号的 URL 整行保留，不按逗号切碎
  (CFG.preferredIPs || []).forEach(function(x){
    lines.push((String(x.ip).indexOf(':') >= 0 ? '[' + x.ip + ']' : x.ip) + ':' + (x.port || 443) + (x.name ? ('#' + x.name) : ''));
  });
  $('f-preferred').value = lines.join('\\n');
}
function fillPort(pv){
  pv = String(pv == null ? 443 : pv);
  var sel = $('o-port');
  var found = false;
  for (var i = 0; i < sel.options.length; i++){ if (sel.options[i].value === pv){ found = true; break; } }
  if (found){ sel.value = pv; $('o-portC').style.display = 'none'; }
  else { sel.value = 'custom'; $('o-portC').value = pv; $('o-portC').style.display = ''; }
}
function fillForm(){
  if (!CFG) return;
  if ($('a-front')) $('a-front').value = CFG.warpFront || '';
  $('en-vless').checked = CFG.enableVless !== false;
  $('en-trojan').checked = !!CFG.enableTrojan;
  $('tp-pass').value = CFG.trojanPassword || '';
  $('en-xhttp').checked = !!CFG.enableXhttp;
  $('tls-only').checked = !!CFG.tlsOnly;
  $('alpn').value = CFG.alpn || '';
  $('ech-on').checked = !!CFG.ech;
  $('ech-host').value = CFG.echHost || '';
  $('ech-dns').value = CFG.echDns || '';
  var fl = CFG.filter || {};
  var region = fl.region || 'all';
  var regionArr = Array.isArray(region) ? region : (region === 'all' ? ['all'] : [region]);
  $('fl-region-all').checked = regionArr.indexOf('all') >= 0;
  ['HK', 'TW', 'US', 'SG', 'JP', 'KR', 'DE'].forEach(function(r){ $('fl-region-' + r).checked = regionArr.indexOf(r) >= 0; });
  var ipType = fl.ipType || ['IPv4'];
  $('fl-ip4').checked = ipType.indexOf('IPv4') >= 0;
  $('fl-ip6').checked = ipType.indexOf('IPv6') >= 0;
  var ip6 = CFG.ipv6Mode || 'off';
  $('ip6-off').checked = ip6 !== 'tail' && ip6 !== 'full';
  $('ip6-tail').checked = ip6 === 'tail';
  $('ip6-full').checked = ip6 === 'full';
  var isp = fl.isp || ['移动', '联通', '电信'];
  $('fl-isp-m').checked = isp.indexOf('移动') >= 0;
  $('fl-isp-c').checked = isp.indexOf('联通') >= 0;
  $('fl-isp-t').checked = isp.indexOf('电信') >= 0;
  var src = CFG.src || {};
  $('fl-native').checked = src.native === true;
  $('fl-pref-domain').checked = src.prefDomain !== false;
  $('fl-pref-ip').checked = src.prefIp !== false;
  $('fl-custom-pref').checked = src.customPref === true;
  var o = CFG.optimizer || {};
  $('o-source').value = o.source || 'wetest_v4';
  $('o-sourceURL').value = o.sourceURL || '';
  $('o-fbpool').value = o.fallbackPool || '';
  fillPort(o.port);
  $('o-threads').value = o.threads || 5;
  $('o-count').value = o.count || 20;
  $('o-fill').value = (o.fillCount == null ? 0 : o.fillCount);
  $('o-useCidr').checked = o.useCidr !== false;
  $('o-submode').value = o.subMode || '';
  $('o-subinc').value = (o.subIncludeDefault ? '1' : '0');
  $('o-rand').value = o.subRandomCount == null ? 16 : o.subRandomCount;
  $('q-nl-on').checked = !!CFG.nodeLimit;
  $('q-nl-count').value = CFG.nodeLimitCount || 300;
  $('q-cpu-on').checked = !!CFG.cpuLimit;
  $('q-clabel').value = CFG.countryLabel || '';
  $('q-lb-on').checked = CFG.loadBalance !== false;  $('q-auto-on').checked = !!CFG.quotaAuto;
  $('q-strict-on').checked = !!CFG.quotaStrict;
  $('a-uuid').value = CFG.uuid || '';
  $('a-suburl').value = CFG.subUrl || '';
  $('a-admin').value = CFG.admin || '';
  $('q-tgtoken').value = CFG.tgBotToken || '';
  $('q-tgchat').value = CFG.tgChatID || '';
  $('hw-on').checked = !!CFG.homeWan;
  $('hw-cfg').value = CFG.hwCfg || '';
  $('s-proxyIP').value = CFG.proxyIP || '';
  $('s-outbound').value = CFG.outboundProxy || '';
  $('s-outmode').value = CFG.outboundMode || '';
  $('a-mode').value = curMode();
  $('w-on').checked = !!CFG.warpEnable;
  setWStat();
  $('w-eps').value = CFG.warpEps || '';
  $('w-name').value = CFG.warpName || 'WARP';
  $('x-on').checked = !!CFG.masqueEnable;
  $('x-conf').value = CFG.masqueConf || '';
  $('x-name').value = CFG.masqueName || 'MASQUE';
  $('x-eps').value = CFG.masqueEps || '';
  renderPreferred();
  bindRegionPills();
  onSubMode();
  $('o-customWrap').style.display = ($('o-source').value === 'custom') ? '' : 'none';
}
// 节点地区多选互斥：勾选具体地区时取消「全部地区」；全部取消时自动恢复「全部地区」（保证筛选非空）
function bindRegionPills(){
  if (window.__regionPillsBound) return;
  window.__regionPillsBound = true;
  var codes = ['HK', 'TW', 'US', 'SG', 'JP', 'KR', 'DE'];
  var all = $('fl-region-all');
  all.addEventListener('change', function(){
    if (all.checked) codes.forEach(function(r){ $('fl-region-' + r).checked = false; });
  });
  codes.forEach(function(c){
    $('fl-region-' + c).addEventListener('change', function(){
      if ($('fl-region-' + c).checked) all.checked = false;
      var any = codes.some(function(r){ return $('fl-region-' + r).checked; });
      if (!any) all.checked = true;
    });
  });
}
function collectForm(){
  if (!CFG) return null;
  var ipLines = [], domLines = [];
  // URL 感知收集：URL（含 ://）整行原样保留（查询串自带逗号不打碎，如 ?region=NL,GB,FI）；
  // 非 URL 行仍支持逗号/分号分隔多条 IP（兼容 "1.2.3.4:443#名, 5.6.7.8" 旧用法）
  String($('f-preferred').value).split(/\\n+/).map(function(s){ return s.trim(); }).filter(Boolean).forEach(function(s){
    if (s.indexOf('://') >= 0){ domLines.push(s); return; }
    s.split(/[;,]+/).map(function(x){ return x.trim(); }).filter(Boolean).forEach(function(x){
      if (parseIps(x).length) ipLines.push(x); else domLines.push(x);
    });
  });
  var ips = [], seen = {};
  ipLines.forEach(function(s){
    var p = parseIps(s);
    if (!p.length) return;
    var k = p[0].ip + ':' + (p[0].port || 443);
    if (seen[k]) return;
    seen[k] = 1;
    ips.push(p[0]);
  });
  return {
    mode: $('a-mode').value || '',
    warpFront: (($('a-front') || {}).value || '').trim(),
    warpEnable: $('w-on').checked,
    warpConf: CFG.warpConf || '',
    warpEps: $('w-eps').value,
    warpName: $('w-name').value.trim() || 'WARP',
    masqueEnable: $('x-on').checked,
    masqueConf: $('x-conf').value,
    masqueName: $('x-name').value.trim() || 'MASQUE',
    masqueEps: $('x-eps').value,
    uuid: $('a-uuid').value.trim(),
    subUrl: $('a-suburl').value.trim(),
    admin: $('a-admin').value,
    alpn: $('alpn').value,
    ech: $('ech-on').checked,
    echHost: $('ech-host').value.trim() || 'cloudflare-ech.com',
    echDns: $('ech-dns').value.trim(),
    tlsOnly: $('tls-only').checked,
    nodeLimit: $('q-nl-on').checked,
    nodeLimitCount: parseInt($('q-nl-count').value) || 300,
    cpuLimit: $('q-cpu-on').checked,
    countryLabel: $('q-clabel').value,
    loadBalance: $('q-lb-on').checked,
    ipv6Mode: $('ip6-tail').checked ? 'tail' : ($('ip6-full').checked ? 'full' : 'off'),
    tgBotToken: $('q-tgtoken').value.trim(),
    tgChatID: $('q-tgchat').value.trim(),
    quotaAuto: $('q-auto-on').checked,
    quotaStrict: $('q-strict-on').checked,
    enableVless: $('en-vless').checked,
    enableTrojan: $('en-trojan').checked,
    trojanPassword: $('tp-pass').value,
    enableXhttp: $('en-xhttp').checked,
    homeWan: $('hw-on').checked,
    hwCfg: $('hw-cfg').value,
    proxyIP: $('s-proxyIP').value.trim(),
    outboundProxy: $('s-outbound').value.trim(),
    outboundMode: $('s-outmode').value,
    preferredDomains: domLines.join('\\n'),
    preferredIPs: ips,
    optimizer: {
      source: $('o-source').value,
      sourceURL: $('o-sourceURL').value.trim(),
      fallbackPool: $('o-fbpool').value.trim(),
      port: parseInt($('o-port').value === 'custom' ? $('o-portC').value : $('o-port').value) || 443,
      threads: parseInt($('o-threads').value) || 5,
      count: parseInt($('o-count').value) || 20,
      fillCount: parseInt($('o-fill').value) || 0,
      useCidr: $('o-useCidr').checked,
      subMode: $('o-submode').value,
      subRandomCount: parseInt($('o-rand').value) || 16,
      subIncludeDefault: $('o-subinc').value === '1'
    },
    filter: {
      region: (function(){
        if ($('fl-region-all').checked) return ['all'];
        var a = [];
        ['HK', 'TW', 'US', 'SG', 'JP', 'KR', 'DE'].forEach(function(r){ if ($('fl-region-' + r).checked) a.push(r); });
        return a.length ? a : ['all'];
      })(),
      ipType: (function(){ var a = []; if ($('fl-ip4').checked) a.push('IPv4'); if ($('fl-ip6').checked) a.push('IPv6'); return a; })(),
      isp: (function(){ var a = []; if ($('fl-isp-m').checked) a.push('移动'); if ($('fl-isp-c').checked) a.push('联通'); if ($('fl-isp-t').checked) a.push('电信'); return a; })()
    },
    src: {
      native: $('fl-native').checked,
      prefDomain: $('fl-pref-domain').checked,
      prefIp: $('fl-pref-ip').checked,
      customPref: $('fl-custom-pref').checked
    }
  };
}
function saveAll(){
  if (!CFG){ toast('配置尚未加载', 'err'); return; }
  var body = collectForm();
  var btn = $('saveBtn');
  btn.disabled = true;
  api('config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function(r){
      if (r && r.ok){
        CFG = r.data;
        // v4 前后端分离：前端入口由环境变量 L 决定，与后端 uuid / path 无关。
        // 旧单文件版此处会跳到 /<uuid>（因为那时"UUID 即入口"），在 v4 下会落到后端欢迎页，故取消跳转。
        fillForm();
        renderAll();
        makeSub(false);
        refreshQuota();
        btn.classList.remove('dirty');
        $('savedAt').textContent = '已保存：' + new Date().toLocaleTimeString();
        toast('已保存并生效，正在刷新…', 'ok');
        setTimeout(function(){ location.reload(); }, 800);
      } else toast((r && r.msg) || '保存失败', 'err');
    })
    .catch(function(){ toast('保存失败：无法连接服务器', 'err'); })
    .then(function(){ btn.disabled = false; });
}
function hwCustomApply(){
  var el = $('hw-cfg'), st = $('hw-cfg-stat');
  if (!el || !st) return;
  var hosts = [], hasCrypto = false;
  String(el.value || '').split(/\\n+/).forEach(function(line){
    var s = String(line || '').trim();
    if (!s || s.charAt(0) === '#') return;
    if (/^(ca|cert|key|tls-auth|tls-crypt)\\s*[:=]/i.test(s)) { hasCrypto = true; return; }
    if (/^-{3,}/.test(s) || /^[A-Za-z0-9+/=\\s]{16,}$/.test(s)) return;
    var m = /^([A-Za-z]{2})\\s*[:|]\\s*([\\s\\S]+)$/.exec(s);
    var body = s, code = '';
    if (m) { code = m[1].toUpperCase(); body = m[2].trim(); }
    var b64 = body.replace(/\\s+/g, '');
    if (b64.length >= 200 && /^[A-Za-z0-9+/=]+$/.test(b64)) { hosts.push('配置(' + (code || 'XX') + ')'); return; }
    var p = body.split(/[\\s:]+/).filter(Boolean);
    if (p.length) hosts.push(p[0] + ':' + (parseInt(p[1], 10) || 1194) + '/' + (/udp/i.test(p[2] || '') ? 'udp' : 'tcp'));
  });
  st.textContent = hosts.length
    ? ('解析到 ' + hosts.length + ' 条：' + hosts.slice(0, 4).join('、') + (hosts.length > 4 ? ' …' : '') + (hasCrypto ? '（含证书块）' : '（无证书块的行会被忽略）'))
    : '未解析到有效条目';
  toast(hosts.length ? ('解析到 ' + hosts.length + ' 条') : '没有解析到条目', hosts.length ? 'ok' : 'err');
}
function resetAll(){
  if (!confirm('确定重置？将清空后端面板配置与节点记录，并清除前端登录密码、退出登录（回到「设置管理密码」页）。此操作不可恢复！')) return;
  var btn = $('resetBtn');
  btn.disabled = true;
  api('reset', { method: 'POST' })
    .then(function(r){
      if (r && r.ok){ toast(r.msg || '已重置', 'ok'); setTimeout(function(){ location.href = APIPATH; }, 900); }
      else toast((r && r.msg) || '重置失败', 'err');
    })
    .catch(function(){ toast('重置失败：无法连接服务器', 'err'); })
    .then(function(){ btn.disabled = false; });
}
function genUuid(){
  var u = '';
  if (window.crypto && crypto.randomUUID){ u = crypto.randomUUID(); }
  else {
    var tpl = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    u = tpl.replace(/[xy]/g, function(c){
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 3 | 8);
      return v.toString(16);
    });
  }
  $('a-uuid').value = u;
  markDirty();
  toast('已生成新 UUID', 'ok');
}
// 备份：把当前面板表单值收集成 JSON 下载（与保存配置同一套字段，恢复后可直接保存）
function exportConfig(){
  try {
    var data = collectForm();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    var ts = new Date();
    var pad = function(n){ return String(n).padStart(2, '0'); };
    a.download = 'cfnext-backup-' + ts.getFullYear() + pad(ts.getMonth()+1) + pad(ts.getDate()) + '-' + pad(ts.getHours()) + pad(ts.getMinutes()) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    toast('配置已导出为 JSON', 'ok');
  } catch (e) { toast('导出失败：' + e.message, 'err'); }
}
// 恢复：读取 JSON 填充表单，标记未保存，由用户点「保存全部」写盘
function importConfig(input){
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(){
    try {
      var data = JSON.parse(reader.result);
      CFG = Object.assign({}, CFG, data);
      fillForm();
      renderAll();
      markDirty();
      toast('配置已导入，请点「保存全部」生效', 'ok');
    } catch (e) { toast('导入失败：JSON 格式不正确', 'err'); }
    input.value = '';
  };
  reader.readAsText(file, 'utf-8');
}
document.querySelectorAll('input,select,textarea').forEach(function(el){
  var id = el.id || '';
  var prefixes = ['f-', 'o-', 'a-', 's-', 'q-', 'e-', 't-', 'fl-', 'en-'];
  for (var i = 0; i < prefixes.length; i++){ if (id.indexOf(prefixes[i]) === 0){ el.addEventListener('change', markDirty); break; } }
});

/* ===== 订阅 ===== */
function subUrlOf(fmt){
  // 自定义订阅路径优先：自动保留当前域名（location.origin），只替换路径段；
  // 用户只填 UUID/别名段（如 AAZ），拼成 https://当前域名/AAZ/sub；留空用 UUID。
  // 填了 /sub 结尾或带前后斜杠时自动归一，格式后缀（clash/singbox 等）拼为 /sub/<格式>
  var custom = (window.CFG && CFG.subUrl) ? String(CFG.subUrl).trim().replace(/^\\/+/, '').replace(/\\/sub$/, '').replace(/\\/+$/, '') : '';
  var base = custom ? (location.origin + '/' + custom) : (location.origin + APIPATH);
  var u = base + '/sub';
  return fmt ? (u + '/' + fmt) : u;
}
function makeSub(showQR){
  var fmt = $('subFmt').value;
  var url = subUrlOf(fmt === 'auto' ? '' : fmt);
  $('subUrl').value = url;
  if (showQR) showQRCode(url);
}
$('subFmt').addEventListener('change', function(){ makeSub(false); });
function toggleQR(){
  var w = $('qrWrap');
  if (w.style.display === 'block'){ w.style.display = 'none'; return; }
  showQRCode($('subUrl').value || subUrlOf(''));
}
function showQRCode(url){
  var w = $('qrWrap');
  w.style.display = 'block';
  if (typeof qrcode === 'undefined'){ w.innerHTML = '<div class="hint">二维码库加载失败，请直接复制链接</div>'; return; }
  try {
    var fmt = ($('subFmt') && $('subFmt').value) || 'auto';
    var q = qrcode(0, 'M');
    q.addData(qrPayloadOf(fmt, url));
    q.make();
    w.innerHTML = '<div class="qrbox">' + q.createImgTag(4, 10) + '</div>';
  } catch(e) { w.innerHTML = '<div class="hint">二维码生成失败：' + e.message + '</div>'; }
}
// 二维码内容随订阅格式（客户端）联动：
// Clash/Mihomo、Stash → clash://install-config（FlyClash / Clash Verge / Stash 扫码装订阅，配置名取订阅响应头 filename=CFNext）
// Sing-box → sing-box://import-remote-profile?url=...#CFNext（官方 scheme，# 后为配置文件名称）
// Surge → surge:///install-config（Surge 官方 scheme）
// auto / v2rayN+Shadowrocket / Loon / Quantumult X / 明文 → 直接使用订阅链接（Shadowrocket / Loon / QuanX 扫码识别）
function qrPayloadOf(fmt, url){
  var enc = encodeURIComponent(url);
  if (fmt === 'clash' || fmt === 'stash') return 'clash://install-config?url=' + enc;
  if (fmt === 'singbox') return 'sing-box://import-remote-profile?url=' + enc + '#' + __B;
  if (fmt === 'surge') return 'surge:///install-config?url=' + enc;
  return url;
}
function downloadSub(){
  var fmt = $('subFmt').value;
  var url = subUrlOf(fmt === 'auto' ? '' : fmt);
  var names = { auto:__B+'.yaml', clash:__B+'.yaml', stash:__B+'.yaml', singbox:__B+'.json', surge:__B+'.conf', surfboard:__B+'.conf', loon:__B+'.conf', quanx:__B+'.conf' };
  var link = document.createElement('a');
  link.href = url;
  link.download = names[fmt] || __B+'.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast('已请求下载；若未开始，可复制订阅链接在浏览器打开。', '');
}
function previewSub(){
  var fmt = $('subFmt').value;
  var box = $('subPrev');
  box.style.display = 'block';
  $('prevType').textContent = '请求中…';
  $('prevCount').textContent = '—';
  $('prevBody').textContent = '';
  api('sub?fmt=' + encodeURIComponent(fmt === 'auto' ? '' : fmt))
    .then(function(r){
      if (!r || !r.ok){ $('prevType').textContent = '预览失败'; $('prevBody').textContent = (r && r.msg) || '未知错误'; return; }
      var body = r.body || '';
      var type = r.type || '';
      $('prevType').textContent = type || '—';
      var n = 0;
      if (typeof r.nodeCount === 'number') n = r.nodeCount;
      else if (/clash|yaml/i.test(type)) {
        var section = body.split(/(?:^|\\n)proxies:\\s*\\n/)[1] || '';
        section = section.split(/\\n[A-Za-z][\\w-]*:/)[0];
        n = (section.match(/^  - (?:name\\s*:|\\{)/gm) || []).length;
      }
      else if (/json/i.test(type)) {
        try { n = (JSON.parse(body).outbounds || []).filter(function(node){return node.type && ['selector','urltest','url-test','direct','block','dns'].indexOf(node.type)<0;}).length; } catch(e) { n=0; }
      }
      else {
        var t = body;
        if (!/^(vless|trojan|ss|xhttp):\\/\\//m.test(t)) {
          try { t = atob(t); } catch (e) { /* 保持原样 */ }
        }
        n = t.split('\\n').filter(function(l){ return /^(vless|trojan|ss|xhttp):\\/\\//.test(l.trim()); }).length;
      }
      $('prevCount').textContent = n + ' 个节点' + (typeof r.backendCount === 'number' ? '（聚合 ' + r.backendCount + '/' + r.backendTotal + ' 个后端）' : '');
      $('prevBody').textContent = body.length > 2600 ? body.slice(0, 2600) + '\\n…（已截断，完整内容请下载）' : body;
    })
    .catch(function(){ $('prevType').textContent = '预览失败：无法连接服务器'; $('prevBody').textContent = ''; });
}

/* ===== 优选配置 ===== */
function onPortSel(){
  var sel = $('o-port');
  var c = $('o-portC');
  c.style.display = sel.value === 'custom' ? '' : 'none';
}
function onSubMode(){
  var m = $('o-submode').value;
  $('sm-custom').style.display = (m === 'custom') ? '' : 'none';
  $('sm-random').style.display = (m === 'random') ? '' : 'none';
  // 「追加内置优选池与默认地区源」仅在自定义订阅 / 随机优选模式下可选；
  // 订阅模式关闭（使用面板默认节点池）时强制为关闭并禁用，避免默认模式下误开追加导致行为不符
  if (m === '') {
    $('o-subinc').value = '0';
    $('o-subinc').disabled = true;
  } else {
    $('o-subinc').disabled = false;
  }
  // 订阅模式与仪表盘「地址来源」胶囊互斥同步（三态全部明确跟随）：
  // custom → 自定义优选开、随机优选关；random → 随机优选开、自定义优选关；关闭 → 两个胶囊都关
  if (m === 'custom') {
    $('fl-custom-pref').checked = true;
    $('fl-random-pref').checked = false;
  } else if (m === 'random') {
    $('fl-custom-pref').checked = false;
    $('fl-random-pref').checked = true;
  } else {
    $('fl-custom-pref').checked = false;
    $('fl-random-pref').checked = false;
  }
}
// 仪表盘「地址来源 → 自定义优选」与优选配置「订阅模式」联动：
// 勾选 → 订阅模式切为「自定义订阅（支持汇聚）」并关闭随机优选；取消 → 订阅模式关闭（使用面板默认节点池）
$('fl-custom-pref').addEventListener('change', function(){
  if (this.checked) {
    $('fl-random-pref').checked = false;   // 与随机优选互斥
    $('o-submode').value = 'custom';
  } else {
    if ($('o-submode').value === 'custom') $('o-submode').value = '';
  }
  onSubMode();
});
// 仪表盘「地址来源 → 随机优选」与优选配置「订阅模式 → 随机候选模式（未测速）」联动：
// 勾选 → 订阅模式切为 random 并关闭自定义优选；取消 → 订阅模式关闭（若当前为 random）
$('fl-random-pref').addEventListener('change', function(){
  if (this.checked) {
    $('fl-custom-pref').checked = false;   // 与自定义优选互斥
    $('o-submode').value = 'random';
  } else {
    if ($('o-submode').value === 'random') $('o-submode').value = '';
  }
  onSubMode();
});
$('o-source').addEventListener('change', function(){
  $('o-customWrap').style.display = ($('o-source').value === 'custom') ? '' : 'none';
});
function pingIp(ip, port, timeout){
  var t0 = Date.now();
  var addr = ip.indexOf(':') >= 0 ? '[' + ip + ']' : ip;
  var proto = (port === 80 || port === 8080 || port === 8880 || port === 2052 || port === 2082 || port === 2086 || port === 2095) ? 'http' : 'https';
  var ctrl = new AbortController();
  var timer = setTimeout(function(){ ctrl.abort(); }, timeout);
  return fetch(proto + '://' + addr + ':' + port + '/', { mode: 'no-cors', cache: 'no-store', redirect: 'manual', signal: ctrl.signal })
    .then(function(){ clearTimeout(timer); return { ok: true, latency: Date.now() - t0 }; })
    .catch(function(){
      clearTimeout(timer);
      var ms = Date.now() - t0;
      if (proto === 'http' && ms < 100) return pingHttps(ip, port, timeout);
      return { ok: ms < timeout, latency: ms };
    });
}
function pingHttps(ip, port, timeout){
  var t0 = Date.now();
  var addr = ip.indexOf(':') >= 0 ? '[' + ip + ']' : ip;
  var ctrl = new AbortController();
  var timer = setTimeout(function(){ ctrl.abort(); }, timeout);
  return fetch('https://' + addr + ':' + port + '/', { mode: 'no-cors', cache: 'no-store', redirect: 'manual', signal: ctrl.signal })
    .then(function(){ clearTimeout(timer); return { ok: true, latency: Date.now() - t0 }; })
    .catch(function(){ clearTimeout(timer); var ms = Date.now() - t0; return { ok: ms < timeout, latency: ms }; });
}
function localTest(cands, threads, timeout){
  var results = [], idx = 0, pending = 0;
  return new Promise(function(resolve){
    function next(){
      while (pending < threads && idx < cands.length) {
        (function(c){
          pending++;
          pingIp(c.ip, c.port, timeout).then(function(r){
            pending--;
            results.push({ ip: c.ip, port: c.port, name: c.name || '', ok: r.ok, latency: r.latency });
            if (results.length === cands.length) resolve(results);
            else next();
          });
        })(cands[idx++]);
      }
    }
    next();
  });
}
function runPick(){
  if (!CFG){ toast('配置尚未加载', 'err'); return; }
  var o = collectForm().optimizer;
  showMsg('oMsg', '正在拉取候选 IP…', 'info');
  api('candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) })
    .then(function(r){
      if (!r || !r.ok){ showMsg('oMsg', (r && r.msg) || '拉取失败', 'err'); return; }
      var cands = r.data || [];
      if (!cands.length){ showMsg('oMsg', (r && r.msg) || '没有可测的 IP，请换一个数据源', 'err'); return; }
      var st = r.stats || {};
      var parts = [];
      if (st.preset) parts.push('预设源 ' + st.preset + ' 条');
      if (st.presetErr) parts.push('预设源失败(' + st.presetErr + ')');
      if (st.custom) parts.push('自定义源 ' + st.custom + ' 条');
      if (st.customErr) parts.push('自定义源失败(' + st.customErr + ')');
      if (st.cidr) parts.push('CF 补足 ' + st.cidr + ' 条');
      // 候选数量截断：自定义 URL 源可能拉取上千条候选（第三方优选 IP 文档动辄上千条），全量测速耗时过长；
      // 按「候选数量」只测前 N 条（可调高数值测更多），测速列表与「全部加入最优」均基于该子集
      var candSub = (o.count > 0 && cands.length > o.count) ? cands.slice(0, o.count) : cands;
      showMsg('oMsg', '拉取 ' + cands.length + ' 条（' + (parts.join('，') || '无') + '），本地测速前 ' + candSub.length + ' 条…', 'info');
      localTest(candSub, o.threads || 5, 3000).then(function(results){
        results.sort(function(a, b){ return (a.latency < 0 ? 1e9 : a.latency) - (b.latency < 0 ? 1e9 : b.latency); });
        renderResults(results);
        var okc = results.filter(function(x){ return x.ok; }).length;
        showMsg('oMsg', '测速完成：' + okc + '/' + results.length + ' 可用（本地 → 目标）', okc ? 'ok' : 'err');
      });
    })
    .catch(function(){ showMsg('oMsg', '拉取失败：无法连接服务器', 'err'); });
}
function renderResults(list){
  var seen = {};
  var dedup = [];
  (list || []).forEach(function(r){
    if (seen[r.ip]) return;
    seen[r.ip] = 1;
    dedup.push(r);
  });
  LAST = dedup;
  var tb = $('oTableBody');
  tb.innerHTML = '';
  if (!LAST.length){ tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--faint)">没有可用结果</td></tr>'; return; }
  LAST.forEach(function(r, i){
    var tr = document.createElement('tr');
    var ok = r.ok;
    var lag = ok ? (r.latency + 'ms') : '超时';
    var badge = '<span class="badge ' + (ok ? 'g' : 'r') + '">' + (ok ? '可用' : '超时') + '</span>';
    var btn = ok ? '<button class="btn sm primary" onclick="useIp(' + i + ')">加入优选</button>' : '<span style="color:var(--faint)">—</span>';
    tr.innerHTML = '<td class="ip">' + r.ip + ':' + r.port + '</td><td>' + lag + '</td><td>' + badge + '</td><td>' + btn + '</td>';
    tb.appendChild(tr);
  });
}
function useIp(i){
  var r = LAST[i];
  if (!r) return;
  var ta = $('f-preferred');
  var line = r.ip + ':' + r.port + (r.name ? ('#' + r.name) : '');
  var exists = false;
  String(ta.value || '').split(/[\\n,;]+/).forEach(function(s){
    var p = parseIps(s);
    if (p.length && p[0].ip === r.ip) exists = true;
  });
  if (exists){ toast('该 IP 已在优选列表中', 'warn'); return; }
  var s = ta.value.trim();
  ta.value = s ? (s + '\\n' + line) : line;
  markDirty();
  toast('已加入优选列表，点击「保存全部」下发', 'ok');
}
function addAllBest(){
  var n = parseInt($('o-count').value) || 20;
  var seen = {};
  var list = [];
  LAST.filter(function(r){ return r.ok; }).forEach(function(r){
    if (seen[r.ip] || list.length >= n) return;
    seen[r.ip] = 1;
    list.push(r);
  });
  if (!list.length){ toast('没有可用结果', 'err'); return; }
  var arr = [];
  // 保留原节点名：防地区信息丢失导致订阅无国家显示；无名条目才编「优选N」
  list.forEach(function(r, i){ arr.push(r.ip + ':' + r.port + (r.name ? ('#' + r.name) : ('#优选' + (i + 1)))); });
  $('f-preferred').value = arr.join('\\n');
  markDirty();
  toast('已加入最快的 ' + list.length + ' 个优选 IP，点击「保存全部」下发', 'ok');
}
function fetchDomains(){
  api('domains').then(function(r){
    if (r && r.ok && r.data && r.data.length){ $('f-preferred').value = r.data.join('\\n'); markDirty(); toast('已拉取优选域名', 'ok'); }
    else toast((r && r.msg) || '拉取失败', 'err');
  }).catch(function(){ toast('拉取失败：无法连接服务器', 'err'); });
}

/* ===== 启动 ===== */
buildNav();
var initView = 'dashboard';
try {
  var qv = new URLSearchParams(location.search).get('v');
  if (qv && TITLES[qv]) initView = qv;
} catch(e) {}
switchView(initView);
loadAll();

/* 液态玻璃：高光跟随指针 */
var GLASS_EL=null,GLASS_EV=null,GLASS_RAF=0;
function glassTick(){GLASS_RAF=0;if(!GLASS_EL||!GLASS_EV)return;var r=GLASS_EL.getBoundingClientRect();if(!r.width||!r.height)return;GLASS_EL.style.setProperty('--mx',((GLASS_EV.clientX-r.left)/r.width*100).toFixed(1)+'%');GLASS_EL.style.setProperty('--my',((GLASS_EV.clientY-r.top)/r.height*100).toFixed(1)+'%');}
function bindGlass(){if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;if (typeof mdPaint === 'function') mdPaint();
document.addEventListener('pointerdown', function(e){ if (typeof mdRipple === 'function') mdRipple(e); }, true);
/* 鼠标跟随高光已按用户要求移除（原 pointermove → glassTick 沿光标刷新卡片高光） */
document.addEventListener('pointerleave',function(){GLASS_EL=null;});}
bindGlass();
</script>
</body>
</html>

`;

// 读取前端登录密码：ADMIN env 强制 > KV K.admin
async function readAdmin(env) {
  const envAdmin = String(env.ADMIN || "").trim();
  if (envAdmin) return envAdmin;
  try {
    if (env.K && typeof env.K.get === "function") {
      const kv = await env.K.get("admin");
      if (kv) return String(kv);
    }
  } catch (_) {}
  return "";
}

// 校验登录态：cookie cfn_auth == hashPwd(admin)
function authed(request, admin) {
  if (!admin) return false;
  const c = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + AC + "=([^;]+)"));
  return !!(c && c[1] === hashPwd(admin));
}

// 下发登录 cookie
function setAuthCookie(headers, admin) {
  headers.append(
    "Set-Cookie",
    `${AC}=${hashPwd(admin)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`,
  );
  return headers;
}

// 清除登录 cookie（重置时登出）
function clearAuthCookie(headers) {
  headers.append("Set-Cookie", `${AC}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return headers;
}

// 面板 HTML 注入：①「管理密码」字段改为修改前端登录密码 ②注入「多后端管理」模块
function buildPanelHtml({ backends, sel, multi, balance, origin, adminFromEnv, sharedApi }) {
  let html = PANEL_HTML;

  // ① a-admin 字段改写：提示改为「前端登录密码」，值不再进后端 config（collectForm 里 admin 字段被禁写）
  html = html.replace(
    /<label>管理密码（留空则面板免登录）<\/label>/,
    "<label>前端登录密码（留空不变更）</label>",
  );
  html = html.replace(
    /placeholder="设置后访问面板需登录"/,
    'placeholder="修改前端登录密码，至少 4 位（留空不变更）"',
  );
  html = html.replace(
    /部署后首次访问强制要求设置管理密码；设置后此处留空并保存可恢复免登录。/,
    "此密码只属于前端面板（存前端 KV），与后端 Pages / Worker 无关。首次访问会强制要求设置；修改后请重新登录。",
  );
  // collectForm 不再向后端传 admin（前端密码与后端无关）
  html = html.replace("admin: $('a-admin').value,", "admin: '',");
  // fillForm 不再从后端 config 读 admin（a-admin 留空，仅作前端密码输入框）
  html = html.replace("$('a-admin').value = CFG.admin || '';", "$('a-admin').value = '';");

  // ② 注入多后端管理模块：落在「面板设置」视图内、「运行模式」卡之后、「外观风格」卡之前。
  //    ⚠️ 不能用 indexOf("运行模式") 定位——「家宽」视图的说明文字里也含「运行模式」，
  //    会导致卡片被插进家宽视图（非 home 模式下该视图 display:none ⇒ 用户看不到模块）。
  //    锚点用「外观风格」标题（`<span class="tick"></span>外观风格` 全文件仅卡片标题一处），
  //    再回溯到它前面那个 <div class="card"> 的开头 —— 即插到该卡（运行模式）之后。
  const anchor = html.indexOf('<span class="tick"></span>外观风格');
  const at = anchor >= 0 ? html.lastIndexOf('<div class="card">', anchor) : -1;
  if (at >= 0) {
    const beCard = injectBeModule({
      backends,
      sel,
      multi,
      balance,
      origin,
      adminFromEnv,
      sharedApi,
    });
    html = html.slice(0, at) + beCard + html.slice(at);
  }
  return installMultiQuotaPanel(html);
}

// 面板设置页「多后端管理」卡片
function injectBeModule({ backends, sel, multi, balance, origin, adminFromEnv, sharedApi }) {
  // 只回填「显式填写」的 api；环境变量里的共享密钥不写进输入框（否则一回保存就被固化进 KV，改了 env 也不生效）
  const data = JSON.stringify({
    list: backends.map((b) => ({
      name: b.name,
      url: b.url,
      api: b.apiExplicit ? b.api : "",
      uuid: b.uuid || "",
    })),
    sel: sel || 0,
    multi: !!multi,
    balance: !!balance,
    origin,
    shared: !!sharedApi,
  });
  const adminWarn = adminFromEnv
    ? `<div id="be-admin-warn" style="margin-top:12px;padding:10px 12px;border:1px solid #f6ad55;border-radius:10px;background:rgba(246,173,85,.10);color:#f6ad55;font-size:12.5px;line-height:1.6">⚠️ 前端已通过 <code>ADMIN</code> 环境变量固定登录密码，面板内修改密码无效。</div>`
    : "";
  return `<div class="card" id="beCard">
        <h3><span class="tick"></span>多后端管理</h3>
        <p class="hint" style="margin-top:0;margin-bottom:8px">每行一个后端，格式 <code>名称:地址,API,UUID</code>（前两段必填，后两段可省略）；也兼容冒号老写法 <code>名称:地址:API[:UUID]</code>（从右侧识别，不会误伤地址里的 <code>://</code> 与端口）。<br>
          · <b>名称</b>：自定义；开启多订阅聚合时作为该后端节点的名前缀（如 <code>hka·香港-01</code>）。<br>
          · <b>地址</b>：该后端 Worker 的完整地址，如 <code>https://v1.xxx.workers.dev</code>。<br>
          · <b>API</b>：该后端自己的访问密钥，要与那个后端 Worker 的 <code>API</code> 环境变量一致；留空则回落到本前端的环境变量 <code>API</code>（两者都没配、而后端又设了密钥时，该后端会连不上）。<br>
          · <b>UUID</b>：该后端在订阅/接口路径里的映射段，<b>可留空</b> —— 留空依次回落到本前端的环境变量 <code>U</code>，再没有就用固定段 <code>cf</code>。后端<b>只认 API 密钥、不校验这里的 UUID</b>，所以填不填、填什么都可用，多个后端各填各的、互不影响。<br>
          例：<code>hka:https://v1.paicn.workers.dev,该后端的API密钥,该后端的UUID</code>。<br>
          改完点右下角「保存全部」写入存储生效。</p>
        <p class="hint" id="be-shared-tip" style="margin-top:0;margin-bottom:10px"></p>
        <div class="field"><label>后端地址列表</label>
          <textarea id="be-urls" rows="4" spellcheck="false" placeholder="hka:https://v1.paicn.workers.dev,该后端的API密钥&#10;us:https://v2.xxx.workers.dev,另一个API密钥,该后端的UUID" style="width:100%;min-height:88px;background:var(--glass-field);color:var(--tx);border:1px solid var(--glass-field-brd);border-radius:10px;padding:10px;font:12.5px/1.7 ui-monospace,Consolas,monospace;resize:vertical"></textarea>
        </div>
        <div class="inrow" style="margin-top:10px">
          <button class="btn" id="be-check">检测在线状态</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin:16px 0 10px;flex-wrap:wrap">
          <label class="switch"><input type="checkbox" id="be-multi"><span class="sl"></span></label>
          <span style="font-size:13px">多后端订阅聚合</span>
          <span style="flex:1"></span>
          <select id="be-sel" style="min-width:360px;flex:1;max-width:none"></select>
        </div>
        <div class="field"><label>代理连接方式</label>
          <select id="be-balance">
            <option value="stable">优先稳定：同一节点固定后端，故障时切换</option>
            <option value="round-robin">轮询均衡：每个新连接轮换后端</option>
          </select>
        </div>
        <p class="hint" style="margin-top:0">聚合订阅会保留全部后端的节点。默认优先稳定，每个节点使用其对应后端；轮询均衡会分摊新连接，但延迟和出口可能变化。后端握手失败、请求限流或达到账号配额阈值时，新连接切换到可用后端。已建立的连接固定使用原后端，断开后需客户端重连；不同后端可能显示不同出口 IP。配置读写作用于选中的后端。</p>
        ${adminWarn}
      </div>
      <script>
      (function(){
        var D = ${data};
        function $(id){ return document.getElementById(id); }
        var ta=$('be-urls'), sel=$('be-sel'), mul=$('be-multi'), routing=$('be-balance'), tip=$('be-shared-tip');
        if(tip){
          var base = D.shared
            ? '本前端已配置环境变量 <code>API</code>（共享密钥）：某行没单独写密钥的后端，都会用它去访问后端。'
            : '本前端未配置环境变量 <code>API</code>：后端若设了密钥，请在每行的第二段单独填写（<code>名称:地址,<b>API</b>,UUID</code>），否则该后端会拒绝访问。';
          var noUuid = D.list.filter(function(b){return !b.uuid;}).length;
          if(noUuid) base += ' <span style="opacity:.75">其中 '+noUuid+' 个后端未填 UUID，将回落到本前端环境变量 <code>U</code>，再没有就用兜底段 <code>cf</code>（不影响可用）。</span>';
          tip.innerHTML = base;
        }
        function label(b,i,mark){
          return (mark||'')+(b.name||('后端'+(i+1)))+' — '+b.url.replace(/^https?:\\/\\//,'')+((b.api||b.hasApi)?' 🔑':'');
        }
        function fillSel(list, cur, marks){
          sel.innerHTML='';
          list.forEach(function(b,i){
            var o=document.createElement('option');
            o.value=i;
            o.textContent=label(b,i,marks&&marks[i]);
            sel.appendChild(o);
          });
          if(cur>=0&&cur<list.length) sel.value=cur;
        }
        function applyMulti(){
          sel.disabled = mul.checked;
          sel.style.opacity = mul.checked ? '.5' : '1';
          routing.disabled = !mul.checked;
        }
        function rowText(b){
          var s=b.name+':'+b.url;
          if(b.api||b.uuid) s+=','+(b.api||'');
          if(b.uuid) s+=','+b.uuid;
          return s;
        }
        fillSel(D.list, D.sel);
        ta.value=D.list.map(rowText).join('\\n');
        mul.checked=D.multi;
        routing.value=D.balance?'round-robin':'stable';
        applyMulti();
        mul.onchange=applyMulti;
        // 解析一行：名称:地址,API,UUID（API / UUID 可省略；逗号分段不干扰地址里的 :// 与端口）
        // 兼容旧写法 名称:地址:API[:UUID]（从右侧剥 uuid/api）
        function parseLine(line){
          var api='', uuid='';
          var parts=line.split(',');
          if(parts.length>1){
            line=(parts[0]||'').trim();
            api=(parts[1]||'').trim();
            uuid=(parts[2]||'').trim();
          }else{
            var mu=line.match(/:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/);
            if(mu){ uuid=mu[1]; line=line.slice(0,line.length-mu[0].length); }
            var ma=line.match(/:([A-Za-z0-9_.+=-]{8,})$/);
            if(ma){ api=ma[1]; line=line.slice(0,line.length-ma[0].length); }
          }
          line=line.replace(/:\s*$/,'');
          var m=line.match(/^(?:([^:\\s]+)\\s*:\\s*)?(https?:\\/\\/\\S+)$/i);
          if(!m) return null;
          return {name:(m[1]||'').trim(),url:m[2].replace(/\\/+$/,''),api:api,uuid:uuid.replace(/^\\/+|\\/+$/g,'')};
        }
        function parseLines(){
          var lines=ta.value.split(/\\n+/).map(function(s){return s.trim();}).filter(Boolean);
          var list=[];
          for(var i=0;i<lines.length;i++){
            var one=parseLine(lines[i]);
            if(!one){ toast('第'+(i+1)+'行格式错误：应为 名称:地址,API,UUID（后两段可省略；也兼容冒号写法 名称:地址:API:UUID）','err'); return null; }
            list.push(one);
          }
          if(!list.length){ toast('请至少填写一个后端地址','err'); return null; }
          return list;
        }
        function hookSaveAll(){
          if(typeof saveAll !== 'function'){ setTimeout(hookSaveAll, 100); return; }
          if(saveAll.__beHooked) return;
          var orig = saveAll;
          function wrapped(){
            var list=parseLines();
            if(!list) return;
            // 【不做】「基础配置 UUID → 同步到当前行」：每行手填的 UUID 才是权威。
            // 后端已不再校验路径 UUID（带对 API 密钥即放行任意 UUID），前端只需把该行的
            // UUID 放进映射路径；若强行同步，多个后端会被逼成同一个 UUID。
            var chain = fetch('/backends',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({backends:list})})
              .then(function(r){return r.json();})
              .then(function(r){
                if(!(r&&r.ok)){ toast((r&&r.msg)||'后端列表保存失败','err'); throw new Error('be'); }
                return fetch('/becfg',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sel:mul.checked?0:(parseInt(sel.value,10)||0),multi:mul.checked,balance:routing.value==='round-robin'})})
                  .then(function(r2){return r2.json();});
              })
              .then(function(r2){
                if(!(r2&&r2.ok)){ toast((r2&&r2.msg)||'对接设置保存失败','err'); throw new Error('cfg'); }
                // 保存成功后同步内存副本与下拉展示（并把输入框规范化，方便下次核对）
                D.list=list;
                fillSel(list, parseInt(sel.value,10)||0);
                ta.value=list.map(rowText).join('\\n');
              });
            // 前端密码：a-admin 有值则 POST /setpass
            var pwdEl = document.getElementById('a-admin');
            if (pwdEl && pwdEl.value) {
              chain = chain.then(function(){
                return fetch('/setpass',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pwdEl.value})})
                  .then(function(r){return r.json();})
                  .then(function(rp){
                    if(rp&&rp.ok){ pwdEl.value=''; toast('前端登录密码已更新','ok'); }
                    else toast((rp&&rp.msg)||'前端密码更新失败','err');
                  });
              });
            }
            chain.then(function(){ orig.call(window); })
              .catch(function(e){ if(e&&e.message==='be'||e&&e.message==='cfg'){} else toast('多后端保存失败：无法连接前端','err'); });
          }
          wrapped.__beHooked = true;
          saveAll = wrapped;
        }
        hookSaveAll();
        function check(){
          fetch('/backends').then(function(r){return r.json();}).then(function(r){
            if(!r||!r.backends) return;
            var marks={}, list=D.list;
            if(r.backends.length===list.length){
              r.backends.forEach(function(b,i){ marks[i]=(b.online?'● ':'○ '); });
              fillSel(list, parseInt(sel.value,10)||0, marks);
            }
            toast('在线 '+r.backends.filter(function(b){return b.online;}).length+'/'+r.backends.length,'ok');
          }).catch(function(){ toast('检测失败','err'); });
        }
        $('be-check').onclick=check;
      })();
      <\/script>`;
}

// 转发一次请求到后端（不注入面板，纯透传；含 WS 与 set-cookie）
// entry：前端入口路径；当 pathname 以 /<entry>/ 开头时，把 entry 段映射成后端的 uuid（/<uuid>/api/*）
async function proxy(request, backend, pathname, search, entry, tunnel) {
  const u = new URL(request.url);
  const upgrade = (request.headers.get("Upgrade") || "").toLowerCase();
  const h = buildHeaders(request, backend.api);
  h.set("x-cf-host", u.hostname);

  // 路径映射：面板访问 /<entry>/api/* 或 /<entry>/sub/* → 后端 /<映射段>/api/* 或 /<映射段>/sub/*
  let mapped = pathname;
  const bu = mappingSeg(backend);
  if (entry && bu) {
    const prefix = "/" + entry + "/";
    if (pathname.startsWith(prefix)) {
      mapped = "/" + bu + pathname.slice(prefix.length - 1);
    }
  }
  if (tunnel) {
    mapped = "/" + mappingSeg(backend);
    h.set("x-cf-tunnel-uuid", tunnel.uuid);
  }
  const target = backend.url + mapped + search;
  if (upgrade === "websocket") {
    const ws = await fetch(target, {
      method: "GET",
      headers: h,
    });
    if (ws.webSocket)
      return new Response(null, {
        status: 101,
        webSocket: ws.webSocket,
        headers: {
          "X-CFNext-Backend": backend.name,
        },
      });
    return ws;
  }
  const init = {
    method: request.method,
    headers: h,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;
  const res = await fetch(target, init);
  const out = new Headers({
    "X-CFNext-Backend": backend.name,
  });
  for (const [k, v] of res.headers) {
    const lk = k.toLowerCase();
    if (
      lk === "content-encoding" ||
      lk === "content-length" ||
      lk === "transfer-encoding" ||
      lk === "connection" ||
      lk === "set-cookie"
    )
      continue;
    out.set(k, v);
  }
  let cookies = [];
  try {
    if (typeof res.headers.getSetCookie === "function") cookies = res.headers.getSetCookie();
  } catch (_) {}
  if (!cookies.length) {
    const one = res.headers.get("set-cookie");
    if (one) cookies = [one];
  }
  for (const c of cookies) out.append("set-cookie", c);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: out,
  });
}

// Backend failures are remembered briefly per isolate; quota snapshots are stored in KV.
const backendCooldowns = new Map();
let tunnelCursor;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function tunnelRoute(request, backends, pathname) {
  const ws = (request.headers.get("Upgrade") || "").toLowerCase() === "websocket";
  if (!ws && request.method !== "POST") return null;
  const match = pathname.match(/^\/([0-9a-f-]{36})\/?$/i);
  if (!match || !UUID_PATTERN.test(match[1])) return null;
  const index = backends.findIndex((b) => mappingSeg(b).toLowerCase() === match[1].toLowerCase());
  return index < 0
    ? null
    : {
        index,
        uuid: match[1],
        websocket: ws,
      };
}
async function retryableBackendResponse(response) {
  if ([429, 500, 502, 503, 504].includes(response.status)) return true;
  if (response.status !== 403) return false;
  // Ordinary authentication failures must not cause switching to another backend.
  const reader = response.clone().body?.getReader();
  if (!reader) return false;
  let text = "";
  try {
    while (text.length < 16384) {
      const part = await reader.read();
      if (part.done) break;
      text += new TextDecoder().decode(part.value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return /\b1027\b|daily\s+(?:request\s+)?limit|requests?\s+limit\s+exceeded|每日.{0,12}(?:额度|上限)/i.test(
    text,
  );
}
function coolBackend(backend) {
  if (backendCooldowns.size > 128) backendCooldowns.clear();
  backendCooldowns.set(backend.url, Date.now() + 60000);
}

// Configuration operations are pinned to the selected backend. Tunnel requests are
// pinned to the node's UUID; only safe requests can be retried after upstream failure.
async function proxyFailover(request, backends, sel, pathname, search, entry, env, balance = false) {
  if (!backends.length)
    return new Response("No backends configured", {
      status: 503,
    });
  if (entry && pathname.startsWith("/" + entry + "/api/")) {
    return proxy(request, backends[sel], pathname, search, entry);
  }
  const route = tunnelRoute(request, backends, pathname);
  const isTunnel = (request.headers.get("Upgrade") || "").toLowerCase() === "websocket";
  if (isTunnel && !route)
    return new Response("Unknown node UUID; update your subscription", {
      status: 404,
    });
  if (route && balance && tunnelCursor === undefined)
    tunnelCursor = crypto.getRandomValues(new Uint32Array(1))[0];
  const primary = route ? (balance ? tunnelCursor++ % backends.length : route.index) : sel;
  const blocked = await quotaBlockedBackends(env);
  const order = Array.from(
    {
      length: backends.length,
    },
    (_, i) => (primary + i) % backends.length,
  ).filter((i) => !blocked.has(backends[i].url) && !(backendCooldowns.get(backends[i].url) > Date.now()));
  const canReplay = route?.websocket || request.method === "GET" || request.method === "HEAD";
  // A streamed POST cannot be replayed after its body has been consumed.
  const attempts = canReplay ? order : order.slice(0, 1);
  let lastError;
  for (const index of attempts) {
    const backend = backends[index];
    // Failover requires the authenticated tunnel identity extension in the backend.
    if (route && index !== route.index && !backend.api) continue;
    try {
      const response = await proxy(request, backend, pathname, search, entry, route);
      if (!(await retryableBackendResponse(response))) {
        backendCooldowns.delete(backend.url);
        return response;
      }
      coolBackend(backend);
      if (!canReplay) return response;
      lastError = "HTTP " + response.status;
      response.body?.cancel().catch(() => {});
    } catch (error) {
      coolBackend(backend);
      lastError = error.message || "Backend connection failed";
    }
  }
  return new Response("No available backend: " + (lastError || "quota threshold or temporary cooldown"), {
    status: 503,
    headers: {
      "Retry-After": "60",
      "Cache-Control": "no-store",
    },
  });
}
const QUOTA_INTERVAL = 15 * 60 * 1000;
const quotaCache = new Map();
const quotaPending = new Map();
let quotaAccountCache = null;
function quotaJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
async function readQuotaAccounts(env) {
  if (
    quotaAccountCache &&
    quotaAccountCache.env === env.QUOTA_ACCOUNTS &&
    Date.now() - quotaAccountCache.at < 30000
  )
    return quotaAccountCache.accounts;
  let raw;
  try {
    raw = await env.K?.get("quota_accounts");
  } catch (_) {
    raw = null;
  }
  if (!raw) raw = env.QUOTA_ACCOUNTS || "[]";
  const accounts = JSON.parse(raw);
  if (!Array.isArray(accounts)) throw new Error("Invalid quota account configuration");
  quotaAccountCache = {
    env: env.QUOTA_ACCOUNTS,
    at: Date.now(),
    accounts,
  };
  return accounts;
}
async function quotaSnapshot(env, account) {
  const cached = quotaCache.get(account.id);
  if (cached && cached.token === account.token && Date.now() - cached.loadedAt < 30000) return cached;
  let data = null;
  try {
    const raw = await env.K?.get("quota_usage:" + account.id);
    if (raw) data = JSON.parse(raw);
  } catch (_) {}
  const result = {
    token: account.token,
    data,
    loadedAt: Date.now(),
  };
  quotaCache.set(account.id, result);
  return result;
}
async function queryQuotaAccount(env, account, force = false) {
  const cache = await quotaSnapshot(env, account);
  const now = Date.now(),
    day = new Date(now).toISOString().slice(0, 10);
  const previous = cache.data?.day === day ? cache.data : null;
  if (previous && (previous.retryAt > now || (!force && now - previous.checkedAt < QUOTA_INTERVAL)))
    return previous;
  if (quotaPending.has(account.id)) return quotaPending.get(account.id);
  const task = (async () => {
    let result;
    try {
      if (!account.token) throw new Error("未配置 API 令牌");
      const start = day + "T00:00:00.000Z";
      const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + account.token,
        },
        body: JSON.stringify({
          query:
            "query AccountUsage($id: string!, $start: string!, $end: string!) { viewer { accounts(filter: {accountTag: $id}) { workersInvocationsAdaptive(limit: 1, filter: {datetime_geq: $start, datetime_leq: $end}) { sum { requests subrequests } quantiles { cpuTimeP50 } } pagesFunctionsInvocationsAdaptiveGroups(limit: 1, filter: {datetime_geq: $start, datetime_leq: $end}) { sum { requests } } } } }",
          variables: {
            id: account.id,
            start,
            end: new Date(now).toISOString(),
          },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Cloudflare HTTP " + response.status);
      const payload = await response.json();
      if (payload.errors?.length)
        throw new Error(
          payload.errors
            .map((e) => e.message || "GraphQL error")
            .join("; ")
            .slice(0, 300),
        );
      const data = payload.data?.viewer?.accounts?.[0];
      if (!data) throw new Error("未找到账户，检查账户 ID 和 Account Analytics 读取权限");
      const workers = (data.workersInvocationsAdaptive || []).reduce(
        (sum, row) => sum + (row.sum?.requests || 0),
        0,
      );
      const pages = (data.pagesFunctionsInvocationsAdaptiveGroups || []).reduce(
        (sum, row) => sum + (row.sum?.requests || 0),
        0,
      );
      const requests = workers + pages;
      result = {
        day,
        checkedAt: now,
        updatedAt: new Date(now).toISOString(),
        workers,
        pages,
        requests,
        limit: account.limit,
        percent: Math.round((requests / account.limit) * 1000) / 10,
        remaining: Math.max(0, account.limit - requests),
        cpuTime: data.workersInvocationsAdaptive?.[0]?.quantiles?.cpuTimeP50 || 0,
        subrequests: (data.workersInvocationsAdaptive || []).reduce(
          (sum, row) => sum + (row.sum?.subrequests || 0),
          0,
        ),
      };
    } catch (error) {
      const message = String(error.message || error);
      result = {
        ...(previous && previous.requests != null ? previous : {}),
        day,
        checkedAt: now,
        error: message,
        stale: !!(previous && previous.requests != null),
        retryAt: now + (/429/.test(message) ? QUOTA_INTERVAL : 60000),
      };
    }
    quotaCache.set(account.id, {
      token: account.token,
      data: result,
      loadedAt: now,
    });
    await env.K?.put("quota_usage:" + account.id, JSON.stringify(result), {
      expirationTtl: 172800,
    });
    return result;
  })();
  quotaPending.set(account.id, task);
  try {
    return await task;
  } finally {
    quotaPending.delete(account.id);
  }
}
async function refreshQuotaAccounts(env) {
  const accounts = await readQuotaAccounts(env);
  await Promise.all(accounts.map((account) => queryQuotaAccount(env, account).catch(() => {})));
}
async function quotaBlockedBackends(env) {
  const blocked = new Set();
  if (!env) return blocked;
  const accounts = await readQuotaAccounts(env);
  const day = new Date().toISOString().slice(0, 10);
  await Promise.all(
    accounts.map(async (account) => {
      const snapshot = (await quotaSnapshot(env, account)).data;
      if (
        snapshot?.day === day &&
        !snapshot.error &&
        snapshot.requests != null &&
        snapshot.requests * 100 >= account.limit * account.threshold &&
        Date.now() - snapshot.checkedAt < 2 * QUOTA_INTERVAL
      ) {
        for (const url of account.backends || []) blocked.add(url);
      }
    }),
  );
  return blocked;
}
async function handleQuotaAccounts(request, env, backends) {
  const url = new URL(request.url);
  const accounts = await readQuotaAccounts(env);
  if (url.pathname === "/quota-accounts/check" && request.method === "POST") {
    const body = await request.json();
    const selected = body.id ? accounts.filter((a) => a.id === body.id) : accounts;
    if (!selected.length)
      return quotaJson(
        {
          ok: false,
          msg: "请先保存账号",
        },
        400,
      );
    const results = await Promise.all(
      selected.map(async (account) => ({
        id: account.id,
        name: account.name,
        ...(await queryQuotaAccount(env, account, !body.cached)),
      })),
    );
    return quotaJson({
      ok: true,
      results,
    });
  }
  if (url.pathname !== "/quota-accounts")
    return quotaJson(
      {
        ok: false,
      },
      404,
    );
  if (request.method === "POST") {
    if (!env.K)
      return quotaJson(
        {
          ok: false,
          msg: "前端未绑定 KV",
        },
        500,
      );
    const body = await request.json();
    if (!Array.isArray(body.accounts) || body.accounts.length > 20)
      return quotaJson(
        {
          ok: false,
          msg: "最多配置 20 个账号",
        },
        400,
      );
    const known = new Set(backends.map((b) => b.url));
    const clean = [],
      ids = new Set();
    for (const item of body.accounts) {
      const id = String(item.id || "")
        .trim()
        .toLowerCase();
      if (!/^[0-9a-f]{32}$/.test(id) || ids.has(id))
        return quotaJson(
          {
            ok: false,
            msg: "账户 ID 必须为不重复的 32 位十六进制字符串",
          },
          400,
        );
      ids.add(id);
      const previous = accounts.find((a) => a.id === id);
      const token = String(item.token || "").trim() || previous?.token || "";
      if (!token)
        return quotaJson(
          {
            ok: false,
            msg: "新账号需要填写 API 令牌",
          },
          400,
        );
      const limit = Number(item.limit || 100000),
        threshold = Number(item.threshold ?? 80);
      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        !Number.isFinite(threshold) ||
        threshold < 1 ||
        threshold > 100
      )
        return quotaJson(
          {
            ok: false,
            msg: "额度和切换阈值无效",
          },
          400,
        );
      const urls = [
        ...new Set((item.backends || []).map((x) => String(x).trim().replace(/\/+$/, "")).filter(Boolean)),
      ];
      if (urls.some((x) => !known.has(x)))
        return quotaJson(
          {
            ok: false,
            msg: "关联域名必须来自已配置的后端列表",
          },
          400,
        );
      if (clean.some((a) => a.backends.some((x) => urls.includes(x))))
        return quotaJson(
          {
            ok: false,
            msg: "一个后端只能关联一个账号",
          },
          400,
        );
      clean.push({
        id,
        name: String(item.name || id).slice(0, 100),
        token,
        limit,
        threshold,
        backends: urls,
      });
    }
    await env.K.put("quota_accounts", JSON.stringify(clean));
    quotaAccountCache = { env: env.QUOTA_ACCOUNTS, at: Date.now(), accounts: clean };
    quotaCache.clear();
    return quotaJson({
      ok: true,
      msg: "已保存 " + clean.length + " 个独立账号",
      accounts: clean.map(({ token, ...account }) => ({ ...account, hasToken: !!token })),
    });
  }
  if (request.method !== "GET")
    return quotaJson(
      {
        ok: false,
      },
      405,
    );
  const results = await Promise.all(
    accounts.map(async (account) => {
      const { token, ...safe } = account;
      const snapshot = (await quotaSnapshot(env, account)).data;
      return {
        ...safe,
        hasToken: !!token,
        usage: snapshot?.day === new Date().toISOString().slice(0, 10) ? snapshot : null,
      };
    }),
  );
  return quotaJson({
    ok: true,
    accounts: results,
  });
}
export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url);
    // 面板入口路径：ENTRY / LOGIN / L 任填其一（与后端的简化命名保持一致）
    const entry = String(env.ENTRY || env.LOGIN || env.L || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");
    const entryPath = entry ? "/" + entry : "";
    const isEntry = !!entryPath && u.pathname === entryPath;
    const envAdmin = String(env.ADMIN || "").trim();
    // 前端登录密码：ADMIN env 强制 > KV K.admin；空串 = 从未设置过
    const admin = await readAdmin(env);
    const ok = authed(request, admin);
    const J = (o, st, h) =>
      new Response(JSON.stringify(o), {
        status: st || 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          ...(h || {}),
        },
      });
    const P = (html) =>
      new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      });

    // ---- 入口路径归一化 / 兜底跳转 ----
    // 踩过：/<entry>/（尾斜杠）不命中 isEntry ⇒ 绕过登录闸门被透传给后端，露出后端的 Welcome 兜底页
    const isGet = request.method === "GET" || request.method === "HEAD";
    const redirect = (to) =>
      new Response(null, {
        status: 302,
        headers: {
          Location: to,
          "cache-control": "no-store",
        },
      });
    const isNav = (() => {
      const ua = request.headers.get("User-Agent") || "";
      const ac = request.headers.get("Accept") || "";
      return (
        /mozilla|applewebkit|chrome|safari|firefox|edg/i.test(ua) &&
        (/text\/html/i.test(ac) ||
          request.headers.get("Sec-Fetch-Dest") === "document" ||
          request.headers.get("Upgrade-Insecure-Requests") === "1")
      );
    })();
    if (entryPath && isGet) {
      // ① 尾斜杠归一化：/<entry>/ → /<entry>
      if (u.pathname === entryPath + "/") return redirect(entryPath + (u.search || ""));
      // ② 根路径一律跳入口（不看 UA，避免任何客户端拿到后端兜底页）
      if (u.pathname === "/") return redirect(entryPath + (u.search || ""));
      // ③ 入口下未识别的子路径（非 api/sub/crules）且是浏览器导航 → 回入口
      if (isNav && u.pathname.startsWith(entryPath + "/")) {
        const rest = u.pathname.slice(entryPath.length);
        if (!/^\/(api|sub|crules)(\/|$)/.test(rest)) return redirect(entryPath);
      }
    }

    // ---- 首次设置密码 / 登录（POST 到 <entry>）----
    if (isEntry && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (_) {
        body = null;
      }
      const pwd = body && typeof body.password === "string" ? body.password : "";
      if (envAdmin) {
        // ADMIN env 存在 = 密码唯一来源（KV 里的密码被忽略）；此处只校验，不修改
        if (pwd !== envAdmin)
          return J(
            {
              ok: false,
              msg: "密码错误",
            },
            403,
          );
        const h = setAuthCookie(
          new Headers({
            "content-type": "application/json; charset=utf-8",
          }),
          envAdmin,
        );
        return new Response(
          JSON.stringify({
            ok: true,
            next: entryPath,
          }),
          {
            status: 200,
            headers: h,
          },
        );
      }
      if (!admin) {
        // 首次设置密码（写入前端 KV，此后每次访问都要求登录）
        if (pwd.length < 4)
          return J(
            {
              ok: false,
              msg: "密码至少 4 位",
            },
            400,
          );
        if (!env.K || typeof env.K.put !== "function")
          return J(
            {
              ok: false,
              msg: "前端未绑定 KV，无法保存密码",
            },
            500,
          );
        await env.K.put("admin", pwd);
        const h = setAuthCookie(
          new Headers({
            "content-type": "application/json; charset=utf-8",
          }),
          pwd,
        );
        return new Response(
          JSON.stringify({
            ok: true,
            next: entryPath,
          }),
          {
            status: 200,
            headers: h,
          },
        );
      }
      if (pwd !== admin)
        return J(
          {
            ok: false,
            msg: "密码错误",
          },
          403,
        );
      const h = setAuthCookie(
        new Headers({
          "content-type": "application/json; charset=utf-8",
        }),
        admin,
      );
      return new Response(
        JSON.stringify({
          ok: true,
          next: entryPath,
        }),
        {
          status: 200,
          headers: h,
        },
      );
    }

    // ---- 登录闸门：唯一的放行判据 ----
    //  · 无密码（未配 ADMIN env 且 KV 也无密码）⇒ 强制设置密码页，不设密码永远看不到面板
    //  · 有密码但无有效登录态            ⇒ 登录页（页面）/ 403（接口）
    if (isEntry && (request.method === "GET" || request.method === "HEAD")) {
      if (!admin) return P(SETUP_HTML);
      if (!ok) return P(LOGIN_PAGE);
      const bl = await parseBackends(env);
      const bc = await parseBecfg(env, bl.length || 1);
      return P(
        buildPanelHtml({
          backends: bl,
          sel: bc.sel,
          multi: bc.multi,
          balance: bc.balance,
          origin: u.origin,
          adminFromEnv: !!envAdmin,
          sharedApi: String(env.API || env.GATE || "").trim(),
        }),
      );
    }
    // 管理类接口：无密码或未登录一律拒绝（返回 null 表示放行）
    const gate = () =>
      admin && ok
        ? null
        : J(
            {
              ok: false,
              msg: admin ? "未授权" : "请先设置登录密码",
            },
            403,
          );

    // ---- 多后端管理接口（需登录）----
    const backends = await parseBackends(env);
    const becfg = await parseBecfg(env, backends.length || 1);
    if (u.pathname === "/quota-accounts" || u.pathname === "/quota-accounts/check") {
      const denied = gate();
      if (denied) return denied;
      try {
        return await handleQuotaAccounts(request, env, backends);
      } catch (error) {
        return quotaJson(
          {
            ok: false,
            msg: String(error.message || error),
          },
          500,
        );
      }
    }
    if (
      ctx &&
      typeof ctx.waitUntil === "function" &&
      ((request.headers.get("Upgrade") || "").toLowerCase() === "websocket" || /\/sub\//.test(u.pathname))
    ) {
      ctx.waitUntil(refreshQuotaAccounts(env).catch(() => {}));
    }
    if (u.pathname === "/backends") {
      const d = gate();
      if (d) return d;
      if (request.method === "POST") return await saveBackends(request, env);
      const status = await Promise.all(
        backends.map(async (b, i) => {
          const hdrs = {
            "User-Agent": "Mozilla/5.0",
          };
          if (b.api) hdrs["x-cf-api"] = b.api;
          try {
            const r = await fetch(b.url + "/", {
              headers: hdrs,
              signal: AbortSignal.timeout(5000),
            });
            return {
              index: i,
              name: b.name,
              url: b.url,
              online: r.status < 500,
              status: r.status,
              hasApi: !!b.api,
              hasUuid: !!(b.uuid || b.envUuid),
            };
          } catch (e) {
            return {
              index: i,
              name: b.name,
              url: b.url,
              online: false,
              status: 0,
              hasApi: !!b.api,
              hasUuid: !!(b.uuid || b.envUuid),
            };
          }
        }),
      );
      return new Response(
        JSON.stringify({
          backends: status,
          sel: becfg.sel,
          multi: becfg.multi,
          balance: becfg.balance,
          aggregate: u.origin + "/aggregate/sub/clash",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        },
      );
    }
    if (u.pathname === "/becfg" && request.method === "POST") {
      const d = gate();
      if (d) return d;
      return await saveBecfg(request, env, backends.length);
    }

    // ---- 修改前端登录密码 /setpass ----
    if (u.pathname === "/setpass" && request.method === "POST") {
      const d = gate();
      if (d) return d;
      if (envAdmin)
        return J(
          {
            ok: false,
            msg: "前端已由 ADMIN env 固定密码，不可修改",
          },
          400,
        );
      let body;
      try {
        body = await request.json();
      } catch (_) {
        body = null;
      }
      const pwd = body && typeof body.password === "string" ? body.password : "";
      if (pwd.length < 4)
        return J(
          {
            ok: false,
            msg: "密码至少 4 位",
          },
          400,
        );
      if (!env.K || typeof env.K.put !== "function")
        return J(
          {
            ok: false,
            msg: "前端未绑定 KV，无法保存密码",
          },
          500,
        );
      await env.K.put("admin", pwd);
      const h = setAuthCookie(
        new Headers({
          "content-type": "application/json; charset=utf-8",
        }),
        pwd,
      );
      return new Response(
        JSON.stringify({
          ok: true,
          msg: "前端登录密码已更新",
        }),
        {
          status: 200,
          headers: h,
        },
      );
    }

    // ---- 重置：转发后端清配置 → 再清前端登录密码与登录态（一键回到「设置管理密码」页）----
    // 后端 /api/reset 只删它自己 KV 的 config，并下发一个早已废弃的 luma_auth 清 cookie
    // （对当前架构无效）；而前端登录密码在前端 KV 的 admin 键、登录态是前端 cookie cfn_auth，
    // 后端都碰不到 —— 因此必须在这里把这两样一并清掉，否则「重置」后仍是登录态。
    if (entryPath && u.pathname === entryPath + "/api/reset" && request.method === "POST") {
      const d = gate();
      if (d) return d;
      try {
        await proxyFailover(request, backends, becfg.sel, u.pathname, u.search, entry, env, becfg.multi && becfg.balance);
      } catch (_) {}
      try {
        if (env.K && typeof env.K.delete === "function") await env.K.delete("admin");
      } catch (_) {}
      const rh = new Headers({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      clearAuthCookie(rh);
      return new Response(
        JSON.stringify({
          ok: true,
          msg: "已重置：后端配置与前端登录密码均已清除，请重新设置密码",
        }),
        {
          status: 200,
          headers: rh,
        },
      );
    }

    // 到这里还没配后端：非入口页给提示页（入口页展示面板，可在面板里添加后端）
    if (!backends.length) return P(HINT);

    // Download and preview use this authenticated JSON endpoint, so aggregate
    // its body as well as the public subscription URLs.
    if (becfg.multi && entryPath && u.pathname === entryPath + "/api/sub") {
      const denied = gate();
      if (denied) return denied;
      const format = aggregateFormat(u.searchParams.get("fmt"), request.headers.get("User-Agent"));
      if (format && (request.method === "GET" || request.method === "HEAD")) {
        const response = await aggregateSub(backends, format, u.search, u.hostname, entry, env);
        const body = await response.text();
        if (!response.ok) return J({ ok: false, msg: body }, response.status);
        return J({
          ok: true,
          type: format === "singbox" ? "application/json" : "text/yaml",
          body,
          nodeCount: subscriptionNodeCount(body, format),
          backendCount: Number(response.headers.get("X-CFNext-Backend-Count")),
          backendTotal: Number(response.headers.get("X-CFNext-Backend-Total")),
        });
      }
    }

    // ---- 聚合订阅端点 ----
    if (u.pathname.startsWith("/aggregate/sub/")) {
      const m = u.pathname.match(/^\/aggregate\/sub(?:\/([^/]+))?\/?$/);
      if (m) {
        const format = aggregateFormat(m[1] || u.searchParams.get("fmt"), request.headers.get("User-Agent"));
        return await aggregateSub(backends, format || m[1] || "clash", u.search, u.hostname, entry, env);
      }
    }

    // ---- 多后端聚合与均衡：订阅路径改走聚合 ----
    if (becfg.multi) {
      const sm = u.pathname.match(/^\/[^/]+\/sub(?:\/([^/]+))?\/?$/);
      const format = sm && aggregateFormat(sm[1] || u.searchParams.get("fmt"), request.headers.get("User-Agent"));
      if (format) return await aggregateSub(backends, format, u.search, u.hostname, entry, env);
    }

    // ---- 面板页（<entry>）在上面的登录闸门里已返回，这里不再重复；----
    // ---- 其余（/sub/*、/crules/* 等）转发后端 ----
    // 例外：<entry>/api/* 是面板的配置读写接口，必须带登录态（订阅 /sub/* 保持公开）
    if (entryPath && u.pathname.startsWith(entryPath + "/api/")) {
      const d = gate();
      if (d) return d;
    }
    try {
      return await proxyFailover(request, backends, becfg.sel, u.pathname, u.search, entry, env, becfg.multi && becfg.balance);
    } catch (e) {
      return new Response("backend unreachable: " + ((e && e.message) || e), {
        status: 502,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }
  },
};
const MULTI_QUOTA_CARD = `<div class="card" id="mq-card">
  <h3><span class="tick"></span>多账号配额监控 <span class="sub" id="mq-summary">加载中…</span></h3>
  <p class="hint">每个 Cloudflare 账号单独检查 Workers + Pages 请求量，同账号的项目共用额度。前端账号也单独列出，不把各账号额度合并。每天北京时间 08:00 重置，统计存在延迟。</p>
  <div class="inrow" style="margin-bottom:16px;flex-wrap:wrap">
    <button class="btn sm" id="mq-add">添加账号</button>
    <button class="btn primary sm" id="mq-save">保存账号设置</button>
    <button class="btn sm" id="mq-check-all">检查全部账号</button>
  </div>
  <div id="mq-message" class="hint" role="status" aria-live="polite"></div>
  <div id="mq-accounts"></div>
  <p class="hint">令牌需要 Account Analytics 读取权限，仅保存在前端服务端，页面不回显。留空保留原令牌。关联后端达到切换阈值时，新连接会选择其它可用后端；前端额度耗尽仍会影响统一入口。自动检查间隔 15 分钟，429 单独退避，不影响其它账号。</p>
</div>
`;
const MULTI_QUOTA_SCRIPT = `<script>
(function () {
  'use strict';
  var accounts = [], dirty = false, legacyRefresh = window.refreshQuota, legacyDb = window.updDbQuota;
  var list = document.getElementById('mq-accounts'), message = document.getElementById('mq-message');
  function el(tag, text, cls) { var e=document.createElement(tag); if(text!=null)e.textContent=text; if(cls)e.className=cls; return e; }
  function input(label, key, value, type, parent) {
    var field=el('div',null,'field'), caption=el('label',label), box=el('input');
    box.type=type||'text'; box.value=value==null?'':String(value); box.dataset.key=key;
    box.setAttribute('aria-label', label); box.autocomplete=key==='token'?'new-password':'off';
    if(key==='token')box.placeholder='已保存，留空保留；新账号请填入';
    field.append(caption,box); parent.appendChild(field); return box;
  }
  function collect() {
    return Array.from(list.children).map(function(card){
      var o={}; card.querySelectorAll('[data-key]').forEach(function(box){o[box.dataset.key]=box.value.trim();});
      o.backends=o.backends.split(/[\\n,]+/).map(function(x){return x.trim();}).filter(Boolean);
      o.limit=Number(o.limit); o.threshold=Number(o.threshold); return o;
    });
  }
  function result(card, data) {
    var output=card.querySelector('[data-result]'); output.replaceChildren();
    if(!data){output.textContent='尚未检查';return;}
    if(data.error){var error=el('div',(data.stale?'缓存数据 · ':'检查失败 · ')+data.error);error.style.color='var(--err)';output.appendChild(error);}
    if(data.requests!=null){
      output.appendChild(el('div','已用 '+Number(data.requests).toLocaleString()+' / '+Number(data.limit).toLocaleString()+' 次（'+data.percent+'%） · 剩余 '+Number(data.remaining).toLocaleString()+' 次'));
      output.appendChild(el('div','Workers '+Number(data.workers||0).toLocaleString()+' · Pages '+Number(data.pages||0).toLocaleString()+' · 更新 '+new Date(data.updatedAt).toLocaleString()));
      var bar=el('progress');bar.max=100;bar.value=Math.min(100,data.percent||0);bar.style.cssText='width:100%;height:10px;margin-top:8px';bar.setAttribute('aria-label','已用额度');output.appendChild(bar);
    }
    if(data.requests==null&&!data.error)output.textContent='尚无可用统计';
  }
  function summary() {
    var failed=accounts.filter(function(a){return a.usage&&a.usage.error;}).length;
    var checked=accounts.filter(function(a){return a.usage&&a.usage.requests!=null;}).length;
    document.getElementById('mq-summary').textContent=accounts.length+' 个账号 · '+checked+' 已检查'+(failed?' · '+failed+' 查询异常':'');
    if(accounts.length){
      var old=document.getElementById('qQuotaSub');if(old)old.closest('.card').style.display='none';
      var db=document.getElementById('dbSub');if(db)db.textContent='多账号 '+accounts.length+' 个 · '+failed+' 异常';
      var wrap=document.getElementById('dbWrap');if(wrap)wrap.style.display='none';
    }
  }
  function render() {
    list.replaceChildren();
    accounts.forEach(function(a,index){
      var card=el('div',null,'mq-account');card.style.cssText='border:1px solid var(--border,var(--bd));border-radius:12px;padding:16px;margin-top:14px';card.dataset.id=a.id||'';
      var heading=el('h3',a.name||'新账号');card.appendChild(heading);
      var grid=el('div',null,'grid2');
      input('账号名称','name',a.name,'text',grid);input('账户 ID','id',a.id,'text',grid);
      input('API 令牌','token',a.token||'','password',grid);input('每日请求额度','limit',a.limit||100000,'number',grid);
      input('切换阈值（%）','threshold',a.threshold??80,'number',grid);input('关联后端完整域名（逗号分隔，前端账号留空）','backends',(a.backends||[]).join(','),'text',grid);card.appendChild(grid);
      var row=el('div',null,'inrow'), check=el('button','检查此账号','btn sm'), remove=el('button','移除账号','btn sm');
      check.onclick=function(){checkAccounts(a.id,check);};
      remove.onclick=function(){accounts=collect();accounts.splice(index,1);dirty=true;render();message.textContent='账号已移除，点击“保存账号设置”后生效';};
      row.append(check,remove);card.appendChild(row);
      var output=el('div',null,'hint');output.dataset.result='';output.style.marginTop='12px';card.appendChild(output);result(card,a.usage);list.appendChild(card);
      card.addEventListener('input',function(){dirty=true;message.textContent='设置已修改，点击“保存账号设置”或底部“保存全部”生效';});
    });summary();
  }
  async function call(path,body) {
    if(!body)path+=(path.indexOf('?')>=0?'&':'?')+'_v='+Date.now();
    var r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
    var j=await r.json();if(!r.ok||j.ok===false)throw new Error(j.msg||('HTTP '+r.status));return j;
  }
  async function load() { var j=await call('/quota-accounts');accounts=j.accounts||[];dirty=false;render(); }
  async function saveQuotaSettings() {
    var submitted = collect();
    var j = await call('/quota-accounts', { accounts: submitted });
    // Use the committed response rather than immediately rereading eventually consistent KV.
    accounts = j.accounts.map(function(account){
      var old = accounts.find(function(previous){return previous.id===account.id;});
      return Object.assign({}, account, {usage:old&&old.usage});
    });
    dirty=false;render();message.textContent=j.msg;return j;
  }
  async function checkAccounts(id,button,automatic) {
    if(dirty){
      if(automatic)return;
      try{await saveQuotaSettings();}catch(error){message.textContent='保存失败：'+error.message;return;}
    }
    if(!accounts.length){message.textContent='请先添加并保存账号';return;}
    if(button)button.disabled=true;
    message.textContent='正在分别检查账号…';
    try{
      var j=await call('/quota-accounts/check', {id:id||'',cached:!!automatic});
      j.results.forEach(function(data){var a=accounts.find(function(x){return x.id===data.id;});if(a)a.usage=data;var card=Array.from(list.children).find(function(x){return x.dataset.id===data.id;});if(card)result(card,data);});
      summary();message.textContent='检查完成：'+j.results.length+' 个账号，'+j.results.filter(function(x){return x.error;}).length+' 个查询异常';
    }catch(error){message.textContent='检查失败：'+error.message;}
    finally{if(button)button.disabled=false;}
  }
  document.getElementById('mq-add').onclick=function(){accounts=collect();accounts.push({name:'',id:'',token:'',limit:100000,threshold:80,backends:[]});dirty=true;render();};
  document.getElementById('mq-save').onclick=async function(){
    var button=this;button.disabled=true;
    try{await saveQuotaSettings();}catch(error){message.textContent='保存失败：'+error.message;}finally{button.disabled=false;}
  };
  document.getElementById('mq-check-all').onclick=function(){checkAccounts('',this);};
  var originalSaveAll=window.saveAll;
  if(typeof originalSaveAll==='function'){
    window.saveAll=function(){
      var self=this,args=arguments;
      if(!dirty)return originalSaveAll.apply(self,args);
      return saveQuotaSettings().then(function(){return originalSaveAll.apply(self,args);})
        .catch(function(error){message.textContent='账号设置保存失败：'+error.message;if(window.toast)window.toast(message.textContent,'err');});
    };
  }

  window.refreshQuota=function(){if(accounts.length)return checkAccounts('',document.getElementById('mq-check-all'),true);return legacyRefresh&&legacyRefresh();};
  window.updDbQuota=function(data){if(accounts.length)return summary();return legacyDb&&legacyDb(data);};
  load().then(function(){return checkAccounts('',null,true);}).catch(function(error){message.textContent='加载失败：'+error.message;});
  setInterval(function(){if(!document.hidden&&!dirty)checkAccounts('',null,true);},15*60*1000);
})();
</script>
`;
function installMultiQuotaPanel(html) {
  const start = html.indexOf('data-view="quota"');
  const at = html.indexOf("</div>", start) + 6;
  if (start >= 0 && at > 5) html = html.slice(0, at) + MULTI_QUOTA_CARD + html.slice(at);
  return html.replace("</body>", MULTI_QUOTA_SCRIPT + "</body>");
}
