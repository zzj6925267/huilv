(() => {
  const CURRENCIES = [
    { code: "CNY", name: "人民币" },
    { code: "USD", name: "美元" },
    { code: "EUR", name: "欧元" },
    { code: "JPY", name: "日元" },
    { code: "GBP", name: "英镑" },
    { code: "HKD", name: "港币" },
    { code: "AUD", name: "澳元" },
    { code: "CAD", name: "加元" },
    { code: "SGD", name: "新加坡元" },
    { code: "KRW", name: "韩元" },
    { code: "CHF", name: "瑞士法郎" },
    { code: "TWD", name: "新台币" },
    { code: "THB", name: "泰铢" },
    { code: "MYR", name: "马来西亚林吉特" },
    { code: "NZD", name: "新西兰元" },
  ];

  const API_URL = "https://open.er-api.com/v6/latest/USD";
  const CACHE_KEY = "huilv_rates_cache_v1";
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  const amountEl = document.getElementById("amount");
  const fromEl = document.getElementById("from");
  const toEl = document.getElementById("to");
  const swapEl = document.getElementById("swap");
  const refreshEl = document.getElementById("refresh");
  const statusEl = document.getElementById("status");
  const resultValueEl = document.getElementById("resultValue");
  const resultRateEl = document.getElementById("resultRate");
  const mobileHintEl = document.getElementById("mobileHint");

  let rates = null;
  let updatedAt = null;

  function fillSelects() {
    const options = CURRENCIES.map(
      (c) => `<option value="${c.code}">${c.code} · ${c.name}</option>`
    ).join("");
    fromEl.innerHTML = options;
    toEl.innerHTML = options;
    fromEl.value = "CNY";
    toEl.value = "USD";
  }

  function parseAmount(raw) {
    const cleaned = String(raw).replace(/,/g, "").trim();
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatNumber(n, maxFrac = 4) {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: Math.min(digits, maxFrac + 2),
      minimumFractionDigits: 0,
    }).format(n);
  }

  function labelOf(code) {
    const found = CURRENCIES.find((c) => c.code === code);
    return found ? `${code}（${found.name}）` : code;
  }

  function convert() {
    if (!rates) {
      resultValueEl.textContent = "—";
      resultRateEl.textContent = "";
      return;
    }

    const amount = parseAmount(amountEl.value);
    const from = fromEl.value;
    const to = toEl.value;

    if (!Number.isFinite(amount)) {
      resultValueEl.textContent = "请输入有效金额";
      resultRateEl.textContent = "";
      return;
    }

    const fromRate = rates[from];
    const toRate = rates[to];
    if (!fromRate || !toRate) {
      resultValueEl.textContent = "暂不支持该币种";
      resultRateEl.textContent = "";
      return;
    }

    const usdAmount = amount / fromRate;
    const converted = usdAmount * toRate;
    const unitRate = toRate / fromRate;

    resultValueEl.textContent = `${formatNumber(amount)} ${from} = ${formatNumber(converted)} ${to}`;
    resultRateEl.textContent = `1 ${from} ≈ ${formatNumber(unitRate, 6)} ${to}`;
  }

  function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#9b2c2c" : "";
  }

  function saveCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (_) {
      /* ignore quota errors */
    }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data?.rates || !data?.fetchedAt) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  async function fetchRates({ force = false } = {}) {
    refreshEl.disabled = true;

    const cached = loadCache();
    const cacheFresh =
      cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS && !force;

    if (cacheFresh) {
      rates = cached.rates;
      updatedAt = cached.updatedAt || cached.fetchedAt;
      setStatus(`已使用今日缓存 · 更新于 ${formatTime(updatedAt)}`);
      convert();
      refreshEl.disabled = false;
      return;
    }

    setStatus(force ? "正在刷新汇率…" : "正在获取最新汇率…");

    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.result !== "success" || !data.rates) {
        throw new Error(data["error-type"] || "接口返回异常");
      }

      rates = data.rates;
      updatedAt = data.time_last_update_utc
        ? Date.parse(data.time_last_update_utc)
        : Date.now();

      saveCache({
        rates,
        updatedAt,
        fetchedAt: Date.now(),
      });

      setStatus(`汇率已更新 · ${formatTime(updatedAt)}（每日同步）`);
      convert();
    } catch (err) {
      if (cached?.rates) {
        rates = cached.rates;
        updatedAt = cached.updatedAt || cached.fetchedAt;
        setStatus(`网络异常，已使用本地缓存 · ${formatTime(updatedAt)}`, true);
        convert();
      } else {
        setStatus("获取汇率失败，请检查网络后重试", true);
      }
    } finally {
      refreshEl.disabled = false;
    }
  }

  function formatTime(ts) {
    if (!ts) return "未知时间";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  }

  async function showMobileHint() {
    if (!window.huilvDesktop?.getLanUrl) return;
    try {
      const info = await window.huilvDesktop.getLanUrl();
      if (!info?.url) return;
      mobileHintEl.hidden = false;
      mobileHintEl.innerHTML = `同一 Wi‑Fi 下手机可打开 <code>${info.url}</code>`;
    } catch (_) {
      /* not in Electron */
    }
  }

  amountEl.addEventListener("input", convert);
  fromEl.addEventListener("change", convert);
  toEl.addEventListener("change", convert);

  swapEl.addEventListener("click", () => {
    const a = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = a;
    swapEl.classList.remove("spin");
    void swapEl.offsetWidth;
    swapEl.classList.add("spin");
    convert();
  });

  refreshEl.addEventListener("click", () => fetchRates({ force: true }));

  fillSelects();
  fetchRates();
  showMobileHint();
})();
