"use strict";

// =========================
// ゲーム画面更新
// =========================

function refreshGameView() {
  renderMap();

  renderPlacementArea();
}

// =========================
// マップ描画
// =========================

function renderMap() {
  const mapArea = document.getElementById("mapArea");

  let html = "";

  let buildingIndex = 0;

  // -------------------------
  // 11×11マップを描画
  // -------------------------

  for (let row = 0; row < MAP_DISPLAY_SIZE; row++) {
    for (let col = 0; col < MAP_DISPLAY_SIZE; col++) {
      const isBuilding = row % 2 === 0 && col % 2 === 0;

      const isCrossroad = row % 2 === 1 && col % 2 === 1;

      if (isBuilding) {
        html += renderBuilding(row, col, buildingIndex);

        buildingIndex++;

        continue;
      }

      if (isCrossroad) {
        html += renderCrossroad(row, col);

        continue;
      }

      html += renderRoad(row, col);
    }
  }

  mapArea.innerHTML = html;

  renderPieces();

  registerBuildingEvents();

  registerCrossroadEvents();

  registerMapPieceEvents();
}

// =========================
// 建物描画
// =========================

function renderBuilding(row, col, buildingIndex) {
  const building = gameState.map.buildings[buildingIndex];

  const buildingRow = row / 2;

  const buildingCol = col / 2;

  const isPlacementMode =
    gameState.placement.pieceType === "human" &&
    gameState.placement.selectedPiece !== null;

  const isSearchTarget =
    gameState.phase === "oniTurn" &&
    (gameState.turn.actionMode === "search" ||
      gameState.turn.actionMode === "oniReady") &&
    isSearchableBuilding(buildingRow, buildingCol);

  const isHumanMoveTarget =
    gameState.phase === "humanTurn" &&
    gameState.turn.actionMode === "humanMove" &&
    isMovableBuilding(buildingRow, buildingCol);

  return `
    <div
      class="building ${isPlacementMode ? "placementTarget" : ""} ${
        isSearchTarget ? "searchTarget" : ""
      } ${isHumanMoveTarget ? "placementTarget" : ""} ${getTideCellClass(row, col)}"
      data-row="${buildingRow}"
      data-col="${buildingCol}"
    >

      ${building.icon}

    </div>
  `;
}

// =========================
// 十字路描画
// =========================

function renderCrossroad(row, col) {
  const crossroadRow = (row - 1) / 2;

  const crossroadCol = (col - 1) / 2;

  const isPlacementMode =
    gameState.placement.pieceType === "oni" &&
    gameState.placement.selectedPiece !== null;

  const isMoveTarget =
    gameState.phase === "oniTurn" &&
    (gameState.turn.actionMode === "move" ||
      gameState.turn.actionMode === "oniReady") &&
    isMovableCrossroad(crossroadRow, crossroadCol);

  return `
    <div
      class="crossroad ${
        isPlacementMode || isMoveTarget ? "placementTarget" : ""
      } ${getTideCellClass(row, col)}"
      data-row="${crossroadRow}"
      data-col="${crossroadCol}"
    >
    </div>
  `;
}

// =========================
// 道描画
// =========================

function renderRoad(row, col) {
  return `<div class="road ${getTideCellClass(row, col)}"></div>`;
}

// =========================
// 建物データ生成
// =========================

function createBuildings() {
  const buildings = [];

  const totalBuildings = gameState.map.rows * gameState.map.cols;

  for (let i = 0; i < totalBuildings; i++) {
    const randomIndex = Math.floor(Math.random() * BUILDING_MASTER.length);

    buildings.push(BUILDING_MASTER[randomIndex]);
  }

  return buildings;
}

// =========================
// 建物イベント登録
// =========================

function registerBuildingEvents() {
  const buildings = document.querySelectorAll(".building");

  for (const building of buildings) {
    building.addEventListener("click", onBuildingClick);
  }
}

// =========================
// 十字路イベント登録
// =========================

function registerCrossroadEvents() {
  const crossroads = document.querySelectorAll(".crossroad");

  for (const crossroad of crossroads) {
    crossroad.addEventListener("click", onCrossroadClick);
  }
}

// =========================
// 満潮表示クラス取得
// =========================

function getTideCellClass(row, col) {
  if (isSinkTargetCell(row, col)) {
    return "sinkPreview";
  }

  if (isSunkCell(row, col)) {
    return "sunkCell";
  }

  return "";
}
