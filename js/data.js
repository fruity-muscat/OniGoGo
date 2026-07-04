"use strict";

// =========================
// 建物マスター
// =========================

const BUILDING_MASTER = [
  {
    id: "house",
    name: "家",
    icon: "🏠",
    category: "human",
  },

  {
    id: "shrine",
    name: "神社",
    icon: "⛩️",
    category: "human",
  },

  {
    id: "abandonedHouse",
    name: "廃屋",
    icon: "🏚️",
    category: "human",
  },

  {
    id: "forest",
    name: "森",
    icon: "🌳",
    category: "nature",
  },

  {
    id: "bamboo",
    name: "竹林",
    icon: "🎍",
    category: "nature",
  },

  {
    id: "cave",
    name: "洞窟",
    icon: "🕳️",
    category: "nature",
  },

  {
    id: "altar",
    name: "鬼の祭壇",
    icon: "👹",
    category: "oni",
  },

  {
    id: "hokora",
    name: "鬼の祠",
    icon: "🏮",
    category: "oni",
  },
];

// =========================
// マップ
// =========================

const MAP_DISPLAY_SIZE = 11;

const MAP_ROWS = 6;

const MAP_COLS = 6;

// =========================
// 鬼
// =========================

const ONI_ICON = "👹";

const ONI_COUNT = 3;

// =========================
// 人間
// =========================

const HUMAN_ICON = "🧍";

const HUMAN_COUNT = 1;

// =========================
// 足跡
// =========================

const FOOTPRINT_ICON = "👣";
