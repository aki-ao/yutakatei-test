/*
 * 友多加亭 店舗データ
 * 店の情報を変えるときは、このファイルだけを直す。
 * 「仮」と書いてある値は、店主に確認してから確定する。
 */
window.SHOP = {
  name: "友多加亭",
  kana: "ゆたかてい",
  area: "大宮・櫛引町の定食屋",

  tel: "048-653-1038",
  postal: "330-0851",
  address: "埼玉県さいたま市大宮区櫛引町1-617-3",

  // 営業時間（24:00 は深夜 0 時）。年中無休。
  hours: { open: "11:00", close: "24:00", holiday: "年中無休" },

  // X の URL。決まったらここに入れる。空のあいだは、ボタンを押すと「準備中」と表示する。
  xUrl: "",

  mapUrl:
    "https://www.google.com/maps/place/%E5%8F%8B%E5%A4%9A%E5%8A%A0%E4%BA%AD/@35.9137388,139.6054168,17z/data=!4m6!3m5!1s0x6018c3ff43f30611:0xcd29cb37141715a!8m2!3d35.9137388!4d139.6054168!16s%2Fg%2F1thqgs0_",

  // 店内の定食（仮：クチコミの情報。価格とセット内容は要確認）
  teishoku: {
    includes: "ライス・みそ汁・おしんこ付き",
    plans: [
      { count: 1, price: 800 },
      { count: 2, price: 1100 },
      { count: 3, price: 1450 },
    ],
  },

  // 黒板に並べる人気のおかず
  popular: ["生姜焼き", "ハンバーグ", "オムライス", "チキンチーズカツカレー", "ソースかつ丼", "から揚げ"],

  // 持ち帰りメニュー（店の配布チラシより）
  takeout: {
    // 注文の送り先（Google Apps Script の URL）。空のあいだは、注文ボタンを押しても送信しない。
    orderUrl: "",
    slotMinutes: 15, // 受け取り時間のきざみ
    leadMinutes: 20, // いまから何分後を最短の受け取り時間にするか（仮）
    bento: [
      { id: "curry", name: "カレーライス", price: 730 },
      { id: "omurice", name: "オムライス", price: 730 },
      { id: "hamburg", name: "ハンバーグ", price: 730 },
      { id: "sasami", name: "ささみ梅しそ", price: 730 },
      { id: "nikuzume", name: "3色肉詰め揚げ", price: 730 },
      { id: "saba", name: "さば", price: 730, options: ["塩", "みそ"] },
      { id: "karaage", name: "唐揚げ", price: 730, options: ["プレーン", "チリ", "ポン酢"] },
      { id: "chicken-cheese", name: "チキンチーズ", price: 730 },
      { id: "katsu-curry", name: "カツカレー", price: 850 },
      { id: "chicken-katsu-curry", name: "チキンカツカレー", price: 850 },
      { id: "chicken-cheese-curry", name: "チキンチーズカレー", price: 850 },
      { id: "sauce-katsudon", name: "ソースカツ丼", price: 850 },
      { id: "napolitan", name: "ナポリタン", price: 730 },
    ],
    salad: [
      { id: "avocado", name: "アボカドサラダ", price: 480 },
      { id: "broccoli", name: "ブロッコリーサラダ", price: 480 },
      { id: "banbanji", name: "バンバンジー", price: 480 },
      { id: "wakame-tofu", name: "わかめ豆腐サラダ", price: 480 },
      { id: "mushidori", name: "蒸し鶏和風サラダ", price: 480 },
    ],
  },
};
