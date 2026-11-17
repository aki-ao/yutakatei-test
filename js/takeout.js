/*
 * 友多加亭 持ち帰り注文ページ
 * 画面でメニューを選ぶと注文メモができる。注文そのものは電話か店頭で伝える（送信はしない）。
 */
(function () {
  "use strict";

  var SHOP = window.SHOP;
  var U = window.SHOP_UTIL;
  var T = SHOP.takeout;
  var MAX_QTY = 20;

  // 注文の中身。キーは「品ID|味」。メニューの並び順のまま保持する。
  var lines = [];
  var byKey = {};
  var current = { lines: [], total: 0, pickup: "" }; // いまの注文メモの中身
  var sending = false;

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---------- メニューの一覧 ---------- */

  function addLine(item, option, canLarge) {
    var line = { item: item, option: option || "", qty: 0, large: false, canLarge: canLarge };
    lines.push(line);
    byKey[item.id + "|" + line.option] = line;
    return line;
  }

  function lineLabel(line) {
    var extra = [];
    if (line.option) extra.push(line.option);
    if (line.large) extra.push("大盛り");
    return line.item.name + (extra.length ? "（" + extra.join("・") + "）" : "");
  }

  function buildStepper(line, spokenName, onChange) {
    var wrap = el("div", "stepper");
    var minus = el("button", "stepper__btn", "−");
    var num = el("output", "stepper__num", "0");
    var plus = el("button", "stepper__btn stepper__btn--plus", "＋");
    minus.type = "button";
    plus.type = "button";
    minus.disabled = true;
    minus.setAttribute("aria-label", spokenName + "を1つ減らす");
    plus.setAttribute("aria-label", spokenName + "を1つ増やす");
    num.setAttribute("aria-label", spokenName + "の個数");

    function set(qty) {
      line.qty = Math.max(0, Math.min(MAX_QTY, qty));
      num.textContent = line.qty;
      minus.disabled = line.qty === 0;
      plus.disabled = line.qty === MAX_QTY;
      onChange();
    }
    minus.addEventListener("click", function () { set(line.qty - 1); });
    plus.addEventListener("click", function () { set(line.qty + 1); });

    wrap.append(minus, num, plus);
    return wrap;
  }

  function buildLargeToggle(line, onChange) {
    var label = el("label", "large");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.addEventListener("change", function () {
      line.large = box.checked;
      onChange();
    });
    label.append(box, "大盛りにする（無料）");
    label.hidden = true;
    return { label: label, box: box };
  }

  function buildItem(item, canLarge) {
    var wrap = el("div", "item");
    var itemLines = [];

    function refresh() {
      var any = itemLines.some(function (entry) { return entry.line.qty > 0; });
      wrap.classList.toggle("is-on", any);
      itemLines.forEach(function (entry) {
        if (!entry.toggle) return;
        var on = entry.line.qty > 0;
        entry.toggle.label.hidden = !on;
        if (!on) { entry.toggle.box.checked = false; entry.line.large = false; }
      });
      render();
    }

    function addRow(option) {
      var line = addLine(item, option, canLarge);
      var row = el("div", option ? "item__row item__row--opt" : "item__row");
      var info = el("div", "item__info");
      if (option) {
        info.append(el("span", "item__name", option));
      } else {
        info.append(el("span", "item__name", item.name), el("span", "item__price", U.yen(item.price) + "円"));
      }
      var spoken = item.name + (option ? "（" + option + "）" : "");
      row.append(info, buildStepper(line, spoken, refresh));
      wrap.append(row);
      var toggle = canLarge ? buildLargeToggle(line, refresh) : null;
      if (toggle) wrap.append(toggle.label);
      itemLines.push({ line: line, toggle: toggle });
    }

    if (item.options && item.options.length) {
      var head = el("div", "item__row");
      var info = el("div", "item__info");
      info.append(el("span", "item__name", item.name), el("span", "item__price", U.yen(item.price) + "円・味をえらべます"));
      head.append(info);
      wrap.append(head);
      item.options.forEach(addRow);
    } else {
      addRow("");
    }
    return wrap;
  }

  /* ---------- 受け取り時間 ---------- */

  var pickup = $("pickup");

  function clock(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ":" + (m < 10 ? "0" : "") + m;
  }

  function spokenClock(value) {
    var p = value.split(":");
    return Number(p[0]) + "時" + (Number(p[1]) ? Number(p[1]) + "分" : "");
  }

  function buildSlots() {
    var open = U.toMin(SHOP.hours.open);
    var close = U.toMin(SHOP.hours.close);
    var step = T.slotMinutes;
    var first = Math.ceil((Math.max(U.nowMin(), open) + T.leadMinutes) / step) * step;

    pickup.textContent = "";
    var asap = el("option", "", "できあがり次第（いちばん早く）");
    asap.value = "asap";
    pickup.append(asap);
    for (var t = first; t <= close - step; t += step) {
      var opt = el("option", "", clock(t) + " ごろ");
      opt.value = clock(t);
      pickup.append(opt);
    }
  }

  /* ---------- 注文メモ ---------- */

  function render() {
    var chosen = lines.filter(function (line) { return line.qty > 0; });
    var count = 0, total = 0;
    chosen.forEach(function (line) {
      count += line.qty;
      total += line.qty * line.item.price;
    });

    var asap = pickup.value === "asap";
    var timeLabel = asap ? "できあがり次第" : pickup.value + " ごろ";

    $("memo-empty").hidden = chosen.length > 0;
    $("memo-body").hidden = chosen.length === 0;

    [$("memo-list")].forEach(function (list) {
      list.textContent = "";
      chosen.forEach(function (line) {
        var li = el("li");
        li.append(el("span", "", lineLabel(line)), el("span", "", "× " + line.qty));
        list.append(li);
      });
    });
    $("memo-total").textContent = U.yen(total);
    $("memo-time").textContent = timeLabel;
    current = {
      lines: chosen.map(function (line) { return { label: lineLabel(line), qty: line.qty, price: line.item.price }; }),
      total: total,
      pickup: timeLabel,
    };

    var items = chosen.map(function (line) {
      return lineLabel(line) + "を" + (line.qty < 10 ? line.qty + "つ" : line.qty + "個");
    }).join("、");
    $("memo-say").textContent = "「持ち帰りの注文をお願いします。" + items + "。" +
      (asap ? "できあがり次第、取りに行きます。」" : spokenClock(pickup.value) + "ごろに取りに行きます。」");

    var sum = $("cart-sum");
    sum.textContent = "";
    if (chosen.length) {
      var amount = el("b", "", U.yen(total));
      sum.append("合計 " + count + "点", amount, "円");
    } else {
      sum.textContent = "まだ選んでいません";
    }

    $("call").classList.toggle("is-disabled", chosen.length === 0);
    $("order").classList.toggle("is-disabled", chosen.length === 0);
    if (chosen.length) $("hint").textContent = "";
    return chosen.length;
  }

  function needChoice(e) {
    if (render() > 0) return false;
    e.preventDefault();
    $("hint").textContent = "先に、上のメニューから選んでください。";
    return true;
  }

  /* ---------- 組み立て ---------- */

  T.bento.forEach(function (item) { $("bento-list").append(buildItem(item, true)); });
  T.salad.forEach(function (item) { $("salad-list").append(buildItem(item, false)); });

  buildSlots();
  pickup.addEventListener("change", render);

  $("call").addEventListener("click", needChoice);
  /* ---------- 注文を送る ---------- */

  function showResult(title, text) {
    $("result-title").textContent = title;
    $("result-text").textContent = text;
    var dialog = $("result");
    if (dialog.showModal) dialog.showModal();
  }

  function warn(text, field) {
    $("hint").textContent = text;
    if (field) field.focus();
  }

  var FAIL_TEXT = "お手数ですが、お電話でご注文ください。";
  var ERRORS = {
    closed: ["ただいま営業時間外です", SHOP.hours.open + " からご注文いただけます。"],
    busy: ["ただいま混み合っています", FAIL_TEXT],
  };

  $("order").addEventListener("click", function (e) {
    if (sending || needChoice(e)) return;
    var name = $("cust-name").value.trim();
    var tel = $("cust-tel").value.replace(/[^0-9]/g, "");
    if (!name) return warn("お名前を入れてください。", $("cust-name"));
    if (!/^0\d{9,10}$/.test(tel)) return warn("電話番号を入れてください（例：09012345678）。", $("cust-tel"));
    if (!U.isOpen()) return showResult(ERRORS.closed[0], ERRORS.closed[1]);
    if (!T.orderUrl) {
      return showResult("テスト版です", "注文の送り先がまだ設定されていないため、送信されません。" + FAIL_TEXT);
    }

    sending = true;
    $("order-main").textContent = "送っています…";
    // text/plain で送る（Google Apps Script は事前確認つきのリクエストを受けられないため）
    fetch(T.orderUrl, {
      method: "POST",
      body: JSON.stringify({
        name: name, tel: tel, website: $("cust-web").value,
        lines: current.lines, total: current.total, pickup: current.pickup,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.ok) {
          showResult("注文を送りました",
            "受付番号 " + res.id + "。お店から確認のお電話をします。お電話で注文が確定します。" +
            "10分たっても電話がないときは、お手数ですがお電話ください。");
        } else {
          var known = ERRORS[res.error];
          showResult(known ? known[0] : "送れませんでした", known ? known[1] : FAIL_TEXT);
        }
      })
      .catch(function () { showResult("送れませんでした", FAIL_TEXT); })
      .then(function () {
        sending = false;
        $("order-main").textContent = "注文する";
      });
  });

  var closed = $("closed-note");
  if (!U.isOpen()) {
    closed.hidden = false;
    var open = closed.querySelector("[data-open]");
    if (open) open.textContent = SHOP.hours.open;
    $("call-sub").textContent = SHOP.tel + "（" + SHOP.hours.open + " から）";
  } else {
    $("call-sub").textContent = SHOP.tel;
  }

  render();
})();
