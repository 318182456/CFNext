// CFNext 后端 Pages 明文版：固定编码字符串已展开，关键函数已命名，排版未压缩。
// 原作者未提供压缩前变量名；其余局部变量沿用现有名称。
import { connect as connectSocket } from "cloudflare:sockets";
const decodeBase64 = atob,
  proxyAddressPattern = new RegExp("^(socks5|http|https|ss):\\/\\/(.+)$", "i"),
  clientUserAgentPattern = new RegExp("clash|singbox|sing-box|surge|surfboard|loon|quantumult"),
  karingUserAgentPattern = new RegExp("karing", "i"),
  nodeUrlPattern = new RegExp(
    "(?:vless|trojan):\\/\\/[^@\\s/]+@(\\[[0-9a-fA-F:]+\\]|[A-Za-z0-9.-]+)(?::(\\d{1,5}))?",
  ),
  vlessUrlPattern = new RegExp("^vless:\\/\\/"),
  VERSION = "3.0.0",
  DEPLOY_EDITION = "明文版",
  APP_NAME = "CFNext",
  AUTH_COOKIE_NAME = "luma_auth";
function deploymentKind() {
  try {
    return "小说混淆版" === DEPLOY_EDITION ? "novel" : "混淆版" === DEPLOY_EDITION ? "obfuscated" : "plain";
  } catch (t) {
    return "plain";
  }
}
const UPDATE_REPO = "PAICNI/CFNext";
let d = null;
function h(t) {
  const e = String(t || "").match(/(\d+)\.(\d+)\.(\d+)/);
  return e ? [parseInt(e[1], 10), parseInt(e[2], 10), parseInt(e[3], 10)] : null;
}
function f(t, e) {
  const n = h(t),
    r = h(e);
  if (!n || !r) return 0;
  for (let t = 0; t < 3; t++) if (n[t] !== r[t]) return n[t] < r[t] ? -1 : 1;
  return 0;
}
function m(t) {
  const e = t.match(/const\s+VERSION\s*=\s*['"]([^'"]+)['"]/);
  return e ? e[1] : null;
}
const g = "application/octet-stream",
  y = "text/yaml; charset=utf-8",
  w = {
    Tracking: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Tracking.mrs",
      ct: g,
    },
    Advertising: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Advertising.mrs",
      ct: g,
    },
    AWAvenueAds: {
      url: "https://raw.githubusercontent.com/TG-Twilight/AWAvenue-Ads-Rule/main/Filters/AWAvenue-Ads-Rule-Clash.yaml",
      ct: y,
    },
    Direct: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Direct.mrs",
      ct: g,
    },
    Private: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Private.mrs",
      ct: g,
    },
    Download: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Download.mrs",
      ct: g,
    },
    AppleCN: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/AppleCN.mrs",
      ct: g,
    },
    China: {
      url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/ChinaMaxNoIP/ChinaMaxNoIP_No_Resolve.yaml",
      ct: y,
    },
    AI: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/AI.mrs",
      ct: g,
    },
    Telegram: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Telegram.mrs",
      ct: g,
    },
    Twitter: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Twitter.mrs",
      ct: g,
    },
    SocialMedia: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/SocialMedia.mrs",
      ct: g,
    },
    Netflix: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Netflix.mrs",
      ct: g,
    },
    ["YouTube"]: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/YouTube.mrs",
      ct: g,
    },
    Google: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Google.mrs",
      ct: g,
    },
    Microsoft: {
      url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft.yaml",
      ct: y,
    },
    Proxy: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/domain/Proxy.mrs",
      ct: g,
    },
    Spotify: {
      url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/spotify.mrs",
      ct: g,
    },
    TikTok: {
      url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/tiktok.mrs",
      ct: g,
    },
    disney: {
      url: "https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo-ruleset/disney.mrs",
      ct: g,
    },
    github: {
      url: "https://rule.kelee.one/Clash/GitHub.yaml",
      ct: y,
    },
    PrivateIP: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/ip/Private.mrs",
      ct: g,
    },
    TelegramIP: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/ip/Telegram.mrs",
      ct: g,
    },
    ["ProxyIP"]: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/ip/Proxy.mrs",
      ct: g,
    },
    ChinaIP: {
      url: "https://github.com/666OS/rules/raw/release/mihomo/ip/China.mrs",
      ct: g,
    },
  },
  b = new Map(),
  I = new Map();
function P(t, e) {
  return new Response(t, {
    status: 200,
    headers: {
      "Content-Type": e,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
const S = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ],
  v = ["104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "162.158.0.0/15", "188.114.96.0/20"],
  A = [
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
  ],
  U = ["2606:4700::/32", "2400:cb00::/32", "2803:f800::/32", "2a06:98c0::/29", "2c0f:f248::/32"];
let x = A.slice(),
  C = 0;
function V(t) {
  if (!st((t = String(t || "")))) return !1;
  if (t.indexOf(":") >= 0)
    return A.some((e) =>
      (function (t, e) {
        const [n, r] = e.split("/"),
          o = parseInt(r, 10),
          a = (t) => {
            const e = t.indexOf("::");
            let n;
            if (e >= 0) {
              const r = t.slice(0, e).split(":").filter(Boolean),
                o = t
                  .slice(e + 2)
                  .split(":")
                  .filter(Boolean),
                a = 8 - r.length - o.length;
              n = [...r, ...Array(a).fill("0"), ...o];
            } else n = t.split(":");
            return n.map((t) => t.padStart(4, "0"));
          },
          s = (t) => t.map((t) => parseInt(t, 16).toString(2).padStart(16, "0")).join("");
        return s(a(t)).slice(0, o) === s(a(n)).slice(0, o);
      })(t, e),
    );
  const e = t.split(".").map(Number),
    n = ((e[0] << 24) | (e[1] << 16) | (e[2] << 8) | e[3]) >>> 0;
  return lt.some(([t, e]) => n >= t && n <= e);
}
const k = {
    HK: "香港",
    TW: "台湾",
    MO: "澳门",
    JP: "日本",
    SG: "新加坡",
    US: "美国",
    KR: "韩国",
    DE: "德国",
    FR: "法国",
    GB: "英国",
    CA: "加拿大",
    AU: "澳大利亚",
    SE: "瑞典",
    NL: "荷兰",
    FI: "芬兰",
    NO: "挪威",
    DK: "丹麦",
    CH: "瑞士",
    IT: "意大利",
    ES: "西班牙",
    PT: "葡萄牙",
    IE: "爱尔兰",
    BE: "比利时",
    AT: "奥地利",
    PL: "波兰",
    CZ: "捷克",
    RO: "罗马尼亚",
    HU: "匈牙利",
    GR: "希腊",
    RU: "俄罗斯",
    TR: "土耳其",
    UA: "乌克兰",
    IN: "印度",
    TH: "泰国",
    MY: "马来西亚",
    VN: "越南",
    PH: "菲律宾",
    ID: "印尼",
    BR: "巴西",
    MX: "墨西哥",
    AR: "阿根廷",
    CL: "智利",
    ZA: "南非",
    EG: "埃及",
    AE: "阿联酋",
    IL: "以色列",
    NZ: "新西兰",
    KZ: "哈萨克斯坦",
    SA: "沙特",
  },
  T = {};
for (const t in k) T[k[t]] = t;
T["印度尼西亚"] = "ID";
const R = {
    HKG: "香港",
    TPE: "台湾",
    KHH: "台湾",
    TSA: "台湾",
    RMQ: "台湾",
    NRT: "日本",
    KIX: "日本",
    HND: "日本",
    CTS: "日本",
    FUK: "日本",
    SIN: "新加坡",
    ICN: "韩国",
    KUL: "马来西亚",
    BKK: "泰国",
    MNL: "菲律宾",
    SGN: "越南",
    HAN: "越南",
    CGK: "印尼",
    DEL: "印度",
    BOM: "印度",
    MAA: "印度",
    DXB: "阿联酋",
    TLV: "以色列",
    RUH: "沙特",
    JED: "沙特",
    DOH: "卡塔尔",
    FRA: "德国",
    MUC: "德国",
    DUS: "德国",
    HAM: "德国",
    BER: "德国",
    CGN: "德国",
    STR: "德国",
    AMS: "荷兰",
    CDG: "法国",
    MRS: "法国",
    NCE: "法国",
    LHR: "英国",
    LGW: "英国",
    MAN: "英国",
    MAD: "西班牙",
    BCN: "西班牙",
    MXP: "意大利",
    FCO: "意大利",
    PMO: "意大利",
    ZRH: "瑞士",
    GVA: "瑞士",
    VIE: "奥地利",
    WAW: "波兰",
    PRG: "捷克",
    ARN: "瑞典",
    CPH: "丹麦",
    OSL: "挪威",
    HEL: "芬兰",
    DUB: "爱尔兰",
    LIS: "葡萄牙",
    BRU: "比利时",
    BUD: "匈牙利",
    OTP: "罗马尼亚",
    ATH: "希腊",
    IST: "土耳其",
    SVO: "俄罗斯",
    DME: "俄罗斯",
    LED: "俄罗斯",
    JFK: "美国",
    EWR: "美国",
    LAX: "美国",
    SJC: "美国",
    SFO: "美国",
    SEA: "美国",
    ORD: "美国",
    DFW: "美国",
    IAD: "美国",
    ATL: "美国",
    MIA: "美国",
    BOS: "美国",
    DEN: "美国",
    PHX: "美国",
    MSP: "美国",
    DTW: "美国",
    PHL: "美国",
    CLT: "美国",
    LAS: "美国",
    PDX: "美国",
    SLC: "美国",
    SAN: "美国",
    AUS: "美国",
    IAH: "美国",
    MCI: "美国",
    BNA: "美国",
    SMF: "美国",
    RDU: "美国",
    YYZ: "加拿大",
    YVR: "加拿大",
    YUL: "加拿大",
    YOW: "加拿大",
    YYC: "加拿大",
    MEX: "墨西哥",
    GRU: "巴西",
    GIG: "巴西",
    EZE: "阿根廷",
    SCL: "智利",
    SYD: "澳大利亚",
    MEL: "澳大利亚",
    BNE: "澳大利亚",
    PER: "澳大利亚",
    AKL: "新西兰",
    JNB: "南非",
    CAI: "埃及",
    ALA: "哈萨克斯坦",
    ALB: "美国",
    BDL: "美国",
    BHM: "美国",
    BIL: "美国",
    BOI: "美国",
    BUF: "美国",
    BUR: "美国",
    BTV: "美国",
    BWI: "美国",
    CAE: "美国",
    CHA: "美国",
    CLE: "美国",
    CMH: "美国",
    CPR: "美国",
    DAL: "美国",
    DAY: "美国",
    DSM: "美国",
    DTT: "美国",
    ECP: "美国",
    EYW: "美国",
    FLL: "美国",
    GRR: "美国",
    GSP: "美国",
    HIO: "美国",
    HNL: "美国",
    ICT: "美国",
    IND: "美国",
    JAX: "美国",
    LBB: "美国",
    MCO: "美国",
    MDW: "美国",
    MEM: "美国",
    MFE: "美国",
    MFR: "美国",
    MSY: "美国",
    OAK: "美国",
    OKC: "美国",
    OMA: "美国",
    ONT: "美国",
    ORF: "美国",
    PIT: "美国",
    PSC: "美国",
    PVD: "美国",
    RIC: "美国",
    RNO: "美国",
    RSW: "美国",
    SAT: "美国",
    SDF: "美国",
    SNA: "美国",
    STL: "美国",
    SWF: "美国",
    SYR: "美国",
    TPA: "美国",
    TUL: "美国",
    TUS: "美国",
    CTS: "日本",
    FUK: "日本",
    HND: "日本",
    BLR: "印度",
    CMB: "斯里兰卡",
    KWI: "科威特",
    AMM: "约旦",
    BEY: "黎巴嫩",
    NBO: "肯尼亚",
    LOS: "尼日利亚",
    ACC: "加纳",
    CPT: "南非",
    LIM: "秘鲁",
    BOG: "哥伦比亚",
    PTY: "巴拿马",
  },
  N = Object.assign({}, k, R, {
    USA: "美国",
  }),
  M = R,
  Z = [
    "https://bestcf.pages.dev/random-region/HK/100.txt",
    "https://bestcf.pages.dev/random-region/TW/100.txt",
    "https://bestcf.pages.dev/random-region/JP/100.txt",
    "https://bestcf.pages.dev/random-region/SG/100.txt",
    "https://bestcf.pages.dev/random-region/US/100.txt",
    "https://bestcf.pages.dev/random-region/KR/100.txt",
  ].join("\n"),
  H = /random-region\/[A-Z]{2,}\/\d+\.txt/i,
  DEFAULT_CONFIG = {
    uuid: "",
    path: "",
    admin: "",
    login: "",
    adminInit: !1,
    host: "",
    enableVless: !0,
    enableTrojan: !1,
    trojanPassword: "",
    enableXhttp: !1,
    ["alpn"]: "",
    ech: !1,
    echHost: "cloudflare-ech.com",
    echDns: "",
    tlsOnly: !1,
    nodeLimit: !0,
    nodeLimitCount: 300,
    countryLabel: "",
    loadBalance: !0,
    ipv6Mode: "off",
    cpuLimit: !1,
    cfAccountId: "",
    cfApiToken: "",
    quotaAuto: !1,
    quotaStrict: !1,
    tgBotToken: "",
    tgChatID: "",
    homeWan: !1,
    homeWanNodes: [],
    ["proxyIP"]: "",
    outboundProxy: "",
    outboundMode: "",
    ["warpFront"]: "",
    mode: "",
    warpEnable: !1,
    warpConf: "",
    warpEps: "",
    warpName: "",
    masqueEnable: !1,
    masqueConf: "",
    masqueName: "",
    masqueNet: "",
    preferredDomains: `https://bestcf.pages.dev/random-region/HK/100.txt
https://bestcf.pages.dev/random-region/TW/100.txt
https://bestcf.pages.dev/random-region/JP/100.txt
https://bestcf.pages.dev/random-region/SG/100.txt
https://bestcf.pages.dev/random-region/US/100.txt
https://bestcf.pages.dev/random-region/KR/100.txt`,
    preferredIPs: [],
    optimizer: {
      source: "wetest_v4",
      sourceURL: "",
      fallbackPool: "",
      port: 443,
      threads: 5,
      count: 20,
      useCidr: !0,
      fillCount: 0,
      subMode: "",
      subRandomCount: 16,
      subIncludeDefault: !1,
    },
    filter: {
      region: "all",
      ipType: ["IPv4"],
      isp: ["移动", "联通", "电信"],
    },
  },
  W = ["cloudflare.com", "www.cloudflare.com", "speed.cloudflare.com"],
  E = [
    "104.16.128.11",
    "172.67.72.4",
    "104.17.201.77",
    "104.16.66.7",
    "104.16.88.7",
    "104.16.98.7",
    "104.17.2.7",
    "104.17.44.9",
    "104.18.34.34",
    "104.18.7.34",
    "104.19.191.31",
    "104.19.1.1",
    "104.20.15.15",
    "104.20.1.1",
    "104.21.23.1",
    "104.21.2.1",
    "104.24.12.10",
    "104.25.0.1",
    "104.26.1.1",
    "162.159.128.1",
  ],
  D = [
    {
      label: "香港",
      region: "HK",
      url: "https://bestcf.pages.dev/random-region/HK/100.txt",
      count: 12,
    },
    {
      label: "日本",
      region: "JP",
      url: "https://bestcf.pages.dev/random-region/JP/100.txt",
      count: 12,
    },
    {
      label: "美国",
      region: "US",
      url: "https://bestcf.pages.dev/random-region/US/100.txt",
      count: 12,
    },
    {
      label: "新加坡",
      region: "SG",
      url: "https://bestcf.pages.dev/random-region/SG/100.txt",
      count: 12,
    },
    {
      label: "台湾",
      region: "TW",
      url: "https://bestcf.pages.dev/random-region/TW/100.txt",
      count: 12,
    },
  ],
  _ = [
    "104.17.127.180#优选IP-001",
    "104.16.123.96#优选IP-002",
    "104.16.124.96#优选IP-003",
    "104.16.125.96#优选IP-004",
    "104.16.126.96#优选IP-005",
    "104.16.127.96#优选IP-006",
    "104.16.132.229#优选IP-007",
    "104.16.248.248#优选IP-008",
    "104.16.249.249#优选IP-009",
    "162.159.0.1#优选IP-010",
    "188.114.96.1#优选IP-011",
    "104.17.24.252#优选IP-012",
    "188.114.99.52#优选IP-013",
    "162.159.94.229#优选IP-014",
    "162.159.5.175#优选IP-015",
    "104.18.119.34#优选IP-016",
    "104.21.213.24#优选IP-017",
    "104.17.234.5#优选IP-018",
    "104.16.245.187#优选IP-019",
    "172.67.64.211#优选IP-020",
    "172.67.64.12#优选IP-021",
    "104.18.43.224#优选IP-022",
    "104.18.40.93#优选IP-023",
    "104.18.37.92#优选IP-024",
    "104.18.47.234#优选IP-025",
    "104.18.42.54#优选IP-026",
    "172.64.144.49#优选IP-027",
    "172.64.146.15#优选IP-028",
    "104.17.185.207#优选IP-029",
    "104.17.101.139#优选IP-030",
    "162.159.44.215#优选IP-031",
    "162.159.44.214#优选IP-032",
    "104.18.217.109#优选IP-033",
    "172.65.127.225#优选IP-034",
    "104.18.184.243#优选IP-035",
    "162.159.137.205#优选IP-036",
    "172.65.64.7#优选IP-037",
    "104.25.45.44#优选IP-038",
    "104.19.88.253#优选IP-039",
    "162.159.136.73#优选IP-040",
    "104.18.185.40#优选IP-041",
    "104.25.141.168#优选IP-042",
    "104.25.246.123#优选IP-043",
    "104.24.54.254#优选IP-044",
    "104.19.123.4#优选IP-045",
    "188.114.98.144#优选IP-046",
    "188.114.99.18#优选IP-047",
    "104.17.127.106#优选IP-048",
    "162.159.4.175#优选IP-049",
    "104.18.255.187#优选IP-050",
    "172.65.173.221#优选IP-051",
    "104.18.176.111#优选IP-052",
    "104.25.122.6#优选IP-053",
    "188.114.96.116#优选IP-054",
    "104.25.214.211#优选IP-055",
    "104.16.223.195#优选IP-056",
    "104.25.101.186#优选IP-057",
    "172.64.81.44#优选IP-058",
    "104.25.143.238#优选IP-059",
    "188.114.99.114#优选IP-060",
    "104.19.169.53#优选IP-061",
    "104.16.113.211#优选IP-062",
    "104.27.40.81#优选IP-063",
    "188.114.98.91#优选IP-064",
    "162.159.236.5#优选IP-065",
    "104.25.44.144#优选IP-066",
    "162.159.46.167#优选IP-067",
    "104.18.84.180#优选IP-068",
    "104.18.196.199#优选IP-069",
    "104.24.155.234#优选IP-070",
    "162.159.228.244#优选IP-071",
    "162.159.235.27#优选IP-072",
    "104.19.214.25#优选IP-073",
    "104.19.168.107#优选IP-074",
    "104.24.244.237#优选IP-075",
    "104.27.66.179#优选IP-076",
    "104.24.2.253#优选IP-077",
    "104.21.61.179#优选IP-078",
    "104.21.114.216#优选IP-079",
    "188.114.98.53#优选IP-080",
    "172.65.145.187#优选IP-081",
    "188.114.96.255#优选IP-082",
    "104.25.245.147#优选IP-083",
    "172.66.161.31#优选IP-084",
    "104.18.133.24#优选IP-085",
    "188.114.99.155#优选IP-086",
    "172.64.34.109#优选IP-087",
    "172.64.145.202#优选IP-088",
    "104.19.78.30#优选IP-089",
    "104.17.118.180#优选IP-090",
    "104.17.13.179#优选IP-091",
    "172.65.35.169#优选IP-092",
    "104.16.0.133#优选IP-093",
    "104.16.238.98#优选IP-094",
    "104.18.28.140#优选IP-095",
    "104.19.115.243#优选IP-096",
    "104.24.58.243#优选IP-097",
    "104.27.207.36#优选IP-098",
    "104.21.192.230#优选IP-099",
    "104.25.20.146#优选IP-100",
    "104.27.113.151#优选IP-101",
    "104.24.230.144#优选IP-102",
    "172.65.134.100#优选IP-103",
    "188.114.96.94#优选IP-104",
    "104.25.197.107#优选IP-105",
    "104.16.108.18#优选IP-106",
    "172.64.233.36#优选IP-107",
    "172.67.163.14#优选IP-108",
    "104.24.230.213#优选IP-109",
    "104.19.106.1#优选IP-110",
    "104.27.72.4#优选IP-111",
    "104.21.57.47#优选IP-112",
    "172.65.162.213#优选IP-113",
    "172.67.255.83#优选IP-114",
    "172.67.189.246#优选IP-115",
    "162.159.230.149#优选IP-116",
    "162.159.197.16#优选IP-117",
    "172.67.103.87#优选IP-118",
    "162.159.237.243#优选IP-119",
    "104.25.193.135#优选IP-120",
    "104.18.141.27#优选IP-121",
    "172.65.11.191#优选IP-122",
    "104.24.184.158#优选IP-123",
    "188.114.97.52#优选IP-124",
    "104.27.4.144#优选IP-125",
    "104.25.93.154#优选IP-126",
    "172.66.199.166#优选IP-127",
    "172.67.64.94#优选IP-128",
    "104.27.94.231#优选IP-129",
    "104.24.168.96#优选IP-130",
    "104.18.173.224#优选IP-131",
    "172.67.173.89#优选IP-132",
    "104.17.107.217#优选IP-133",
    "188.114.97.91#优选IP-134",
    "104.17.195.184#优选IP-135",
    "162.159.14.18#优选IP-136",
    "172.67.229.44#优选IP-137",
    "104.24.51.58#优选IP-138",
    "104.19.97.238#优选IP-139",
    "104.25.161.217#优选IP-140",
    "104.17.146.117#优选IP-141",
    "172.67.161.136#优选IP-142",
    "104.17.99.0#优选IP-143",
    "104.25.100.203#优选IP-144",
    "104.19.23.222#优选IP-145",
    "188.114.96.141#优选IP-146",
    "104.19.247.23#优选IP-147",
    "104.25.24.66#优选IP-148",
    "104.16.123.26#优选IP-149",
    "104.27.23.242#优选IP-150",
    "104.25.36.200#优选IP-151",
    "104.17.195.133#优选IP-152",
    "104.16.68.175#优选IP-153",
    "188.114.98.19#优选IP-154",
    "104.16.218.231#优选IP-155",
    "104.18.28.48#优选IP-156",
    "162.159.143.225#优选IP-157",
    "162.159.19.201#优选IP-158",
    "104.25.166.112#优选IP-159",
    "104.16.201.45#优选IP-160",
    "104.16.91.33#优选IP-161",
    "172.67.82.86#优选IP-162",
    "104.16.11.246#优选IP-163",
    "188.114.97.61#优选IP-164",
    "104.17.240.245#优选IP-165",
    "172.66.157.150#优选IP-166",
    "104.17.25.173#优选IP-167",
    "104.18.26.28#优选IP-168",
    "104.18.123.15#优选IP-169",
    "104.25.124.155#优选IP-170",
    "188.114.96.64#优选IP-171",
    "104.18.18.214#优选IP-172",
    "104.17.46.187#优选IP-173",
    "104.17.153.58#优选IP-174",
    "188.114.96.89#优选IP-175",
    "172.67.174.143#优选IP-176",
    "104.25.251.220#优选IP-177",
    "104.27.195.79#优选IP-178",
    "162.159.153.10#优选IP-179",
    "104.25.129.238#优选IP-180",
    "172.65.3.67#优选IP-181",
    "172.67.232.109#优选IP-182",
    "104.18.178.193#优选IP-183",
    "104.19.78.144#优选IP-184",
    "104.18.63.107#优选IP-185",
    "104.19.69.150#优选IP-186",
    "104.25.73.92#优选IP-187",
    "172.67.195.152#优选IP-188",
    "172.65.184.114#优选IP-189",
    "172.65.202.216#优选IP-190",
    "172.65.21.190#优选IP-191",
    "104.19.32.220#优选IP-192",
    "104.18.211.8#优选IP-193",
    "104.17.160.131#优选IP-194",
    "162.159.6.39#优选IP-195",
    "162.159.43.223#优选IP-196",
    "104.21.224.5#优选IP-197",
    "104.25.18.216#优选IP-198",
    "162.159.6.246#优选IP-199",
    "104.24.46.127#优选IP-200",
    "104.17.87.46#优选IP-201",
    "188.114.97.80#优选IP-202",
    "188.114.97.108#优选IP-203",
    "162.159.241.11#优选IP-204",
    "188.114.97.0#优选IP-205",
    "188.114.99.14#优选IP-206",
    "104.19.68.127#优选IP-207",
    "162.159.10.45#优选IP-208",
    "104.25.181.74#优选IP-209",
    "104.24.178.200#优选IP-210",
    "188.114.96.164#优选IP-211",
    "104.24.41.240#优选IP-212",
    "104.17.97.72#优选IP-213",
    "104.16.77.112#优选IP-214",
    "104.19.181.118#优选IP-215",
    "172.67.165.245#优选IP-216",
    "104.17.169.109#优选IP-217",
    "172.65.44.103#优选IP-218",
    "188.114.97.63#优选IP-219",
    "172.65.47.182#优选IP-220",
    "104.17.245.237#优选IP-221",
    "162.159.2.86#优选IP-222",
    "188.114.96.151#优选IP-223",
    "172.65.139.108#优选IP-224",
    "172.65.118.105#优选IP-225",
    "104.21.7.133#优选IP-226",
    "162.159.134.174#优选IP-227",
    "104.18.194.107#优选IP-228",
    "188.114.97.21#优选IP-229",
    "162.159.9.18#优选IP-230",
    "104.18.41.168#优选IP-231",
    "162.159.192.111#优选IP-232",
    "162.159.240.54#优选IP-233",
    "104.17.0.4#优选IP-234",
    "104.25.86.143#优选IP-235",
    "104.27.97.130#优选IP-236",
    "172.67.127.122#优选IP-237",
    "104.25.33.126#优选IP-238",
    "104.25.223.90#优选IP-239",
    "104.25.123.130#优选IP-240",
    "172.65.167.52#优选IP-241",
    "172.67.159.243#优选IP-242",
    "104.25.113.22#优选IP-243",
    "188.114.98.27#优选IP-244",
    "162.159.198.200#优选IP-245",
    "104.17.76.49#优选IP-246",
    "104.21.215.255#优选IP-247",
    "172.67.131.200#优选IP-248",
    "162.159.135.234#优选IP-249",
    "172.65.45.102#优选IP-250",
    "172.66.164.60#优选IP-251",
    "162.159.26.248#优选IP-252",
    "162.159.90.82#优选IP-253",
    "172.65.50.167#优选IP-254",
    "162.159.236.19#优选IP-255",
    "104.19.143.220#优选IP-256",
    "104.17.151.244#优选IP-257",
    "104.17.121.245#优选IP-258",
    "104.18.144.168#优选IP-259",
    "162.159.228.231#优选IP-260",
    "104.17.100.40#优选IP-261",
    "104.27.116.114#优选IP-262",
    "162.159.199.220#优选IP-263",
    "104.20.17.160#优选IP-264",
    "104.25.62.39#优选IP-265",
    "104.27.20.220#优选IP-266",
    "172.65.118.85#优选IP-267",
    "104.19.83.33#优选IP-268",
    "188.114.96.238#优选IP-269",
    "162.159.42.67#优选IP-270",
    "104.27.46.114#优选IP-271",
    "104.25.126.144#优选IP-272",
    "104.25.173.14#优选IP-273",
    "104.24.46.107#优选IP-274",
    "104.25.109.0#优选IP-275",
    "162.159.137.71#优选IP-276",
    "104.25.238.28#优选IP-277",
    "104.27.124.239#优选IP-278",
    "104.24.34.149#优选IP-279",
    "104.19.246.234#优选IP-280",
    "162.159.10.243#优选IP-281",
    "104.27.96.232#优选IP-282",
    "172.65.78.200#优选IP-283",
    "104.24.25.178#优选IP-284",
    "104.24.84.86#优选IP-285",
    "104.25.238.237#优选IP-286",
    "104.16.45.249#优选IP-287",
    "104.16.234.241#优选IP-288",
    "104.24.18.62#优选IP-289",
    "172.65.45.248#优选IP-290",
    "104.25.169.144#优选IP-291",
    "104.27.27.106#优选IP-292",
    "162.159.43.85#优选IP-293",
    "172.67.71.106#优选IP-294",
    "162.159.228.164#优选IP-295",
    "104.24.250.89#优选IP-296",
    "104.18.185.26#优选IP-297",
    "104.27.21.175#优选IP-298",
    "104.24.49.39#优选IP-299",
    "172.67.85.54#优选IP-300",
  ],
  L = [
    "cloudflare.182682.xyz",
    "speed.marisalnc.com",
    "freeyx.cloudflare88.eu.org",
    "bestcf.top",
    "cdn.2020111.xyz",
    "cfip.cfcdn.vip",
    "cf.0sm.com",
    "cf.090227.xyz",
    "cf.zhetengsha.eu.org",
    "cloudflare.9jy.cc",
    "cf.zerone-cdn.pp.ua",
    "cfip.1323123.xyz",
    "cnamefuckxxs.yuchen.icu",
    "cloudflare-ip.mofashi.ltd",
    "115155.xyz",
    "cname.xirancdn.us",
    "f3058171cad.002404.xyz",
    "8.889288.xyz",
    "cdn.tzpro.xyz",
    "cf.877771.xyz",
    "xn--b6gac.eu.org",
    "bestcf.030101.xyz",
    "cdns.doon.eu.org",
    "fn.130519.xyz",
    "saas.sin.fan",
  ].join("\n"),
  G = new Set([80, 8080, 8880, 2052, 2082, 2086, 2095]),
  J = {
    wetest_v4: {
      label: "微测网 IPv4",
      url: "https://www.wetest.vip/page/cloudflare/address_v4.html",
    },
    wetest_v6: {
      label: "微测网 IPv6",
      url: "https://www.wetest.vip/page/cloudflare/address_v6.html",
    },
    ["bestcf"]: {
      label: "优选 IP 列表",
      url: "https://cf.090227.xyz/ip.164746.xyz",
    },
    hostmonit: {
      label: "HostMonit 优选",
      url: "https://stock.hostmonit.com/CloudFlareYes",
    },
    wetest_cname: {
      label: "微测网 优选域名",
      url: "https://www.wetest.vip/page/cloudflare/cname.html",
    },
  },
  textEncoder = new TextEncoder(),
  textDecoder = new TextDecoder(),
  j = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5,
    9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6,
    10, 15, 21, 6, 10, 15, 21,
  ],
  $ = [
    3614090360, 3905402710, 606105819, 3250441966, 4118548399, 1200080426, 2821735955, 4249261313, 1770035416,
    2336552879, 4294925233, 2304563134, 1804603682, 4254626195, 2792965006, 1236535329, 4129170786,
    3225465664, 643717713, 3921069994, 3593408605, 38016083, 3634488961, 3889429448, 568446438, 3275163606,
    4107603335, 1163531501, 2850285829, 4243563512, 1735328473, 2368359562, 4294588738, 2272392833,
    1839030562, 4259657740, 2763975236, 1272893353, 4139469664, 3200236656, 681279174, 3936430074, 3572445317,
    76029189, 3654602809, 3873151461, 530742520, 3299628645, 4096336452, 1126891415, 2878612391, 4237533241,
    1700485571, 2399980690, 4293915773, 2240044497, 1873313359, 4264355552, 2734768916, 1309151649,
    4149444226, 3174756917, 718787259, 3951481745,
  ];
function X(t, e) {
  return ((t << e) | (t >>> (32 - e))) >>> 0;
}
function Q(t) {
  const e = textEncoder.encode(String(t)),
    n = 8 * e.length,
    r = (1 + ((e.length + 8) >> 6)) << 6,
    o = new Uint8Array(r);
  (o.set(e), (o[e.length] = 128));
  const a = new DataView(o.buffer);
  (a.setUint32(r - 8, n >>> 0, !0), a.setUint32(r - 4, Math.floor(n / 4294967296), !0));
  let s = 1732584193,
    i = 4023233417,
    c = 2562383102,
    l = 271733878;
  for (let t = 0; t < r; t += 64) {
    const e = new Uint32Array(16);
    for (let n = 0; n < 16; n++) e[n] = a.getUint32(t + 4 * n, !0);
    let n = s,
      r = i,
      o = c,
      u = l;
    for (let t = 0; t < 64; t++) {
      let a, s;
      t < 16
        ? ((a = (r & o) | (~r & u)), (s = t))
        : t < 32
          ? ((a = (u & r) | (~u & o)), (s = (5 * t + 1) % 16))
          : t < 48
            ? ((a = r ^ o ^ u), (s = (3 * t + 5) % 16))
            : ((a = o ^ (r | ~u)), (s = (7 * t) % 16));
      const i = (n + a + $[t] + e[s]) >>> 0;
      ((n = u), (u = o), (o = r), (r = (r + X(i, j[t])) >>> 0));
    }
    ((s = (s + n) >>> 0), (i = (i + r) >>> 0), (c = (c + o) >>> 0), (l = (l + u) >>> 0));
  }
  let u = "";
  for (const t of [s, i, c, l])
    ((u += (255 & t).toString(16).padStart(2, "0")),
      (u += ((t >>> 8) & 255).toString(16).padStart(2, "0")),
      (u += ((t >>> 16) & 255).toString(16).padStart(2, "0")),
      (u += ((t >>> 24) & 255).toString(16).padStart(2, "0")));
  return u;
}
function F(t, e = 443) {
  if (!(t = String(t || "").trim()))
    return {
      host: "",
      port: e,
    };
  if (t.startsWith("[")) {
    const n = t.match(/^\[([^\]]+)\](?::(\d+))?$/);
    return {
      host: n ? n[1] : t.replace(/^\[|\]$/g, ""),
      port: n && n[2] ? parseInt(n[2]) : e,
    };
  }
  const n = t.lastIndexOf(":");
  return n > 0 && /^\d+$/.test(t.slice(n + 1))
    ? {
        host: t.slice(0, n),
        port: parseInt(t.slice(n + 1)),
      }
    : {
        host: t,
        port: e,
      };
}
async function B(t) {
  let e = null,
    n = "";
  for (const r of ["https://www.vpngate.net/api/iphone/", "http://www.vpngate.net/api/iphone/"])
    try {
      const t = await fetch(r, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/plain",
        },
        cf: {
          cacheTtl: 1800,
          cacheEverything: !0,
        },
        signal: AbortSignal.timeout(8e3),
      });
      if (!t || !t.ok) {
        e = new Error("HTTP " + (t && t.status));
        continue;
      }
      if (((n = await t.text()), n && n.length)) break;
    } catch (t) {
      e = t;
    }
  if (!n) throw e || new Error("VPN Gate 节点源没有返回内容");
  const r = [];
  return (
    String(n)
      .split(/\r?\n/)
      .forEach((e) => {
        if (!(e = e.trim()) || e.startsWith("#")) return;
        const n = e.split(",");
        if (n.length < 15) return;
        const o = (n[0] || "").trim(),
          a = (n[1] || "").trim();
        if (0 === o.toLowerCase().indexOf("public-vpn")) return;
        if (0 === a.indexOf("219.100.37.")) return;
        const s = (function (t) {
          for (let e = t.length - 1; e >= Math.max(3, t.length - 3); e--) {
            const n = (t[e] || "").trim();
            if (n && !(n.length < 100))
              try {
                const t = atob(n.slice(0, 600));
                if (
                  "string" == typeof t &&
                  t.length > 10 &&
                  (t.indexOf("client") >= 0 ||
                    t.indexOf("remote") >= 0 ||
                    t.indexOf("dev ") >= 0 ||
                    t.indexOf("OpenVPN") >= 0 ||
                    t.indexOf("PacketiX") >= 0)
                )
                  return n;
              } catch (t) {}
          }
          return "";
        })(n);
        if (!a || !s) return;
        const i = (n[6] || "").trim().toUpperCase();
        (t && i !== String(t).trim().toUpperCase()) ||
          r.push({
            host: o,
            ip: a,
            speed: parseInt(n[4]) || 0,
            ping: parseInt(n[5]) || 0,
            country: i,
            ovpnB64: s,
          });
      }),
    r.sort((t, e) => (e.speed || 0) - (t.speed || 0)),
    r
  );
}
function K(t) {
  try {
    const e = atob(String(t || "").trim());
    return "string" == typeof e && e.indexOf("BEGIN") >= 0 ? e : "";
  } catch (t) {
    return "";
  }
}
function q(t) {
  const e = (e) => {
      const n = String(t || "").match(new RegExp("<" + e + ">([\\s\\S]*?)<\\/" + e + ">", "i"));
      return n ? n[1].trim() : "";
    },
    n = {};
  return (
    String(t || "")
      .split(/\r?\n/)
      .forEach((t) => {
        const e = t.trim().match(/^(cipher|auth|dev|comp-lzo|key-direction|remote|port|proto|verb)\s+(.+)$/i);
        e && (n[e[1].toLowerCase()] = e[2].trim());
      }),
    {
      ca: e("ca"),
      cert: e("cert"),
      key: e("key"),
      tlsAuth: e("tls-auth"),
      tlsCrypt: e("tls-crypt"),
      cipher: n.cipher || "",
      auth: n.auth || "",
      keyDirection: n["key-direction"] || "",
      remote: n.remote || "",
      proto: n.proto || "",
    }
  );
}
let tt = "",
  et = 0;
