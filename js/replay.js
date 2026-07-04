"use strict";

// =========================
// リプレイイベント登録
// =========================

function registerReplayEvents() {
  document
    .getElementById("replayPrevDayButton")
    .addEventListener("click", replayPrevDay);

  document
    .getElementById("replayPrevButton")
    .addEventListener("click", replayPrevAction);

  document
    .getElementById("replayNextButton")
    .addEventListener("click", replayNextAction);

  document
    .getElementById("replayNextDayButton")
    .addEventListener("click", replayNextDay);

  document
    .getElementById("replayAutoButton")
    .addEventListener("click", replayStartAuto);

  document
    .getElementById("replayStopButton")
    .addEventListener("click", replayStopAuto);

  document
    .getElementById("replayExitButton")
    .addEventListener("click", function () {
      if (confirm("タイトルへ戻りますか？")) {
        renderTitleScreen();
      }
    });

  const dayButtons = document.querySelectorAll(".replayDayButton");

  for (const button of dayButtons) {
    button.addEventListener("click", function () {
      const day = Number(button.dataset.day);

      replayJumpToDay(day);
    });
  }
}

// =========================
// リプレイ描画
// =========================

function renderReplay() {
  const item = gameState.replayHistory[gameState.replay.index];

  if (!item) {
    return;
  }

  const dayArea = document.getElementById("replayDay");

  const turnArea = document.getElementById("replayTurn");

  if (dayArea) {
    dayArea.textContent = "Day" + item.day;
  }

  if (turnArea) {
    turnArea.textContent = getReplayTurnText(item);
  }

  renderReplayMap(item);
}

// =========================
// リプレイターン文言取得
// =========================

function getReplayTurnText(item) {
  if (item.phase === "oniTurn") {
    return "🌙 鬼ターン";
  }

  if (item.phase === "humanTurn") {
    return "👤 人間ターン";
  }

  if (item.phase === "gameOver") {
    return "🏁 ゲーム終了";
  }

  return item.phase;
}

// =========================
// 1アクション進む
// =========================

function replayNextAction() {
  if (gameState.replay.index >= gameState.replayHistory.length - 1) {
    return;
  }

  gameState.replay.index++;

  renderReplay();
}

// =========================
// 1アクション戻る
// =========================

function replayPrevAction() {
  if (gameState.replay.index <= 0) {
    return;
  }

  gameState.replay.index--;

  renderReplay();
}

// =========================
// リプレイマップ描画
// =========================

function renderReplayMap(item) {
  const replayMapArea = document.getElementById("replayMapArea");

  if (!replayMapArea || !item) {
    return;
  }

  let html = "";

  let buildingIndex = 0;

  for (let row = 0; row < MAP_DISPLAY_SIZE; row++) {
    for (let col = 0; col < MAP_DISPLAY_SIZE; col++) {
      const isBuilding = row % 2 === 0 && col % 2 === 0;

      const isCrossroad = row % 2 === 1 && col % 2 === 1;

      if (isBuilding) {
        html += createReplayBuildingCell(row, col, buildingIndex, item);

        buildingIndex++;

        continue;
      }

      if (isCrossroad) {
        html += createReplayCrossroadCell(row, col, item);

        continue;
      }

      html += createReplayRoadCell(row, col, item);
    }
  }

  replayMapArea.innerHTML = html + createReplayNearMissLine(item);
}

// =========================
// リプレイ建物マス作成
// =========================

function createReplayBuildingCell(row, col, buildingIndex, item) {
  const building = gameState.map.buildings[buildingIndex];

  const buildingRow = row / 2;

  const buildingCol = col / 2;

  return `
    <div class="building replayCell ${getReplayTideClass(row, col, item)} ${getReplaySearchClass(buildingRow, buildingCol, item)} ${getReplayRouteClass(buildingRow, buildingCol)} ${getReplayNearMissClass(buildingRow, buildingCol, item)}">
      ${building.icon}
      ${createReplayHumansHtml(buildingRow, buildingCol, item)}
      ${createReplayFootprintsHtml(buildingRow, buildingCol, item)}
    </div>
  `;
}

// =========================
// リプレイ十字路マス作成
// =========================

function createReplayCrossroadCell(row, col, item) {
  const crossroadRow = (row - 1) / 2;

  const crossroadCol = (col - 1) / 2;

  return `
    <div class="crossroad replayCell ${getReplayTideClass(row, col, item)}">
      ${createReplayOniHtml(crossroadRow, crossroadCol, item)}
    </div>
  `;
}

