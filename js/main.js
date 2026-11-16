/*
 * 友多加亭 共通スクリプト（両方のページで読み込む）
 * - 店舗データ（shop-data.js）をページに反映する
 * - 営業中／準備中の表示
 * - X ボタン、画面下の固定バー
 */
(function () {
  "use strict";

  var SHOP = window.SHOP;

  /* ---------- 時刻 ---------- */

  function toMin(hhmm) {
    var p = hhmm.split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }

  // 日本時間の「0 時からの分」。確認用に ?now=10:59 のように時刻を指定できる。
  function nowMin() {
    var test = new URLSearchParams(location.search).get("now");
    if (test && /^\d{1,2}:\d{2}$/.test(test)) return toMin(test);
    var parts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    var h = 0, m = 0;
    parts.forEach(function (p) {
      if (p.type === "hour") h = Number(p.value);
      if (p.type === "minute") m = Number(p.value);
    });
    return h * 60 + m;
  }

  function isOpen() {
    var n = nowMin();
    return n >= toMin(SHOP.hours.open) && n < toMin(SHOP.hours.close);
  }

  function yen(n) { return n.toLocaleString("ja-JP"); }

  window.SHOP_UTIL = { toMin: toMin, nowMin: nowMin, isOpen: isOpen, yen: yen };

  /* ---------- 店舗データの反映 ---------- */

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  var telHref = "tel:" + SHOP.tel.replace(/[^0-9+]/g, "");
  each("[data-tel]", function (el) {
    el.setAttribute("href", telHref);
    if (el.getAttribute("data-tel") !== "keep") el.textContent = SHOP.tel;
  });
  each("[data-hours]", function (el) { el.textContent = SHOP.hours.open + "〜" + SHOP.hours.close; });
  each("[data-holiday]", function (el) { el.textContent = SHOP.hours.holiday; });
  each("[data-postal]", function (el) { el.textContent = SHOP.postal; });
  each("[data-address]", function (el) { el.textContent = SHOP.address; });
  each("[data-map]", function (el) { el.setAttribute("href", SHOP.mapUrl); });
  each("[data-includes]", function (el) { el.textContent = SHOP.teishoku.includes; });

  /* ---------- X ボタン ---------- */

  var xNote = document.getElementById("x-note");
  each("[data-x]", function (el) {
    if (SHOP.xUrl) {
      el.setAttribute("href", SHOP.xUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
      return;
    }
    el.addEventListener("click", function (e) {
      e.preventDefault();
      if (xNote && xNote.showModal) xNote.showModal();
    });
  });

  /* ---------- 営業中／準備中 ---------- */

  var status = document.getElementById("status");
  var statusText = document.getElementById("status-text");
  function renderStatus() {
    if (!status) return;
    var open = isOpen();
    status.classList.toggle("is-open", open);
    statusText.textContent = open ? "ただいま営業中" : "ただいま準備中（" + SHOP.hours.open + " から）";
  }
  renderStatus();
  setInterval(renderStatus, 30000);

  /* ---------- 定食のしくみ・人気のおかず ---------- */

  var plans = document.getElementById("plans");
  if (plans) {
    plans.textContent = "";
    SHOP.teishoku.plans.forEach(function (plan) {
      var li = document.createElement("li");
      li.className = "plan";

      var count = document.createElement("span");
      count.className = "plan__count";
      count.append("おかず");
      var num = document.createElement("b");
      num.textContent = plan.count;
      count.append(num, "品");

      var dishes = document.createElement("span");
      dishes.className = "plan__dishes";
      dishes.setAttribute("aria-hidden", "true");
      for (var i = 0; i < plan.count; i++) {
        var dish = document.createElement("span");
        dish.className = "plan__dish";
        dishes.append(dish);
      }

      var price = document.createElement("span");
      price.className = "plan__price";
      var amount = document.createElement("b");
      amount.textContent = yen(plan.price);
      price.append(amount, "円");

      li.append(count, dishes, price);
      plans.append(li);
    });
  }

  var popular = document.getElementById("popular-list");
  if (popular) {
    popular.textContent = "";
    SHOP.popular.forEach(function (name) {
      var li = document.createElement("li");
      li.textContent = name;
      popular.append(li);
    });
  }

  /* ---------- 画面下の固定バー ---------- */

  var dock = document.getElementById("dock");
  var actions = document.querySelector(".actions");
  if (dock && actions && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      dock.classList.toggle("is-shown", !entries[0].isIntersecting);
    }).observe(actions);
  }
})();