function nt() {
  const t = new Date().toISOString().slice(0, 10);
  return (t !== tt && ((tt = t), (et = 0)), !(et >= 300 || (et++, 0)));
}
async function rt(t, e) {
  try {
    if (!t.K || "function" != typeof t.K.get) return null;
    const n = await t.K.get("hwcache");
    if (!n) return null;
    const r = JSON.parse(n);
    if (r && r.t && 2 === r.v && Array.isArray(r.nodes) && r.nodes.length && (e || Date.now() - r.t < 18e5))
      return r.nodes;
  } catch (t) {}
  return null;
}
function ot(t) {
  return Array.isArray(t) && t.length
    ? t.filter((t) => t && "udp" !== String(t.proto || "").toLowerCase())
    : t;
}
async function at(t, n, r) {
  if (!n.homeWan) return [];
  const o = (function (t) {
    try {
      const n = {
        ca: "ca",
        cert: "cert",
        key: "key",
        "tls-auth": "tlsAuth",
        "tls-crypt": "tlsCrypt",
      };
      let r = {
          ca: "",
          cert: "",
          key: "",
          tlsAuth: "",
          tlsCrypt: "",
        },
        o = null,
        a = [];
      const s = [],
        i = function () {
          o && ((r[o] = a.join("\n")), (o = null), (a = []));
        },
        c = function (t, n, r, o, a) {
          return a && a.ca
            ? {
                server: String(t || ""),
                port: Number(n) || 1194,
                proto: r,
                country: String(o || "XX")
                  .toUpperCase()
                  .slice(0, 2),
                ca: a.ca || "",
                cert: a.cert || "",
                key: a.key || "",
                tlsAuth: a.tlsAuth || "",
                tlsCrypt: a.tlsCrypt || "",
                cipher: a.cipher || "AES-128-GCM",
                auth: a.auth || "SHA1",
              }
            : null;
        };
      return (
        String(t || "")
          .split(/\r?\n/)
          .forEach(function (t) {
            const e = String(t || "").trim(),
              l = /^(ca|cert|key|tls-auth|tls-crypt)\s*[:=]\s*(.*)$/i.exec(e);
            if (l) return (i(), (o = n[l[1].toLowerCase()]), void (l[2] && a.push(l[2])));
            if (o && (/^-{3,}/.test(e) || /^[A-Za-z0-9+/=\s]{16,}$/.test(e))) return void a.push(e);
            if ((i(), !e || "#" === e.charAt(0))) return;
            let u = "",
              p = e;
            const d = /^([A-Za-z]{2})\s*[:|]\s*([\s\S]+)$/.exec(e);
            d && ((u = d[1].toUpperCase()), (p = d[2].trim()));
            const h = p.replace(/\s+/g, "");
            if (h.length >= 200 && /^[A-Za-z0-9+/=]+$/.test(h)) {
              try {
                const t = q(atob(h)),
                  e = String(t.remote || "").split(/\s+/),
                  n = c(
                    e[0] || "",
                    parseInt(e[1], 10) || 1194,
                    "udp" === String(t.proto || "").toLowerCase() ? "udp" : "tcp",
                    u,
                    t,
                  );
                n && s.push(n);
              } catch (t) {}
              return;
            }
            const f = p.split(/[\s:]+/).filter(Boolean);
            if (!f.length) return;
            const m = c(
              f[0],
              parseInt(f[1], 10) || 1194,
              /udp/i.test(f[2] || "") ? "udp" : "tcp",
              f[3] || u || "XX",
              r,
            );
            m && s.push(m);
          }),
        i(),
        s
      );
    } catch (t) {
      return [];
    }
  })(n && n.hwCfg);
  if (o.length) return o;
  let a = null;
  if ((r || (a = ot(await rt(t))), a && a.length && a.length >= 30)) return a;
  let s = [];
  try {
    ((s = ot(
      (await B("")).map((t) =>
        (function (t) {
          const n = q("string" == typeof t.ovpn ? t.ovpn : K(t.ovpnB64)),
            r = String(n.remote || "").split(/\s+/),
            o = parseInt(r[1], 10) || 443,
            a = "udp" === String(n.proto || "").toLowerCase() ? "udp" : "tcp";
          return {
            server: t.ip,
            port: o,
            proto: a,
            country: t.country,
            ca: n.ca || "",
            cert: n.cert || "",
            key: n.key || "",
            tlsAuth: n.tlsAuth || "",
            tlsCrypt: n.tlsCrypt || "",
            cipher: n.cipher || "AES-128-GCM",
            auth: n.auth || "SHA1",
          };
        })(t),
      ),
    ).slice(0, 100)),
      s.length || (s = []));
  } catch (t) {}
  if (s.length)
    return (
      await (async function (t, e) {
        try {
          if (!t.K || "function" != typeof t.K.put) return;
          if (!nt()) return;
          await t.K.put(
            "hwcache",
            JSON.stringify({
              t: Date.now(),
              v: 2,
              nodes: e,
            }),
          );
        } catch (t) {}
      })(t, s),
      s
    );
  if (a && a.length) return a;
  const i = ot(await rt(t, !0));
  return i && i.length ? i : [];
}
function st(t) {
  if (!(t = String(t || "").trim())) return !1;
  const e = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (e) return e.slice(1).every((t) => Number(t) <= 255);
  if (!/^[0-9a-fA-F:]+$/.test(t)) return !1;
  if ((t.match(/::/g) || []).length > 1) return !1;
  const n = t.includes("::"),
    r = t.replace(/::/g, ":").split(":").filter(Boolean);
  return (
    !(!n && 8 !== r.length) &&
    (!n || !(r.length < 1 || r.length > 7)) &&
    r.every((t) => /^[0-9a-fA-F]{1,4}$/.test(t))
  );
}
function it(t) {
  const e = [];
  for (let n = 0; n < 16; n += 2) e.push(((t[n] << 8) | t[n + 1]).toString(16));
  let n = -1,
    r = 0,
    o = -1,
    a = 0;
  for (let t = 0; t < 8; t++)
    "0" === e[t] ? (o < 0 ? ((o = t), (a = 1)) : a++, a > r && ((r = a), (n = o))) : ((o = -1), (a = 0));
  if (r >= 2) {
    const t = e.slice(0, n).join(":");
    return (t ? t + "::" : "::") + e.slice(n + r).join(":");
  }
  return e.join(":");
}
function ct(t) {
  const [e, n] = t.split("/"),
    r = e.split(".").map(Number),
    o = ((r[0] << 24) | (r[1] << 16) | (r[2] << 8) | r[3]) >>> 0,
    a = n >= 32 ? 0 : (4294967295 << (32 - n)) >>> 0;
  return [(o & a) >>> 0, (o | (~a >>> 0)) >>> 0];
}
const lt = S.map(ct),
  ut = new Map();
function pt(t) {
  if (String(t).indexOf(":") >= 0)
    return (function (t) {
      const [e, n] = t.split("/"),
        r = parseInt(n, 10) || 0,
        o = ((t) => {
          const e = t.indexOf("::");
          let n;
          if (e >= 0) {
            const r = t.slice(0, e).split(":").filter(Boolean),
              o = t
                .slice(e + 2)
                .split(":")
                .filter(Boolean),
              a = 8 - r.length - o.length;
            n = [...r, ...Array(a).fill("0"), ...o];
          } else n = t.split(":");
          return n.map((t) => t.padStart(4, "0"));
        })(e).map((t) => parseInt(t, 16));
      let a = 0;
      for (let t = 0; t < 8; t++)
        for (let e = 15; e >= 0; e--) (a >= r && (o[t] |= (Math.random() < 0.5 ? 1 : 0) << e), a++);
      return o.map((t) => t.toString(16)).join(":");
    })(t);
  const [e, n] = (function (t) {
      let e = ut.get(t);
      return (e || ((e = ct(t)), ut.set(t, e)), e);
    })(t),
    r = e + Math.floor(Math.random() * ((n - e) >>> 0));
  return `${(r >>> 24) & 255}.${(r >>> 16) & 255}.${(r >>> 8) & 255}.${255 & r}`;
}
function dt(t) {
  const e = String(t || "")
    .split(".")
    .map((t) => parseInt(t, 10).toString(16).padStart(2, "0"));
  return 4 !== e.length || e.some((t) => "NaN" === t)
    ? null
    : "2606:4700::" + e[0] + e[1] + ":" + e[2] + e[3];
}
function ht(t, e) {
  const n = new Set(),
    r = [];
  let o = 0;
  for (; r.length < e && o++ < 20 * e; ) {
    const e = pt(t[Math.floor(Math.random() * t.length)]);
    n.has(e) || (n.add(e), r.push(e));
  }
  return r;
}
function ft(t) {
  const e = [],
    n = new Set();
  return (
    String(t || "")
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => {
        let r = "";
        if (t.includes("#")) {
          const [e, n] = t.split("#");
          ((t = e), (r = n));
        }
        const { host: o, port: a } = F(t, 443);
        o &&
          st(o) &&
          !n.has(o) &&
          (n.add(o),
          e.push({
            ip: o,
            port: a,
            name: r,
          }));
      }),
    e
  );
}
function mt(t) {
  try {
    const e = atob(String(t).replace(/-/g, "+").replace(/_/g, "/")),
      n = new Uint8Array(e.length);
    for (let t = 0; t < e.length; t++) n[t] = e.charCodeAt(t);
    return new TextDecoder("utf-8").decode(n);
  } catch (t) {
    return null;
  }
}
function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
async function loadBackendConfig(env) {
  const e = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  let n = !1,
    r = !1,
    o = "";
  if (
    (env.U && (e.uuid = o = String(env.U).toLowerCase()),
    (env.D || env.PATH) && (e.path = String(env.D || env.PATH)),
    env.HOST &&
      (e.host = String(env.HOST)
        .replace(/^https?:\/\//, "")
        .split("/")[0]),
    env.PROXYIP && (e.proxyIP = String(env.PROXYIP)),
    (env.S || env.OUTBOUND) && (e.outboundProxy = String(env.S || env.OUTBOUND)),
    ("true" !== env.ECH && "1" !== env.ECH) || (e.ech = !0),
    ("true" !== env.TROJAN && "1" !== env.TROJAN) || (e.enableTrojan = !0),
    env.TROJAN_PASSWORD && (e.trojanPassword = String(env.TROJAN_PASSWORD)),
    env.ALPN && (e.alpn = String(env.ALPN)),
    env.TGTOKEN && (e.tgBotToken = String(env.TGTOKEN)),
    env.TGCHAT && (e.tgChatID = String(env.TGCHAT)),
    env.YX && (e.preferredIPs = ft(env.YX)),
    env.YXURL && (e.optimizer.sourceURL = String(env.YXURL)),
    ("1" !== env.HOME_WAN && "true" !== env.HOME_WAN) || (e.homeWan = !0),
    ("1" !== env.WARP_ENABLE && "true" !== env.WARP_ENABLE) || (e.warpEnable = !0),
    env.WARP_ENDPOINTS && (e.warpEps = String(env.WARP_ENDPOINTS)),
    env.MASQUE_ENDPOINTS && (e.masqueEps = String(env.MASQUE_ENDPOINTS)),
    env.MASQUE_SNI && (e.masqueSni = String(env.MASQUE_SNI)),
    env.K && "function" == typeof env.K.get)
  )
    try {
      const a = await (async function (t) {
        try {
          return await t.K.get("config", {
            cacheTtl: 30,
          });
        } catch (t) {
          return null;
        }
      })(env);
      if (a) {
        const t = JSON.parse(a);
        ((r = !0),
          void 0 !== t.quotaAuto && (n = !0),
          Object.assign(e, t),
          t.optimizer &&
            (e.optimizer = Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG.optimizer)), t.optimizer)),
          t.preferredIPs && Array.isArray(t.preferredIPs) && (e.preferredIPs = t.preferredIPs),
          t.admin && (e.admin = String(t.admin)),
          (e.uuid = t.uuid ? String(t.uuid).toLowerCase() : o));
      }
    } catch (t) {}
  var a;
  return (
    (e.adminInit = !(!e.adminInit && !r)),
    delete e.fragment,
    delete e.fragmentParam,
    (Xe = !1),
    (an = (e.optimizer && e.optimizer.fallbackPool) || ""),
    (e.uuid = String(e.uuid || "").toLowerCase()),
    (a = e.uuid),
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(a || "") ||
      (e.uuid = e.admin
        ? (function (t) {
            const e = Q(String(t || "") + "|" + APP_NAME);
            return [
              e.slice(0, 8),
              e.slice(8, 12),
              "4" + e.slice(13, 16),
              "8" + e.slice(17, 20),
              e.slice(20),
            ].join("-");
          })(e.admin)
        : (function () {
            if (crypto.randomUUID) return crypto.randomUUID();
            const t = crypto.getRandomValues(new Uint8Array(16));
            return (
              (t[6] = (15 & t[6]) | 64),
              (t[8] = (63 & t[8]) | 128),
              [...t]
                .map(
                  (t, e) =>
                    (4 === e || 6 === e || 8 === e || 10 === e ? "-" : "") + t.toString(16).padStart(2, "0"),
                )
                .join("")
            );
          })()),
    delete e.login,
    (e.path = env.D || env.PATH ? String(env.D || env.PATH) : e.uuid),
    Array.isArray(e.preferredIPs) || (e.preferredIPs = ft(e.preferredIPs)),
    n ||
      (Boolean((e.cfAccountId && e.cfApiToken) || (env.CF_ACCOUNT_ID && env.CF_API_TOKEN)) &&
        (e.quotaAuto = !0)),
    e
  );
}
async function saveBackendConfig(env, config) {
  if (!env.K || "function" != typeof env.K.put) return !1;
  const n = JSON.parse(JSON.stringify(config));
  return (n.admin && (n.admin = String(n.admin)), await env.K.put("config", JSON.stringify(n)), !0);
}
let bt = null,
  It = 0;
const DAILY_REQUEST_LIMIT = 1e5;
async function St(t, e) {
  const n = String(t.tgBotToken || "").trim(),
    r = String(t.tgChatID || "").trim();
  if (n && r)
    try {
      await ge(
        "https://api.telegram.org/bot" + n + "/sendMessage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: r,
            text: e,
          }),
        },
        8e3,
      );
    } catch (t) {}
}
const vt = [80, 85, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99];
async function updateQuotaProtection(t, e) {
  try {
    const n = await queryAccountQuota(t, e);
    if (!n || !n.configured || n.error || "number" != typeof n.percent) return;
    const r = Math.floor(n.percent),
      o = new Date().toISOString().slice(0, 10);
    let a = null;
    if (t.K && "function" == typeof t.K.get)
      try {
        a = await t.K.get("tgnote");
      } catch (t) {}
    let s = {
      day: o,
      level: 0,
    };
    if (a)
      try {
        const t = JSON.parse(a);
        t && t.day && (s = t);
      } catch (t) {}
    const i = s.day !== o;
    if (
      i &&
      ((s = {
        day: o,
        level: 0,
      }),
      e.quotaDisabled)
    ) {
      e.quotaDisabled = !1;
      try {
        await saveBackendConfig(t, e);
      } catch (t) {}
    }
    const l = !(!String(e.tgBotToken || "").trim() || !String(e.tgChatID || "").trim()),
      u = "当日额度 " + n.percent + "%（" + ((n.today && n.today.requests) || 0) + " / " + n.limit + "）";
    let p = i;
    if (r >= 99 && !e.quotaDisabled) {
      e.quotaDisabled = !0;
      try {
        await saveBackendConfig(t, e);
      } catch (t) {}
      (l && (await St(e, "⚠️ " + APP_NAME + " 用量告警：" + u + "。订阅已自动停用，明日自动恢复。")),
        (s.level = 99),
        (p = !0));
    } else if (l && r >= 80 && !e.quotaDisabled) {
      const t = vt.filter((t) => t <= r && t > (s.level || 0)).pop();
      t &&
        (await St(e, "📊 " + APP_NAME + " 用量提醒：" + u + "（提醒阈值 " + t + "%）"),
        (s.level = t),
        (p = !0));
    }
    if (p && t.K && "function" == typeof t.K.put)
      try {
        await t.K.put("tgnote", JSON.stringify(s));
      } catch (t) {}
  } catch (t) {}
}
async function queryAccountQuota(env, config) {
  const n = String(env.CF_ACCOUNT_ID || (config && config.cfAccountId) || "").trim(),
    r = String(env.CF_API_TOKEN || (config && config.cfApiToken) || "").trim();
  if (!n || !r)
    return {
      configured: !1,
    };
  const o = Date.now();
  if (o < It)
    return bt && bt.data
      ? Object.assign({}, bt.data, {
          stale: !0,
          error: "CF API 限流(429)，显示缓存数据（可能滞后）",
        })
      : {
          configured: !0,
          error: "CF API 限流(429)，请 15 分钟后再试",
        };
  if (bt && bt.at && o - bt.at < 3e5) return bt.data;
  try {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0);
    const e = new Date(),
      a = {
        query: `query getBillingMetrics($accountId: string!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject) {
        viewer { accounts(filter:{accountTag:$accountId}) {
          workersInvocationsAdaptive(limit:10000, filter:$filter) { sum { requests subrequests } quantiles { cpuTimeP50 } }
          pagesFunctionsInvocationsAdaptiveGroups(limit:1000, filter:$filter) { sum { requests } }
        } }
      }`,
        variables: {
          accountId: n,
          filter: {
            datetime_geq: t.toISOString(),
            datetime_leq: e.toISOString(),
          },
        },
      },
      s = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + r,
        },
        body: JSON.stringify(a),
        signal: AbortSignal.timeout(8e3),
      });
    if (!s.ok) throw new Error("CF API HTTP " + s.status);
    const i = await s.json();
    if (i.errors && i.errors.length) throw new Error("GraphQL: " + JSON.stringify(i.errors).slice(0, 200));
    const c = (i && i.data && i.data.viewer && i.data.viewer.accounts) || [];
    if (!c.length) throw new Error("未找到账户数据（检查账户 ID 与令牌权限）");
    const l = c[0],
      u = (l.workersInvocationsAdaptive || [])[0] || {},
      p = (l.pagesFunctionsInvocationsAdaptiveGroups || []).reduce(
        (t, e) => t + ((e && e.sum && e.sum.requests) || 0),
        0,
      ),
      d = ((u.sum && u.sum.requests) || 0) + p,
      h = (u.quantiles && u.quantiles.cpuTimeP50) || 0,
      f = (u.sum && u.sum.subrequests) || 0,
      m = Math.round((d / DAILY_REQUEST_LIMIT) * 1e3) / 10,
      g = {
        configured: !0,
        limit: DAILY_REQUEST_LIMIT,
        today: {
          requests: d,
          cpuTime: h,
          subrequests: f,
        },
        percent: m,
        remaining: Math.max(0, DAILY_REQUEST_LIMIT - d),
        updatedAt: e.toISOString(),
      };
    return (
      (bt = {
        at: o,
        data: g,
      }),
      g
    );
  } catch (t) {
    const e = (t && t.message) || String(t);
    return e.indexOf("429") >= 0
      ? ((It = o + 9e5),
        bt && bt.data
          ? Object.assign({}, bt.data, {
              stale: !0,
              error: "CF API 限流(429)，显示缓存数据（可能滞后）",
            })
          : {
              configured: !0,
              error: "CF API 限流(429)，请 15 分钟后再试",
            })
      : {
          configured: !0,
          error: e,
        };
  }
}
function parseVlessHeader(data) {
  if (!data || data.byteLength < 1) throw new Error("VLESS 头部过短");
  const n = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let r = 0;
  if (0 !== n.getUint8(0)) throw new Error("不支持的 VLESS 版本");
  if (((r += 17), r >= data.byteLength)) throw new Error("VLESS 头部过短");
  const o = n.getUint8(r);
  if (((r += 1), (r += o), r + 3 > data.byteLength)) throw new Error("VLESS 头部过短");
  const a = n.getUint8(r);
  r += 1;
  const s = n.getUint16(r);
  r += 2;
  const i = n.getUint8(r);
  r += 1;
  const { addr: c, len: l } = (function (t, e, n, r) {
    if (1 === r)
      return {
        addr: `${e.getUint8(n)}.${e.getUint8(n + 1)}.${e.getUint8(n + 2)}.${e.getUint8(n + 3)}`,
        len: 4,
      };
    if (2 === r) {
      const r = e.getUint8(n),
        o = t.subarray(n + 1, n + 1 + r);
      return {
        addr: textDecoder.decode(o),
        len: 1 + r,
      };
    }
    if (3 === r)
      return {
        addr: it(t.subarray(n, n + 16)),
        len: 16,
      };
    throw new Error("无法识别的地址类型");
  })(data, n, r, i);
  return (
    (r += l),
    {
      command: a,
      port: s,
      addr: c,
      headerLength: r,
      earlyData: data.subarray(r),
    }
  );
}
const Ct = [
  1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080,
  310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
  264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808,
  3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
  1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817,
  3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
  1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
  3329325298,
];
let Vt = "",
  kt = "";