// =========================
// リプレイ道マス作成
// =========================

function createReplayRoadCell(row, col, item) {
  return `
    <div class="road replayCell ${getReplayTideClass(row, col, item)}"></div>
  `;
}

// =========================
// リプレイ人間HTML
// =========================

function createReplayHumansHtml(row, col, item) {
  return item.humans
    .filter(
      (human) =>
        human.alive &&
        human.position &&
        human.position.row === row &&
        human.position.col === col,
    )
    .map(() => `<div class="mapPiece">${HUMAN_ICON}</div>`)
    .join("");
}

// =========================
// リプレイ鬼HTML
// =========================

function createReplayOniHtml(row, col, item) {
  const oniList = item.oni.filter(
    (oni) =>
      oni.alive &&
      oni.position &&
      oni.position.row === row &&
      oni.position.col === col,
  );

  if (oniList.length === 0) {
    return "";
  }

  if (oniList.length === 1) {
    return `<div class="mapPiece">${ONI_ICON}</div>`;
  }

  return `
    <div class="stackedPieces">
      ${oniList
        .map(
          () => `
            <div class="mapPiece stackedPiece">
              ${ONI_ICON}
            </div>
          `,
        )
        .join("")}
      <div class="pieceCount">×${oniList.length}</div>
    </div>
  `;
}

// =========================
// リプレイ足跡HTML
// =========================

function createReplayFootprintsHtml(row, col, item) {
  return item.footprints
    .filter((footprint) => footprint.row === row && footprint.col === col)
    .map(() => `<div class="footprint">${FOOTPRINT_ICON}</div>`)
    .join("");
}

// =========================
// リプレイ満潮クラス
// =========================

function getReplayTideClass(row, col, item) {
  for (const side of item.tide.sunkSides) {
    if (side === "north" && row <= 1) {
      return "sunkCell";
    }

    if (side === "south" && row >= MAP_DISPLAY_SIZE - 2) {
      return "sunkCell";
    }

    if (side === "west" && col <= 1) {
      return "sunkCell";
    }

    if (side === "east" && col >= MAP_DISPLAY_SIZE - 2) {
      return "sunkCell";
    }
  }

  return "";
}

// =========================
// リプレイ探索表示クラス
// =========================

function getReplaySearchClass(row, col, item) {
  if (item.actionType !== "oniSearch") {
    return "";
  }

  if (!item.detail || !item.detail.target) {
    return "";
  }

  if (item.detail.target.row === row && item.detail.target.col === col) {
    return "replaySearchTarget";
  }

  return "";
}

// =========================
// 指定Day開始インデックス取得
// =========================

function getReplayDayStartIndex(day) {
  return gameState.replayHistory.findIndex(
    (item) => item.day === day && item.actionType === "dayStart",
  );
}

// =========================
// 現在より前のDay開始へ移動
// =========================

function replayPrevDay() {
  const currentItem = gameState.replayHistory[gameState.replay.index];

  if (!currentItem) {
    return;
  }

  const dayStartIndexes = gameState.replayHistory
    .map((item, index) => ({
      item,
      index,
    }))
    .filter(
      (entry) =>
        entry.item.actionType === "dayStart" &&
        entry.item.day < currentItem.day,
    );

  if (dayStartIndexes.length === 0) {
    return;
  }

  gameState.replay.index = dayStartIndexes[dayStartIndexes.length - 1].index;

  renderReplay();
}

// =========================
// 現在より後のDay開始へ移動
// =========================

function replayNextDay() {
  const currentItem = gameState.replayHistory[gameState.replay.index];

  if (!currentItem) {
    return;
  }

  const nextDayStart = gameState.replayHistory.findIndex(
    (item) => item.actionType === "dayStart" && item.day > currentItem.day,
  );

  if (nextDayStart === -1) {
    return;
  }

  gameState.replay.index = nextDayStart;

  renderReplay();
}

// =========================
// 指定Dayへ移動
// =========================

function replayJumpToDay(day) {
  const index = getReplayDayStartIndex(day);

  if (index === -1) {
    return;
  }

  gameState.replay.index = index;

  renderReplay();
}

// =========================
// リプレイ自動再生開始
// =========================

function replayStartAuto() {
  if (gameState.replay.playing) {
    return;
  }

  gameState.replay.playing = true;

  updateReplayButtonState();

  gameState.replay.timerId = setInterval(function () {
    if (gameState.replay.index >= gameState.replayHistory.length - 1) {
      replayStopAuto();
      return;
    }

    gameState.replay.index++;

    renderReplay();
  }, 1000);
}

