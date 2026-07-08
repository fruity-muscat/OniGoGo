"use strict";

// =========================
// 建物マスター
// =========================

const BUILDING_MASTER = [
  {
    id: "house",
    name: "家",
    icon: '<img src="images/house01.png" alt="家" class="buildingIcon">',
    category: "human",
  },

  {
    id: "shrine",
    name: "神社",
    icon: '<img src="images/shrine01.png" alt="神社" class="buildingIcon">',
    category: "human",
  },

  {
    id: "abandonedHouse",
    name: "廃屋",
    icon: '<img src="images/abandonedHouse01.png" alt="廃屋" class="buildingIcon">',
    category: "human",
  },

  {
    id: "forest",
    name: "森",
    icon: '<img src="images/forest01.png" alt="森" class="buildingIcon">',
    category: "nature",
  },

  {
    id: "bamboo",
    name: "竹林",
    icon: '<img src="images/bamboo01.png" alt="竹林" class="buildingIcon">',
    category: "nature",
  },

  {
    id: "cave",
    name: "洞窟",
    icon: '<img src="images/cave01.png" alt="洞窟" class="buildingIcon">',
    category: "nature",
  },

  {
    id: "altar",
    name: "鬼の祭壇",
    icon: '<img src="images/altar01.png" alt="鬼の祭壇" class="buildingIcon">',
    category: "oni",
  },

  {
    id: "hokora",
    name: "鬼の祠",
    icon: '<img src="images/hokora01.png" alt="鬼の祠" class="buildingIcon">',
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

const ONI_ICON = '<img src="images/aka-oni01.png" alt="鬼" class="oniIcon">';

const ONI_COUNT = 3;

// =========================
// 人間
// =========================

const HUMAN_ICON =
  '<img src="images/human01.png" alt="人間" class="humanIcon">';

const HUMAN_COUNT = 1;

// =========================
// ゲーム設定
// =========================

const SETTINGS_KEY = "onigogo_settings_v1";

const DEFAULT_GAME_SETTINGS = {
  oniCount: 3,

  oniMaxActions: 2,
};

function loadGameSettings() {
  const savedText = localStorage.getItem(SETTINGS_KEY);

  if (!savedText) {
    return { ...DEFAULT_GAME_SETTINGS };
  }

  try {
    const saved = JSON.parse(savedText);

    return {
      oniCount: saved.oniCount || DEFAULT_GAME_SETTINGS.oniCount,

      oniMaxActions: saved.oniMaxActions || DEFAULT_GAME_SETTINGS.oniMaxActions,
    };
  } catch (error) {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

function saveGameSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getGameSettings() {
  return loadGameSettings();
}

// =========================
// 足跡
// =========================

const FOOTPRINT_ICON =
  '<img src="images/footprint01.png" alt="足跡" class="footprintIcon">';

const START_FOOTPRINT_ICON =
  '<img src="images/start_footprint01.png" alt="スタート地点の足跡" class="startFootprintIcon">';