function hashTrojanPassword(password) {
  return (
    password !== Vt &&
      ((Vt = password),
      (kt = (function (t) {
        const e = textEncoder.encode(String(t)),
          n = 8 * e.length,
          r = (1 + ((e.length + 8) >> 6)) << 6,
          o = new Uint8Array(r);
        (o.set(e), (o[e.length] = 128));
        const a = new DataView(o.buffer);
        (a.setUint32(r - 8, Math.floor(n / 4294967296), !1), a.setUint32(r - 4, n >>> 0, !1));
        let s = 3238371032,
          i = 914150663,
          c = 812702999,
          l = 4144912697,
          u = 4290775857,
          p = 1750603025,
          d = 1694076839,
          h = 3204075428;
        const f = (t, e) => (t >>> e) | (t << (32 - e));
        for (let t = 0; t < r; t += 64) {
          const e = new Uint32Array(64);
          for (let n = 0; n < 16; n++) e[n] = a.getUint32(t + 4 * n, !1);
          for (let t = 16; t < 64; t++) {
            const n = f(e[t - 15], 7) ^ f(e[t - 15], 18) ^ (e[t - 15] >>> 3),
              r = f(e[t - 2], 17) ^ f(e[t - 2], 19) ^ (e[t - 2] >>> 10);
            e[t] = (e[t - 16] + n + e[t - 7] + r) >>> 0;
          }
          let n = s,
            r = i,
            o = c,
            m = l,
            g = u,
            y = p,
            w = d,
            b = h;
          for (let t = 0; t < 64; t++) {
            const a = (b + (f(g, 6) ^ f(g, 11) ^ f(g, 25)) + ((g & y) ^ (~g & w)) + Ct[t] + e[t]) >>> 0,
              s = (n & r) ^ (n & o) ^ (r & o);
            ((b = w),
              (w = y),
              (y = g),
              (g = (m + a) >>> 0),
              (m = o),
              (o = r),
              (r = n),
              (n = (a + (((f(n, 2) ^ f(n, 13) ^ f(n, 22)) + s) >>> 0)) >>> 0));
          }
          ((s = (s + n) >>> 0),
            (i = (i + r) >>> 0),
            (c = (c + o) >>> 0),
            (l = (l + m) >>> 0),
            (u = (u + g) >>> 0),
            (p = (p + y) >>> 0),
            (d = (d + w) >>> 0),
            (h = (h + b) >>> 0));
        }
        let m = "";
        for (const t of [s, i, c, l, u, p, d])
          ((m += ((t >>> 24) & 255).toString(16).padStart(2, "0")),
            (m += ((t >>> 16) & 255).toString(16).padStart(2, "0")),
            (m += ((t >>> 8) & 255).toString(16).padStart(2, "0")),
            (m += (255 & t).toString(16).padStart(2, "0")));
        return m;
      })(password))),
    kt
  );
}
const Rt = [
  "https://doh.pub/dns-query",
  "https://dns.alidns.com/resolve",
  "https://1.1.1.1/dns-query",
  "https://8.8.8.8/dns-query",
  "https://dns.google/dns-query",
  "https://cloudflare-dns.com/dns-query",
];
function Nt(t) {
  const e = String(t).split("::"),
    n = e[0] ? e[0].split(":").filter(Boolean) : [],
    r = e[1] ? e[1].split(":").filter(Boolean) : [],
    o = [...n, ...Array(Math.max(0, 8 - n.length - r.length)).fill("0"), ...r],
    a = new Uint8Array(16);
  return (
    o.forEach((t, e) => {
      const n = parseInt(t, 16) || 0;
      ((a[2 * e] = (n >> 8) & 255), (a[2 * e + 1] = 255 & n));
    }),
    a
  );
}
async function Mt(e, n, r) {
  const o = connectSocket({
    hostname: e,
    port: n,
  });
  try {
    await (function (t, e) {
      return Promise.race([
        t,
        new Promise((t, n) => setTimeout(() => n(new Error("连接超时（SYN 被静默丢弃）")), e || 6e3)),
      ]);
    })(o.opened, r || 6e3);
  } catch (t) {
    try {
      o.close();
    } catch (t) {}
    throw t;
  }
  return o;
}
async function Zt(t, e) {
  return Mt(t.hostname, t.port, e || 6e3);
}
function Ht(t) {
  const e = t instanceof Uint8Array ? t : new Uint8Array(t),
    n = e.length,
    r = 8 * n,
    o = new Uint8Array((1 + ((n + 8) >> 6)) << 6);
  (o.set(e), (o[n] = 128));
  const a = new DataView(o.buffer);
  (a.setUint32(o.length - 8, Math.floor(r / 4294967296), !1), a.setUint32(o.length - 4, r >>> 0, !1));
  let s = 1732584193,
    i = 4023233417,
    c = 2562383102,
    l = 271733878,
    u = 3285377520;
  const p = new Uint32Array(80);
  for (let t = 0; t < o.length; t += 64) {
    for (let e = 0; e < 16; e++) p[e] = a.getUint32(t + 4 * e, !1);
    for (let t = 16; t < 80; t++) p[t] = X(p[t - 3] ^ p[t - 8] ^ p[t - 14] ^ p[t - 16], 1);
    let e = s,
      n = i,
      r = c,
      o = l,
      d = u;
    for (let t = 0; t < 80; t++) {
      let a, s;
      t < 20
        ? ((a = (n & r) | (~n & o)), (s = 1518500249))
        : t < 40
          ? ((a = n ^ r ^ o), (s = 1859775393))
          : t < 60
            ? ((a = (n & r) | (n & o) | (r & o)), (s = 2400959708))
            : ((a = n ^ r ^ o), (s = 3395469782));
      const i = (X(e, 5) + a + d + s + p[t]) >>> 0;
      ((d = o), (o = r), (r = X(n, 30)), (n = e), (e = i));
    }
    ((s = (s + e) >>> 0), (i = (i + n) >>> 0), (c = (c + r) >>> 0), (l = (l + o) >>> 0), (u = (u + d) >>> 0));
  }
  const d = new Uint8Array(20),
    h = new DataView(d.buffer);
  return (
    h.setUint32(0, s, !1),
    h.setUint32(4, i, !1),
    h.setUint32(8, c, !1),
    h.setUint32(12, l, !1),
    h.setUint32(16, u, !1),
    d
  );
}
function Ot(t, e) {
  let n = t;
  n.length > 64 && (n = Ht(n));
  const r = new Uint8Array(64),
    o = new Uint8Array(64);
  for (let t = 0; t < 64; t++)
    ((r[t] = 54 ^ (t < n.length ? n[t] : 0)), (o[t] = 92 ^ (t < n.length ? n[t] : 0)));
  return Ht(Jt(o, Ht(Jt(r, e))));
}
function Wt(t, e, n) {
  const r = Ot(e && e.length ? e : new Uint8Array(20), t);
  let o = new Uint8Array(0),
    a = new Uint8Array(0);
  for (let t = 1; a.length < n; t++) {
    const e = new Uint8Array([t]);
    ((o = Ot(r, Jt(Jt(o, textEncoder.encode("ss-subkey")), e))), (a = Jt(a, o)));
  }
  return a.slice(0, n);
}
function Et(t, e, n) {
  const r = new Uint32Array(16);
  ((r[0] = 1634760805), (r[1] = 857760878), (r[2] = 2036477234), (r[3] = 1797285236));
  const o = new DataView(t.buffer, t.byteOffset, 32);
  for (let t = 0; t < 8; t++) r[4 + t] = o.getUint32(4 * t, !0);
  r[12] = e >>> 0;
  const a = new DataView(n.buffer, n.byteOffset, 12);
  ((r[13] = a.getUint32(0, !0)), (r[14] = a.getUint32(4, !0)), (r[15] = a.getUint32(8, !0)));
  const s = r.slice(),
    i = (t, e, n, r) => {
      ((s[t] = (s[t] + s[e]) >>> 0),
        (s[r] = X(s[r] ^ s[t], 16)),
        (s[n] = (s[n] + s[r]) >>> 0),
        (s[e] = X(s[e] ^ s[n], 12)),
        (s[t] = (s[t] + s[e]) >>> 0),
        (s[r] = X(s[r] ^ s[t], 8)),
        (s[n] = (s[n] + s[r]) >>> 0),
        (s[e] = X(s[e] ^ s[n], 7)));
    };
  for (let t = 0; t < 10; t++)
    (i(0, 4, 8, 12),
      i(1, 5, 9, 13),
      i(2, 6, 10, 14),
      i(3, 7, 11, 15),
      i(0, 5, 10, 15),
      i(1, 6, 11, 12),
      i(2, 7, 8, 13),
      i(3, 4, 9, 14));
  const c = new Uint8Array(64),
    l = new DataView(c.buffer);
  for (let t = 0; t < 16; t++) ((s[t] = (s[t] + r[t]) >>> 0), l.setUint32(4 * t, s[t], !0));
  return c;
}
function Dt(t, e, n, r) {
  const o = r.slice(),
    a = Math.ceil(r.length / 64);
  for (let r = 0; r < a; r++) {
    const a = Et(t, n + r, e),
      s = 64 * r,
      i = Math.min(64, o.length - s);
    for (let t = 0; t < i; t++) o[s + t] ^= a[t];
  }
  return o;
}
function _t(t, e) {
  let n = 0n,
    r = 0n;
  for (let e = 0; e < 16; e++)
    ((n |= BigInt(t[e]) << BigInt(8 * e)), (r |= BigInt(t[16 + e]) << BigInt(8 * e)));
  n &= 0x0ffffffc0ffffffc0ffffffc0fffffffn;
  let o = 0n;
  const a = (1n << 130n) - 5n;
  for (let t = 0; t < e.length; t += 16) {
    let r = 1n;
    for (let n = Math.min(16, e.length - t) - 1; n >= 0; n--) r = (r << 8n) | BigInt(e[t + n]);
    o = ((o + r) * n) % a;
  }
  o = (o + r) & ((1n << 128n) - 1n);
  const s = new Uint8Array(16);
  for (let t = 0; t < 16; t++) s[t] = Number((o >> BigInt(8 * t)) & 0xffn);
  return s;
}
async function Lt(t, n) {
  const r = new Uint8Array(12),
    o = () => {
      const t = r.slice();
      for (let e = 11; e >= 0 && (t[e]++, 0 === t[e]); e--);
      return t;
    };
  if ("CHACHA20-POLY1305" === t)
    return {
      seal: (t) =>
        (function (t, e, n) {
          const r = new Uint8Array(0),
            o = Dt(t, e, 0, new Uint8Array(32)),
            a = Dt(t, e, 1, n),
            s = (t) => new Uint8Array((16 - (t % 16)) % 16),
            i = (t) => {
              const e = new Uint8Array(8),
                n = new DataView(e.buffer);
              return (n.setUint32(0, t >>> 0, !0), n.setUint32(4, Math.floor(t / 4294967296), !0), e);
            },
            c = Jt(r, Jt(s(r.length), Jt(a, Jt(s(a.length), Jt(i(r.length), i(a.length))))));
          return Jt(a, _t(o, c));
        })(n, o(), t),
      open(t) {
        const e = (function (t, e, n) {
          if (n.length < 16) throw new Error("SS AEAD 数据过短");
          const r = n.subarray(0, n.length - 16),
            o = n.subarray(n.length - 16),
            a = new Uint8Array(0),
            s = (t) => new Uint8Array((16 - (t % 16)) % 16),
            i = (t) => {
              const e = new Uint8Array(8),
                n = new DataView(e.buffer);
              return (n.setUint32(0, t >>> 0, !0), n.setUint32(4, Math.floor(t / 4294967296), !0), e);
            },
            c = _t(
              Dt(t, e, 0, new Uint8Array(32)),
              Jt(a, Jt(s(a.length), Jt(r, Jt(s(r.length), Jt(i(a.length), i(r.length)))))),
            );
          let l = 0;
          for (let t = 0; t < 16; t++) l |= c[t] ^ o[t];
          return 0 !== l ? null : Dt(t, e, 1, r);
        })(n, o(), t);
        if (!e) throw new Error("SS AEAD 解密失败（密码/加密方式与服务器不匹配）");
        return e;
      },
    };
  const a = await crypto.subtle.importKey(
    "raw",
    n,
    {
      name: t,
    },
    !1,
    ["encrypt", "decrypt"],
  );
  return {
    seal: async (e) =>
      new Uint8Array(
        await crypto.subtle.encrypt(
          {
            name: t,
            iv: o(),
          },
          a,
          e,
        ),
      ),
    async open(e) {
      try {
        return new Uint8Array(
          await crypto.subtle.decrypt(
            {
              name: t,
              iv: o(),
            },
            a,
            e,
          ),
        );
      } catch (t) {
        throw new Error("SS AEAD 解密失败（密码/加密方式与服务器不匹配）");
      }
    },
  };
}
async function Gt(t, e) {
  const n = new Uint8Array([(e.length >> 8) & 255, 255 & e.length]);
  return Jt(await t.seal(n), await t.seal(e));
}
function Jt(t, e) {
  const n = new Uint8Array(t.length + e.length);
  return (n.set(t, 0), n.set(e, t.length), n);
}
function Yt(t, e) {
  t: for (let n = 0; n <= t.length - e.length; n++) {
    for (let r = 0; r < e.length; r++) if (t[n + r] !== e[r]) continue t;
    return n;
  }
  return -1;
}
const zt = "cmliussss.net",
  jt = {
    HK: "proxyip.hk." + zt,
    US: "proxyip.us." + zt,
    SG: "proxyip.sg." + zt,
    JP: "proxyip.jp." + zt,
    KR: "proxyip.kr." + zt,
    DE: "proxyip.de." + zt,
    SE: "proxyip.se." + zt,
    NL: "proxyip.nl." + zt,
    FI: "proxyip.fi." + zt,
    GB: "proxyip.gb." + zt,
    Oracle: "proxyip.oracle." + zt,
    DigitalOcean: "proxyip.digitalocean." + zt,
    Vultr: "proxyip.vultr." + zt,
    Multacom: "proxyip.multacom." + zt,
  },
  $t = (() => {
    const t = Object.create(null),
      e = (e, n) => {
        for (const r of [].concat(n)) t[r] = e;
      };
    return (
      e("HK", "HKG"),
      e("AU", ["SYD", "MEL", "BNE", "PER", "ADL", "CBR"]),
      e("SG", "SIN"),
      e("JP", ["NRT", "HND", "KIX", "TYO", "OSA", "NGO", "CTS", "FUK", "OKA"]),
      e("KR", ["ICN", "SEL", "PUS"]),
      e("DE", [
        "FRA",
        "MUC",
        "DUS",
        "BER",
        "HAM",
        "STR",
        "VIE",
        "ZRH",
        "CDG",
        "MAD",
        "MXP",
        "FCO",
        "PRG",
        "WAW",
      ]),
      e("SE", "ARN"),
      e("NL", "AMS"),
      e("FI", "HEL"),
      e("GB", ["LHR", "LGW", "MAN", "EDI"]),
      e("US", [
        "LAX",
        "SJC",
        "SFO",
        "SEA",
        "PDX",
        "SAN",
        "LAS",
        "PHX",
        "SLC",
        "DEN",
        "DFW",
        "IAH",
        "AUS",
        "ORD",
        "MSP",
        "DTW",
        "STL",
        "MCI",
        "ATL",
        "MIA",
        "MCO",
        "BNA",
        "CLT",
        "IAD",
        "BOS",
        "EWR",
        "JFK",
        "PHL",
        "YYZ",
        "YVR",
        "YUL",
        "MEX",
        "GRU",
      ]),
      e("TW", ["TPE", "KHH", "TSA", "RMQ"]),
      t
    );
  })(),
  Xt = (t) => {
    const e = String(t || "").toUpperCase();
    return e ? ($t[e] ? $t[e] : /^[A-Z]{2}$/.test(e) ? e : "US") : "US";
  },
  Qt = new Map(),
  Ft = new Map();
