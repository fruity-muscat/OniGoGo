"use strict";

// =========================
// グローバル変数
// =========================

// アプリ描画領域
let app = null;

// ゲーム状態
let gameState = {
  day: 0,

  phase: "oniSetup",

  gameOver: false,

  result: null,

  placement: {
    pieceType: "oni",

    selectedPiece: null,
  },

  panel: {
    type: "normal",

    title: "",

    messages: [],

    buttonText: "",

    nextAction: "",
  },

  turn: {
    selectedOniId: null,

    selectedHumanId: null,

    actionMode: "",

    pendingMove: null,

    pendingSearch: null,
  },

  drag: {
    // ドラッグ中のコマID
    pieceId: null,

    // ドラッグ中か
    dragging: false,

    // Pointer ID
    pointerId: null,

    // ドラッグ開始位置
    startX: 0,
    startY: 0,

    // 現在位置
    currentX: 0,
    currentY: 0,

    // ドラッグ中の最寄り十字路
    hoverRow: null,
    hoverCol: null,

    wasMoved: false,
    suppressClick: false,
  },

  map: {
    rows: MAP_ROWS,
    cols: MAP_COLS,
    buildings: [],
    sunkSides: [],
    nextSinkSide: null,
  },

  tide: {
    schedules: [
      {
        noticeDay: 1,
        sinkDay: 3,
      },

      {
        noticeDay: 4,
        sinkDay: 6,
      },

      {
        noticeDay: 7,
        sinkDay: 9,
      },
    ],

    sunkSides: [],

    nextSinkSide: null,

    previewSide: null,
  },

  humans: [],

  oni: [],

  history: [],

  replayHistory: [],

  replay: {
    index: 0,

    playing: false,

    timerId: null,
  },
};

// =========================
// UI初期化
// =========================

function initializeUI() {
  // アプリ描画領域
  app = document.getElementById("app");

  // 建物生成
  gameState.map.buildings = createBuildings();

  // 鬼生成
  gameState.oni = createOni();

  // 人間生成
  gameState.humans = createHumans();

  // タイトル画面表示
  renderTitleScreen();
}