// =========================
// リプレイ自動再生停止
// =========================

function replayStopAuto() {
  gameState.replay.playing = false;

  if (gameState.replay.timerId !== null) {
    clearInterval(gameState.replay.timerId);

    gameState.replay.timerId = null;
  }

  updateReplayButtonState();
}

// =========================
// リプレイボタン状態更新
// =========================

function updateReplayButtonState() {
  const manualButtons = [
    "replayPrevDayButton",
    "replayPrevButton",
    "replayNextButton",
    "replayNextDayButton",
    "replayAutoButton",
    "replayExitButton",
  ];

  for (const id of manualButtons) {
    const button = document.getElementById(id);

    if (button) {
      button.disabled = gameState.replay.playing;
    }
  }

  const dayButtons = document.querySelectorAll(".replayDayButton");

  for (const button of dayButtons) {
    button.disabled = gameState.replay.playing;
  }

  const stopButton = document.getElementById("replayStopButton");

  if (stopButton) {
    stopButton.disabled = !gameState.replay.playing;
  }
}

// =========================
// リプレイルート表示クラス
// =========================

function getReplayRouteClass(row, col) {
  const route = getReplayHumanRoute();

  return route.some((point) => point.row === row && point.col === col)
    ? "replayHumanRoute"
    : "";
}

// =========================
// 現在位置までの人間ルート取得
// =========================

function getReplayHumanRoute() {
  const route = [];

  for (let i = 0; i <= gameState.replay.index; i++) {
    const item = gameState.replayHistory[i];

    if (!item || item.actionType !== "humanMove") {
      continue;
    }

    if (!item.detail || !item.detail.to) {
      continue;
    }

    route.push({
      row: item.detail.to.row,
      col: item.detail.to.col,
    });
  }

  return route;
}

// =========================
// リプレイニアミスクラス
// =========================

function getReplayNearMissClass(row, col, item) {
  const nearMiss = getReplayNearMiss(item);

  if (!nearMiss) {
    return "";
  }

  const isSearchTarget =
    nearMiss.search.row === row && nearMiss.search.col === col;

  const isHumanPosition =
    nearMiss.human.row === row && nearMiss.human.col === col;

  if (isSearchTarget || isHumanPosition) {
    return "replayNearMiss";
  }

  return "";
}

// =========================
// リプレイニアミス取得
// =========================

function getReplayNearMiss(item) {
  if (item.actionType !== "oniSearch") {
    return null;
  }

  if (!item.detail || !item.detail.target) {
    return null;
  }

  const search = item.detail.target;

  const human = item.humans.find(
    (humanItem) => humanItem.alive && humanItem.position,
  );

  if (!human) {
    return null;
  }

  const distance =
    Math.abs(search.row - human.position.row) +
    Math.abs(search.col - human.position.col);

  if (distance <= 1) {
    return {
      search,
      human: human.position,
    };
  }

  return null;
}

// =========================
// リプレイニアミス線HTML
// =========================

function createReplayNearMissLine(item) {
  const nearMiss = getReplayNearMiss(item);

  if (!nearMiss) {
    return "";
  }

  const search = nearMiss.search;
  const human = nearMiss.human;

  const rowDiff = human.row - search.row;
  const colDiff = human.col - search.col;

  let direction = "";

  if (rowDiff === -1 && colDiff === 0) {
    direction = "up";
  }

  if (rowDiff === 1 && colDiff === 0) {
    direction = "down";
  }

  if (rowDiff === 0 && colDiff === -1) {
    direction = "left";
  }

  if (rowDiff === 0 && colDiff === 1) {
    direction = "right";
  }

  if (direction === "") {
    return "";
  }

  const position = getReplayBuildingCenterPosition(search.row, search.col);

  let left = position.x;
  let top = position.y;

  if (direction === "left") {
    left = position.x - 200 / MAP_DISPLAY_SIZE;
  }

  if (direction === "up") {
    top = position.y - 200 / MAP_DISPLAY_SIZE;
  }

  return `
    <div
      class="replayNearMissLine replayNearMissLine-${direction}"
      style="
        left: ${left}%;
        top: ${top}%;
      "
    ></div>
  `;
}

// =========================
// リプレイ建物中心位置取得
// =========================

function getReplayBuildingCenterPosition(row, col) {
  const cellSize = 100 / MAP_DISPLAY_SIZE;

  return {
    x: (col * 2 + 0.5) * cellSize,
    y: (row * 2 + 0.5) * cellSize,
  };
}