async function Bt(t, n) {
  if (((n = n || 443), st(t)))
    return [
      {
        hostname: t,
        port: n,
      },
    ];
  const r = t + ":" + n,
    o = Date.now(),
    a = Ft.get(r);
  if (a && o - a.t < 3e5) return a.ips;
  const s = [
      "https://cloudflare-dns.com/dns-query",
      "https://dns.alidns.com/resolve",
      "https://doh.pub/dns-query",
    ],
    i = async (e, n) => {
      for (const r of s)
        try {
          const o = await ge(
            r + "?name=" + encodeURIComponent(t) + "&type=" + e,
            {
              headers: {
                accept: "application/dns-json",
              },
            },
            4e3,
          );
          if (!o || !o.ok) continue;
          return ((await o.json()).Answer || []).filter((t) => t.type === n).map((t) => t.data);
        } catch (t) {}
      return [];
    },
    c = await i("TXT", 16);
  let l = [];
  for (const t of c) {
    const r = String(t).replace(/^"|"$/g, "").replace(/\\010/g, ",").replace(/\n/g, ",").trim();
    if (!r) continue;
    if ("@edtunnel" === r) break;
    const o = r
        .split(/[,;\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      a = [];
    for (const t of o) {
      const { host: e, port: r } = F(t, n);
      st(e) &&
        a.push({
          hostname: e,
          port: r,
        });
    }
    if (a.length) {
      l = a;
      break;
    }
  }
  (l.length ||
    (l = (await i("A", 1))
      .filter((t) => /^\d+\.\d+\.\d+\.\d+$/.test(t))
      .map((t) => ({
        hostname: t,
        port: n,
      }))),
    l.length ||
      (l = (await i("AAAA", 28))
        .filter((t) => st(t))
        .map((t) => ({
          hostname: t,
          port: n,
        }))));
  const u = new Set(),
    p = l.filter((t) => {
      const e = t.hostname + ":" + t.port;
      return !u.has(e) && (u.add(e), !0);
    });
  return (
    p.length &&
      Ft.set(r, {
        t: o,
        ips: p,
      }),
    p
  );
}
async function Kt(t) {
  if (!t || !t.length) return null;
  let e = !1;
  return await new Promise((n) => {
    let r = t.length;
    const o = (t) => {
      if ((r--, t)) {
        if (e)
          try {
            t.close();
          } catch (t) {}
        else ((e = !0), n(t));
      } else r <= 0 && !e && n(null);
    };
    for (const e of t)
      Promise.resolve()
        .then(e)
        .then(
          (t) => o(t && t.readable ? t : null),
          () => o(null),
        );
  });
}
async function qt(t, e, n) {
  let r = null;
  const o = (t) => {
      if (t && t !== r)
        try {
          t.close();
        } catch (t) {}
    },
    a = t
      ? Promise.resolve()
          .then(t)
          .then(
            (t) => (t && t.readable ? t : null),
            () => null,
          )
      : Promise.resolve(null),
    s =
      e && e.length
        ? Kt(e).then(
            (t) => (t && t.readable ? t : null),
            () => null,
          )
        : Promise.resolve(null);
  let i = null;
  const c = await Promise.race([
    a,
    new Promise((t) => {
      i = setTimeout(() => t("__GRACE__"), n);
    }),
  ]);
  if ((i && (clearTimeout(i), (i = null)), c && "__GRACE__" !== c)) return ((r = c), s.then(o), r);
  // Keep racing after the direct grace period. A slow fallback must not block
  // a direct connection that has already opened. Kt closes the losing sockets.
  return Kt([() => a, () => s]);
}
function te(t) {
  return !t || t.byteLength < 3 ? "unknown" : 22 === t[0] && 3 === t[1] ? "tls" : "nontls";
}
async function openOutboundConnection(target, config, o, a, s) {
  const i = (function (t) {
      if (!t) return null;
      let r = "socks5",
        o = String(t).trim();
      const a = o.match(proxyAddressPattern);
      if ((a && ((r = a[1].toLowerCase()), (o = a[2])), "ss" === r))
        return (function (t) {
          let e = t,
            n = "";
          const r = t.indexOf("#");
          r >= 0 && (e = t.slice(0, r));
          const o = e.lastIndexOf("@");
          if (o >= 0) ((n = e.slice(0, o)), (e = e.slice(o + 1)));
          else {
            const t = mt(e);
            if (t && t.includes("@")) {
              const r = t.lastIndexOf("@");
              ((n = t.slice(0, r)), (e = t.slice(r + 1)));
            }
          }
          let a = "",
            s = "";
          if (n) {
            let e = mt(n) || n;
            try {
              e = decodeURIComponent(e);
            } catch (t) {}
            const r = e.indexOf(":");
            r > 0 ? ((a = e.slice(0, r)), (s = e.slice(r + 1))) : (a = e);
          }
          const { host: i, port: c } = F(e, 8388);
          return {
            type: "ss",
            host: i,
            port: c,
            method: a,
            password: s,
          };
        })(o);
      let s = "",
        i = "";
      if (o.includes("@")) {
        const [t, e] = o.split("@"),
          n = (t) => {
            try {
              return decodeURIComponent(t);
            } catch (e) {
              return t;
            }
          },
          r = t.indexOf(":");
        (r >= 0 ? ((s = n(t.slice(0, r))), (i = n(t.slice(r + 1)))) : (s = n(t)), (o = e));
      }
      const c = "http" === r ? 80 : "https" === r ? 443 : 1080,
        { host: l, port: u } = F(o, c);
      return {
        type: r,
        host: l,
        port: u,
        user: s,
        pass: i,
      };
    })(config.outboundProxy),
    c = config.outboundMode || "",
    l = "nontls" !== s,
    u = i
      ? "http" === i.type || "https" === i.type
        ? (t) =>
            (async function (t, n) {
              const r = await Mt(t.host, t.port, 6e3),
                o = r.writable.getWriter(),
                a = r.readable.getReader();
              let s = "";
              t.user &&
                (s =
                  "Proxy-Authorization: Basic " +
                  (function (t) {
                    let e = "";
                    for (let n = 0; n < t.length; n += 32768)
                      e += String.fromCharCode(...t.subarray(n, n + 32768));
                    return btoa(e);
                  })(textEncoder.encode(`${t.user}:${t.pass}`)) +
                  "\r\n");
              const i = `${"CONNECT"} ${n.hostname}:${n.port} HTTP/1.1\r\nHost: ${n.hostname}:${n.port}\r\n${s}\r\n`;
              await o.write(textEncoder.encode(i));
              const { head: c, leftover: l } = await (async function (t) {
                let e = new Uint8Array(0);
                for (; e.length < 65536; ) {
                  const { done: n, value: r } = await t.read();
                  if (n) break;
                  e = Jt(e, r);
                  const o = Yt(e, [13, 10, 13, 10]);
                  if (o >= 0)
                    return {
                      head: textDecoder.decode(e.subarray(0, o)),
                      leftover: e.subarray(o + 4),
                    };
                }
                return {
                  head: textDecoder.decode(e),
                  leftover: new Uint8Array(0),
                };
              })(a);
              if (!/^HTTP\/\d\.\d\s+2\d\d/i.test(c)) throw new Error("CONNECT 失败: " + c.split("\r\n")[0]);
              return (l && l.byteLength > 0 && (r._preamble = l), o.releaseLock(), a.releaseLock(), r);
            })(i, t)
        : "ss" === i.type
          ? (t) =>
              (async function (t) {
                const n = (function (t) {
                  const n = String(t || "")
                    .toLowerCase()
                    .replace(/_/g, "-");
                  return "aes-128-gcm" === n || "aes-128gcm" === n
                    ? {
                        name: "AES-GCM",
                        keyLen: 16,
                      }
                    : "aes-256-gcm" === n || "aes-256gcm" === n
                      ? {
                          name: "AES-GCM",
                          keyLen: 32,
                        }
                      : "chacha20-ietf-poly1305" === n ||
                          "chacha20-poly1305" === n ||
                          "chacha20poly1305" === n
                        ? {
                            name: "CHACHA20-POLY1305",
                            keyLen: 32,
                          }
                        : null;
                })(t.method);
                if (!n) throw new Error("不支持的 SS 加密方式: " + (t.method || "（未指定）"));
                if (!t.password) throw new Error("SS 出站缺少密码");
                const r = await Mt(t.host, t.port, 6e3),
                  o = r.writable.getWriter(),
                  a = r.readable.getReader();
                let s = new Uint8Array(0);
                const i = async (t) => {
                    for (; s.length < t; ) {
                      const { done: t, value: e } = await a.read();
                      if (t) throw new Error("SS 连接被关闭");
                      s = Jt(s, e);
                    }
                    const e = s.slice(0, t);
                    return ((s = s.subarray(t)), e);
                  },
                  c = new Uint8Array(await crypto.subtle.digest("SHA-256", textEncoder.encode(t.password))),
                  l = crypto.getRandomValues(new Uint8Array(16)),
                  u = await Lt(n.name, await Wt(c, l, n.keyLen));
                return (
                  await o.write(l),
                  await o.write(await Gt(u, new Uint8Array(0))),
                  {
                    readable: new ReadableStream({
                      async start(t) {
                        try {
                          const e = await i(16),
                            r = await Lt(n.name, await Wt(c, e, n.keyLen));
                          for (;;) {
                            const e = await r.open(await i(18)),
                              n = (e[0] << 8) | e[1];
                            if (n > 16384) throw new Error("SS 分片长度非法 " + n);
                            const o = await r.open(await i(n + 16));
                            n > 0 && t.enqueue(o);
                          }
                        } catch (e) {
                          try {
                            t.error(e);
                          } catch (t) {}
                        }
                      },
                    }),
                    writable: new WritableStream({
                      async write(t) {
                        const e = t instanceof Uint8Array ? t : new Uint8Array(t);
                        for (let t = 0; t < e.length; t += 16384)
                          await o.write(await Gt(u, e.subarray(t, Math.min(e.length, t + 16384))));
                      },
                      close() {
                        try {
                          o.close();
                        } catch (t) {}
                      },
                      abort() {
                        try {
                          o.abort();
                        } catch (t) {}
                      },
                    }),
                    close() {
                      try {
                        r.close();
                      } catch (t) {}
                    },
                  }
                );
              })(i)
          : (t) =>
              (async function (t, n) {
                const r = await Mt(t.host, t.port, 6e3),
                  o = r.writable.getWriter(),
                  a = r.readable.getReader();
                let s = new Uint8Array(0);
                const i = async (t) => {
                    for (; s.length < t; ) {
                      const { done: t, value: e } = await a.read();
                      if (t) throw new Error("连接被关闭");
                      s = Jt(s, e);
                    }
                    const e = s.slice(0, t);
                    return ((s = s.subarray(t)), e);
                  },
                  c = t.user ? [5, 2, 0, 2] : [5, 1, 0];
                await o.write(new Uint8Array(c));
                const l = await i(2);
                if (5 !== l[0] || 255 === l[1]) throw new Error("SOCKS5 握手失败");
                if (2 === l[1]) {
                  if (!t.user) throw new Error("SOCKS5 服务器要求认证但未提供凭据");
                  const n = textEncoder.encode(t.user),
                    r = textEncoder.encode(t.pass),
                    a = new Uint8Array([1, n.length, ...n, r.length, ...r]);
                  if ((await o.write(a), 0 !== (await i(2))[1])) throw new Error("SOCKS5 认证失败");
                } else if (0 !== l[1]) throw new Error("SOCKS5 不支持的认证方法 " + l[1]);
                const u = textEncoder.encode(n.hostname);
                let p;
                ((p = /^\d+\.\d+\.\d+\.\d+$/.test(n.hostname)
                  ? new Uint8Array([
                      5,
                      1,
                      0,
                      1,
                      ...n.hostname.split(".").map(Number),
                      (n.port >> 8) & 255,
                      255 & n.port,
                    ])
                  : new Uint8Array([5, 1, 0, 3, u.length, ...u, (n.port >> 8) & 255, 255 & n.port])),
                  await o.write(p));
                const d = await i(4);
                if (0 !== d[1]) throw new Error("SOCKS5 连接失败 码" + d[1]);
                if (1 === d[3]) await i(6);
                else if (3 === d[3]) {
                  const t = (await i(1))[0];
                  await i(t + 2);
                } else 4 === d[3] && (await i(18));
                return (s.byteLength > 0 && (r._preamble = s), o.releaseLock(), a.releaseLock(), r);
              })(i, t)
      : null;
  let p;
  const d = async (t) => {
      try {
        const e = await t();
        if (e) return e;
      } catch (t) {
        p = t;
      }
      return null;
    },
    h = () => {
      throw p || new Error("所有出站方式均失败");
    },
    f = config.proxyIP
      ? ((t) => {
          const e = String(t || "").trim();
          if (!e) return [];
          const n = Qt.get(e);
          if (n) return n;
          const r = [];
          for (const t of e.split(/[,;\n\r]+/)) {
            let e = t.trim();
            if (!e) continue;
            let n = "";
            const o = /^([A-Za-z]{2})\.(.+)$/.exec(e);
            if ((o && st(F(o[2], 443).host) && ((n = o[1].toUpperCase()), (e = o[2])), !n)) {
              const t = /^(.+)#([A-Za-z]{2})$/.exec(e);
              t && ((n = t[2].toUpperCase()), (e = t[1]));
            }
            const a = F(e, 443);
            if (a.host) {
              if (!n && !st(a.host))
                for (const t of a.host.toUpperCase().split(/[^A-Z0-9]+/))
                  if (/^[A-Z]{2}$/.test(t) && "IP" !== t && "CF" !== t) {
                    n = t;
                    break;
                  }
              r.push({
                host: a.host,
                port: a.port,
                cc: n,
              });
            }
          }
          return (Qt.size > 32 && Qt.clear(), Qt.set(e, r), r);
        })(config.proxyIP)
      : [],
    m = Xt(o),
    g = String(o || "").toUpperCase(),
    y = [];
  if (f.length && l) {
    for (const t of f) !t.cc || (t.cc !== m && t.cc !== g) || y.push(t);
    for (const t of f) t.cc || y.push(t);
    y.length || y.push(f[0]);
    for (const t of y.slice(0, 3)) {
      const e = await d(async () => {
        let e = [];
        try {
          e = await Bt(t.host, t.port);
        } catch (t) {}
        e.length ||
          (e = [
            {
              hostname: t.host,
              port: t.port,
            },
          ]);
        const n = await Kt(e.slice(0, 4).map((t) => () => d(() => Zt(t, 4e3))));
        if (n) return n;
      });
      if (e) return e;
    }
  }
  const w = {
      hostname: target.addr,
      port: target.port,
    },
    b = () => {
      if (!l) return [];
      const t = Xt(o);
      return [t, ...Object.keys(jt).filter((e) => e !== t)].slice(0, 2).map((t, e) => async () => {
        const n = jt[t];
        if (!n) return null;
        let r = [];
        try {
          r = await Bt(n, 443);
        } catch (t) {
          return null;
        }
        if (!r.length) return null;
        const o = r.slice(0, 0 === e ? 2 : 1);
        return await Kt(o.map((t) => () => d(() => Zt(t, 4e3))));
      });
    },
    I = () => d(() => Zt(w, 4e3)),
    P = u ? () => d(() => u(w)) : null,
    S = V(target.addr) ? 0 : 300,
    v = () => qt(I, b().slice(0, 3), S);
  if ("only" === c && P) return (await P()) || (await qt(null, b().slice(0, 4), 0)) || h();
  if ("" === c && P) return (await P()) || (await v()) || h();
  const A = await v();
  if (A) return A;
  if (P) {
    const t = await P();
    if (t) return t;
  }
  return h();
}
function ne(t) {
  const e = t instanceof Uint8Array ? t : new Uint8Array(t);
  try {
    return new TextDecoder("utf-8", {
      fatal: !0,
    }).decode(e);
  } catch (t) {}
  try {
    return new TextDecoder("gbk").decode(e);
  } catch (t) {}
  return new TextDecoder().decode(e);
}
function re(t) {
  const e = new Set(),
    n = [],
    r = (t, r, o) => {
      st(t) &&
        (e.has(t) ||
          (e.add(t),
          n.push({
            ip: t,
            port: r || 443,
            name: o || "",
          })));
    };
  ft(t).forEach((t) => r(t.ip, t.port, t.name));
  const o = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\b/g;
  let a;
  for (; (a = o.exec(t)); ) {
    const { host: t, port: e } = F(a[0], 443);
    t && r(t, e, "");
  }
  const s = /[0-9a-fA-F:]+/g;
  for (; (a = s.exec(t)); ) {
    const t = a[0];
    t.includes(":") && t.split(":").length >= 3 && st(t) && r(t, 443, "");
  }
  return n;
}
const oe = {
  t: 0,
  ips: null,
};
async function ae(t) {
  if (((t = Math.max(1, parseInt(t) || 150)), Date.now() - oe.t < 6e5)) return oe.ips;
  const e = await ge(
    "https://stock.hostmonit.com/CloudFlareYes",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    },
    6e3,
  );
  if (e && e.ok) {
    const n = re(await e.text()).filter((t) => t.ip && V(t.ip)),
      r = new Set(),
      o = [];
    for (const e of n) if (!r.has(e.ip) && (r.add(e.ip), o.push(e), o.length >= t)) break;
    return ((oe.t = Date.now()), (oe.ips = o), o);
  }
  return null;
}
async function se(t) {
  const e = [],
    n = {
      preset: 0,
      presetErr: "",
      custom: 0,
      customErr: "",
      cidr: 0,
    },
    r = "custom" === (t = t || {}).source || !!t.sourceURL,
    o = (n) => {
      n &&
        n.ip &&
        (r || V(n.ip)) &&
        e.push({
          ip: n.ip,
          port: n.port || t.port || 443,
          name: n.name || "",
        });
    };
  if (t.source && J[t.source]) {
    const e = await ge(
      J[t.source].url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
      6e3,
    );
    if (e && e.ok) {
      const t = re(await e.text());
      (t.forEach(o), (n.preset = t.length));
    } else n.presetErr = e ? "HTTP " + e.status : "超时/网络错误";
  }
  if (t.sourceURL) {
    const e = ye(t.sourceURL)
      .filter((t) => /^https?:\/\//i.test(t))
      .slice(0, 50);
    if (e.length) {
      const t = await Promise.all(
        e.map(async (t) => {
          try {
            const e = await ge(
              t,
              {
                headers: {
                  "User-Agent": "Mozilla/5.0",
                },
              },
              6e3,
            );
            return e && e.ok
              ? {
                  url: t,
                  arr: re(await e.text()),
                  err: "",
                }
              : {
                  url: t,
                  arr: [],
                  err: e ? "HTTP " + e.status : "超时/网络错误",
                };
          } catch (e) {
            return {
              url: t,
              arr: [],
              err: (e && e.message) || String(e),
            };
          }
        }),
      );
      let r = 0;
      const a = [];
      for (const e of t)
        e.err
          ? a.push(e.url.replace(/^https?:\/\//, "").slice(0, 40) + " → " + e.err)
          : (e.arr.forEach(o), (n.custom += e.arr.length), r++);
      a.length && (n.customErr = (r ? "部分源失败: " : "") + a.join("；"));
    } else n.customErr = "未提供有效 URL（多个用换行或分号隔开）";
  }
  const a = new Set(),
    s = [];
  for (const t of e) a.has(t.ip) || (a.add(t.ip), s.push(t));
  if (s.length < (t.count || 20)) {
    let e = (t.count || 20) - s.length;
    try {
      const n = await cn();
      for (const r of n) {
        if (e <= 0) break;
        a.has(r.ip) ||
          (V(r.ip) &&
            (a.add(r.ip),
            s.push({
              ip: r.ip,
              port: t.port || r.port || 443,
              name: r.name || "",
            }),
            e--));
      }
    } catch (t) {}
    n.bestcf = (t.count || 20) - s.length - e;
  }
  if (!1 !== t.useCidr && s.length < (t.count || 20)) {
    const e = (t.count || 20) - s.length,
      r = ht(S, 3 * e);
    let o = 0;
    for (const n of r) {
      if (o >= e) break;
      a.has(n) ||
        (a.add(n),
        s.push({
          ip: n,
          port: t.port || 443,
          name: "",
        }),
        o++);
    }
    n.cidr = o;
  }
  return {
    candidates: s,
    stats: n,
  };
}
function ie(e, n, r) {
  return new Promise((o) => {
    const a = Date.now();
    let s,
      i = !1;
    const c = (t, r) => {
        if (!i) {
          ((i = !0), clearTimeout(l));
          try {
            s && s.close();
          } catch (t) {}
          o({
            ip: e,
            port: n,
            ok: t,
            latency: r,
          });
        }
      },
      l = setTimeout(() => c(!1, -1), r);
    try {
      s = connectSocket({
        hostname: e,
        port: n,
      });
    } catch (t) {
      return c(!1, -1);
    }
    s.opened.then(() => c(!0, Date.now() - a)).catch(() => c(!1, -1));
  });
}
function ce(t) {
  return String(t).replace(/%/g, "%25").replace(/#/g, "%23").replace(/\?/g, "%3F").replace(/ /g, "%20");
}
function le(t, e, n, r) {
  return (e ? 1 : 0) + (n ? 1 : 0) + (r ? 1 : 0) <= 1
    ? {
        v: t,
        t: t,
        x: t,
      }
    : {
        v: t,
        t: t + ".T",
        x: t + ".X",
      };
}
function ue(t, n, r, o, a = {}) {
  const s = t.host,
    i = n.includes(":") && !n.startsWith("[") ? `[${n}]` : n,
    c = !G.has(Number(r)),
    l = encodeURIComponent;
  let u = "encryption=none";
  ((u += c ? "&security=tls&sni=" + l(s) + "&fp=chrome" : "&security=none"), (u += "&host=" + l(s)));
  const p = "xhttp" === a.type && c;
  return (
    p
      ? ((u += "&type=xhttp&mode=stream-one"),
        (u +=
          "&extra=" +
          l(
            JSON.stringify(
              (function (t) {
                const e = t.uuid || "";
                return {
                  xPaddingObfsMode: !0,
                  xPaddingMethod: "tokenish",
                  xPaddingPlacement: "queryInHeader",
                  xPaddingHeader: e.slice(1, 7),
                  xPaddingKey: "_" + e.slice(25, 31),
                };
              })(t),
            ),
          )))
      : (u += "&type=ws"),
    (u += "&path=" + l("/" + t.path + (!p && c ? "?ed=2048" : ""))),
    t.alpn &&
      (u +=
        "&alpn=" +
        t.alpn
          .split(",")
          .map((t) => t.trim().replace(/[&#=]/g, ""))
          .filter(Boolean)
          .join(",")),
    t.ech &&
      (u +=
        "&ech=" + l((t.echHost || "cloudflare-ech.com") + "+" + (t.echDns || "https://223.5.5.5/dns-query"))),
    `${"vless"}://${t.uuid}@${i}:${r}?${u}#${ce(o)}`
  );
}
function pe(t, n, r, o) {
  const a = t.host,
    s = n.includes(":") && !n.startsWith("[") ? `[${n}]` : n,
    i = encodeURIComponent,
    c = !G.has(Number(r)),
    l = "/" + t.path + (c ? "?ed=2048" : "");
  let u = c
    ? "security=tls&sni=" + i(a) + "&fp=chrome&host=" + i(a) + "&" + "type=ws" + "&path=" + i(l)
    : "security=none&host=" + i(a) + "&" + "type=ws" + "&path=" + i(l);
  return (
    t.alpn &&
      c &&
      (u +=
        "&alpn=" +
        t.alpn
          .split(",")
          .map((t) => t.trim().replace(/[&#=]/g, ""))
          .filter(Boolean)
          .join(",")),
    t.ech &&
      c &&
      (u +=
        "&ech=" + i((t.echHost || "cloudflare-ech.com") + "+" + (t.echDns || "https://223.5.5.5/dns-query"))),
    `${"trojan"}://${t.trojanPassword || t.uuid}@${s}:${r}?${u}#${ce(o)}`
  );
}
const de = new Map(),
  he = 18e5,
  fe = new Map();
function me(t, e) {
  const n = en;
  if (!(n && n.K && "function" == typeof n.K.put && e && e.length)) return;
  const r = fe.get(t) || 0;
  if (Date.now() - r < he) return;
  if (!nt()) return;
  (fe.size > 200 && fe.clear(), fe.set(t, Date.now()));
  const o = JSON.stringify({
      t: Date.now(),
      ips: e.slice(0, 300),
    }),
    a = n.K.put(t, o, {
      expirationTtl: 1800,
    }).catch(() => {});
  n._ctx && "function" == typeof n._ctx.waitUntil && n._ctx.waitUntil(a);
}
function ge(t, e, n) {
  return new Promise((r) => {
    const o = new AbortController(),
      a = setTimeout(() => o.abort(), n);
    fetch(
      t,
      Object.assign({}, e, {
        signal: o.signal,
      }),
    )
      .then((t) => {
        (clearTimeout(a), r(t));
      })
      .catch(() => {
        (clearTimeout(a), r(null));
      });
  });
}
function ye(t) {
  const e = [];
  let n = "";
  const r = (t) => /^[a-z][a-z0-9+.-]*:\/\//i.test(t),
    o = (t) =>
      /^\[[0-9a-f:]+\](?::\d{1,5})?(?:[?#].*)?$/i.test(t) ||
      /^(?:\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)(?::\d{1,5})?(?:[?#].*)?$/i.test(
        t,
      );
  for (const a of String(t || "").split(/[\n;]+/)) {
    for (const t of a.split(",")) {
      const a = t.trim();
      a &&
        (n
          ? r(a) || o(a)
            ? (e.push(n), (n = a))
            : a.includes("=") || /^[A-Za-z0-9]{1,6}$/.test(a)
              ? (n = n + "," + a)
              : (e.push(n), (n = a))
          : (n = a));
    }
    n && (e.push(n), (n = ""));
  }
  return e;
}
async function we(t, e = 100, n = 300, r = !1, o = !0, s = !1) {
  const i = ye(t).map((t) => t.replace(/^\*\./, "")),
    c = Date.now(),
    l = ["https://cloudflare-dns.com/dns-query", "https://dns.alidns.com/resolve"],
    u = async (t, e, n) => {
      for (const r of l)
        try {
          const o = await ge(
            r + "?name=" + encodeURIComponent(t) + "&type=" + e,
            {
              headers: {
                accept: "application/dns-json",
              },
            },
            4e3,
          );
          if (!o || !o.ok) continue;
          return ((await o.json()).Answer || [])
            .filter(
              (t) =>
                t.type === n &&
                ("A" === e ? /^\d+\.\d+\.\d+\.\d+$/.test(t.data) : /^[0-9a-fA-F:]+$/.test(t.data)),
            )
            .map((t) => t.data);
        } catch (t) {}
      return [];
    },
    p = await Promise.all(
      i.map(async (t) => {
        if (t.includes("://")) {
          if (t.startsWith("sub://")) {
            let e = t.slice(6);
            if (/^[A-Za-z0-9+/=]+$/.test(e) && e.length % 4 == 0)
              try {
                const t = atob(e);
                /^https?:\/\//i.test(t) && (e = t);
              } catch (t) {}
            (/^https?:\/\//i.test(e) || (e = "https://" + e), (t = e));
          }
          const i = "url:" + t + (r ? "|rf" : "") + (o ? "" : "|raw"),
            l = "srccache:" + Q(i).slice(0, 24),
            u = de.get(i);
          if (u && c - u.t < 6e5) return u.ips.slice(0, e);
          const p = await (async function (t) {
            const e = en;
            if (!e || !e.K || "function" != typeof e.K.get) return null;
            try {
              const n = await e.K.get(t);
              if (!n) return null;
              const r = JSON.parse(n);
              return !r || !Array.isArray(r.ips) || !r.ips.length || Date.now() - (r.t || 0) > he
                ? null
                : r.ips;
            } catch (t) {
              return null;
            }
          })(l);
          if (p)
            return (
              de.set(i, {
                t: c,
                ips: p,
              }),
              p.slice(0, e)
            );
          try {
            const u = await ge(t, {}, 6e3);
            if (!u || !u.ok) throw new Error("unreachable");
            let p = ne(await u.arrayBuffer());
            if (/^[A-Za-z0-9+/=\s]{40,}$/.test(p.slice(0, 2e3)) && p.replace(/\s+/g, "").length % 4 == 0)
              try {
                const t = atob(p.replace(/\s+/g, ""));
                p = ne(Uint8Array.from(t, (t) => t.charCodeAt(0)));
              } catch (t) {}
            const d = new Set(),
              h = {},
              f = [],
              m = ((n = t), H.test(String(n || ""))),
              g = (t) => !o || V(t) || m,
              y = p
                .trim()
                .split(/\r?\n/)
                .map((t) => t.trim())
                .filter(Boolean);
            if (y.length > 1 && y[0].includes(",")) {
              const t = y[0].split(",").map((t) => t.trim()),
                n = t.includes("IP地址") && t.includes("端口"),
                r =
                  t.some((t) => t.includes("IP")) &&
                  t.some((t) => t.includes("延迟")) &&
                  t.some((t) => t.includes("下载速度"));
              if (n || r) {
                const n = t.findIndex((t) => t.includes("IP")),
                  r = t.indexOf("端口"),
                  o = t.findIndex((t) => t.includes("延迟")),
                  a = t.findIndex((t) => t.includes("下载速度")),
                  s =
                    t.indexOf("国家") > -1
                      ? t.indexOf("国家")
                      : t.indexOf("城市") > -1
                        ? t.indexOf("城市")
                        : t.indexOf("数据中心"),
                  u = t.indexOf("TLS");
                for (const t of y.slice(1)) {
                  if (f.length >= e) break;
                  const i = t.split(",").map((t) => t.trim());
                  if (-1 !== u && i[u] && "true" !== i[u].toLowerCase()) continue;
                  const c = (i[n] || "").match(/(\[[0-9a-fA-F:]+\]|\d{1,3}(?:\.\d{1,3}){3})/);
                  if (!c) continue;
                  const l = c[1].replace(/^\[|\]$/g, ""),
                    p = -1 !== r && i[r] ? parseInt(i[r]) : 443,
                    y = l + ":" + p;
                  if (d.has(y)) continue;
                  if (!g(l)) continue;
                  d.add(y);
                  let w = -1 !== s && i[s] ? i[s] : "";
                  (w ||
                    -1 === o ||
                    -1 === a ||
                    (w = "CF优选 " + (i[o] || "") + "ms " + (i[a] || "") + "MB/s"),
                    w
                      ? ((h[w] = (h[w] || 0) + 1),
                        f.push({
                          ip: l,
                          port: p,
                          name: w + "-" + String(h[w]).padStart(2, "0"),
                          ...(m
                            ? {
                                relay: !0,
                              }
                            : {}),
                        }))
                      : f.push({
                          ip: l,
                          port: p,
                          name: "",
                          ...(m
                            ? {
                                relay: !0,
                              }
                            : {}),
                        }));
                }
                return (
                  de.set(i, {
                    t: c,
                    ips: f,
                  }),
                  me(l, f),
                  f.slice()
                );
              }
            }
            if (p.includes("<tr") && p.includes("data-label")) {
              for (const t of p.match(/<tr[\s\S]*?<\/tr>/g) || []) {
                if (f.length >= e) break;
                const n = {};
                for (const e of t.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []) {
                  const t = e.match(/data-label="([^"]*)"[^>]*>([\s\S]*?)<\/td>/);
                  t && (n[t[1]] = t[2].replace(/<[^>]+>/g, "").trim());
                }
                const r = (n["优选地址"] || "").match(/(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?/);
                if (!r) continue;
                const o = r[1],
                  a = r[2] ? parseInt(r[2]) : 443,
                  s = o + ":" + a;
                if (d.has(s)) continue;
                if (!g(o)) continue;
                d.add(s);
                const i = (n["线路名称"] || n["数据中心"] || "线路").trim();
                i
                  ? ((h[i] = (h[i] || 0) + 1),
                    f.push({
                      ip: o,
                      port: a,
                      name: i + "-" + String(h[i]).padStart(2, "0"),
                      ...(m
                        ? {
                            relay: !0,
                          }
                        : {}),
                    }))
                  : f.push({
                      ip: o,
                      port: a,
                      name: "",
                      ...(m
                        ? {
                            relay: !0,
                          }
                        : {}),
                    });
              }
              return (
                de.set(i, {
                  t: c,
                  ips: f,
                }),
                me(l, f),
                f.slice()
              );
            }
            for (const t of p.split(/\r?\n/)) {
              if (f.length >= e) break;
              const n = t.match(nodeUrlPattern);
              if (!n) continue;
              const r = n[1].replace(/^\[|\]$/g, ""),
                o = n[2] ? parseInt(n[2]) : 443,
                s = r + ":" + o;
              if (d.has(s)) continue;
              if (!g(r)) continue;
              d.add(s);
              let i = "";
              const c = t.indexOf("#");
              if (c >= 0)
                try {
                  i = decodeURIComponent(t.slice(c + 1).trim());
                } catch (e) {
                  i = t.slice(c + 1).trim();
                }
              i
                ? ((h[i] = (h[i] || 0) + 1),
                  f.push({
                    ip: r,
                    port: o,
                    name: i + "-" + String(h[i]).padStart(2, "0"),
                    ...(m
                      ? {
                          relay: !0,
                        }
                      : {}),
                  }))
                : f.push({
                    ip: r,
                    port: o,
                    name: "",
                    ...(m
                      ? {
                          relay: !0,
                        }
                      : {}),
                  });
            }
            for (const t of p.split(/\r?\n/)) {
              if (f.length >= e) break;
              const n = t.match(/(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?(?:#([^\r\n]*))?/);
              if (!n) {
                const e = t
                  .trim()
                  .match(
                    /^(\*\.)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)(?::(\d{1,5}))?(?:#([^\r\n]*))?$/i,
                  );
                if (!e || e[1]) continue;
                const n = e[2].toLowerCase(),
                  r = e[3] ? parseInt(e[3]) : 443,
                  o = n + ":" + r;
                if (d.has(o)) continue;
                d.add(o);
                const a = (e[4] || "").trim();
                f.push({
                  ip: n,
                  port: r,
                  name: a || n,
                  ...(m
                    ? {
                        relay: !0,
                      }
                    : {}),
                });
                continue;
              }
              const r = n[1],
                o = n[2] ? parseInt(n[2]) : 443,
                a = r + ":" + o;
              if (d.has(a)) continue;
              if (!g(r)) continue;
              d.add(a);
              const s = (n[3] || "").trim();
              if (s && !/[\u4e00-\u9fa5]/.test(s) && !s.includes("|")) {
                f.push({
                  ip: r,
                  port: o,
                  name: s,
                  ...(m
                    ? {
                        relay: !0,
                      }
                    : {}),
                });
                continue;
              }
              let i = "";
              if (n[3]) {
                const t = n[3].match(/^\s*[\u4e00-\u9fa5]{2,5}\s+[A-Z]{2}/);
                if (t) {
                  const e = t[0].match(/[\u4e00-\u9fa5]{2,5}/);
                  e && (i = e[0]);
                } else {
                  const t = n[3].split("|").map((t) => t.trim()),
                    e = t.find((t) => /^[\u4e00-\u9fa5]{2,5}\s+[A-Z]{2}$/.test(t));
                  if (e) {
                    const t = e.match(/[\u4e00-\u9fa5]{2,5}/);
                    t && (i = t[0]);
                  } else {
                    const e = t.find(
                      (t) =>
                        /^[\u4e00-\u9fa5]{2,5}$/.test(t) &&
                        !/^(\u5730\u533a\u968f\u673a|\u968f\u673a\u4f18\u9009|\u5b98\u65b9\u4f18\u9009|\u4f18\u9009|CF\u4f18\u9009)$/.test(
                          t,
                        ),
                    );
                    if (e) i = e;
                    else {
                      const t = n[3].match(/\b([A-Z]{2})\b/);
                      t && (i = k[t[1]] || t[1]);
                    }
                  }
                }
              }
              i
                ? ((h[i] = (h[i] || 0) + 1),
                  f.push({
                    ip: r,
                    port: o,
                    name: i + "-" + String(h[i]).padStart(2, "0"),
                    ...(m
                      ? {
                          relay: !0,
                        }
                      : {}),
                  }))
                : f.push({
                    ip: r,
                    port: o,
                    name: "",
                    ...(m
                      ? {
                          relay: !0,
                        }
                      : {}),
                  });
            }
            if (!f.length && r) {
              const n =
                (String(t).match(/\/([A-Z]{2})\//) || [])[1] ||
                String(t)
                  .replace(/^https?:\/\//, "")
                  .split(".")[0];
              k[n] &&
                ht(s ? U : v, e).forEach((t, e) =>
                  f.push({
                    ip: t,
                    port: 443,
                    name: k[n] + "-" + String(e + 1).padStart(2, "0"),
                  }),
                );
            }
            return (
              de.set(i, {
                t: c,
                ips: f,
              }),
              me(l, f),
              f.slice()
            );
          } catch (t) {
            const n = de.get(i);
            return n && n.ips && n.ips.length ? n.ips.slice(0, e) : [];
          }
        }
        var n;
        if (!t.includes("://") && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(t)) {
          const e = t.match(
            /^(\[?[0-9a-fA-F:]+\]?|\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9.-]+\.[a-z]{2,})(?::(\d{1,5}))?(?:#([^\r\n]*))?$/i,
          );
          if (!e) return [];
          const n = e[1].replace(/^\[|\]$/g, ""),
            r = e[2] ? parseInt(e[2]) : 443,
            a = (e[3] || "").trim(),
            s = st(n);
          if (!s && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(n)) return [];
          if (o && s && !V(n)) return [];
          if (a)
            return [
              {
                ip: n,
                port: r,
                name: a,
              },
            ];
          if (s)
            return [
              {
                ip: n,
                port: r,
                name: "",
              },
            ];
        }
        const i = de.get(t);
        if (i && c - i.t < 6e5)
          return i.ips.slice(0, e).map((e, n) => ({
            ip: e,
            port: 443,
            name: t + "-" + (n + 1),
          }));
        const l = await u(t, "A", 1);
        let p = o ? l.filter(V) : l;
        if (s) {
          const e = await u(t, "AAAA", 28);
          p = [...new Set(l.concat(e))].filter((t) => !o || V(t));
        }
        return (
          (p = p.slice(0, e)),
          p.length
            ? (de.set(t, {
                t: c,
                ips: p,
              }),
              p.map((e, n) => ({
                ip: e,
                port: 443,
                name: t + "-" + (n + 1),
              })))
            : i && i.ips && i.ips.length
              ? i.ips.slice(0, e).map((e, n) => ({
                  ip: e,
                  port: 443,
                  name: t + "-" + (n + 1),
                }))
              : []
        );
      }),
    ),
    d = [];
  let h = 0;
  for (; h < n; ) {
    let t = !1;
    for (const e of p) {
      if (h >= n) break;
      e.length && (d.push(e.shift()), h++, (t = !0));
    }
    if (!t) break;
  }
  return d;
}
async function be(t, n = 800, r = null) {
  const o = [],
    a = new Set(),
    s = (t.optimizer && t.optimizer.subMode) || "",
    i = (t.filter && t.filter.ipType) || [],
    c = 1 === i.length && "IPv6" === i[0],
    l = ke(t),
    u = c ? x : l ? [...v, ...x] : v,
    p = "custom" === s && !(t.optimizer && t.optimizer.subIncludeDefault),
    d = "custom" === s || "random" === s,
    h = (r, s, i, c) => {
      ((r, s, i, c) => {
        if (o.length >= n) return;
        if (st(r) && !V(r) && !p && !c) return;
        const l = r;
        if (a.has(l)) return;
        a.add(l);
        const u = !G.has(Number(s));
        if (t.tlsOnly && !u) return;
        const d = Number(s),
          h = le(i, !!t.enableVless, !!t.enableTrojan, !(!t.enableXhttp || !u));
        (t.enableVless && o.push(ue(t, r, d, h.v)),
          t.enableTrojan && u && o.push(pe(t, r, u ? d : Number(s), h.t)),
          t.enableXhttp &&
            u &&
            o.push(
              ue(t, r, d, h.x, {
                type: "xhttp",
              }),
            ));
      })(r, Number(s) || 443, i, c);
    };
  if ("random" === s) {
    let a = Math.min(Math.max(parseInt(t.optimizer.subRandomCount) || 16, 1), Math.min(99, n));
    if (t.nodeLimit) {
      const e = parseInt(t.nodeLimitCount) || 0;
      e > 0 && (a = Math.min(a, e, n));
    }
    const s = (t.enableVless ? 1 : 0) + (t.enableTrojan ? 1 : 0) + (t.enableXhttp ? 1 : 0) || 1;
    let i = 0;
    const c = ht(u, 3 * Math.ceil(a / s));
    let l = c;
    r && (l = [...c.filter((t) => !r.has(t)), ...c.filter((t) => r.has(t))]);
    for (const n of l) {
      if (i >= a) break;
      const r = le(
        "优选IP-" + String(i + 1).padStart(2, "0"),
        !!t.enableVless,
        !!t.enableTrojan,
        !!t.enableXhttp,
      );
      if ((t.enableVless && (o.push(ue(t, n, 443, r.v)), i++), i >= a)) break;
      if ((t.enableTrojan && (o.push(pe(t, n, 443, r.t)), i++), i >= a)) break;
      t.enableXhttp &&
        (o.push(
          ue(t, n, 443, r.x, {
            type: "xhttp",
          }),
        ),
        i++);
    }
    return o;
  }
  const f = ye(t.preferredDomains).filter((t) => !t.includes("://"));
  f.forEach((t, e) => {
    const n = t.indexOf("#"),
      r = (n >= 0 ? t.slice(0, n) : t).trim(),
      o = (n >= 0 ? t.slice(n + 1) : "").trim(),
      a = F(r, 443);
    a.host.startsWith("*.") || h(a.host, a.port, o || "优选IP-" + String(e + 1).padStart(2, "0"));
  });
  let m = t.preferredIPs || [];
  if (l && !c && m.length > 1) {
    const t = [],
      e = [];
    for (const n of m) (String(n.ip).indexOf(":") >= 0 ? e : t).push(n);
    const n = [],
      r = Math.max(t.length, e.length);
    for (let o = 0; o < r; o++) (o < t.length && n.push(t[o]), o < e.length && n.push(e[o]));
    m = n;
  }
  if (
    (m.forEach((t, e) => {
      h(
        t.ip,
        t.port || 443,
        t.name || "优选IP-" + String(e + 1).padStart(2, "0"),
        !0 === t.relay || (st(t.ip) && !V(t.ip)),
      );
    }),
    !("custom" !== s || (t.optimizer && t.optimizer.subIncludeDefault)))
  )
    return o;
  f.length ||
    (t.preferredIPs || []).length ||
    (ft(_.join("\n")).forEach((t) => h(t.ip, t.port || 443, t.name || "0")),
    W.forEach((t, e) => h(t, 443, "域名-" + String(e + 1).padStart(2, "0"))));
  const g = Math.min(Math.max(parseInt((t.optimizer && t.optimizer.fillCount) || 0) || 0, 0), 5e3),
    y = Math.min(g, n) - a.size;
  if (y > 0) {
    const t = r ? E.filter((t) => !r.has(t)) : E.slice(),
      e = ht(u, 3 * y);
    let a = [...t, ...(r ? e.filter((t) => !r.has(t)) : e)];
    if ((a.length < y && (a = [...E, ...e]), a.length > 0)) {
      const t = Math.min(a.length, 20),
        e = a.slice(0, t),
        n = d ? e.map(() => !0) : await tn(e, (t) => rn(t, 443, 1500)),
        r = e.filter((t, e) => n[e]),
        o = a.slice(t);
      a = [...r, ...o].slice(0, y);
    }
    let s = 0;
    for (const t of a) {
      if (o.length >= n) break;
      (s++, h(t, 443, "优选IP-" + String(s).padStart(3, "0")));
    }
  }
  return o;
}
function Ie(t) {
  const e = t.indexOf("@"),
    n = t.indexOf("?", e),
    r = n > e && e >= 0 ? t.slice(e + 1, n) : t.slice(e + 1);
  if (r.startsWith("[")) {
    const t = r.indexOf("]"),
      e = t > 0 ? r.slice(1, t) : r,
      n = r.slice(t + 1),
      o = n.startsWith(":") ? parseInt(n.slice(1)) : 443;
    return {
      host: e,
      port: isNaN(o) ? 443 : o,
    };
  }
  const o = r.lastIndexOf(":");
  if (o > 0) {
    const t = parseInt(r.slice(o + 1));
    return {
      host: r.slice(0, o),
      port: isNaN(t) ? 443 : t,
    };
  }
  return {
    host: r,
    port: 443,
  };
}
function Pe(t, e) {
  const n = t.indexOf("?");
  if (n < 0) return null;
  const r = t.indexOf("#", n),
    o = r > n ? t.slice(n + 1, r) : t.slice(n + 1);
  for (const t of o.split("&")) {
    const n = t.indexOf("=");
    if ((n > 0 ? t.slice(0, n) : t) === e) return n > 0 ? decodeURIComponent(t.slice(n + 1)) : "";
  }
  return null;
}
function Se(t, n) {
  const { host: r, port: o } = Ie(t),
    a = r,
    s = t.indexOf("#");
  let i = `${"节点"}${n + 1}`;
  if (s >= 0)
    try {
      i = decodeURIComponent(t.slice(s + 1)) || i;
    } catch (t) {}
  const c = t.indexOf("@");
  let l = "";
  if (c >= 0) {
    const e = t.indexOf("://"),
      r = e >= 0 ? e + 3 : 0;
    try {
      l = decodeURIComponent(t.slice(r, c));
    } catch (n) {
      l = t.slice(r, c);
    }
  }
  const u = t.startsWith("trojan://");
  return {
    srv: a,
    prt: o,
    name: i,
    user: l,
    isTrojan: u,
    tls: u || "tls" === (Pe(t, "security") || "tls"),
  };
}
const ve = {
    HK: ["HK", "香港"],
    TW: ["TW", "台湾"],
    US: ["US", "美国"],
    SG: ["SG", "新加坡"],
    JP: ["JP", "日本"],
    KR: ["KR", "韩国"],
    DE: ["DE", "德国"],
  },
  Ae = {
    移动: ["移动", "CM", "CHINAMOBILE"],
    联通: ["联通", "CU", "UNICOM"],
    电信: ["电信", "CT", "CHINATELECOM"],
  },
  Ue = ["移动", "联通", "电信"],
  xe = ["IPv4", "IPv6"];
function Ce(t, e) {
  if (!e || (!e.region && !e.ipType && !e.isp)) return t;
  const n = e.region || "all",
    r = e.ipType || xe,
    o = e.isp || Ue,
    a = t.map((t) => {
      const { host: e } = Ie(t);
      let n = "";
      try {
        const e = t.indexOf("#");
        e >= 0 && (n = decodeURIComponent(t.slice(e + 1) || ""));
      } catch (t) {
        n = "";
      }
      return {
        host: e,
        name: n,
        up: n.toUpperCase(),
      };
    }),
    s = a.some(
      (t) => t.up && Object.keys(Ae).some((e) => (Ae[e] || [e]).some((e) => t.up.includes(e.toUpperCase()))),
    ),
    i = (e, n, r) => {
      const o = Array.isArray(e)
          ? 0 === e.length || e.includes("all")
            ? null
            : e.flatMap((t) => ve[t] || [])
          : "all" !== e
            ? ve[e] || []
            : null,
        i = r.length > 0 && r.length < Ue.length;
      return t.filter((t, e) => {
        const c = a[e],
          l = c.host.indexOf(":") >= 0;
        if (!c.name) return !1;
        if (
          o &&
          !o.some((t) => c.up.includes(t.toUpperCase())) &&
          !/^(\u4f18\u9009IP|\u57df\u540d)-\d+/.test(c.name) &&
          "原生地址" !== c.name
        )
          return !1;
        if (1 === n.length) {
          if ("IPv4" === n[0] && l) return !1;
          if ("IPv6" === n[0] && !l) return !1;
        }
        return !(i && s && !r.some((t) => (Ae[t] || [t]).some((t) => c.up.includes(t.toUpperCase()))));
      });
    };
  let c = i(n, r, o);
  return (
    c.length || (c = i(n, r, Ue)),
    c.length || (c = i(n, xe, Ue)),
    c.length || (c = i("all", xe, Ue)),
    c
  );
}
function Ve(t) {
  try {
    let e = Ie(t).host || "";
    return (
      "[" === e.charAt(0) && (e = e.slice(1, e.indexOf("]") > 0 ? e.indexOf("]") : void 0)),
      e.indexOf(":") >= 0
    );
  } catch (t) {
    return !1;
  }
}
function ke(t) {
  const e = (t && t.filter && t.filter.ipType) || [];
  if (!e.includes("IPv6")) return !1;
  if (1 === e.length) return !0;
  const n = (t && t.ipv6Mode) || "off";
  return "tail" === n || "full" === n;
}
function Te(t, e, n) {
  const r = (e && e.ipv6Mode) || "off";
  if (n || "full" === r || "mix" === r || t.length < 2) return t;
  const o = [],
    a = [];
  for (const e of t) (Ve(e) ? o : a).push(e);
  if (!o.length) return t;
  if ("off" === r) return a.length ? a : t;
  const s = Math.max(1, Math.min(o.length, 40, Math.floor(0.1 * a.length)));
  return a.length ? a.concat(o.slice(0, s)) : t;
}
const Re = /^(?:\u4f18\u9009IP-S\d|\u5185\u7f6e\u00b7\u4fdd\u5e95-|\u96a7\u9053\u524d\u7f6e-)/;
function Ne(t) {
  try {
    const e = t.indexOf("#");
    return !(e < 0) && Re.test(decodeURIComponent(t.slice(e + 1) || ""));
  } catch (t) {
    return !1;
  }
}
function Me(t) {
  for (let e = t.length - 1; e > 0; e--) {
    const n = Math.floor(Math.random() * (e + 1)),
      r = t[e];
    ((t[e] = t[n]), (t[n] = r));
  }
  return t;
}
function Ze(t) {
  if ("boolean" == typeof t || "number" == typeof t) return String(t);
  const e = String(t);
  return /^[\w.\-/\u4e00-\u9fa5]+$/.test(e) ? e : JSON.stringify(e);
}
function He(t, e) {
  const n = " ".repeat(e);
  return String(t || "")
    .split("\n")
    .map((t) => n + (t || ""));
}
function Oe(t) {
  const e = String(t || "");
  if (!e) return "";
  if (e.indexOf("印度尼西亚") >= 0) return "印尼";
  let n = "";
  for (const t in k) {
    const r = k[t];
    r.length > n.length && e.indexOf(r) >= 0 && (n = r);
  }
  if (n) return n;
  const r = e.toUpperCase().match(/[A-Z]{2,3}/g) || [];
  for (const t of r) if (N[t]) return N[t];
  return "";
}
const We = 36e5;
let Ee = 0;
function De(t, e) {
  const n = (async function (t, e) {
    try {
      const n = String(e || "").toUpperCase();
      if (!n || !t || !t.K || "function" != typeof t.K.put) return;
      const r = Date.now();
      if (r - Ee < We) return;
      Ee = r;
      let o = null;
      try {
        o = JSON.parse((await t.K.get("usageColo")) || "null");
      } catch (t) {
        o = null;
      }
      if (o && r - (o.t || 0) < We) return void (Ee = o.t || r);
      if (!nt()) return;
      await t.K.put(
        "usageColo",
        JSON.stringify({
          colo: n,
          t: r,
        }),
      ).catch(() => {});
    } catch (t) {}
  })(t, e);
  t && t._ctx && "function" == typeof t._ctx.waitUntil ? t._ctx.waitUntil(n) : n.catch(() => {});
}
async function _e(t) {
  try {
    if (!t || !t.K || "function" != typeof t.K.get) return "";
    const e = JSON.parse(
      (await t.K.get("usageColo", {
        cacheTtl: 30,
      })) || "null",
    );
    return e && e.colo ? (Date.now() - (e.t || 0) > 6048e5 ? "" : String(e.colo).toUpperCase()) : "";
  } catch (t) {
    return "";
  }
}
let Le = null;
function Ge(t, n, r, o, a, s, l, u) {
  const p = t.host,
    d = "/" + t.path,
    h = d + "?ed=2048",
    f = t.alpn
      ? t.alpn
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null,
    m = new Set(),
    g = [],
    y = {},
    w = String(r || "").toUpperCase(),
    b = M[w] || w || "",
    I = String(l || "").toUpperCase(),
    P = M[I] || I || "",
    S = String(s || "")
      .trim()
      .toUpperCase(),
    v = "OFF" === S ? "" : k[S] || P || b,
    A = n.map((n) => {
      const { user: r, srv: o, prt: a, name: s, isTrojan: i, tls: c } = Se(n, 0);
      let l = s;
      const u = Pe(n, "type") || "ws";
      let w = Oe(l);
      if ((!w && v && ((w = v), (l = l ? v + "·" + l : v + "·优选")), m.has(l))) {
        const t = i ? "T" : "xhttp" === u ? "X" : "W";
        let n = l + "·" + t,
          r = 2;
        for (; m.has(n); ) ((n = l + "·" + t + r), r++);
        l = n;
      }
      if ((m.add(l), w)) {
        let t = y[w];
        (void 0 === t &&
          ((t = g.length),
          (y[w] = t),
          g.push({
            name: w,
            code: T[w] || "R" + t,
            nodes: [],
          })),
          g[t].nodes.push(l));
      }
      const b = {
        name: l,
        server: o,
        port: a,
        udp: !0,
        ...(c
          ? {
              tls: !0,
              ["skip-cert-verify"]: !0,
              ["servername"]: p,
              ["client-fingerprint"]: "chrome",
              ["alpn"]: f || ["http/1.1"],
            }
          : {}),
        ...(t.ech && c
          ? {
              "ech-opts": {
                enable: !0,
                "query-server-name": t.echHost || "cloudflare-ech.com",
              },
            }
          : {}),
      };
      if (i)
        return {
          ...b,
          type: "trojan",
          password: r,
          network: "ws",
          ["ws-opts"]: {
            path: c ? h : d,
            headers: {
              Host: p,
            },
          },
        };
      if ("xhttp" === u) {
        let t = {};
        try {
          t = JSON.parse(Pe(n, "extra") || "{}");
        } catch (t) {}
        return {
          ...b,
          type: "vless",
          uuid: r,
          network: "xhttp",
          ["alpn"]: f || ["h2"],
          ["xhttp-opts"]: {
            path: d,
            mode: "stream-one",
            host: p,
            ["x-padding-obfs-mode"]: void 0 === t.xPaddingObfsMode || t.xPaddingObfsMode,
            "x-padding-method": t.xPaddingMethod || "tokenish",
            "x-padding-placement": t.xPaddingPlacement || "queryInHeader",
            "x-padding-header": t.xPaddingHeader || "",
            "x-padding-key": t.xPaddingKey || "",
          },
        };
      }
      return {
        ...b,
        type: "vless",
        uuid: r,
        network: "ws",
        ["ws-opts"]: {
          path: c ? h : d,
          headers: {
            Host: p,
          },
        },
      };
    });
  A.sort((t, e) => (443 === t.port ? 0 : 1) - (443 === e.port ? 0 : 1));
  const U = "custom" === ((t.optimizer && t.optimizer.subMode) || ""),
    x = A.map((t) => t.name),
    C = t.homeWan && x.length ? "隧道前置" : "",
    V = (function (t) {
      if (!t || !t.length) return t;
      const e = t[0],
        n = (t, e) => (t || "") === (e || "");
      return t.map(
        (t) => (
          t !== e
            ? (n(t.ca, e.ca) && (t.caRef = "hwca"),
              n(t.cert, e.cert) && (t.certRef = "hwcert"),
              n(t.key, e.key) && (t.keyRef = "hwkey"))
            : (t.ca && (t.caAnchor = "hwca"),
              t.cert && (t.certAnchor = "hwcert"),
              t.key && (t.keyAnchor = "hwkey")),
          t
        ),
      );
    })(
      (function (t, n) {
        if (!t.homeWan) return [];
        const r = Array.isArray(t.homeWanNodes) && t.homeWanNodes.length ? t.homeWanNodes : [];
        if (!r.length) return [];
        const o = {};
        return r.map((t) => {
          const r = "家宽" + String(t.country || "XX").toUpperCase();
          let a = r,
            s = 2;
          for (; o[a]; ) ((a = r + "-" + s), s++);
          o[a] = 1;
          const i = {
            name: a,
            type: "openvpn",
            server: t.server,
            port: Number(t.port) || 1194,
            proto: "tcp" === String(t.proto || "udp") ? "tcp" : "udp",
            username: "vpn",
            password: "vpn",
            ca: t.ca || "",
            dev: "tun",
            handshakeTimeout: 30,
            cipher: t.cipher || "AES-128-GCM",
            auth: t.auth || "SHA1",
          };
          return (
            t.cert && (i.cert = t.cert),
            t.key && (i.key = t.key),
            t.tlsAuth && ((i["tls-auth"] = t.tlsAuth), (i["key-direction"] = "1")),
            t.tlsCrypt && (i["tls-crypt"] = t.tlsCrypt),
            n && (i["dialerProxy"] = n),
            i
          );
        });
      })(t, C),
    ),
    R = !(!t.homeWan || U);
  if ((V.length && A.push(...V), u && u.length)) {
    const t = u.map(function (t) {
      const n = {
        name: t.name,
        type: t.mg ? "masque" : "wireguard",
        server: t.host,
        port: t.port,
        ip: t.local[0] ? (t.mg ? String(t.local[0]).split("/")[0] + "/32" : String(t.local[0])) : "",
        "private-key": t.k,
        "peer-public-key": t.p,
        udp: !0,
        mtu: 1280,
        "remote-dns-resolve": !0,
        dns: ["1.1.1.1"],
      };
      return (
        t.local[1] && (n.ipv6 = t.mg ? String(t.local[1]).split("/")[0] + "/128" : String(t.local[1])),
        t.mg
          ? ((n.sni = t.sni),
            (n.uri = "https://cloudflareaccess.com"),
            (n["congestion-controller"] = "bbr"),
            t.msnet && (n["network"] = t.msnet))
          : t.cid && (n.cid = t.cid),
        t["dialerProxy"] && (n["dialerProxy"] = t["dialerProxy"]),
        n
      );
    });
    (A.push(...t),
      Le && A.push(Le),
      g.push({
        name: In(
          (
            u.find(function (t) {
              return !t.mg;
            }) || u[0]
          ).name,
        ),
        code: "R" + g.length,
        nodes: t.map(function (t) {
          return t.name;
        }),
        proto: 1,
      }));
  }
  const N = (function (t, n) {
    const r = "https://www.gstatic.com/generate_204",
      o = "https://www.gstatic.com/generate_204";
    if (!n)
      return `# ==================== 策略组 ====================
proxy-groups:
  - {name: 一键连接, type: select, proxies: [直接连接]}
  - {name: 直接连接, type: select, proxies: [DIRECT]}
`;
    const a = [];
    (a.push("# ==================== 监听器 ===================="),
      a.push("listeners:"),
      a.push("  # Shadowsocks监听器 - 远程连接家庭网络，端口和密码使用时请修改（默认密码请勿用于公网）"),
      a.push(
        "  - {name: SS-IN,  type: shadowsocks, listen: '::', port: 10000, udp: true, password: Xf3#Lp9WqZ, cipher: aes-256-gcm}",
      ),
      a.push("  # Mixed监听器 - 分地区专用端口 玩法：本地客户端或插件，实现分地区访问"),
      t.slice(0, 7).forEach((t, e) => {
        a.push(
          "  - {name: MIXED-" + t.code + ", type: mixed, port: " + (5e4 + e) + ", proxy: " + t.name + "节点}",
        );
      }),
      a.push("  - {name: MIXED-AL, type: mixed, port: 50007, proxy: 一键连接}"),
      a.push(""),
      a.push("# ==================== 策略组 ===================="),
      a.push("proxy-groups:"));
    const s = t.map((t) => t.name + "节点");
    return (
      a.push("  # 主入口：默认自动选择延迟最低节点，可手动切换各地区 / 全部节点 / 直接连接"),
      a.push(
        "  - {name: 一键连接, type: select, proxies: [" +
          ["自动选择", "故障转移"].concat(s, ["全部节点", "直接连接"]).join(", ") +
          "]}",
      ),
      a.push("  # 自动选择：隐藏（面板不可手动选择），纯自动优选延时最低节点；故障转移：按序自动切换"),
      a.push(
        "  - {name: 自动选择, type: url-test, include-all: true, url: '" +
          r +
          "', interval: 200, timeout: 8000, expected-status: '204', lazy: true, hidden: true, " +
          "empty-fallback" +
          ": REJECT}",
      ),
      a.push(
        "  - {name: 故障转移, type: fallback, proxies: [" +
          s.concat(["全部节点"]).join(", ") +
          "], url: '" +
          r +
          "', interval: 200, timeout: 8000, expected-status: '204', lazy: true, " +
          "empty-fallback" +
          ": REJECT}",
      ),
      t.forEach((t) => {
        const n = t.name + "节点",
          s = t.name + "自动",
          i = t.proto ? o : r,
          c = t.proto ? "600" : "200";
        (a.push(
          "  # " +
            t.name +
            "（" +
            t.nodes.length +
            " 节点）：默认选中「" +
            s +
            "」=自动优选该地区最快节点，也可手动指定单个节点",
        ),
          a.push(
            "  - {name: " +
              n +
              ", type: select, " +
              "proxies" +
              ": [" +
              s +
              ", " +
              t.nodes.map(Ze).join(", ") +
              "]}",
          ),
          a.push(
            "  - {name: " +
              s +
              ", type: " +
              "url-test" +
              ", " +
              "proxies" +
              ": [" +
              t.nodes.map(Ze).join(", ") +
              "], url: '" +
              i +
              "', interval: " +
              c +
              (t.proto ? ", timeout: 5000, tolerance: 50, expected-status: '204'" : "") +
              ", lazy: true, " +
              "empty-fallback" +
              ": REJECT, hidden: true}",
          ));
      }),
      a.push("  # 全部节点（手动挑选任意节点；首个选项「自动选择」=全部节点中最快）"),
      a.push("  - {name: 全部节点, type: select, include-all: true, proxies: [自动选择]}"),
      a.push("  - {name: 直接连接, type: select, proxies: [DIRECT]}"),
      a.join("\n") + "\n"
    );
  })(g, A.length);
  let Z = `
# 监听器与策略组由订阅生成时按实际节点动态输出（见 generateClash / buildClashGroups）：
# 有节点的地区才生成对应分组与监听器，无节点不占位（地区归桶由节点名识别 + 机房落点标注）

# ==================== 核心配置 ====================
mode: rule
port: 7890
socks-port: 7891
redir-port: 7892
mixed-port: 7893
tproxy-port: 7895
ipv6: true
allow-lan: true
unified-delay: false
tcp-concurrent: true
log-level: warning
bind-address: '*'
find-process-mode: 'always'
keep-alive-interval: 15
keep-alive-idle: 600

# 认证配置（默认凭据请务必修改！）
authentication:
  - mihomo:yyds666
skip-auth-prefixes:
  - 192.168.1.0/24
  - 192.168.31.0/24
  - 192.168.100.0/24
  - 127.0.0.1/8

# 实验性功能
experimental:
  quic-go-disable-gso: true

# 管理面板配置
external-ui-url: https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip
external-ui-name: zashboard
external-ui: ui
external-controller: 127.0.0.1:9090
secret: yyds666    # 请修改为自定义密钥
# 允许网页面板跨域访问
external-controller-cors:
  allow-origins:
    - "*"
  allow-private-network: true

# 配置存储
profile:
  store-selected: true
  store-fake-ip: true

# geosite / geoip 数据源（GEOSITE 规则依赖；MetaCubeX 官方规则库，GitHub release 官方源）
geox-url:
  geoip: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.dat"
  geosite: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
  mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb"

# 流量嗅探
sniffer:
  enable: true
  force-dns-mapping: true   # 强制 DNS 映射，提高分流准确度
  parse-pure-ip: true       # 解析纯 IP 连接
  override-destination: true
  sniff:
    HTTP:
      ports: [80, 8080-8880]
    TLS:
      ports: [443, 8443]
    QUIC:
      ports: [443, 8443]
  skip-domain:
    - "+.push.apple.com"

# TUN模式配置
tun:
  enable: false
  stack: mixed
  mtu: 1480
  dns-hijack:
    - "any:53"
    - "tcp://any:53"
  udp-timeout: 300
  auto-route: true
  strict-route: true
  auto-redirect: true
  auto-detect-interface: true
  # 提示：系统级防泄露的最强手段是开启 TUN（自动劫持全部 DNS 流量）；
  # 不开 TUN 时，请把系统 / LAN 设备的 DNS 指向 127.0.0.1:53（本机）或本机局域网 IP:53。

hosts:
  miwifi.com: 192.168.31.2
  "epdg.epc.mnc010.mcc234.pub.3gppnetwork.org": [87.194.8.8, 87.194.88.8, 87.194.89.8, 87.194.9.8]
  services.googleapis.cn: services.googleapis.com
  cn.bing.com: www4.bing.com

# ==================== DNS 配置 ====================
# 防泄露要点：
#   1) respect-rules: true：DNS 服务器连接遵循路由规则（国外 DoH 走隧道、国内 DoH 直连），
#      解析行为与规则分流一致，避免“规则走出口、解析却直连”的泄露。
#   2) 默认 nameserver 用国内 DoH；只有“将走出口”的规则集才用国外 DoH，
#      且其域名在 rules 中显式固定走出口。
#   3) fake-ip-filter 补齐系统连通性检测 / 时间同步 / 运营商登录等域名，防止系统误判断网而回退运营商 DNS。
dns:
  enable: true
  listen: 0.0.0.0:53        # 本机 / LAN 设备可把 DNS 指向此地址，避免走运营商 DNS
  ipv6: true
  prefer-h3: false          # respect-rules 下官方不推荐 DoH3；且 QUIC 已被规则拦截
  cache-algorithm: arc      # 性能更优的 ARC 缓存算法
  cache-size: 4096
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - "+.lan"
    - "+.local"
    - "+.localhost"
    - "+.home.arpa"
    - "+.internal"
    # 系统连通性检测（防止 fake-ip 导致“无网络”判断，回退 ISP DNS 造成泄露）
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"          # 通配已覆盖 dns.msftncsi.com
    - "captive.apple.com"
    - "connectivitycheck.gstatic.com"
    - "detectportal.firefox.com"
    # 时间同步
    - "time.nist.gov"
    - "+.pool.ntp.org"
    - "time.*.com"              # 通配已覆盖 time.windows.com
    - "ntp.*.com"               # 通配已覆盖 ntp.ubuntu.com
    # 运营商 Wi-Fi 登录页
    - "+.cmpassport.com"
    - "id6.me"
    - "open.e.189.cn"
    - "mdn.open.wo.cn"
    - "opencloud.wostore.cn"
    - "auth.wosms.cn"
    - "+.10099.com.cn"
    # 原配置保留项
    - "+.market.xiaomi.com"
    - "+.pub.3gppnetwork.org"
    - "+.push.apple.com"
    - "+.bing.com"
    - "+.miwifi.com"
    - "+.docker.io"
    # 国内应用登录（+.qq.com 已覆盖 localhost.ptlogin2.qq.com）
    - "+.qq.com"
    # 直连 / 国内类规则集：返回真实 IP
    - rule-set:Direct
    - rule-set:Private
    - rule-set:China
    - geosite:cn                # 国内域名返回真实 IP（geosite 库兜底，防 fake-ip 干扰国内应用）
  use-hosts: true
  respect-rules: true
  # 引导用 DNS（解析 DoH/DoT 服务器自身的域名），必须是 IP
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  # 默认解析：未命中 nameserver-policy 的域名（国内 DoH，直连）
  nameserver:
    - "https://dns.alidns.com/dns-query"
    - "https://doh.pub/dns-query"
  # 直连出口的解析
  direct-nameserver:
    - "https://dns.alidns.com/dns-query"
    - "https://doh.pub/dns-query"
  # 解析节点域名（防套娃 / 防循环，用国内直连可达的 DoH）
  proxy-server-nameserver:
    - "https://dns.alidns.com/dns-query"
    - "https://doh.pub/dns-query"
  nameserver-policy:
    # 广告域名直接返回空应答
    "rule-set:Advertising,AWAvenueAds": rcode://success
    # 直连类：国内 DoH（微软已并入直连，微软域名走国内解析后直连）
    "rule-set:Direct,Private,China,Microsoft":
      - "https://dns.alidns.com/dns-query"
      - "https://doh.pub/dns-query"
    # 走出口类：国外 DoH（连接本身经隧道，不直连暴露查询）
    "rule-set:AI,Telegram,Twitter,SocialMedia,Netflix,YouTube,Spotify,TikTok,disney,Google,Proxy":
      - "https://dns.google/dns-query"
      - "https://cloudflare-dns.com/dns-query"

__CLASH_GROUPS__

# ==================== 规则路由 ====================
rules:
  # 广告拦截（常用：直接拒绝；如需临时放行可改为一键连接）
  - RULE-SET,Tracking,REJECT
  - RULE-SET,AWAvenueAds,REJECT
  - RULE-SET,Advertising,REJECT
  - GEOSITE,category-ads-all,REJECT        # geosite 广告分类兜底（v2ray 标准库，覆盖面广）

  # DNS 服务器域名：解析通道固定，避免 DNS 流量走错路径（防泄露关键）
  - DOMAIN-SUFFIX,alidns.com,直接连接
  - DOMAIN-SUFFIX,doh.pub,直接连接
  - DOMAIN,dns.google,一键连接
  - DOMAIN,cloudflare-dns.com,一键连接

  # 大陆直连优先（置于国外服务规则之前：大陆应用一律直连，不被国外服务规则集抢先命中）
  - RULE-SET,Private,直接连接
  - RULE-SET,Direct,直接连接
  - RULE-SET,Download,直接连接
  - RULE-SET,AppleCN,直接连接
  - RULE-SET,Microsoft,直接连接        # 微软全家桶直连（Office / OneDrive / Windows 更新 / Teams / Xbox 等）
  - RULE-SET,China,直接连接             # 国内域名直连
  - GEOSITE,CN,直接连接                  # geosite 国内域名兜底（覆盖规则集未收录的国内域名，先于 GEOIP 命中）
  # 阻止 QUIC 走出口（强制回退 TCP，避免 QUIC 绕过出口 / 被干扰）。
  # 放在直连规则之后：直连 QUIC（大陆 / 微软 / 苹果）不受影响。如需 Telegram 语音等 UDP，可删除此行。
  - AND,((DST-PORT,443),(NETWORK,UDP)),REJECT

  # 常用国外服务（统一走一键连接）
  - RULE-SET,AI,一键连接
  - RULE-SET,Telegram,一键连接
  - RULE-SET,Twitter,一键连接
  - RULE-SET,SocialMedia,一键连接
  - RULE-SET,Netflix,一键连接
  - RULE-SET,YouTube,一键连接
  - RULE-SET,Spotify,一键连接
  - RULE-SET,TikTok,一键连接
  - RULE-SET,disney,一键连接
  - RULE-SET,Google,一键连接
  - RULE-SET,github,一键连接
  - RULE-SET,Proxy,一键连接

  # IP规则
  - RULE-SET,PrivateIP,直接连接,no-resolve
  - RULE-SET,TelegramIP,一键连接,no-resolve
  - RULE-SET,ProxyIP,一键连接,no-resolve
  - RULE-SET,ChinaIP,直接连接,no-resolve

  # 大陆 IP 兜底直连：覆盖规则集未收录的域名 / 纯 IP 连接的大陆应用（GEOIP 库覆盖面更全）
  - GEOIP,CN,直接连接,no-resolve

  # 兜底规则：其余（国外）走一键连接
  - MATCH,一键连接

# ==================== 规则集 ====================
# 规则集行为模板
BehaviorDN: &BehaviorDN {type: http, behavior: domain, format: mrs, interval: 86400}
BehaviorDY: &BehaviorDY {type: http, behavior: domain, format: yaml, interval: 86400}
BehaviorIP: &BehaviorIP {type: http, behavior: ipcidr, format: mrs, interval: 86400}
ClassicalYaml: &ClassicalYaml {type: http, behavior: classical, interval: 3600, format: yaml, proxy: DIRECT}
BehaviorCL: &BehaviorCL {type: http, behavior: classical, interval: 86400, format: yaml, proxy: DIRECT}   # 经典规则集（blackmatrix7 等，DOMAIN/DOMAIN-SUFFIX/DOMAIN-KEYWORD/PROCESS-NAME）

# 规则提供者（仅保留常用）
# ★ 同域代下：url 指向 __CRULES__（生成时替换为 https://<当前订阅域名>/crules）——
#   客户端导入/更新零外部直连（不开梯子也能完成导入）；上游仓库资源由 Worker 服务端拉取，
#   KV 缓存 + 进程内缓存，客户端不再每次直连外站下载（见 serveCrule / RULE_SOURCES）
rule-providers:
  # 广告
  Tracking:       {<<: *BehaviorDN, url: __CRULES__/Tracking.mrs}
  Advertising:    {<<: *BehaviorDN, url: __CRULES__/Advertising.mrs}
  AWAvenueAds:    {<<: *BehaviorDY, url: __CRULES__/AWAvenueAds.yaml}
  # 直连 / 国内
  Direct:         {<<: *BehaviorDN, url: __CRULES__/Direct.mrs}
  Private:        {<<: *BehaviorDN, url: __CRULES__/Private.mrs}
  Download:       {<<: *BehaviorDN, url: __CRULES__/Download.mrs}
  AppleCN:        {<<: *BehaviorDN, url: __CRULES__/AppleCN.mrs}
  China:          {<<: *BehaviorCL, url: __CRULES__/China.yaml}   # 大陆直连全量：ChinaMaxNoIP（11万+ 域名，含大陆可达国际服务），每日更新
  # 常用国外服务
  AI:             {<<: *BehaviorDN, url: __CRULES__/AI.mrs}
  Telegram:       {<<: *BehaviorDN, url: __CRULES__/Telegram.mrs}
  Twitter:        {<<: *BehaviorDN, url: __CRULES__/Twitter.mrs}
  SocialMedia:    {<<: *BehaviorDN, url: __CRULES__/SocialMedia.mrs}
  Netflix:        {<<: *BehaviorDN, url: __CRULES__/Netflix.mrs}
  YouTube:        {<<: *BehaviorDN, url: __CRULES__/YouTube.mrs}
  Google:         {<<: *BehaviorDN, url: __CRULES__/Google.mrs}
  Microsoft:      {<<: *BehaviorCL, url: __CRULES__/Microsoft.yaml}   # 微软全家桶全量：blackmatrix7（Office/OneDrive/Xbox/Teams/Skype/Bing/Azure 等）
  Proxy:          {<<: *BehaviorDN, url: __CRULES__/Proxy.mrs}
  # 媒体（DustinWin）
  Spotify:        {<<: *BehaviorDN, url: __CRULES__/Spotify.mrs}
  TikTok:         {<<: *BehaviorDN, url: __CRULES__/TikTok.mrs}
  disney:         {<<: *BehaviorDN, url: __CRULES__/disney.mrs}
  # GitHub
  github:          {<<: *ClassicalYaml, url: __CRULES__/github.yaml}
  # IP规则
  PrivateIP:      {<<: *BehaviorIP, url: __CRULES__/PrivateIP.mrs}
  TelegramIP:     {<<: *BehaviorIP, url: __CRULES__/TelegramIP.mrs}
  ProxyIP:        {<<: *BehaviorIP, url: __CRULES__/ProxyIP.mrs}
  ChinaIP:        {<<: *BehaviorIP, url: __CRULES__/ChinaIP.mrs}

# ==================== EOF ====================

`;
  ((Z = Z.replace("__CLASH_GROUPS__", N)),
    o && (Z = Z.replace(/__CRULES__/g, o)),
    (Z = (function (t, n, r, o, a) {
      if (!(n.length || (a && a.length))) return t;
      let s = t;
      if (n.length) {
        const t = n.map((t) => t.name),
          a = t.slice().sort((t, e) => (t < e ? -1 : t > e ? 1 : 0)),
          i =
            o && o.length
              ? `  # ${"家宽隧道前置："}CF ${"优选节点自动测活，家宽"} openvpn ${"经此拨号（"}${"dialer"}-proxy${"）"}\n  - {name: ${"隧道前置"}, type: ${"url-test"}, ${"proxies"}: [${o.map(Ze).join(", ")}], url: 'https://www.gstatic.com/generate_204', interval: 300, lazy: true, hidden: true, ${"empty-fallback"}: REJECT}\n`
              : "",
          c = `  # ${"家宽模式：自动测活（"}${"url-test"} ${"自动选择延迟最低家宽节点）"}\n  - {name: ${"家宽自动"}, type: ${"url-test"}, ${"proxies"}: [${t.map(Ze).join(", ")}], url: 'https://www.gstatic.com/generate_204', interval: 600, lazy: true, hidden: true, ${"empty-fallback"}: REJECT}\n`,
          l = `  # ${"家宽模式："}VPN Gate OpenVPN ${"出口（多台家宽节点自动测活，经"} ${"dialer"}-proxy ${"隧道拨号）"}\n  - {name: ${"家宽出口"}, type: select, ${"proxies"}: [${"家宽自动"}, ${a.map(Ze).join(", ")}, ${"直接连接"}]}\n`;
        ((s = s.replace(
          "# ==================== 规则路由 ====================",
          i + c + l + "# ==================== 规则路由 ====================",
        )),
          (s = s.replace(
            "  - MATCH,一键连接",
            "  # 家宽模式：VPN Gate 相关流量走家宽出口（OpenVPN 经 CF 隧道）\n  - DOMAIN-SUFFIX,vpngate.net,家宽出口\n" +
              (r ? "  - MATCH,家宽出口" : "  - MATCH,一键连接"),
          )));
      }
      return (function (t, n) {
        try {
          if (!n || !n.length) return t;
          const r = n.map(Ze).join(", ") + ", 一键连接",
            o = "url-test",
            a = "proxies",
            s = "empty-fallback",
            i =
              "  # AI 与流媒体专用策略组：按真实站点测活，只有能直连该站点的节点才会被选中；\n  # 组内末位固定挂「一键连接」兜底，全部不达标时仍可正常出网，不会断流。\n  - {name: AI自动, type: " +
              o +
              ", " +
              a +
              ": [" +
              r +
              "], url: 'https://chatgpt.com/cdn-cgi/trace', interval: 600, timeout: 5000, tolerance: 50, expected-status: '200-399', lazy: true, hidden: true, " +
              s +
              ": REJECT}\n" +
              "  - {name: AI优选, type: select, " +
              a +
              ": [AI自动, 一键连接, 直接连接]}\n" +
              "  - {name: 流媒体自动, type: " +
              o +
              ", " +
              a +
              ": [" +
              r +
              "], url: 'https://www." +
              "youtube" +
              ".com/generate_204', interval: 600, timeout: 5000, tolerance: 50, expected-status: '204', lazy: true, hidden: true, " +
              s +
              ": REJECT}\n" +
              "  - {name: 流媒体优选, type: select, " +
              a +
              ": [流媒体自动, 一键连接, 直接连接]}\n",
            c = "RULE-SET";
          let l = t.replace(
            "# ==================== 规则路由 ====================",
            i + "# ==================== 规则路由 ====================",
          );
          return (
            (l = l.replace("  - " + c + ",AI,一键连接", "  - " + c + ",AI,AI优选")),
            ["Netflix", "YouTube", "Spotify", "TikTok", "disney"].forEach(function (t) {
              l = l.replace("  - " + c + "," + t + ",一键连接", "  - " + c + "," + t + ",流媒体优选");
            }),
            l
          );
        } catch (e) {
          return t;
        }
      })(
        s,
        (a && a.length ? a : n).map(function (t) {
          return t.name;
        }),
      );
    })(Z, V, R, x, u)));
  {
    const t = String(p || "").toLowerCase(),
      n = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/.test(t) ? "  - DOMAIN," + t + ",DIRECT\n" : "";
    Z = Z.replace(
      "# ==================== 规则路由 ====================\nrules:\n",
      `# ==================== 规则路由 ====================
rules:
  # 本订阅域名必须直连：客户端（Clash Verge 等）拉取/更新订阅走的是系统代理（=本 Clash 自身），
  # 规则里若没有 DIRECT 放行，请求会被送进代理节点 → 自指循环 → TLS 握手被断（tls handshake eof）→ 导入/更新失败
` +
        n +
        "  - DOMAIN-SUFFIX,pages.dev,DIRECT\n  - DOMAIN-SUFFIX,workers.dev,DIRECT\n",
    );
  }
  const H = String(a || "").toUpperCase(),
    O = k[H] || "";
  return `# ${APP_NAME} ${"订阅"} v${VERSION} ${"·"} ${"机房"} ${w || "未知"}${b ? "(" + b + ")" : ""}${I && I !== w ? " · 实测 " + I + (P ? "(" + P + ")" : "") : ""}${H ? " · 访客 " + H + (O ? "(" + O + ")" : "") : ""} ${"·"} ${"节点"} ${A.length} ${"个"}\ntest-url: 'https://www.gstatic.com/generate_204'\n${"proxies"}:\n${A.map(
    (t) =>
      (function (t) {
        const n = [];
        if (
          (n.push("  - name: " + Ze(t.name)),
          n.push("    type: " + t.type),
          n.push("    server: " + Ze(t.server)),
          n.push("    port: " + t.port),
          "openvpn" === t.type)
        )
          return (
            n.push("    proto: " + Ze(t.proto || "udp")),
            n.push("    udp: " + ("tcp" === t.proto ? "false" : "true")),
            n.push("    username: " + Ze(t.username || "vpn")),
            n.push("    password: " + Ze(t.password || "vpn")),
            t.caRef
              ? n.push("    ca: *" + t.caRef)
              : t.ca &&
                (n.push(t.caAnchor ? "    ca: &" + t.caAnchor + " |" : "    ca: |"), n.push(...He(t.ca, 6))),
            t.certRef
              ? n.push("    cert: *" + t.certRef)
              : t.cert &&
                (n.push(t.certAnchor ? "    cert: &" + t.certAnchor + " |" : "    cert: |"),
                n.push(...He(t.cert, 6))),
            t.keyRef
              ? n.push("    key: *" + t.keyRef)
              : t.key &&
                (n.push(t.keyAnchor ? "    key: &" + t.keyAnchor + " |" : "    key: |"),
                n.push(...He(t.key, 6))),
            t["tls-auth"] &&
              (n.push("    tls-auth: |"),
              n.push(...He(t["tls-auth"], 6)),
              n.push("    key-direction: " + Ze(t["key-direction"] || "1"))),
            t["tls-crypt"] && (n.push("    tls-crypt: |"), n.push(...He(t["tls-crypt"], 6))),
            n.push("    dev: tun"),
            n.push("    cipher: " + Ze(t.cipher || "AES-128-GCM")),
            n.push("    auth: " + Ze(t.auth || "SHA1")),
            t.handshakeTimeout && n.push("    handshake-timeout: " + t.handshakeTimeout),
            t["dialerProxy"] && n.push("    dialer-proxy: " + Ze(t["dialerProxy"])),
            n.join("\n")
          );
        if ("masque" === t.type)
          return (
            t.ip && n.push("    ip: " + Ze(t.ip)),
            t.ipv6 && n.push("    ipv6: " + Ze(t.ipv6)),
            n.push("    private-key: " + Ze(t["private-key"] || "")),
            n.push("    public-key: " + Ze(t["peer-public-key"] || "")),
            n.push("    udp: true"),
            n.push("    mtu: " + (t.mtu || 1280)),
            t["dialerProxy"] && n.push("    dialer-proxy: " + Ze(t["dialerProxy"])),
            t.sni && n.push("    sni: " + Ze(t.sni)),
            t["remote-dns-resolve"] && n.push("    remote-dns-resolve: true"),
            t.dns && t.dns.length && n.push("    dns: [" + t.dns.join(", ") + "]"),
            t.uri && n.push("    uri: " + t.uri),
            t["congestion-controller"] && n.push("    congestion-controller: " + t["congestion-controller"]),
            t.network && n.push("    network: " + t.network),
            n.join("\n")
          );
        if ("wireguard" === t.type)
          return (
            t.ip && n.push("    ip: " + Ze(t.ip)),
            t.ipv6 && n.push("    ipv6: " + Ze(t.ipv6)),
            n.push("    private-key: " + Ze(t["private-key"] || "")),
            n.push("    public-key: " + Ze(t["peer-public-key"] || "")),
            t["dialerProxy"] && n.push("    dialer-proxy: " + Ze(t["dialerProxy"])),
            t["pre-shared-key"] && n.push("    pre-shared-key: " + Ze(t["pre-shared-key"])),
            t.cid && n.push("    reserved: " + Ze(t.cid)),
            n.push("    persistent-keepalive: " + (t["persistent-keepalive"] || 25)),
            n.push("    udp: true"),
            n.push("    mtu: " + (t.mtu || 1280)),
            t["remote-dns-resolve"] && n.push("    remote-dns-resolve: true"),
            t.dns && t.dns.length && n.push("    dns: [" + t.dns.join(", ") + "]"),
            n.join("\n")
          );
        if (t.type === "shadowsocks" || t.type === "socks5" || "http" === t.type)
          return (
            t.cipher && n.push("    cipher: " + Ze(t.cipher)),
            t.username && n.push("    username: " + Ze(t.username)),
            t.password && n.push("    password: " + Ze(t.password)),
            t.tls && n.push("    tls: true"),
            n.push("    udp: true"),
            n.join("\n")
          );
        if (
          ("vless" === t.type ? n.push("    uuid: " + Ze(t.uuid)) : n.push("    password: " + Ze(t.password)),
          n.push("    network: " + t.network),
          n.push("    udp: true"),
          t.tls &&
            (n.push("    tls: true"),
            n.push("    skip-cert-verify: true"),
            n.push(
              t.alpn && t.alpn.length
                ? "    alpn: [" + t.alpn.join(", ") + "]"
                : "xhttp" === t.network
                  ? "    alpn: [h2]"
                  : "    alpn: [http/1.1]",
            ),
            n.push("    servername: " + Ze(t.servername)),
            "trojan" === t.type && n.push("    sni: " + Ze(t.servername)),
            n.push("    client-fingerprint: chrome"),
            t["flow"] && n.push("    flow: " + Ze(t["flow"])),
            t["reality-opts"] &&
              (n.push("    reality-opts:"),
              n.push("      public-key: " + Ze(t["reality-opts"]["public-key"] || "")),
              t["reality-opts"]["short-id"] &&
                n.push("      short-id: " + Ze(t["reality-opts"]["short-id"]))),
            t["ech-opts"] &&
              (n.push("    ech-opts:"),
              n.push("      enable: " + Ze(t["ech-opts"].enable)),
              n.push("      query-server-name: " + Ze(t["ech-opts"]["query-server-name"])))),
          "ws" === t.network)
        )
          (n.push("    ws-opts:"),
            n.push("      path: " + Ze(t["ws-opts"].path)),
            n.push("      headers:"),
            n.push("        Host: " + Ze(t["ws-opts"].headers.Host)));
        else if ("xhttp" === t.network) {
          const r = t["xhttp-opts"];
          (n.push("    xhttp-opts:"),
            n.push("      path: " + Ze(r.path)),
            n.push("      mode: " + Ze(r.mode)),
            n.push("      host: " + Ze(r.host)),
            n.push("      x-padding-obfs-mode: " + Ze(r["x-padding-obfs-mode"])),
            n.push("      x-padding-method: " + Ze(r["x-padding-method"])),
            n.push("      x-padding-placement: " + Ze(r["x-padding-placement"])),
            n.push("      x-padding-header: " + Ze(r["x-padding-header"])),
            n.push("      x-padding-key: " + Ze(r["x-padding-key"])));
        }
        return n.join("\n");
      })(t),
  ).join("\n")}\n${Z}\n`;
}
function Je(t, n) {
  const r = t.host,
    o = "/" + t.path,
    a = [];
  for (const t of n)
    t.startsWith("trojan://") && t.indexOf("security=none") < 0
      ? a.push(t)
      : t.startsWith("vless://") &&
        t.indexOf("type=xhttp") < 0 &&
        t.indexOf("security=none") < 0 &&
        a.push(t.replace(vlessUrlPattern, "trojan://").replace("encryption=none&", ""));
  const i = a.map((t, n) => {
    const { user: a, srv: s, prt: i, name: c } = Se(t, n);
    return `${c} = ${"trojan"}, ${s}, ${i}, password=${a}, ws=true, ws-path=${o}, ws-headers=Host:${r}, tls=true, ${"skip-cert-verify"}=true, sni=${r}`;
  });
  return `#!MANAGED-CONFIG\n[General]\nloglevel = notify\ndns-server = 223.5.5.5, 119.29.29.29\n\n[Proxy]\n${i.join("\n")}\n\n[Proxy Group]\n${"🚀"} ${"节点选择"} = select, ${i.map((t) => t.split(" = ")[0]).join(", ")}\n${"🌐"} ${"全球直连"} = select, DIRECT\n${"🐟"} ${"漏网之鱼"} = select, ${"🚀"} ${"节点选择"}\n\n[Rule]\n${"GEOIP"},CN,DIRECT\nFINAL,${"🐟"} ${"漏网之鱼"}\n`;
}
function Ye(t, n, r) {
  const o =
      r && r.length
        ? r
            .filter(function (t) {
              return !t.mg;
            })
            .map(function (t) {
              return {
                type: "wireguard",
                tag: t.name,
                address: t.local.map(function (t) {
                  return t.indexOf(":") >= 0 ? t + "/128" : t + "/32";
                }),
                private_key: t.k,
                mtu: 1280,
                peers: [
                  {
                    address: t.host,
                    port: t.port,
                    public_key: t.p,
                    allowed_ips: ["0.0.0.0/0", "::/0"],
                    persistent_keepalive_interval: 25,
                  },
                ],
              };
            })
        : [],
    a = t.host,
    s = "/" + t.path,
    i = t.alpn
      ? t.alpn
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null,
    c = new Set(),
    l = n.map((t, n) => {
      const { user: r, srv: o, prt: l, name: u, isTrojan: p, tls: d } = Se(t, n),
        h = Pe(t, "type") || "ws";
      let f = u;
      if (c.has(f)) {
        const t = p ? "T" : "xhttp" === h ? "X" : "W";
        let n = f + "·" + t,
          r = 2;
        for (; c.has(n); ) ((n = f + "·" + t + r), r++);
        f = n;
      }
      c.add(f);
      const m = d
          ? "xhttp" === h
            ? {
                enabled: !0,
                server_name: a,
                insecure: !0,
                ["alpn"]: i || ["h2"],
              }
            : {
                enabled: !0,
                server_name: a,
                insecure: !0,
                ["alpn"]: i || ["http/1.1"],
                utls: {
                  enabled: !0,
                  ["fingerprint"]: "chrome",
                },
              }
          : {
              enabled: !1,
            },
        g =
          "xhttp" === h
            ? {
                type: "xhttp",
                mode: "stream-one",
                path: s,
              }
            : d
              ? {
                  type: "ws",
                  path: s,
                  max_early_data: 2048,
                  early_data_header_name: "Sec-WebSocket-Protocol",
                  headers: {
                    Host: a,
                  },
                }
              : {
                  type: "ws",
                  path: s,
                  headers: {
                    Host: a,
                  },
                };
      return p
        ? {
            type: "trojan",
            tag: f,
            server: o,
            server_port: l,
            password: r,
            tls: m,
            transport: g,
          }
        : {
            type: "vless",
            tag: f,
            server: o,
            server_port: l,
            uuid: r,
            tls: m,
            transport: g,
          };
    }),
    u = o.length ? l.map((t) => t.tag).concat(o.map((t) => t.tag)) : l.map((t) => t.tag),
    p = [
      ["geosite-cn", "🎯 全球直连"],
      ["geosite-google", "🌐 谷歌服务"],
      ["geosite-apple", "🍎 苹果服务"],
      ["geosite-microsoft", "Ⓜ️ 微软服务"],
      ["geosite-openai", "🤖 OpenAI"],
      ["geosite-spotify", "🌍 国外媒体"],
      ["geosite-youtube", "🌍 国外媒体"],
      ["geosite-netflix", "🌍 国外媒体"],
      ["geosite-disney", "🌍 国外媒体"],
      ["geosite-twitter", "🌍 国外媒体"],
      ["geosite-telegram", "🌍 国外媒体"],
      ["geosite-github", "🌍 国外媒体"],
      ["geosite-category-ads-all", "block"],
    ],
    d = {
      log: {
        level: "info",
      },
      dns: {
        servers: [
          {
            tag: "dns-remote",
            type: "https",
            server: "1.1.1.1",
          },
          {
            tag: "dns-direct",
            type: "udp",
            server: "223.5.5.5",
          },
          {
            tag: "dns-fakeip",
            type: "fakeip",
            inet4_range: "198.18.0.0/15",
          },
        ],
        rules: [
          {
            domain_suffix: ["githubusercontent.com", "github.com", "jsdelivr.net"],
            action: "route",
            server: "dns-direct",
          },
          {
            rule_set: "geosite-cn",
            action: "route",
            server: "dns-direct",
          },
          {
            action: "route",
            server: "dns-fakeip",
          },
        ],
        final: "dns-remote",
        strategy: "ipv4_only",
      },
      inbounds: [
        {
          type: "mixed",
          tag: "mixed-in",
          listen: "127.0.0.1",
          listen_port: 2080,
        },
        {
          type: "tun",
          tag: "tun-in",
          interface_name: "tun0",
          address: ["172.19.0.1/30"],
          mtu: 9e3,
          auto_route: !0,
          strict_route: !0,
        },
      ],
      ["outbounds"]: [
        ...l,
        {
          type: "direct",
          tag: "direct",
        },
        {
          type: "block",
          tag: "block",
        },
        {
          type: "selector",
          tag: "🚀 节点选择",
          ["outbounds"]: u,
        },
        {
          type: "selector",
          tag: "🎯 全球直连",
          ["outbounds"]: ["direct"],
        },
        {
          type: "selector",
          tag: "🐟 漏网之鱼",
          ["outbounds"]: ["🚀 节点选择", "🎯 全球直连"],
        },
        {
          type: "selector",
          tag: "🌍 国外媒体",
          ["outbounds"]: ["🚀 节点选择"],
        },
        {
          type: "selector",
          tag: "🌐 谷歌服务",
          ["outbounds"]: ["🚀 节点选择"],
        },
        {
          type: "selector",
          tag: "🤖 OpenAI",
          ["outbounds"]: ["🚀 节点选择"],
        },
        {
          type: "selector",
          tag: "🍎 苹果服务",
          ["outbounds"]: ["🎯 全球直连"],
        },
        {
          type: "selector",
          tag: "Ⓜ️ 微软服务",
          ["outbounds"]: ["🎯 全球直连"],
        },
      ],
      endpoints: o.length ? o : void 0,
      route: {
        rules: [
          {
            action: "sniff",
          },
          {
            protocol: "dns",
            action: "hijack-dns",
          },
          {
            ip_is_private: !0,
            ["outbound"]: "direct",
          },
          ...p.map(([t, n]) => ({
            rule_set: [t],
            ["outbound"]: n,
          })),
          {
            rule_set: "geoip-cn",
            ["outbound"]: "direct",
          },
          {
            ip_is_private: !0,
            action: "reject",
          },
        ],
        rule_set: [
          ...p.map(([t]) => {
            const n = t.replace("geosite-", "geosite/");
            return {
              type: "remote",
              tag: t,
              format: "binary",
              url: "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/" + n + ".srs",
              download_detour: "direct",
            };
          }),
          {
            type: "remote",
            tag: "geoip-cn",
            format: "binary",
            url: "https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/cn.srs",
            download_detour: "direct",
          },
        ],
        final: "🐟 漏网之鱼",
        auto_detect_interface: !0,
        default_domain_resolver: {
          server: "dns-direct",
        },
      },
      experimental: {
        clash_api: {
          external_controller: "127.0.0.1:9090",
        },
        cache_file: {
          enabled: !0,
        },
      },
    };
  return JSON.stringify(d, null, 2);
}
function ze(t, n) {
  const r = t.host,
    o = "/" + t.path,
    a = n.map((t, n) => {
      const { user: a, srv: s, prt: i, name: c, isTrojan: l, tls: u } = Se(t, n),
        p = u ? ", tls=true, skip-cert-verify=true, sni=" + r : ", tls=false";
      return l
        ? `${c} = ${"trojan"}, ${s}, ${i}, password=${a}, ws=true, ws-path=${o}, ws-headers=Host:${r}${p}`
        : `${c} = ${"vless"}, ${s}, ${i}, username=${a}, ws=true, ws-path=${o}, ws-headers=Host:${r}${p}`;
    });
  return `#!MANAGED-CONFIG\n[General]\nloglevel = notify\ndns-server = 223.5.5.5, 119.29.29.29\n\n[Proxy]\n${a.join("\n")}\n\n[Proxy Group]\n${"🚀"} ${"节点选择"} = select, ${a.map((t) => t.split(" = ")[0]).join(", ")}\n${"🌐"} ${"全球直连"} = select, DIRECT\n${"🐟"} ${"漏网之鱼"} = select, ${"🚀"} ${"节点选择"}\n\n[Rule]\n${"GEOIP"},CN,DIRECT\nFINAL,${"🐟"} ${"漏网之鱼"}\n`;
}
function je(t, n) {
  const r = t.host,
    o = "/" + t.path,
    a = n.map((t, n) => {
      const { user: a, srv: s, prt: i, name: c, isTrojan: l, tls: u } = Se(t, n),
        p = u ? ", tls=true, skip-cert-verify=true, sni=" + r : ", tls=false";
      return l
        ? `${c} = ${"trojan"}, ${s}, ${i}, password=${a}, ws=true, ws-path=${o}, ws-headers=Host:${r}${p}`
        : `${c} = ${"vless"}, ${s}, ${i}, username=${a}, ws=true, ws-path=${o}, ws-headers=Host:${r}${p}`;
    }),
    s = a.map((t) => t.split(" = ")[0]).join(", ");
  return `[General]\ndns-server = 223.5.5.5, 119.29.29.29\n\n[Proxy]\n${a.join("\n")}\n\n[Proxy Group]\n${"🚀"} ${"节点选择"} = select, ${s}\n${"🌐"} ${"全球直连"} = select, DIRECT\n${"🐟"} ${"漏网之鱼"} = select, ${s}\n\n[Rule]\n${"GEOIP"},CN,DIRECT\nFINAL,${"🐟"} ${"漏网之鱼"}\n`;
}
function $e(t, n) {
  const r = t.host,
    o = "/" + t.path,
    a = (t) => (t.indexOf(":") >= 0 ? "[" + t + "]" : t),
    s = n.map((t, n) => {
      const { user: s, srv: i, prt: c, name: l } = Se(t, n);
      if (t.startsWith("trojan://"))
        return `${"trojan"}=${a(i)}:${c}, password=${s}, over-tls=true, tls-host=${r}, ${"obfs"}=wss, ${"obfs"}-host=${r}, ${"obfs"}-uri=${o}, tls-verification=true, tag=${l}`;
      const u = "tls" === (Pe(t, "security") || "tls");
      return `${"vless"}=${a(i)}:${c}, method=none, password=${s}, ${"obfs"}=${u ? "wss" : "ws"}, ${"obfs"}-host=${r}, ${"obfs"}-uri=${o}${u ? ", tls-verification=true, tls13=true" : ""}, tag=${l}`;
    }),
    i = n
      .map((t, e) => {
        const n = t.indexOf("#");
        if (n < 0) return `${"节点"}${e + 1}`;
        try {
          return decodeURIComponent(t.slice(n + 1)) || `${"节点"}${e + 1}`;
        } catch (t) {
          return `${"节点"}${e + 1}`;
        }
      })
      .join(", ");
  return `[general]\nnetwork_check_url=https://www.gstatic.com/generate_204\nserver_check_url=https://www.gstatic.com/generate_204\ndns_exclusion_list=*.cmpassport.com, *.qq.com, *.weibo.com, *.icloud.com\n[dns]\nserver=223.5.5.5\nserver=119.29.29.29\n[server_local]\n${s.join("\n")}\n[policy]\nstatic=${"🚀"} ${"节点选择"}, ${i}, img-url=https://fastly.jsdelivr.net/gh/${"Koolson"}/${"Qure"}@master/IconSet/Color/Proxy.png\nstatic=${"🌐"} ${"全球直连"}, direct, img-url=https://fastly.jsdelivr.net/gh/${"Koolson"}/${"Qure"}@master/IconSet/Color/Direct.png\nstatic=${"🐟"} ${"漏网之鱼"}, ${"🚀"} ${"节点选择"}, direct, img-url=https://fastly.jsdelivr.net/gh/${"Koolson"}/${"Qure"}@master/IconSet/Color/Final.png\n[filter_local]\n${"geoip"}, cn, ${"🌐"} ${"全球直连"}\nfinal, ${"🐟"} ${"漏网之鱼"}\n`;
}
let Xe = !1;
const Qe = 4;
let Fe = 0;
const Be = [];
function Ke() {
  return Fe < Qe ? (Fe++, Promise.resolve()) : new Promise((t) => Be.push(t));
}
function qe() {
  const t = Be.shift();
  t ? t() : Fe--;
}
async function tn(t, e) {
  const n = [];
  let r = 0;
  const o = Array.from(
    {
      length: Math.min(Qe, t.length),
    },
    async () => {
      for (; r < t.length; ) {
        const o = r++;
        await Ke();
        try {
          n[o] = await e(t[o], o);
        } catch (t) {
          n[o] = !1;
        } finally {
          qe();
        }
      }
    },
  );
  return (await Promise.all(o), n);
}
let en = null,
  nn = null;
async function rn(e, n, r) {
  if (!Xe) return !0;
  if (V(e)) return !0;
  const o = r || 2e3;
  try {
    const r = connectSocket({
      hostname: e,
      port: n,
    });
    await Promise.race([r.opened, new Promise((t, e) => setTimeout(() => e(new Error("proxy timeout")), o))]);
    try {
      r.close();
    } catch (t) {}
    return !0;
  } catch (t) {
    return !1;
  }
}
const on = {
  t: 0,
  list: null,
};
let an = "";
const sn = {
  list: null,
  at: 0,
  key: "",
};
async function cn() {
  const t = String(an || "").trim(),
    e = t || "__default__";
  if (sn.key === e && sn.list && Date.now() - sn.at < 6e5) return sn.list;
  const n = [],
    r = (
      t
        ? ye(t)
            .filter((t) => /^https?:\/\//i.test(t))
            .slice(0, 10)
            .map((t) => ({
              url: t,
              label: "兜底",
              count: 100,
            }))
        : D
    ).map(async (t) => {
      try {
        const e = await ge(
          t.url,
          {
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          },
          8e3,
        );
        if (!e.ok) return;
        const r = await e.text(),
          o = [];
        for (const e of r.split(/[\r\n]+/)) {
          const n = e.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?$/);
          n &&
            o.length < t.count &&
            o.push({
              ip: n[1],
              port: n[2] ? parseInt(n[2], 10) : 443,
              name: t.label + "-" + String(o.length + 1).padStart(2, "0"),
            });
        }
        o.forEach((t) => n.push(t));
      } catch (t) {}
    });
  return (await Promise.all(r), (sn.list = n), (sn.at = Date.now()), (sn.key = e), n);
}
const ln = new Map(),
  un = "https://api.cloudflareclient.com/v0a5641/reg",
  pn = "https://api.cloudflareclient.com/v0a2158/reg",
  dn = "www.microsoft.com";
function hn(t) {
  let e = "";
  for (let n = 0; n < t.length; n++) e += String.fromCharCode(t[n]);
  return btoa(e);
}
function fn(t) {
  try {
    const e = String(t || "")
        .replace(/-/g, "+")
        .replace(/_/g, "/"),
      n = e.length % 4,
      r = atob(n ? e + (2 === n ? "==" : "=") : e),
      o = new Uint8Array(r.length);
    for (let t = 0; t < r.length; t++) o[t] = r.charCodeAt(t);
    return o;
  } catch (t) {
    return null;
  }
}
async function mn(t, n, r) {
  try {
    if ("masque" === r)
      return (async function (t, n) {
        try {
          if (t._mkc) return t._mkc;
          let r = null;
          try {
            const e = JSON.parse(String(t.masqueConf || ""));
            e && e.mk && e.k && e.p && (r = e);
          } catch (t) {}
          if (r) return (t._mkc = r);
          const o = await (async function () {
            try {
              const t = await crypto.subtle.generateKey(
                  {
                    name: "ECDSA",
                    namedCurve: "P-256",
                  },
                  !0,
                  ["sign", "verify"],
                ),
                n = (function (t) {
                  try {
                    const e = fn(t.d),
                      n = fn(t.x),
                      r = fn(t.y);
                    if (!e || !n || !r || 32 !== e.length || 32 !== n.length || 32 !== r.length) return null;
                    const o = new Uint8Array(121);
                    return (
                      o.set([48, 119, 2, 1, 1, 4, 32], 0),
                      o.set(e, 7),
                      o.set([160, 10, 6, 8, 42, 134, 72, 206, 61, 3, 1, 7], 39),
                      o.set([161, 68, 3, 66, 0], 51),
                      (o[56] = 4),
                      o.set(n, 57),
                      o.set(r, 89),
                      o
                    );
                  } catch (t) {
                    return null;
                  }
                })(await crypto.subtle.exportKey("jwk", t.privateKey));
              return n
                ? {
                    pub: hn(new Uint8Array(await crypto.subtle.exportKey("spki", t.publicKey))),
                    pri: hn(n),
                  }
                : null;
            } catch (t) {
              return null;
            }
          })();
          if (!o) return null;
          let a = null;
          for (let t = 0; t < 3 && !a; t++) {
            try {
              const t = await fetch(pn, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "User-Agent": "okhttp/3.12.1",
                  "CF-Client-Version": "a-6.30.0",
                },
                body: JSON.stringify({
                  ["fcm_token"]: "",
                  ["install_id"]: "",
                  key: o.pub,
                  locale: "en_US",
                  model: "PC",
                  tos: new Date().toISOString(),
                  ["serial_number"]: "",
                  ["tunnel_type"]: "masque",
                }),
                signal: AbortSignal.timeout(1e4),
              });
              t.ok && (a = t);
            } catch (t) {}
            !a && t < 2 && (await new Promise((e) => setTimeout(e, 800 * (t + 1))));
          }
          if (!a) return null;
          const s = await a.json(),
            i = s && s.config,
            c = i && i.peers && i.peers[0],
            l = i && i.interface;
          if (!c || !l || !c.public_key) return null;
          const u = c.endpoint || {};
          let p = String(u.host || u.v4 || u.v6 || "");
          const d = p.lastIndexOf(":");
          (d > 0 && (p = p.slice(0, d)),
            (p = p || "162.159.198.2"),
            (r = {
              mk: 1,
              k: o.pri,
              p: String(c.public_key)
                .replace(/-----[^-]+-----/g, "")
                .replace(/\s+/g, ""),
              a4: String((l.addresses && l.addresses.v4) || ""),
              a6: String((l.addresses && l.addresses.v6) || ""),
              h: p,
              pt: Number((u.ports && u.ports[0]) || 443) || 443,
              cid: String(i.client_id || ""),
              at: Date.now(),
            }));
          try {
            const e = JSON.parse(JSON.stringify(t));
            (delete e._mkc,
              (e.masqueConf = JSON.stringify(r)),
              (t.masqueConf = e.masqueConf),
              await saveBackendConfig(n, e));
          } catch (t) {}
          return (t._mkc = r);
        } catch (t) {
          return null;
        }
      })(t, n);
    if (t._wgc) return t._wgc;
    let o = null;
    try {
      const n = JSON.parse(String(t.warpConf || ""));
      n && n.k && n.p && n.a4 && ((n.cid = gn(n["reserved"] || n.cid || "")), (o = n));
    } catch (t) {}
    if (o) return (t._wgc = o);
    const a = await (async function () {
      try {
        const t = await crypto.subtle.generateKey(
            {
              name: "X25519",
            },
            !0,
            ["deriveBits"],
          ),
          n = new Uint8Array(await crypto.subtle.exportKey("raw", t.publicKey)),
          r = new Uint8Array(await crypto.subtle.exportKey("pkcs8", t.privateKey));
        return {
          pub: hn(n),
          pri: hn(r.slice(r.length - 32)),
        };
      } catch (t) {
        return null;
      }
    })();
    if (!a) return null;
    let s = null;
    for (let t = 0; t < 3 && !s; t++) {
      try {
        const t = await fetch(un, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "1.1.1.1/6.38.9-5641 (Android 16.0.0)",
            "CF-Client-Version": "a-6.38.9-5641",
          },
          body: JSON.stringify({
            ["fcm_token"]: "",
            ["install_id"]: "",
            key: a.pub,
            locale: "en_US",
            model: "PC",
            tos: new Date().toISOString(),
            ["serial_number"]: "",
            os_version: "16.0.0",
            ["key_type"]: "curve25519",
            ["tunnel_type"]: "wireguard",
          }),
          signal: AbortSignal.timeout(1e4),
        });
        t.ok && (s = t);
      } catch (t) {}
      !s && t < 2 && (await new Promise((e) => setTimeout(e, 800 * (t + 1))));
    }
    if (!s) return null;
    const i = await s.json(),
      c = i && i.config,
      l = c && c.peers && c.peers[0],
      u = c && c.interface;
    if (!l || !u || !l.public_key) return null;
    const p = l.endpoint || {};
    let d = String(p.host || p.v4 || p.v6 || "");
    const h = d.lastIndexOf(":");
    (h > 0 && (d = d.slice(0, h)),
      (d = d || "engage.cloudflareclient.com"),
      (o = {
        k: a.pri,
        p: String(l.public_key),
        a4: String((u.addresses && u.addresses.v4) || ""),
        a6: String((u.addresses && u.addresses.v6) || ""),
        h: d,
        pt: Number((p.ports && p.ports[0]) || 2408) || 2408,
        cid: gn(c["reserved"] || c.client_id || ""),
        at: Date.now(),
      }));
    try {
      const e = JSON.parse(JSON.stringify(t));
      (delete e._wgc,
        (e.warpConf = JSON.stringify(o)),
        (t.warpConf = e.warpConf),
        (e.warpEnable = !0),
        await saveBackendConfig(n, e));
    } catch (t) {}
    return (t._wgc = o);
  } catch (t) {
    return null;
  }
}
function gn(t) {
  try {
    const e = String(t || "");
    return e ? (3 !== atob(e.replace(/-/g, "+").replace(/_/g, "/")).length ? "" : e) : "";
  } catch (t) {
    return "";
  }
}
const yn = [
    "162.159.192.1:2408",
    "162.159.192.2:2408",
    "162.159.192.3:2408",
    "162.159.192.4:2408",
    "162.159.192.5:2408",
    "162.159.192.6:2408",
    "162.159.192.7:2408",
    "162.159.192.8:2408",
    "162.159.192.9:2408",
    "162.159.192.10:2408",
    "162.159.192.11:2408",
    "162.159.192.12:2408",
    "162.159.192.13:2408",
    "162.159.193.1:2408",
    "162.159.193.2:2408",
    "162.159.193.3:2408",
    "162.159.193.4:2408",
    "162.159.193.5:2408",
    "162.159.193.6:2408",
    "162.159.193.7:2408",
    "162.159.193.8:2408",
    "162.159.193.9:2408",
    "162.159.193.10:2408",
    "162.159.193.11:2408",
    "162.159.193.12:2408",
    "162.159.193.13:2408",
    "162.159.195.1:2408",
    "162.159.195.2:2408",
    "162.159.195.3:2408",
    "162.159.195.4:2408",
    "162.159.195.5:2408",
    "162.159.195.6:2408",
    "162.159.195.7:2408",
    "162.159.195.8:2408",
    "162.159.195.9:2408",
    "162.159.195.10:2408",
    "162.159.195.11:2408",
    "162.159.195.12:2408",
    "162.159.204.1:2408",
    "162.159.204.2:2408",
    "162.159.204.3:2408",
    "162.159.204.4:2408",
    "162.159.204.5:2408",
    "162.159.204.6:2408",
    "162.159.204.7:2408",
    "162.159.204.8:2408",
    "162.159.204.9:2408",
    "162.159.204.10:2408",
    "162.159.204.11:2408",
    "162.159.204.12:2408",
    "188.114.96.1:2408",
    "188.114.96.2:2408",
    "188.114.96.3:2408",
    "188.114.96.4:2408",
    "188.114.96.5:2408",
    "188.114.96.6:2408",
    "188.114.96.7:2408",
    "188.114.96.8:2408",
    "188.114.96.9:2408",
    "188.114.96.10:2408",
    "188.114.96.11:2408",
    "188.114.96.12:2408",
    "188.114.96.13:2408",
    "188.114.97.1:2408",
    "188.114.97.2:2408",
    "188.114.97.3:2408",
    "188.114.97.4:2408",
    "188.114.97.5:2408",
    "188.114.97.6:2408",
    "188.114.97.7:2408",
    "188.114.97.8:2408",
    "188.114.97.9:2408",
    "188.114.97.10:2408",
    "188.114.97.11:2408",
    "188.114.97.12:2408",
    "188.114.98.1:2408",
    "188.114.98.2:2408",
    "188.114.98.3:2408",
    "188.114.98.4:2408",
    "188.114.98.5:2408",
    "188.114.98.6:2408",
    "188.114.98.7:2408",
    "188.114.98.8:2408",
    "188.114.98.9:2408",
    "188.114.98.10:2408",
    "188.114.98.11:2408",
    "188.114.98.12:2408",
    "188.114.99.1:2408",
    "188.114.99.2:2408",
    "188.114.99.3:2408",
    "188.114.99.4:2408",
    "188.114.99.5:2408",
    "188.114.99.6:2408",
    "188.114.99.7:2408",
    "188.114.99.8:2408",
    "188.114.99.9:2408",
    "188.114.99.10:2408",
    "188.114.99.11:2408",
    "188.114.99.12:2408",
    "188.114.99.13:2408",
  ],
  wn = [
    "162.159.198.2:443",
    "162.159.198.2:8443",
    "162.159.198.2:4443",
    "162.159.198.2:8095",
    "162.159.198.2:500",
    "162.159.198.2:1701",
    "162.159.198.2:4500",
    "162.159.199.2:443",
    "162.159.199.2:8443",
    "162.159.199.2:4443",
    "162.159.199.2:8095",
    "162.159.199.2:500",
    "162.159.199.2:1701",
    "162.159.199.2:4500",
    "[2606:4700:103::2]:443",
    "[2606:4700:103::2]:8443",
    "[2606:4700:103::2]:4443",
    "[2606:4700:103::2]:8095",
    "[2606:4700:103::2]:500",
    "[2606:4700:103::2]:1701",
    "[2606:4700:103::2]:4500",
    "[2606:4700:104::2]:443",
    "[2606:4700:104::2]:8443",
    "[2606:4700:104::2]:4443",
    "[2606:4700:104::2]:8095",
    "[2606:4700:104::2]:500",
    "[2606:4700:104::2]:1701",
    "[2606:4700:104::2]:4500",
  ];
function bn(t, n, r, o) {
  const a = "masque" === o,
    s = String((a ? n.masqueEps : n.warpEps) || "")
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean),
    i = (s.length ? s : a ? wn : yn).slice(0, 50),
    c = [];
  return (
    t.a4 && c.push(String(t.a4).split("/")[0]),
    t.a6 && c.push(String(t.a6).split("/")[0]),
    i.map((e, o) => {
      const s = (function (t) {
          let e = String(t || "").trim();
          if ("[" === e.charAt(0)) {
            const t = e.indexOf("]");
            if (t > 0)
              return {
                h: e.slice(1, t),
                p: parseInt(e.slice(t + 2), 10) || 0,
              };
          }
          const n = e.lastIndexOf(":");
          return n > 0 && e.indexOf(":") === n
            ? {
                h: e.slice(0, n),
                p: parseInt(e.slice(n + 1), 10) || 0,
              }
            : {
                h: e,
                p: 0,
              };
        })(e),
        l = {
          name: r + (i.length > 1 ? "·" + String(o + 1) : ""),
          host: s.h,
          port: s.p || t.pt,
          local: c,
          k: t.k,
          p: t.p,
          cid: t.cid,
        };
      if (a) {
        ((l.mg = 1), (l.sni = String(n.masqueSni || "").trim() || dn));
        const t = String(n.masqueNet || "").trim();
        t && (l.msnet = t);
      }
      return l;
    })
  );
}
function In(t) {
  const e = String(t || "").lastIndexOf("·");
  return e > 0 ? String(t).slice(0, e) : String(t || "WARP");
}
async function generateSubscription(config, requestUrl, format, userAgent, colo, visitorCountry, env) {
  (config.path && "/" !== config.path && "" !== config.path) || (config.path = config.uuid);
  let p = "";
  try {
    p = (new URL(requestUrl).searchParams.get("country") || "").trim();
  } catch (t) {}
  const d = (p || String(config.countryLabel || "")).trim(),
    h = (await _e(env)) || colo;
  if (
    (config.filter && config.filter.ipType,
    ke(config) &&
      (await (async function () {
        const t = Date.now();
        if (!(C && t - C < 216e5))
          try {
            const e = await fetch("https://www.cloudflare.com/ips-v6/", {
              signal: AbortSignal.timeout(1e4),
            });
            if (!e.ok) return;
            const n = await e.text(),
              r = String(n)
                .split("\n")
                .map((t) => t.trim())
                .filter((t) => /^[0-9a-fA-F:.]+\/\d+$/.test(t) && t.indexOf(":") >= 0);
            r.length >= 3 && ((x = r), (C = t));
          } catch (t) {}
      })()),
    "" === ((config.optimizer && config.optimizer.subMode) || "") &&
      !1 &&
      (!config.preferredIPs || config.preferredIPs.length < 80))
  ) {
    let r = !1;
    try {
      const t = await (async function (t) {
        if (!t || !t.K || "function" != typeof t.K.get) return null;
        try {
          const e = await t.K.get("initPool");
          if (!e) return null;
          const n = JSON.parse(e);
          return n && Array.isArray(n.ips) && n.ips.length
            ? Date.now() - (n.at || 0) > 216e5
              ? null
              : n.ips
            : null;
        } catch (t) {
          return null;
        }
      })(env);
      if (t && t.length) {
        const e = new Set((config.preferredIPs || []).map((t) => t.ip)),
          o = t.filter((t) => t && t.ip && !e.has(t.ip));
        (o.length && (config.preferredIPs = [...(config.preferredIPs || []), ...o]), (r = !0));
      }
    } catch (t) {}
    if (!r)
      try {
        const [r, o, a] = await Promise.all([
            cn().catch(() => []),
            ae(200).catch(() => null),
            Promise.resolve(ft(_.join("\n"))),
          ]),
          s = [],
          i = [],
          c = new Set((config.preferredIPs || []).map((t) => t.ip));
        for (const t of [...(config.preferredIPs || []), ...(r || []), ...(o || []), ...a]) {
          if (!t || !t.ip || c.has(t.ip)) continue;
          c.add(t.ip);
          const e = {
            ip: t.ip,
            port: t.port || 443,
            name: t.name || "",
            relay: !!t.relay,
          };
          e.relay || !V(e.ip) ? i.push(e) : s.push(e);
        }
        const l = i.slice(0, 24),
          p = s.slice(0, 16),
          [d, h] = await Promise.all([
            tn(l, (n) =>
              (async function (n, r) {
                return (
                  !Xe ||
                  (async function (n, r) {
                    const o = 2500 || 2500;
                    try {
                      const a = connectSocket({
                        hostname: n,
                        port: r,
                      });
                      await Promise.race([
                        a.opened,
                        new Promise((t, e) => setTimeout(() => e(new Error("tcp timeout")), o)),
                      ]);
                      const s = a.writable.getWriter(),
                        i = a.readable.getReader();
                      await s.write(
                        new TextEncoder().encode(
                          "GET / HTTP/1.1\r\nHost: " +
                            n +
                            "\r\nUser-Agent: Mozilla/5.0\r\n" +
                            "Connect" +
                            "ion: close\r\n\r\n",
                        ),
                      );
                      const c = await Promise.race([
                        i.read(),
                        new Promise((t, e) => setTimeout(() => e(new Error("http timeout")), o)),
                      ]);
                      try {
                        a.close();
                      } catch (t) {}
                      const l = new TextDecoder().decode(c.value || new Uint8Array(0));
                      return /^HTTP\/1\.[01] (200|204)/.test(l);
                    } catch (t) {
                      return !1;
                    }
                  })(n, r)
                );
              })(n.ip, n.port || 443),
            ),
            tn(p, (t) => rn(t.ip, t.port || 443, 2500)),
          ]),
          f = l.filter((t, e) => d[e]),
          m = [...p.filter((t, e) => h[e]), ...s.slice(p.length)].slice(0, 210),
          g = [...f, ...i.slice(l.length)].slice(0, 40);
        ((config.preferredIPs = [...(config.preferredIPs || []), ...m, ...g].slice(0, 250)),
          (async function (t, e) {
            if (t && t.K && "function" == typeof t.K.put)
              try {
                const n = (e || [])
                  .filter((t) => t && t.ip)
                  .map((t) => ({
                    ip: t.ip,
                    port: t.port || 443,
                    name: t.name || "",
                    relay: !!t.relay,
                  }))
                  .slice(0, 250);
                if (!n.length) return;
                if (!nt()) return;
                await t.K.put(
                  "initPool",
                  JSON.stringify({
                    at: Date.now(),
                    ips: n,
                  }),
                );
              } catch (t) {}
          })(env, config.preferredIPs));
      } catch (t) {}
  }
  const f = config.host || new URL(requestUrl).hostname,
    m = !/\.workers\.dev$/i.test(f),
    g = Object.assign({}, config, {
      host: f,
    });
  (m && (g.tlsOnly = !0), g.enableVless || g.enableTrojan || g.enableXhttp || (g.enableVless = !0));
  const y = (config.optimizer && config.optimizer.subMode) || "",
    w = !("home" !== String(config.mode || "").toLowerCase() && !config.homeWan);
  if (w)
    try {
      g.homeWanNodes = await at(env, g);
    } catch (t) {}
  let b = [];
  const I = (config.filter && config.filter.ipType) || [],
    P = 1 === I.length && "IPv6" === I[0],
    S = ke(config),
    A = ft(_.join("\n")).map((t) => ({
      ip: t.ip,
      port: t.port || 443,
      name: t.name || "优选IP-" + String(_.indexOf(t) + 1).padStart(2, "0"),
    }));
  if ("custom" === y) {
    const t = !(!config.optimizer || !config.optimizer.subIncludeDefault),
      e = !t;
    if (((b = await we(config.preferredDomains || "", e ? 200 : 40, e ? 2e3 : 300, t, t, S)), t)) {
      const t = await we(L, 40, 240, !1, !0, S),
        e = new Set(t.map((t) => t.ip));
      ((b = [...t, ...b.filter((t) => !e.has(t.ip))]),
        (g.preferredIPs = [...(g.preferredIPs || []), ...A]),
        g.optimizer || (g.optimizer = {}),
        (g.optimizer.fillCount = Math.max(parseInt(g.optimizer.fillCount) || 0, 0)));
    }
  } else if ("" === y) {
    const t = config.src || {},
      e = !0 === t.native,
      r = !1 !== t.prefDomain,
      o = !1 !== t.prefIp,
      a = !0 === t.customPref;
    (e &&
      !P &&
      (g.preferredDomains = (g.preferredDomains ? g.preferredDomains + "\n" : "") + g.host + "#原生地址"),
      a || (g.preferredIPs = []));
    const s = (config.filter || {}).region;
    if (Array.isArray(s) ? 0 === s.length || s.includes("all") : !s || "all" === s) {
      if (((b = []), r && !P)) {
        const t = await (async function (t) {
          if (!Xe)
            return String(t || "")
              .split(/[\n,;]+/)
              .map((t) => t.trim().replace(/^\*\./, ""))
              .filter(Boolean)
              .join("\n");
          if (Date.now() - on.t < 6e5 && null !== on.list) return on.list;
          const e = String(t || "")
              .split(/[\n,;]+/)
              .map((t) => t.trim().replace(/^\*\./, ""))
              .filter(Boolean),
            n = e.slice(0, 12),
            r = e.slice(12),
            o = (
              await tn(n, async (t) => {
                const e = await (async function (t) {
                  try {
                    const e = await ge(
                      "https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(t) + "&type=A",
                      {
                        headers: {
                          accept: "application/dns-json",
                        },
                      },
                      4e3,
                    );
                    return (
                      (e &&
                        e.ok &&
                        ((await e.json()).Answer || [])
                          .filter((t) => 1 === t.type && /^\d+\.\d+\.\d+\.\d+$/.test(t.data))
                          .map((t) => t.data)
                          .filter(V)[0]) ||
                      null
                    );
                  } catch (t) {
                    return null;
                  }
                })(t);
                return e && V(e)
                  ? {
                      d: t,
                      ok: await rn(e, 443),
                    }
                  : {
                      d: t,
                      ok: !1,
                    };
              })
            )
              .map((t, e) => (t && t.ok ? n[e] : null))
              .filter(Boolean)
              .concat(r);
          return ((on.t = Date.now()), (on.list = o.join("\n")), on.list);
        })(L);
        t && (g.preferredDomains = (g.preferredDomains ? g.preferredDomains + "\n" : "") + t);
      }
      if (o && !P) {
        const t = await ae(150);
        t && t.length && (g.preferredIPs = [...(g.preferredIPs || []), ...t]);
        try {
          const t = await we(Z, 100, 600, !0, !0, !1);
          t && t.length && (g.preferredIPs = [...(g.preferredIPs || []), ...t]);
        } catch (t) {}
      }
      if (S && r)
        try {
          const t = L + (P ? "\n" + W.join("\n") : ""),
            e = await we(t, 40, P ? 800 : 240, !1, !0, !0);
          e && e.length && (g.preferredIPs = [...(g.preferredIPs || []), ...e]);
        } catch (t) {}
    } else r && (b = await we(L, 100, 300, !1, !0, S));
    if (o)
      if (P) {
        const t = A.map((t) => ({
          ip: dt(t.ip),
          port: t.port || 443,
          name: t.name,
        })).filter((t) => t.ip);
        g.preferredIPs = [...(g.preferredIPs || []), ...t];
      } else if (S) {
        const t = A.map((t) => ({
          ip: dt(t.ip),
          port: t.port || 443,
          name: t.name,
        })).filter((t) => t.ip);
        g.preferredIPs = [...(g.preferredIPs || []), ...A, ...t];
      } else g.preferredIPs = [...(g.preferredIPs || []), ...A];
    if (!(e || r || o || a))
      if (P) {
        const t = A.map((t) => ({
          ip: dt(t.ip),
          port: t.port || 443,
          name: t.name,
        })).filter((t) => t.ip);
        g.preferredIPs = [...(g.preferredIPs || []), ...t];
      } else g.preferredIPs = [...(g.preferredIPs || []), ...A];
    if (
      (P && g.preferredIPs && (g.preferredIPs = g.preferredIPs.filter((t) => String(t.ip).indexOf(":") >= 0)),
      g.optimizer || (g.optimizer = {}),
      (g.optimizer.fillCount = Math.max(parseInt(g.optimizer.fillCount) || 0, 0)),
      !1 && g.preferredIPs && g.preferredIPs.length)
    ) {
      const t = E.map((t, e) => ({
          ip: t,
          port: 443,
          name: "优选IP-S" + String(e + 1).padStart(2, "0"),
        })),
        e = new Set(t.map((t) => t.ip));
      g.preferredIPs = [...t, ...g.preferredIPs.filter((t) => !e.has(t.ip))];
    }
  }
  if (b.length) {
    let t = b;
    const e = (g.preferredIPs || []).length;
    ((t = t.map((t, n) =>
      /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}-\d+$/.test(t.name || "")
        ? Object.assign({}, t, {
            name: "优选IP-" + String(e + n + 1).padStart(2, "0"),
          })
        : t,
    )),
      (g.preferredIPs = [...(g.preferredIPs || []), ...t]));
  }
  (P && g.preferredIPs && (g.preferredIPs = g.preferredIPs.filter((t) => String(t.ip).indexOf(":") >= 0)),
    (userAgent = (userAgent || "").toLowerCase()));
  const U = (format || "").toLowerCase();
  ["clash", "singbox", "sing-box", "surge", "surfboard", "loon", "quanx", "quantumultx"].includes(U) ||
    clientUserAgentPattern.test(userAgent);
  let T = 1e4;
  if (config.nodeLimit) {
    const t = parseInt(config.nodeLimitCount) || 0;
    t > 0 && (T = Math.min(t, 1e3));
  }
  (config._quotaCap && (T = Math.min(T, config._quotaCap)),
    config.cpuLimit && (T = Math.max(10, Math.floor(0.6 * T))));
  const R =
      "random" === y
        ? Object.assign({}, config.filter, {
            region: "all",
          })
        : config.filter,
    N = !(!w || "custom" === y),
    H = String(config.mode || "").toLowerCase();
  let O,
    D = null;
  if ("masque" === H) {
    const t = await mn(config, env, H);
    t && (D = bn(t, config, String(config.masqueName || "") || "WARP", H));
  } else if ("warp" === H) {
    const t = await mn(config, env, H);
    D = t ? bn(t, config, String(config.warpName || "") || "WARP", H) : null;
  }
  if (((Le = null), D && D.length)) {
    const t = (function (t) {
      try {
        const n = String(t["warpFront"] || "")
          .split(/[\n\r]+/)
          .map(function (t) {
            return t.trim();
          })
          .filter(Boolean)[0];
        if (!n) return null;
        const r = /^([A-Za-z0-9]+):\/\/([\s\S]*)$/.exec(n);
        if (!r) return null;
        const o = r[1].toLowerCase();
        let a = r[2],
          s = "前置节点";
        const i = a.indexOf("#");
        if (i >= 0) {
          try {
            s = decodeURIComponent(a.slice(i + 1)) || s;
          } catch (t) {}
          a = a.slice(0, i);
        }
        const c = {},
          l = a.indexOf("?");
        l >= 0 &&
          (a
            .slice(l + 1)
            .split("&")
            .forEach(function (t) {
              const e = t.split("=");
              if (e[0])
                try {
                  c[decodeURIComponent(e[0]).toLowerCase()] = decodeURIComponent(
                    (e[1] || "").replace(/\+/g, " "),
                  );
                } catch (t) {}
            }),
          (a = a.slice(0, l)));
        const u = a.lastIndexOf("@"),
          p = u >= 0 ? a.slice(u + 1) : a,
          d = u >= 0 ? a.slice(0, u) : "",
          h = /^\[([^\]]+)\]:(\d+)$/.exec(p) || /^([^:]+):(\d+)$/.exec(p);
        if (!h) return null;
        const f = h[1],
          m = parseInt(h[2], 10);
        if (!f || !(m > 0 && m < 65536)) return null;
        let g = "",
          y = "";
        if (d) {
          const t = d.indexOf(":");
          t >= 0 ? ((g = d.slice(0, t)), (y = d.slice(t + 1))) : (g = d);
        }
        const w = String(c["security"] || "").toLowerCase(),
          b = "tls" === w || "reality" === w || "trojan" === o || "https" === o,
          I = String(c["type"] || "tcp").toLowerCase();
        if ((({}["udp"] = !0), "socks5" === o || "socks" === o)) {
          const t = {
            name: s,
            type: "socks5",
            server: f,
            port: m,
          };
          return ((t["udp"] = !0), g && (t["username"] = g), y && (t["password"] = y), t);
        }
        if ("http" === o || "https" === o) {
          const t = {
            name: s,
            type: "http",
            server: f,
            port: m,
          };
          return (
            (t["udp"] = !0),
            g && (t["username"] = g),
            y && (t["password"] = y),
            "https" === o && (t["tls"] = !0),
            t
          );
        }
        if ("ss" === o || o === "shadowsocks") {
          let t = "",
            n = d;
          if (d.indexOf(":") >= 0) ((t = d.slice(0, d.indexOf(":"))), (n = d.slice(d.indexOf(":") + 1)));
          else
            try {
              const e = atob(d),
                r = e.indexOf(":");
              r >= 0 && ((t = e.slice(0, r)), (n = e.slice(r + 1)));
            } catch (t) {}
          if (!t || !n) return null;
          let r = n;
          try {
            r = decodeURIComponent(n);
          } catch (t) {}
          const o = {
            name: s,
            type: "shadowsocks",
            server: f,
            port: m,
            ["cipher"]: t,
            ["password"]: r,
          };
          return ((o["udp"] = !0), o);
        }
        if ("trojan" === o || o === "trojan") {
          const t = {
            name: s,
            type: "trojan",
            server: f,
            port: m,
            password: g + (y ? ":" + y : ""),
            skip_: 0,
          };
          delete t.skip_;
          const n = {};
          if (
            ((n["tls"] = !0),
            (n["skip-cert-verify"] = !(
              "false" === String(c["allowinsecure"] || "") || "0" === String(c["allowinsecure"] || "")
            )),
            (n["servername"] = c["sni"] || c["peer"] || c["host"] || f),
            c["alpn"] &&
              (n["alpn"] = c["alpn"]
                .split(",")
                .map(function (t) {
                  return t.trim();
                })
                .filter(Boolean)),
            Object.assign(t, n),
            (t["udp"] = !0),
            (t["network"] =
              "ws" === I ? "ws" : "grpc" === I ? "grpc" : "http" === I || "h2" === I ? "http" : "tcp"),
            "ws" === I)
          ) {
            t["network"] = "ws";
            const n = {
              path: c["path"] || "/",
              headers: {
                Host: c["host"] || c["sni"] || f,
              },
            };
            t["ws-opts"] = n;
          } else if ("grpc" === I) {
            t["network"] = "grpc";
            const n = {};
            ((n["grpc-service-name"] = c["servicename"] || c["path"] || ""), (t["grpc-opts"] = n));
          }
          return t;
        }
        if ("vless" === o || o === "vless") {
          if (!g) return null;
          const t = {
            name: s,
            type: "vless",
            server: f,
            port: m,
            uuid: g,
          };
          if (
            ((t["udp"] = !0),
            b &&
              ((t["tls"] = !0),
              (t["skip-cert-verify"] = !(
                "false" === String(c["allowinsecure"] || "") || "0" === String(c["allowinsecure"] || "")
              )),
              (t["servername"] = c["sni"] || c["host"] || f),
              c["fp"] && (t["client-fingerprint"] = c["fp"]),
              c["alpn"] &&
                (t["alpn"] = c["alpn"]
                  .split(",")
                  .map(function (t) {
                    return t.trim();
                  })
                  .filter(Boolean)),
              c["flow"] && (t["flow"] = c["flow"]),
              "reality" === w))
          ) {
            const n = {};
            ((n["public-key"] = c["pbk"] || ""),
              c["sid"] && (n["short-id"] = c["sid"]),
              (t["reality-opts"] = n));
          }
          if (
            ((t["network"] =
              "ws" === I ? "ws" : "grpc" === I ? "grpc" : "http" === I || "h2" === I ? "http" : "tcp"),
            "ws" === I)
          ) {
            t["network"] = "ws";
            const n = {
              path: c["path"] || "/",
              headers: {
                Host: c["host"] || c["sni"] || f,
              },
            };
            t["ws-opts"] = n;
          } else if ("grpc" === I) {
            t["network"] = "grpc";
            const n = {};
            ((n["grpc-service-name"] = c["servicename"] || c["path"] || ""), (t["grpc-opts"] = n));
          }
          return t;
        }
        return null;
      } catch (t) {
        return null;
      }
    })(config);
    if (t) {
      Le = t;
      for (let n = 0; n < D.length; n++) D[n]["dialerProxy"] = t.name;
    }
  }
  ((O = N
    ? (function (t, e, n) {
        const r = Array.isArray(n) ? n.slice(0, 3) : [];
        if (r.length >= 3) return r;
        const o = new Set();
        for (const e of r)
          try {
            o.add(Ie(e).host);
          } catch (t) {}
        for (const e of E) {
          if (r.length >= 3) break;
          o.has(e) || (o.add(e), r.push(ue(t, e, 443, "隧道前置-" + String(r.length + 1).padStart(2, "0"))));
        }
        return r;
      })(g, 0, Ce(await be(g, T, null), R).slice(0, 3))
    : Ce(await be(g, T, null), R)),
    N || (O = Te(O, config, P)));
  const G = "custom" === y && !(config.optimizer && config.optimizer.subIncludeDefault);
  // A node limit caps output; it must never add untested addresses to reach the cap.
  (N ||
      G ||
      P ||
      (D && D.length) ||
      (function (t, n, r) {
        if (t.length >= r) return;
        const o = new Set();
        for (const e of t)
          try {
            o.add(Ie(e).host);
          } catch (t) {}
        n.src &&
          !0 === n.src.native &&
          ((a) => {
            if (t.length >= r) return;
            if (o.has(a)) return;
            o.add(a);
            const s = le("原生地址", !!n.enableVless, !!n.enableTrojan, !!n.enableXhttp);
            (n.enableVless && t.push(ue(n, a, 443, s.v)),
              n.enableTrojan && t.push(pe(n, a, 443, s.t)),
              n.enableXhttp &&
                t.push(
                  ue(n, a, 443, s.x, {
                    type: "xhttp",
                  }),
                ));
          })(n.host);
      })(O, g, T),
    N ||
      !0 ||
      P ||
      (G && O.length > 0) ||
      (function (t, n) {
        const r = t.length + 3 * E.length,
          o = new Set();
        for (const e of t)
          try {
            o.add(Ie(e).host);
          } catch (t) {}
        let a = 0;
        for (const s of E) {
          if (t.length >= r) break;
          if (o.has(s)) continue;
          (o.add(s), a++);
          const i = le(
            "内置·保底-" + String(a).padStart(2, "0"),
            !!n.enableVless,
            !!n.enableTrojan,
            !!n.enableXhttp,
          );
          if ((n.enableVless && t.push(ue(n, s, 443, i.v)), t.length >= r)) break;
          if ((n.enableTrojan && t.push(pe(n, s, 443, i.t)), t.length >= r)) break;
          n.enableXhttp &&
            t.push(
              ue(n, s, 443, i.x, {
                type: "xhttp",
              }),
            );
        }
      })(O, g));
  if (
    (N || (O = Te(O, config, P)),
    (function (t, e, n) {
      if (t.length < 2) return t;
      const r = !1 !== e.loadBalance && "random" !== n,
        o = "tail" === (e && e.ipv6Mode),
        a = [],
        s = [],
        i = [];
      for (const e of t) Ne(e) ? a.push(e) : o && Ve(e) ? i.push(e) : s.push(e);
      if (!a.length && !i.length) return (r && Me(t), t);
      (r && (Me(a), Me(s)), (t.length = 0));
      for (let e = 0; e < a.length; e++) t.push(a[e]);
      for (let e = 0; e < s.length; e++) t.push(s[e]);
      for (let e = 0; e < i.length; e++) t.push(i[e]);
    })(O, config, y),
    O.length > T && (O.length = T),
    (O = (function (t, e, n) {
      const r = String(n || "")
          .trim()
          .toUpperCase(),
        o = String(e || "").toUpperCase(),
        a = "OFF" === r ? "" : k[r] || M[o] || o || "",
        s = new Set();
      return t.map((t) => {
        let e = "";
        try {
          e = Se(t, 0).name || "";
        } catch (t) {
          e = "";
        }
        const n = e;
        let r = Oe(e);
        (!r && a && ((r = a), (e = e ? a + "·" + e : a + "·优选")), e || (e = "节点"));
        let o = e,
          i = 2;
        for (; s.has(o); ) ((o = e + "·" + i), i++);
        return (
          s.add(o),
          o === n
            ? t
            : (function (t, e) {
                const n = String(t),
                  r = n.indexOf("#");
                return (r >= 0 ? n.slice(0, r) : n) + "#" + ce(e);
              })(t, o)
        );
      });
    })(O, h, d)),
    !(O.length || (D && D.length)))
  )
    for (let t = 0; t < E.length; t++)
      try {
        O.push(ue(g, E[t], 443, "兜底-" + String(t + 1).padStart(2, "0")));
      } catch (t) {}
  if (
    "warp" === String(config.mode || "").toLowerCase() ||
    "masque" === String(config.mode || "").toLowerCase()
  ) {
    const t = "masque" === String(config.mode || "").toLowerCase(),
      r = t
        ? ["clash"]
        : [
            "clash",
            "singbox",
            "sing-box",
            "hiddify",
            "plain",
            "raw",
            "v2ray",
            "v2rayn",
            "shadowrocket",
            "nekoray",
            "stash",
          ];
    if (
      !r.includes(U) &&
      !r.some(function (t) {
        return userAgent && userAgent.includes(t);
      })
    )
      return {
        type: "text/plain",
        body:
          "# 当前为 " +
          (t ? "MASQUE" : "WARP") +
          " 模式：本订阅格式不支持该模式的原生节点，未下发任何节点。请改用支持该模式的客户端与订阅格式。\n",
      };
    O = [];
  }
  let J, Y;
  const z = () => {
      const t = O.slice();
      try {
        t.push(ue(g, g.host, 443, "域名直连·对照"));
      } catch (t) {}
      return {
        type: "text/plain",
        body: t.join("\n"),
      };
    },
    j = () =>
      (D || [])
        .filter((t) => !t.mg)
        .map((t) => {
          try {
            const n = t.cid ? atob(t.cid) : "";
            return (
              "wireguard://" +
              encodeURIComponent(t.k) +
              "@" +
              t.host +
              ":" +
              t.port +
              "/?publickey=" +
              encodeURIComponent(t.p) +
              "&address=" +
              encodeURIComponent(t.local.map((t) => t + (t.indexOf(":") >= 0 ? "/128" : "/32")).join(",")) +
              (t.cid ? "&reserved=" + n.charCodeAt(0) + "," + n.charCodeAt(1) + "," + n.charCodeAt(2) : "") +
              "&mtu=1280#" +
              encodeURIComponent(t.name)
            );
          } catch (t) {
            return "";
          }
        })
        .filter(Boolean)
        .join("\n");
  if ("karing" === U) return z();
  if ("clash" === U)
    ((J = "text/yaml"),
      (Y = Ge(g, O, colo, new URL(requestUrl).origin + "/crules/" + Sn(g), visitorCountry, d, h, D)));
  else if ("singbox" === U || "sing-box" === U || "hiddify" === U)
    ((J = "application/json"), (Y = Ye(g, O, D)));
  else if ("surge" === U) ((J = "text/plain"), (Y = ze(g, O)));
  else if ("surfboard" === U) ((J = "text/plain"), (Y = Je(g, O)));
  else if ("loon" === U) ((J = "text/plain"), (Y = je(g, O)));
  else if ("quanx" === U || "quantumultx" === U) ((J = "text/plain"), (Y = $e(g, O)));
  else if ("plain" === U || "raw" === U) ((J = "text/plain"), (Y = O.join("\n") + (j() ? "\n" + j() : "")));
  else if ("v2ray" === U || "v2rayn" === U || "shadowrocket" === U || "nekoray" === U || "stash" === U)
    ((J = "text/plain"), (Y = O.join("\n") + (j() ? "\n" + j() : "")));
  else if (userAgent.includes("clash") || userAgent.includes("stash"))
    ((J = "text/yaml"),
      (Y = Ge(g, O, colo, new URL(requestUrl).origin + "/crules/" + Sn(g), visitorCountry, d, h, D)));
  else {
    if (karingUserAgentPattern.test(userAgent)) return z();
    userAgent.includes("sing-box")
      ? ((J = "application/json"), (Y = Ye(g, O, D)))
      : userAgent.includes("surge")
        ? ((J = "text/plain"), (Y = ze(g, O)))
        : userAgent.includes("surfboard")
          ? ((J = "text/plain"), (Y = Je(g, O)))
          : userAgent.includes("loon")
            ? ((J = "text/plain"), (Y = je(g, O)))
            : userAgent.includes("quantumult")
              ? ((J = "text/plain"), (Y = $e(g, O)))
              : userAgent.includes("mozilla")
                ? ((J = "text/yaml"),
                  (Y = Ge(
                    g,
                    O,
                    colo,
                    new URL(requestUrl).origin + "/crules/" + Sn(g),
                    visitorCountry,
                    d,
                    h,
                    D,
                  )))
                : ((J = "text/plain"), (Y = O.join("\n") + (j() ? "\n" + j() : "")));
  }
  return {
    type: J,
    body: Y,
  };
}
function Sn(t) {
  return Q(String((t && t.uuid) || "") + "|rule").slice(0, 12);
}
const vn = new Map(),
  An = {
    sub: {
      cap: 30,
      burst: 10,
      refillMs: 6e4,
    },
    panel: {
      cap: 60,
      burst: 20,
      refillMs: 6e4,
    },
  };
function consumeRequestToken(request, kind) {
  const r = An[kind];
  if (!r) return !0;
  const o = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Real-IP") || "";
  if (!o) return !0;
  const a = Date.now();
  vn.size > 2e3 && vn.clear();
  const s = kind + "|" + o;
  let i = vn.get(s);
  i ||
    ((i = {
      tokens: r.cap,
      t: a,
    }),
    vn.set(s, i));
  const c = Math.floor((a - i.t) / r.refillMs);
  return (
    c > 0 && ((i.tokens = Math.min(r.cap, i.tokens + c * r.burst)), (i.t = i.t + c * r.refillMs)),
    !(i.tokens <= 0 || (i.tokens--, 0))
  );
}
function unauthorizedResponse() {
  return camouflageResponse();
}
const Cn = `\n<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Welcome</title>\n<style>\n*{box-sizing:border-box;margin:0;padding:0}\nbody{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1216;color:#e8ecf2;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}\nmain{text-align:center;padding:2rem}\nh1{font-size:1.9rem;font-weight:600;letter-spacing:.02em}\np{margin-top:.75rem;color:#8b95a7;font-size:.95rem}\ni{display:inline-block;width:8px;height:8px;border-radius:50%;background:#3ba55d;margin-right:.5rem;vertical-align:middle}\n</style>\n</head>\n<body>\n<main>\n<h1>Welcome</h1>\n<p><i></i>Service is running</p>\n</main>\n</body>\n</html>\n`;
function camouflageResponse() {
  const t = en && (en.MASK || "");
  return "1101" === t
    ? (function () {
        const t = Tn(),
          n = new Date(),
          r = function (t) {
            return String(t).padStart(2, "0");
          },
          o =
            n.getUTCFullYear() +
            "-" +
            r(n.getUTCMonth() + 1) +
            "-" +
            r(n.getUTCDate()) +
            " " +
            r(n.getUTCHours()) +
            ":" +
            r(n.getUTCMinutes()) +
            ":" +
            r(n.getUTCSeconds()),
          a = Array.from(crypto.getRandomValues(new Uint8Array(8)), function (t) {
            return t.toString(16).padStart(2, "0");
          }).join(""),
          s = (nn && nn.headers.get("CF-Connecting-IP")) || "";
        return new Response(
          `<!DOCTYPE html>\n\x3c!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]--\x3e\n\x3c!--[if IE 7]>    <html class="no-js ie7 oldie" lang="en-US"> <![endif]--\x3e\n\x3c!--[if IE 8]>    <html class="no-js ie8 oldie" lang="en-US"> <![endif]--\x3e\n\x3c!--[if gt IE 8]>\x3c!--\x3e <html class="no-js" lang="en-US"> \x3c!--<![endif]--\x3e\n<head>\n<title>Worker threw exception | ${t} | Cloudflare</title>\n<meta charset="UTF-8" />\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n<meta http-equiv="X-UA-Compatible" content="IE=Edge" />\n<meta name="robots" content="noindex, nofollow" />\n<meta name="viewport" content="width=device-width,initial-scale=1" />\n<style>\nbody{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#fff;color:#404041;font-size:16px;line-height:1.5}\n.cf-wrapper{max-width:960px;margin:0 auto;padding:0 1.5em}\n#cf-error-details{padding:2.5em 0}\n.cf-error-overview h1{font-size:2.6em;font-weight:400;margin:0 0 .3em;line-height:1.2}\n.cf-error-type{color:#404041}\n.cf-error-code{color:#bd2426;font-weight:600}\n.heading-ray-id{display:block;font-size:.5em;color:#92979b;margin-top:.8em;font-weight:400}\n.cf-subheadline{font-size:1.4em;font-weight:400;margin:0 0 1.2em;color:#404041}\n.cf-section{border-top:1px solid #e0e0e0;padding:1.4em 0}\n.cf-error-source{background:#f6f6f6;border:1px solid #e0e0e0;padding:1.2em;color:#606265;font-size:.94em}\n.cf-error-source p{margin:0 0 .8em}\n.cf-error-source p:last-child{margin:0}\n.cf-footer{border-top:1px solid #e0e0e0;padding:1.2em 0;font-size:.86em;color:#92979b}\n.cf-footer a,.cf-section a{color:#2f7bbf;text-decoration:none}\n.cf-footer p{margin:0 0 .4em}\n</style>\n</head>\n<body>\n<div id="cf-wrapper">\n<div id="cf-error-details" class="cf-error-details-wrapper">\n<div class="cf-header cf-error-overview">\n<h1><span class="cf-error-type">Error</span> <span class="cf-error-code">1101</span><small class="heading-ray-id">Ray ID: ${a} &bull; ${o} UTC</small></h1>\n<h2 class="cf-subheadline">Worker threw exception</h2>\n</div>\n<div class="cf-section cf-wrapper">\n<p>You've requested a page on a website (${t}) that is on the <a href="https://www.cloudflare.com/5xx-error-landing/">Cloudflare</a> network. An unknown error occurred while rendering the page.</p>\n</div>\n<div class="cf-section cf-wrapper">\n<div class="cf-error-source">\n<p><strong>What can I do?</strong></p>\n<p><strong>If you are the owner of this website:</strong> contact your hosting provider and let them know your web server is not completing requests. An Error 1101 means that the request reached the server, but the server threw an exception while processing it.</p>\n<p><strong>If you are a visitor:</strong> please try again in a few minutes.</p>\n</div>\n</div>\n</div>\n<div class="cf-footer"><p>Cloudflare Ray ID: <strong>${a}</strong></p><p>Your IP: ${s} &bull; Performance &amp; security by <a href="https://www.cloudflare.com/5xx-error-landing/">Cloudflare</a></p></div>\n</div>\n</body>\n</html>`,
          {
            status: 500,
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
            },
          },
        );
      })()
    : "522" === t
      ? (function () {
          const t = Tn(),
            n = new Date(),
            r = function (t) {
              return String(t).padStart(2, "0");
            },
            o =
              n.getUTCFullYear() +
              "-" +
              r(n.getUTCMonth() + 1) +
              "-" +
              r(n.getUTCDate()) +
              " " +
              r(n.getUTCHours()) +
              ":" +
              r(n.getUTCMinutes()) +
              ":" +
              r(n.getUTCSeconds()),
            a = Array.from(crypto.getRandomValues(new Uint8Array(8)), function (t) {
              return t.toString(16).padStart(2, "0");
            }).join(""),
            s = (nn && nn.headers.get("CF-Connecting-IP")) || "";
          return new Response(
            `<!DOCTYPE html>\n\x3c!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]--\x3e\n\x3c!--[if IE 7]>    <html class="no-js ie7 oldie" lang="en-US"> <![endif]--\x3e\n\x3c!--[if IE 8]>    <html class="no-js ie8 oldie" lang="en-US"> <![endif]--\x3e\n\x3c!--[if gt IE 8]>\x3c!--\x3e <html class="no-js" lang="en-US"> \x3c!--<![endif]--\x3e\n<head>\n<title>${t} | 522: ${"Connect"}ion timed out</title>\n<meta charset="UTF-8" />\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n<meta http-equiv="X-UA-Compatible" content="IE=Edge" />\n<meta name="robots" content="noindex, nofollow" />\n<meta name="viewport" content="width=device-width,initial-scale=1" />\n<style>\nbody{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#fff;color:#404041;font-size:16px;line-height:1.5}\n.cf-wrapper{max-width:960px;margin:0 auto;padding:0 1.5em}\n#cf-error-details{padding:2.5em 0}\n.cf-error-overview h1{font-size:2.6em;font-weight:400;margin:0 0 .3em;line-height:1.2}\n.cf-error-type{color:#404041}\n.cf-error-code{color:#bd2426;font-weight:600}\n.heading-ray-id{display:block;font-size:.5em;color:#92979b;margin-top:.8em;font-weight:400}\n.cf-subheadline{font-size:1.4em;font-weight:400;margin:0 0 1.2em;color:#404041}\n.cf-section{border-top:1px solid #e0e0e0;padding:1.4em 0}\n.cf-error-source{background:#f6f6f6;border:1px solid #e0e0e0;padding:1.2em;color:#606265;font-size:.94em}\n.cf-error-source p{margin:0 0 .8em}\n.cf-error-source p:last-child{margin:0}\n.cf-footer{border-top:1px solid #e0e0e0;padding:1.2em 0;font-size:.86em;color:#92979b}\n.cf-footer a,.cf-section a{color:#2f7bbf;text-decoration:none}\n.cf-footer p{margin:0 0 .4em}\n</style>\n</head>\n<body>\n<div id="cf-wrapper">\n<div id="cf-error-details" class="cf-error-details-wrapper">\n<div class="cf-header cf-error-overview">\n<h1><span class="cf-error-type">Error</span> <span class="cf-error-code">522</span><small class="heading-ray-id">Ray ID: ${a} &bull; ${o} UTC</small></h1>\n<h2 class="cf-subheadline">${"Connect"}ion timed out</h2>\n</div>\n<div class="cf-section cf-wrapper">\n<p>You've requested a page on a website (${t}) that is on the <a href="https://www.cloudflare.com/5xx-error-landing/">Cloudflare</a> network. Cloudflare is currently unable to reach the origin web server.</p>\n</div>\n<div class="cf-section cf-wrapper">\n<div class="cf-error-source">\n<p><strong>What can I do?</strong></p>\n<p><strong>If you are the owner of this website:</strong> contact your hosting provider and let them know your web server is not completing requests. An Error 522 means that the request was able to ${"connect"} to your web server, but it did not reply in time.</p>\n<p><strong>If you are a visitor:</strong> please try again in a few minutes.</p>\n</div>\n</div>\n</div>\n<div class="cf-footer"><p>Cloudflare Ray ID: <strong>${a}</strong></p><p>Your IP: ${s} &bull; Performance &amp; security by <a href="https://www.cloudflare.com/5xx-error-landing/">Cloudflare</a></p></div>\n</div>\n</body>\n</html>`,
            {
              status: 522,
              headers: {
                "Content-Type": "text/html; charset=UTF-8",
                "Cache-Control": "no-store, no-cache, must-revalidate",
                Pragma: "no-cache",
              },
            },
          );
        })()
      : "off" === t || "0" === t
        ? new Response("Not Found", {
            status: 404,
          })
        : new Response(Cn, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
            },
          });
}
function backendErrorResponse() {
  try {
    return camouflageResponse();
  } catch (t) {
    return new Response("Service Unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
function Tn() {
  try {
    return new URL(nn.url).host;
  } catch (t) {
    return "localhost";
  }
}
async function acquireTaskLease(t, e, n) {
  if (!t || !t.K || "function" != typeof t.K.get) return !0;
  try {
    const r = await t.K.get(e),
      o = (r && parseInt(JSON.parse(r).t, 10)) || 0;
    if (o && Date.now() - o < n) return !1;
    const a = t.K.put(
      e,
      JSON.stringify({
        t: Date.now(),
      }),
    );
    return (
      t._ctx && "function" == typeof t._ctx.waitUntil
        ? t._ctx.waitUntil(a.catch(() => {}))
        : await a.catch(() => {}),
      !0
    );
  } catch (t) {
    return !0;
  }
}
export default {
  fetch: async (n, r, o) =>
    (async function (n, r) {
      ((en = r), (nn = n));
      const o = new URL(n.url),
        a = n.headers.get("User-Agent") || "",
        s = (n.headers.get("Upgrade") || "").toLowerCase();
      if ("http:" === o.protocol) return Response.redirect(o.href.replace("http://", "https://"), 301);
      const h = await loadBackendConfig(r);
      cfnApplyTunnelIdentity(n, r, h, s);
      {
        const t = String(n.headers.get("x-cf-host") || "").trim();
        !h.host && /^[A-Za-z0-9.-]{1,253}$/.test(t) && (h.host = t);
      }
      const g = h.path || h.uuid,
        y = o.pathname.replace(/^\/+|\/+$/g, "").split("/");
      if (
        !(function (t, e, n, r, o) {
          try {
            const a = String((e && e.API) || (e && e.GATE) || "").trim();
            return (
              !a ||
              t.headers.get("X-CF-Api") === a ||
              t.headers.get("X-CF-Gate") === a ||
              "crules" === n[0] ||
              "websocket" === r ||
              !("POST" !== t.method || !o || !o.enableXhttp)
            );
          } catch (t) {
            return !0;
          }
        })(n, r, y, s, h)
      )
        return unauthorizedResponse();
      if ("crules" === y[0] && 3 === y.length && y[1] === Sn(h))
        return (async function (t, n) {
          const r = String(n || "").replace(/\.(mrs|yaml|yml|txt|list)$/i, ""),
            o = w[r];
          if (!o)
            return jsonResponse(
              {
                ok: !1,
                msg: "unknown rule set",
              },
              404,
            );
          const a = Date.now(),
            s = b.get(r);
          if (s && a - s.t < 36e5) return P(s.buf, o.ct);
          if (t.K && "function" == typeof t.K.get)
            try {
              const e = await t.K.get("crule:" + r, {
                type: "arrayBuffer",
              });
              if (e && e.byteLength)
                return (
                  b.set(r, {
                    t: a,
                    buf: e,
                  }),
                  P(e, o.ct)
                );
            } catch (t) {}
          let l = I.get(r);
          if (!l) {
            ((l = (async () => {
              const n = await ge(
                o.url,
                {
                  headers: {
                    "User-Agent": APP_NAME + "/" + VERSION,
                    Accept: "*/*",
                  },
                },
                2e4,
              );
              if (!n.ok) throw new Error("upstream HTTP " + n.status);
              const a = await n.arrayBuffer();
              if (!a || !a.byteLength) throw new Error("upstream empty body");
              if (t.K && "function" == typeof t.K.put)
                try {
                  await t.K.put("crule:" + r, a, {
                    expirationTtl: Math.floor(86400),
                  });
                } catch (t) {}
              return (
                b.set(r, {
                  t: Date.now(),
                  buf: a,
                }),
                a
              );
            })()),
              I.set(r, l));
            const n = () => I.delete(r);
            l.then(n, n);
          }
          try {
            return P(await l, o.ct);
          } catch (t) {
            return new Response("rule upstream error: " + (t.message || t), {
              status: 502,
              headers: {
                "Retry-After": "3600",
              },
            });
          }
        })(
          r,
          (function (t) {
            try {
              return decodeURIComponent(t);
            } catch (e) {
              return t;
            }
          })(y[2]),
        );
      const S = String(h.subUrl || "")
          .trim()
          .replace(/^\/+/, "")
          .replace(/\/+$/, ""),
        v =
          y[0] === g ||
          (!!S && y[0] === S) ||
          (function (t, e) {
            try {
              const n = String((e && e.API) || (e && e.GATE) || "").trim();
              return !n || t.headers.get("X-CF-Api") === n || t.headers.get("X-CF-Gate") === n;
            } catch (t) {
              return !0;
            }
          })(n, r);
      if ("" === y[0]) return unauthorizedResponse();
      if (v && 1 === y.length) {
        if ("websocket" === s)
          return (
            De(r, n.cf && n.cf.colo),
            (async function (t, n) {
              const r = new WebSocketPair(),
                [o, a] = Object.values(r);
              try {
                a.accept({
                  allowHalfOpen: !0,
                });
              } catch (t) {
                a.accept();
              }
              a.binaryType = "arraybuffer";
              let s = null,
                i = null,
                c = !1,
                l = null,
                u = null,
                p = !1;
              const d = (t) => {
                  try {
                    a.send(t);
                  } catch (t) {}
                },
                h = async (r, o) => {
                  if ((r && r.byteLength && (l = l ? Jt(l, r) : r), !l)) return;
                  if (l.byteLength > 65536) throw new Error("握手头超过 64KB，关闭连接");
                  let f, m;
                  try {
                    let t = (function (t, e) {
                      if (!e.enableTrojan || !t || t.byteLength < 58) return !1;
                      const n = t.subarray(0, 56);
                      if (
                        textDecoder.decode(n).toLowerCase() === hashTrojanPassword(e.trojanPassword || e.uuid)
                      )
                        return !0;
                      if (13 === t[56] && 10 === t[57]) {
                        for (let t = 0; t < 56; t++) {
                          const e = n[t];
                          if (!((e >= 48 && e <= 57) || (e >= 97 && e <= 102) || (e >= 65 && e <= 70)))
                            return !1;
                        }
                        return !0;
                      }
                      return !1;
                    })(l, n);
                    if (!t && l.byteLength > 0 && 0 !== l[0] && l.byteLength < 58) return;
                    ((m = !t),
                      (f = t
                        ? (function (t) {
                            if (!t || t.byteLength < 66) throw new Error("Trojan 头部过短");
                            const n = new DataView(t.buffer, t.byteOffset, t.byteLength);
                            let r = 58;
                            const o = n.getUint8(r);
                            r += 1;
                            const a = n.getUint8(r);
                            let s, i;
                            if (((r += 1), 1 === a))
                              ((s = `${n.getUint8(r)}.${n.getUint8(r + 1)}.${n.getUint8(r + 2)}.${n.getUint8(r + 3)}`),
                                (i = 4));
                            else if (3 === a) {
                              const e = n.getUint8(r);
                              ((s = textDecoder.decode(t.subarray(r + 1, r + 1 + e))), (i = 1 + e));
                            } else {
                              if (4 !== a) throw new Error("无法识别的地址类型");
                              ((s = it(t.subarray(r, r + 16))), (i = 16));
                            }
                            r += i;
                            const c = n.getUint16(r);
                            return (
                              (r += 2),
                              (r += 2),
                              {
                                command: o,
                                port: c,
                                addr: s,
                                password: textDecoder.decode(t.subarray(0, 56)),
                                headerLength: r,
                              }
                            );
                          })(l)
                        : parseVlessHeader(l)));
                  } catch (t) {
                    if (/\u5934\u90e8\u8fc7\u77ed/.test(t.message || "")) return;
                    throw t;
                  }
                  !p && m && 2 !== f.command && ((p = !0), d(new Uint8Array([0, 0])));
                  const g = te(l.byteLength > f.headerLength ? l.subarray(f.headerLength) : null);
                  if ("unknown" === g && !o)
                    return void (
                      u ||
                      (u = setTimeout(() => {
                        ((u = null),
                          h(new Uint8Array(0), !0).catch((t) => {
                            try {
                              a.close(1011, String((t && t.message) || t));
                            } catch (t) {}
                          }));
                      }, 80))
                    );
                  if ((u && (clearTimeout(u), (u = null)), c)) return;
                  if (((c = !0), 2 === f.command)) {
                    try {
                      const t = l.subarray(f.headerLength);
                      if (53 === f.port && t.byteLength >= 12) {
                        const e = await (async function (t) {
                          if (!t || t.byteLength < 17) return null;
                          const e = new DataView(t.buffer, t.byteOffset, t.byteLength),
                            n = e.getUint16(0);
                          if (32768 & e.getUint16(2)) return null;
                          if (1 !== e.getUint16(4)) return null;
                          let r = 12,
                            o = [];
                          for (; r < t.byteLength; ) {
                            const n = e.getUint8(r);
                            if (0 === n) {
                              r++;
                              break;
                            }
                            if (!(192 & ~n)) {
                              r += 2;
                              break;
                            }
                            if (r + 1 + n > t.byteLength) return null;
                            (o.push(textDecoder.decode(t.subarray(r + 1, r + 1 + n))), (r += 1 + n));
                          }
                          if (r + 4 > t.byteLength || 0 === o.length) return null;
                          const a = e.getUint16(r),
                            s = e.getUint16(r + 2),
                            i = r + 4;
                          if (1 !== a && 28 !== a) return null;
                          const c = o.join("."),
                            l = t.subarray(12, i);
                          let u = null;
                          for (const e of Rt)
                            try {
                              const t = await ge(
                                e + "?name=" + encodeURIComponent(c) + "&type=" + a,
                                {
                                  headers: {
                                    accept: "application/dns-json",
                                  },
                                },
                                5e3,
                              );
                              if (!t || !t.ok) continue;
                              const n = await t.json();
                              if (!n || 0 !== n.Status) continue;
                              const r = (n.Answer || []).filter(
                                (t) =>
                                  t.type === a &&
                                  (1 === t.type
                                    ? st(String(t.data))
                                    : /^[0-9a-fA-F:]+$/.test(String(t.data))),
                              );
                              if (r.length) {
                                u = r;
                                break;
                              }
                            } catch (t) {}
                          if (!u) return null;
                          const p = new Uint8Array(12),
                            d = new DataView(p.buffer);
                          (d.setUint16(0, n),
                            d.setUint16(2, 33152),
                            d.setUint16(4, 1),
                            d.setUint16(6, u.length));
                          const h = [p, l];
                          for (const t of u) {
                            const e = String(t.data),
                              n = 1 === t.type ? Uint8Array.from(e.split(".").map(Number)) : Nt(e);
                            if (n.length !== (1 === t.type ? 4 : 16)) continue;
                            const r = new Uint8Array(10),
                              o = new DataView(r.buffer);
                            (o.setUint16(0, 49164),
                              o.setUint16(2, t.type),
                              o.setUint16(4, 0 === s ? 1 : s),
                              o.setUint32(6, Number(t.TTL) || 300),
                              h.push(r, new Uint8Array([(n.length >> 8) & 255, 255 & n.length]), n));
                          }
                          let f = 0;
                          h.forEach((t) => (f += t.byteLength));
                          const m = new Uint8Array(f);
                          let g = 0;
                          for (const t of h) (m.set(t, g), (g += t.byteLength));
                          return m;
                        })(t);
                        e && d(e);
                      }
                    } catch (t) {}
                    try {
                      a.close(1e3);
                    } catch (t) {}
                    return;
                  }
                  const y = await openOutboundConnection(f, n, t.cf && t.cf.colo, 0, g);
                  ((s = y),
                    (i = y.writable.getWriter()),
                    y._preamble && y._preamble.byteLength > 0 && d(y._preamble),
                    l && l.byteLength > f.headerLength && (await i.write(l.subarray(f.headerLength))),
                    (l = null),
                    (async function (t, e, n) {
                      try {
                        for (;;) {
                          const { done: n, value: r } = await t.read();
                          if (n) break;
                          e(r);
                        }
                      } catch (t) {}
                      try {
                        n && n();
                      } catch (t) {}
                    })(y.readable.getReader(), d, () => {
                      try {
                        a.close(1e3);
                      } catch (t) {}
                    }));
                },
                f = (function (t, e) {
                  if (!t) return null;
                  const n = String(t).trim();
                  if (!n || n.length > 8192) return null;
                  if (!/^[A-Za-z0-9\-_+/=]+$/.test(n)) return null;
                  let r = null;
                  try {
                    const t = n.replace(/-/g, "+").replace(/_/g, "/"),
                      e = t.length % 4 ? "=".repeat(4 - (t.length % 4)) : "",
                      o = atob(t + e);
                    r = new Uint8Array(o.length);
                    for (let t = 0; t < o.length; t++) r[t] = o.charCodeAt(t);
                  } catch (t) {
                    return null;
                  }
                  if (!r.byteLength || r.byteLength > 6144) return null;
                  if (r.byteLength >= 17 && 0 === r[0]) {
                    const t = (function (t) {
                      const e = String(t || "").replace(/-/g, "");
                      if (32 !== e.length) return null;
                      const n = new Uint8Array(16);
                      for (let t = 0; t < 16; t++) {
                        const r = parseInt(e.substr(2 * t, 2), 16);
                        if (isNaN(r)) return null;
                        n[t] = r;
                      }
                      return n;
                    })(e.uuid);
                    if (!t) return r;
                    for (let e = 0; e < 16; e++) if (r[e + 1] !== t[e]) return null;
                    return r;
                  }
                  return e.enableTrojan &&
                    r.byteLength >= 58 &&
                    13 === r[56] &&
                    10 === r[57] &&
                    textDecoder.decode(r.subarray(0, 56)).toLowerCase() ===
                      hashTrojanPassword(e.trojanPassword || e.uuid)
                    ? r
                    : null;
                })(t.headers.get("sec-websocket-protocol"), n);
              (f &&
                h(f).catch((t) => {
                  try {
                    a.close(1011, String((t && t.message) || t));
                  } catch (t) {}
                }),
                a.addEventListener("message", async (t) => {
                  try {
                    const e = "string" == typeof t.data ? textEncoder.encode(t.data) : new Uint8Array(t.data);
                    c ? (i ? await i.write(e) : (l = l ? Jt(l, e) : e)) : await h(e);
                  } catch (t) {
                    try {
                      a.close(1011, String((t && t.message) || t));
                    } catch (t) {}
                  }
                }));
              const m = () => {
                if ((u && (clearTimeout(u), (u = null)), s)) {
                  try {
                    s.close();
                  } catch (t) {}
                  s = null;
                }
              };
              return (
                a.addEventListener("close", m),
                a.addEventListener("error", m),
                new Response(null, {
                  status: 101,
                  webSocket: o,
                })
              );
            })(n, h)
          );
        if ("POST" === n.method && h.enableXhttp) {
          De(r, n.cf && n.cf.colo);
          try {
            return await (async function (t, e) {
              const n = t.body.getReader(),
                r = await n.read();
              if (r.done)
                return new Response("empty", {
                  status: 400,
                });
              const o = parseVlessHeader(r.value),
                a = await openOutboundConnection(
                  o,
                  e,
                  t.cf && t.cf.colo,
                  0,
                  te(r.value.subarray(o.headerLength)),
                ),
                s = a.writable.getWriter();
              (await s.write(r.value.subarray(o.headerLength)),
                (async () => {
                  try {
                    for (;;) {
                      const { done: t, value: e } = await n.read();
                      if (t) break;
                      await s.write(e);
                    }
                  } catch (t) {}
                  try {
                    await s.close();
                  } catch (t) {}
                })());
              const i = new ReadableStream({
                async start(t) {
                  (t.enqueue(new Uint8Array([0, 0])),
                    a._preamble && a._preamble.byteLength > 0 && t.enqueue(a._preamble));
                  const e = a.readable.getReader();
                  try {
                    for (;;) {
                      const { done: n, value: r } = await e.read();
                      if (n) break;
                      t.enqueue(r);
                    }
                  } catch (t) {}
                  try {
                    t.close();
                  } catch (t) {}
                  try {
                    a.close();
                  } catch (t) {}
                },
                cancel() {
                  try {
                    a.close();
                  } catch (t) {}
                },
              });
              return new Response(i, {
                status: 200,
                headers: {
                  "content-type": "application/octet-stream",
                  "x-accel-buffering": "no",
                  "cache-control": "no-store",
                },
              });
            })(n, h);
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "xhttp 错误: " + (t.message || t),
              },
              500,
            );
          }
        }
      }
      if (v && "sub" === y[1]) {
        if (!consumeRequestToken(n, "sub")) return unauthorizedResponse();
        const t = y.length >= 3 ? y[2] : "";
        try {
          if (r._ctx && "function" == typeof r._ctx.waitUntil) r._ctx.waitUntil(updateQuotaProtection(r, h));
          else
            try {
              await updateQuotaProtection(r, h);
            } catch (t) {}
          if (h.quotaDisabled)
            return new Response(APP_NAME + "：账户当日额度已达 99%，订阅已自动停用（次日自动恢复）", {
              status: 403,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
              },
            });
          if (h.quotaStrict)
            try {
              const t = await queryAccountQuota(r, h);
              if (t && t.configured && "number" == typeof t.percent && t.percent > 95)
                return new Response(
                  APP_NAME +
                    "：严格模式已启用，当日额度已达 " +
                    t.percent +
                    "%（阈值 95%），已停止下发任何节点（次日自动恢复）",
                  {
                    status: 403,
                    headers: {
                      "Content-Type": "text/plain; charset=utf-8",
                    },
                  },
                );
            } catch (t) {}
          const o = h;
          if (h.quotaAuto)
            try {
              const t = await queryAccountQuota(r, h);
              if (t.configured && t.today && t.today.requests >= Math.round(6e4)) {
                const e = t.today.requests / t.limit,
                  n = Math.max(0.1, (1 - e) / 0.4);
                o._quotaCap = Math.max(20, Math.round(1e3 * n));
              }
            } catch (t) {}
          const s = await (async function () {
              const e = h.preferredIPs || [],
                s = [
                  h.uuid,
                  n.url,
                  t,
                  a,
                  e.length,
                  (e[0] && e[0].ip) || "",
                  h.nodeLimitCount,
                  h.enableVless ? 1 : 0,
                  h.enableTrojan ? 1 : 0,
                  h.enableXhttp ? 1 : 0,
                  (h.optimizer && h.optimizer.subMode) || "",
                  h.host || "",
                  h.homeWan ? 1 : 0,
                  h._quotaCap || 0,
                  String(h.mode || ""),
                  h.warpEnable ? 1 : 0,
                  (h.warpConf || "").length,
                  h.masqueEnable ? 1 : 0,
                  (h.masqueConf || "").length,
                ].join("|"),
                i = Date.now(),
                c = ln.get(s);
              if (c && i - c.t < 6e4) return c.r;
              const l = await generateSubscription(
                o,
                n.url,
                t,
                a,
                n.cf && n.cf.colo,
                n.cf && n.cf.country,
                r,
              );
              return (
                ln.size > 8 && ln.clear(),
                ln.set(s, {
                  r: l,
                  t: i,
                }),
                l
              );
            })(),
            i =
              {
                ["clash"]: APP_NAME + ".yaml",
                ["stash"]: APP_NAME + ".yaml",
                ["singbox"]: APP_NAME + ".json",
                ["surge"]: APP_NAME + ".conf",
                ["surfboard"]: APP_NAME + ".conf",
                ["loon"]: APP_NAME + ".conf",
                ["quanx"]: APP_NAME + ".conf",
              }[t] || APP_NAME;
          return new Response(s.body, {
            status: 200,
            headers: {
              "Content-Type": s.type + "; charset=utf-8",
              "Cache-Control": "no-store",
              "Content-Disposition": 'attachment; filename="' + i + "\"; filename*=utf-8''" + i,
            },
          });
        } catch (t) {
          return new Response("订阅生成失败: " + ((t && t.message) || t), {
            status: 500,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }
      }
      if (v && "api" === y[1]) {
        if (!consumeRequestToken(n, "panel")) return unauthorizedResponse();
        const s = y[2] || "";
        if ("config" === s) {
          if ("GET" === n.method)
            return jsonResponse({
              ok: !0,
              data: Object.assign({}, h, {
                version: VERSION,
              }),
            });
          if ("POST" === n.method)
            try {
              const t = await n.json();
              let e = !1;
              if (r.K && "function" == typeof r.K.get)
                try {
                  const t = await r.K.get("config", {
                    cacheTtl: 30,
                  });
                  t && void 0 !== JSON.parse(t).quotaAuto && (e = !0);
                } catch (t) {}
              const o = Object.assign(JSON.parse(JSON.stringify(h)), t);
              ("home" === String(o.mode || "").toLowerCase() ? (o.homeWan = !0) : (o.homeWan = !1),
                e ||
                  !1 !== o.quotaAuto ||
                  (Boolean((o.cfAccountId && o.cfApiToken) || (r.CF_ACCOUNT_ID && r.CF_API_TOKEN)) &&
                    (o.quotaAuto = !0)),
                t.optimizer &&
                  "object" == typeof t.optimizer &&
                  (o.optimizer = Object.assign(o.optimizer, t.optimizer)),
                t.preferredIPs && Array.isArray(t.preferredIPs) && (o.preferredIPs = t.preferredIPs),
                await saveBackendConfig(r, o));
              const a = await loadBackendConfig(r, n.url);
              return jsonResponse({
                ok: !0,
                data: Object.assign({}, a, {
                  version: VERSION,
                }),
                msg: "已保存并生效",
              });
            } catch (t) {
              return jsonResponse(
                {
                  ok: !1,
                  msg: "保存失败: " + (t.message || t),
                },
                500,
              );
            }
        }
        if ("reset" === s) {
          if ("POST" !== n.method)
            return jsonResponse(
              {
                ok: !1,
                msg: "仅支持 POST",
              },
              405,
            );
          try {
            if (!r.K || "function" != typeof r.K.delete)
              return jsonResponse(
                {
                  ok: !1,
                  msg: "未绑定 KV 命名空间，无需重置",
                },
                400,
              );
            await r.K.delete("config");
            const t = AUTH_COOKIE_NAME + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
            return new Response(
              JSON.stringify({
                ok: !0,
                msg: "已重置：KV 已清空，面板还原为初始部署状态",
              }),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  "Set-Cookie": t,
                },
              },
            );
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "重置失败: " + (t.message || t),
              },
              500,
            );
          }
        }
        if ("status" === s)
          return jsonResponse({
            ok: !0,
            data: {
              version: VERSION,
              kind:
                "novel" === deploymentKind()
                  ? "小说混淆版"
                  : "obfuscated" === deploymentKind()
                    ? "混淆版"
                    : "明文版",
              host: o.hostname,
              path: g,
              region: (n.cf && n.cf.colo) || "unknown",
              visitorCountry: (n.cf && n.cf.country) || "",
              usageColo: await _e(r),
              kv: !(!r.K || "function" != typeof r.K.get),
              workersDev: /\.workers\.dev$/i.test(o.hostname),
              adminEnv: !(!r.ADMIN && !r.admin),
            },
          });
        if ("update" === s)
          try {
            const t = await (async function () {
                const t = Date.now();
                if (d && t - d.t < 6e4) return d.r;
                const n =
                  "novel" === deploymentKind()
                    ? "小说混淆"
                    : "obfuscated" === deploymentKind()
                      ? "混淆"
                      : "明文";
                let r = null,
                  o = "",
                  a = "";
                const s =
                  "https://raw.githubusercontent.com/" +
                  UPDATE_REPO +
                  "/main/" +
                  encodeURIComponent("CFNext-明文版.js");
                try {
                  const t = await fetch(s, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (CFNext)",
                    },
                    signal: AbortSignal.timeout(1e4),
                  });
                  if (t.ok) {
                    const e = m(await t.text());
                    e && (r = e);
                  }
                } catch (t) {
                  a = (t && t.message) || String(t);
                }
                if (r) {
                  const a =
                    "https://raw.githubusercontent.com/" +
                    UPDATE_REPO +
                    "/main/" +
                    encodeURIComponent(
                      "小说混淆" === n
                        ? "CFNext-小说混淆版.js"
                        : "混淆" === n
                          ? "CFNext-混淆版.js"
                          : "CFNext-明文版.js",
                    );
                  try {
                    const t = await fetch(a, {
                      headers: {
                        "User-Agent": "Mozilla/5.0 (CFNext)",
                      },
                      signal: AbortSignal.timeout(1e4),
                    });
                    t.ok && (o = await t.text());
                  } catch (t) {}
                  return (
                    (d = {
                      t: t,
                      r: {
                        current: VERSION,
                        kind: n,
                        latest: r,
                        hasUpdate: f(r, VERSION) > 0,
                        code: o,
                        checkedAt: t,
                      },
                    }),
                    d.r
                  );
                }
                const c =
                  "https://raw.githubusercontent.com/" +
                  UPDATE_REPO +
                  "/main/" +
                  encodeURIComponent("CFNext-混淆版.js");
                try {
                  const t = await fetch(c, {
                    headers: {
                      "User-Agent": "Mozilla/5.0 (CFNext)",
                    },
                    signal: AbortSignal.timeout(1e4),
                  });
                  if (t.ok) {
                    const e = m(await t.text());
                    e && (r = e);
                  }
                } catch (t) {
                  a = (t && t.message) || String(t);
                }
                return r
                  ? ((d = {
                      t: t,
                      r: {
                        current: VERSION,
                        kind: n,
                        latest: r,
                        hasUpdate: f(r, VERSION) > 0,
                        code: "",
                        checkedAt: t,
                      },
                    }),
                    d.r)
                  : {
                      current: VERSION,
                      kind: n,
                      latest: null,
                      hasUpdate: !1,
                      code: "",
                      error: a || "未在仓库中找到版本信息",
                    };
              })(),
              n = {
                current: t.current,
                latest: t.latest,
                hasUpdate: t.hasUpdate,
                kind: t.kind,
                error: t.error || "",
              };
            return (
              t.hasUpdate && t.code && (n.code = t.code),
              jsonResponse({
                ok: !0,
                data: n,
              })
            );
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "检测失败: " + (t.message || t),
              },
              500,
            );
          }
        if ("quota" === s)
          try {
            return jsonResponse({
              ok: !0,
              data: await queryAccountQuota(r, h),
            });
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "查询失败: " + (t.message || t),
              },
              500,
            );
          }
        if ("sub" === s) {
          const t = o.searchParams.get("fmt") || "";
          try {
            const e = await generateSubscription(h, n.url, t, a, n.cf && n.cf.colo, n.cf && n.cf.country, r);
            return jsonResponse({
              ok: !0,
              type: e.type,
              body: e.body,
            });
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "订阅生成失败: " + (t.message || t),
              },
              500,
            );
          }
        }
        if ("candidates" === s) {
          if ("POST" !== n.method)
            return jsonResponse(
              {
                ok: !1,
                msg: "仅支持 POST",
              },
              405,
            );
          try {
            const t = await n.json().catch(() => ({})),
              e = await se(Object.assign({}, h.optimizer, t));
            if (!e.candidates.length) {
              const t = e.stats || {},
                n = [t.presetErr && "预设源: " + t.presetErr, t.customErr && "自定义源: " + t.customErr]
                  .filter(Boolean)
                  .join("；");
              return jsonResponse(
                {
                  ok: !1,
                  msg: "没有可测的 IP" + (n ? "（" + n + "）" : "，请换一个数据源"),
                },
                400,
              );
            }
            return jsonResponse({
              ok: !0,
              data: e.candidates,
              stats: e.stats,
            });
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "拉取失败: " + (t.message || t),
              },
              500,
            );
          }
        }
        if ("hwlist" === s)
          try {
            const e = o.searchParams.get("country") || "",
              n = o.searchParams.get("proto") || "tcp",
              r = await B(e);
            if (!r.length)
              return jsonResponse(
                {
                  ok: !1,
                  msg: "VPN Gate 列表为空（可能被限流，请稍后重试）",
                },
                400,
              );
            const a = r.slice(0, 30),
              s = await tn(a, (e) => {
                const n = String(q(K(e.ovpnB64)).remote || "").split(/\s+/),
                  r = parseInt(n[1], 10) || 0;
                return r
                  ? (async function (e, n) {
                      const r = Date.now();
                      try {
                        const o = connectSocket({
                          hostname: e,
                          port: n,
                        });
                        await Promise.race([
                          o.opened,
                          new Promise((t, e) => setTimeout(() => e(new Error("tcp timeout")), 2e3)),
                        ]);
                        const a = Date.now() - r;
                        try {
                          o.close();
                        } catch (t) {}
                        return {
                          ok: !0,
                          delay: a,
                        };
                      } catch (t) {
                        return {
                          ok: !1,
                          delay: -1,
                        };
                      }
                    })(e.ip, r)
                  : {
                      ok: !1,
                      delay: -1,
                    };
              }),
              i = a.map((t, e) => {
                const r = q(K(t.ovpnB64)),
                  o = String(r.remote || "").split(/\s+/),
                  a = parseInt(o[1], 10) || 443;
                return {
                  host: t.host,
                  ip: t.ip,
                  port: a,
                  tcp: a,
                  udp: a,
                  speed: t.speed,
                  ping: t.ping,
                  country: t.country,
                  proto: r.proto || n,
                  ovpn: r,
                  alive: !(!s[e] || !s[e].ok),
                  delay: s[e] && s[e].ok ? s[e].delay : -1,
                };
              });
            return (
              i.sort((t, e) => (e.alive ? 1 : 0) - (t.alive ? 1 : 0) || (e.speed || 0) - (t.speed || 0)),
              jsonResponse({
                ok: !0,
                data: i,
                proto: n,
              })
            );
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "VPN Gate 拉取失败: " + (t.message || t),
              },
              500,
            );
          }
        if ("hwrefresh" === s)
          try {
            const t = await loadBackendConfig(r),
              e = await at(r, t, !0);
            return jsonResponse({
              ok: !0,
              data: e,
              count: e.length,
            });
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "VPN Gate 刷新失败: " + (t.message || t),
              },
              500,
            );
          }
        if ("domains" === s)
          try {
            const t = J[o.searchParams.get("source") || "wetest_cname"] || J.wetest_cname,
              n = await fetch(t.url, {
                headers: {
                  "User-Agent": "Mozilla/5.0",
                },
                signal: AbortSignal.timeout(6e3),
              });
            return n.ok
              ? jsonResponse({
                  ok: !0,
                  data: (function (t) {
                    const n = new Set(),
                      r = [],
                      o = /(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}/gi;
                    let a;
                    for (; (a = o.exec(t)); ) {
                      const t = a[0].toLowerCase();
                      !n.has(t) &&
                        (t.includes("cloudflare") ||
                          t.includes("bestcf") ||
                          t.includes("182682") ||
                          t.includes("090227") ||
                          t.endsWith(".xyz") ||
                          t.endsWith(".top")) &&
                        (n.add(t), r.push(t));
                    }
                    return r.slice(0, 10);
                  })(await n.text()),
                })
              : jsonResponse({
                  ok: !1,
                  msg: "拉取失败 HTTP " + n.status,
                });
          } catch (t) {
            return jsonResponse(
              {
                ok: !1,
                msg: "拉取失败: " + (t.message || t),
              },
              500,
            );
          }
      }
      return camouflageResponse();
    })(
      n,
      Object.assign({}, r, {
        _ctx: o,
      }),
    ).catch(backendErrorResponse),
  scheduled: async (t, e, n) =>
    (async function (t, e) {
      en = e;
      const n = String(e.HOME_WAN_AUTO || "").toLowerCase();
      if ("1" === n || "true" === n)
        try {
          if (await acquireTaskLease(e, "hwrefreshAt", 9e5)) {
            const t = await loadBackendConfig(e);
            t.homeWan && (await at(e, t, !0));
          }
        } catch (t) {}
      const r = String(e.BESTIP_AUTO || "").toLowerCase();
      if ("1" === r || "true" === r)
        try {
          (await acquireTaskLease(e, "autobestAt", 18e5)) &&
            (await (async function (t) {
              const e = await loadBackendConfig(t),
                n = (await se(e.optimizer)).candidates || [];
              if (!n.length)
                return {
                  ok: !1,
                  msg: "没有可测的 IP",
                };
              const r = (
                await (async function (t, e, n) {
                  ((e = Math.max(1, Math.min(50, Number(e) || 5))), (n = Math.max(500, Number(n) || 5e3)));
                  const r = [];
                  let o = 0;
                  return (
                    await Promise.all(
                      Array.from(
                        {
                          length: e,
                        },
                        async function () {
                          for (; o < t.length; ) {
                            const e = t[o++],
                              a = await ie(e.ip, e.port, n);
                            r.push(a);
                          }
                        },
                      ),
                    ),
                    r.sort((t, e) => (t.latency < 0 ? 1e9 : t.latency) - (e.latency < 0 ? 1e9 : e.latency)),
                    r
                  );
                })(n, e.optimizer.threads || 5, 5e3)
              )
                .filter((t) => t.ok)
                .slice(0, e.optimizer.count || 20);
              if (!r.length)
                return {
                  ok: !1,
                  msg: "测速无可用 IP",
                };
              const o = r.map((t) => ({
                  ip: t.ip,
                  port: t.port || 443,
                  name: "",
                })),
                a = new Set((e.preferredIPs || []).map((t) => t.ip)),
                s = new Set(o.map((t) => t.ip)),
                i = !(a.size === s.size && [...s].every((t) => a.has(t)));
              i && ((e.preferredIPs = o), await saveBackendConfig(t, e));
              try {
                await updateQuotaProtection(t, e);
              } catch (t) {}
              return {
                ok: !0,
                changed: i,
                count: o.length,
              };
            })(e));
        } catch (t) {}
    })(0, e).catch(() => {}),
};
// Frontend failover identity: never accept this extension without the backend API secret.
function cfnApplyTunnelIdentity(request, env, config, upgrade) {
  const api = String(env.API || env.GATE || "").trim();
  const uuid = String(request.headers.get("x-cf-tunnel-uuid") || "").trim();
  if (!api || (request.headers.get("X-CF-Api") !== api && request.headers.get("X-CF-Gate") !== api)) return;
  if (upgrade !== "websocket" && !(request.method === "POST" && config.enableXhttp)) return;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) return;
  config.uuid = uuid.toLowerCase();
}
