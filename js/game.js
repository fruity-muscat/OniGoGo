"use strict";

// =========================
// 鬼データ生成
// =========================

function createOni() {
  const oni = [];

  for (let i = 0; i < ONI_COUNT; i++) {
    oni.push({
      id: i,

      // -------------------------
      // まだ未配置
      // -------------------------

      position: null,

      moved: false,

      alive: true,
    });
  }

  return oni;
}

// =========================
// 人間データ生成
// =========================

function createHumans() {
  const humans = [];

  for (let i = 0; i < HUMAN_COUNT; i++) {
    humans.push({
      id: i,

      position: null,

      footprints: [],

      alive: true,

      escaped: false,

      moved: false,

      found: false,

      hasMovedOnce: false,
    });
  }

  return humans;
}

// =========================
// 指定マスのコマ取得
// =========================

function getPiecesAt(row, col) {
  const pieces = [];

  // -------------------------
  // 鬼
  // -------------------------

  for (const oni of gameState.oni) {
    if (oni.position === null) {
      continue;
    }

    if (oni.position.row === row && oni.position.col === col) {
      pieces.push({
        type: "oni",
        data: oni,
      });
    }
  }

  // -------------------------
  // 人間
  // -------------------------

  for (const human of gameState.humans) {
    if (human.position === null) {
      continue;
    }

    if (human.position.row === row && human.position.col === col) {
      pieces.push({
        type: "human",
        data: human,
      });
    }
  }

  return pieces;
}

// =========================
// 現在配置中のコマ一覧取得
// =========================

function getCurrentPlacementPieces() {
  if (gameState.placement.pieceType === "oni") {
    return gameState.oni;
  }

  if (gameState.placement.pieceType === "human") {
    return gameState.humans;
  }

  return [];
}

// =========================
// 現在配置中のコマ配置
// =========================

function placeCurrentPiece(pieceId, row, col) {
  const pieces = getCurrentPlacementPieces();

  if (!pieces[pieceId]) {
    return;
  }

  pieces[pieceId].position = {
    row,
    col,
  };
}

// =========================
// 鬼配置完了判定
// =========================

function isOniSetupComplete() {
  return gameState.oni.every((oni) => oni.position !== null);
}

// =========================
// 人間配置完了判定
// =========================

function isHumanSetupComplete() {
  return gameState.humans.every((human) => human.position !== null);
}

// =========================
// 鬼取得
// =========================

function getOniById(oniId) {
  return gameState.oni.find((oni) => oni.id === oniId);
}

// =========================
// 鬼が行動可能か
// =========================

function canOniAct(oniId) {
  const oni = getOniById(oniId);

  if (!oni) {
    return false;
  }

  if (!oni.alive) {
    return false;
  }

  if (oni.moved) {
    return false;
  }

  if (isPieceSunk(oni, "oni")) {
    return false;
  }

  return true;
}

// =========================
// 鬼の移動可能先取得
// =========================

function getMovableCrossroads(oniId) {
  const oni = getOniById(oniId);

  if (!oni || oni.position === null) {
    return [];
  }

  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  const results = [];

  for (const direction of directions) {
    const row = oni.position.row + direction.row;
    const col = oni.position.col + direction.col;

    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) {
      continue;
    }

    if (isSunkCell(row * 2 + 1, col * 2 + 1)) {
      continue;
    }

    results.push({ row, col });
  }

  return results;
}

// =========================
// 鬼の探索可能建物取得
// =========================

function getSearchableBuildings(oniId) {
  const oni = getOniById(oniId);

  if (!oni || oni.position === null) {
    return [];
  }

  const row = oni.position.row;
  const col = oni.position.col;

  const candidates = [
    { row: row, col: col },
    { row: row + 1, col: col },
    { row: row, col: col + 1 },
    { row: row + 1, col: col + 1 },
  ];

  return candidates.filter(
    (target) =>
      target.row >= 0 &&
      target.row < MAP_ROWS &&
      target.col >= 0 &&
      target.col < MAP_COLS,
  );
}

// =========================
// 鬼の探索可能建物判定
// =========================

function isSearchableBuilding(row, col) {
  const oniId = gameState.turn.selectedOniId;

  if (oniId === null) {
    return false;
  }

  return getSearchableBuildings(oniId).some(
    (target) => target.row === row && target.col === col,
  );
}

// =========================
// 鬼の移動可能先判定
// =========================

function isMovableCrossroad(row, col) {
  const oniId = gameState.turn.selectedOniId;

  if (oniId === null) {
    return false;
  }

  return getMovableCrossroads(oniId).some(
    (target) => target.row === row && target.col === col,
  );
}

// =========================
// 探索結果取得
// =========================

function getSearchResult(row, col) {
  const humans = gameState.humans.filter(
    (human) =>
      human.alive &&
      human.position !== null &&
      human.position.row === row &&
      human.position.col === col,
  );

  if (humans.length > 0) {
    for (const human of humans) {
      human.found = true;
      human.alive = false;
    }

    return {
      type: "foundHuman",
      title: "鬼の勝利！",
      messages: ["勝因：鬼が人間を発見しました。"],
      foundHumanIds: humans.map((human) => human.id),
    };
  }

  const footprint = getHiddenFootprint(row, col);

  if (footprint) {
    footprint.found = true;

    return {
      type: "foundFootprint",
      title: "👣 足跡発見！",
      messages: ["人間の足跡を発見しました！"],
    };
  }

  return {
    type: "nothing",
    title: "👹 探索結果",
    messages: ["何もないぞ…"],
  };
}

// =========================
// 鬼ターン完了判定
// =========================

function isOniTurnComplete() {
  return gameState.oni.every(
    (oni) => !oni.alive || oni.moved || isPieceSunk(oni, "oni"),
  );
}

// =========================
// 人間取得
// =========================

function getHumanById(humanId) {
  return gameState.humans.find((human) => human.id === humanId);
}

// =========================
// 人間の移動可能先取得
// =========================

function getMovableBuildings(humanId) {
  const human = getHumanById(humanId);

  if (!human || human.position === null) {
    return [];
  }

  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  const results = [];

  for (const direction of directions) {
    const row = human.position.row + direction.row;
    const col = human.position.col + direction.col;

    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) {
      continue;
    }

    if (hasAnyFootprint(row, col)) {
      continue;
    }

    if (isSunkCell(row * 2, col * 2)) {
      continue;
    }

    results.push({ row, col });
  }

  return results;
}

function hasAnyFootprint(row, col) {
  return gameState.history.some(
    (item) => item.type === "footprint" && item.row === row && item.col === col,
  );
}

// =========================
// 人間の移動可能先判定
// =========================

function isMovableBuilding(row, col) {
  const humanId = gameState.turn.selectedHumanId;

  if (humanId === null) {
    return false;
  }

  return getMovableBuildings(humanId).some(
    (target) => target.row === row && target.col === col,
  );
}

// =========================
// 足跡追加
// =========================

function addFootprint(row, col, options) {
  const data = options || {};

  gameState.history.push({
    type: "footprint",
    row,
    col,
    day: gameState.day,
    found: false,
    kind: data.kind || "normal",
    humanId: data.humanId ?? null,
  });
}

function getVisibleFootprints(row, col) {
  return gameState.history.filter((item) => {
    if (item.type !== "footprint" || item.row !== row || item.col !== col) {
      return false;
    }

    if (gameState.phase === "humanTurn") {
      return true;
    }

    return item.found;
  });
}

function getFootprintIcon(footprint) {
  if (footprint.kind === "start") {
    return START_FOOTPRINT_ICON;
  }

  return FOOTPRINT_ICON;
}

// =========================
// 足跡取得
// =========================

function hasFootprint(row, col) {
  return gameState.history.some((item) => {
    if (item.type !== "footprint" || item.row !== row || item.col !== col) {
      return false;
    }

    if (gameState.phase === "humanTurn") {
      return true;
    }

    return item.found;
  });
}

// =========================
// 人間ターン完了判定
// =========================

function isHumanTurnComplete() {
  return gameState.humans.every((human) => !human.alive || human.moved);
}

// =========================
// 未発見の足跡取得
// =========================

function getHiddenFootprint(row, col) {
  return gameState.history.find(
    (item) =>
      item.type === "footprint" &&
      item.row === row &&
      item.col === col &&
      !item.found,
  );
}

// =========================
// 次の満潮予定取得
// =========================

function getNextTideSchedule() {
  return gameState.tide.schedules.find(
    (schedule) => schedule.sinkDay >= gameState.day,
  );
}

// =========================
// 次の満潮日取得
// =========================

function getNextTideDay() {
  const schedule = getNextTideSchedule();

  if (!schedule) {
    return null;
  }

  return schedule.sinkDay;
}

// =========================
// 満潮表示可能判定
// =========================

function canShowTideHeader() {
  return gameState.tide.noticeShown;
}

// =========================
// 満潮通知日判定
// =========================

function isTideNoticeDay() {
  return gameState.tide.schedules.some(
    (schedule) => schedule.noticeDay === gameState.day,
  );
}

// =========================
// 満潮発生日判定
// =========================

function isTideSinkDay() {
  return gameState.tide.schedules.some(
    (schedule) => schedule.sinkDay === gameState.day,
  );
}

// =========================
// 沈没方向候補
// =========================

function getSinkSideOptions() {
  return ["north", "east", "south", "west"].filter(
    (side) => !gameState.tide.sunkSides.includes(side),
  );
}

// =========================
// 沈没方向名取得
// =========================

function getSinkSideName(side) {
  if (side === "north") {
    return "北側";
  }

  if (side === "east") {
    return "東側";
  }

  if (side === "south") {
    return "南側";
  }

  if (side === "west") {
    return "西側";
  }

  return "";
}

// =========================
// 次の沈没方向決定
// =========================

function decideNextSinkSide() {
  if (gameState.tide.nextSinkSide !== null) {
    return gameState.tide.nextSinkSide;
  }

  const options = getSinkSideOptions();

  if (options.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * options.length);

  gameState.tide.nextSinkSide = options[randomIndex];

  gameState.tide.previewSide = gameState.tide.nextSinkSide;

  return gameState.tide.nextSinkSide;
}

// =========================
// 沈没対象マス判定
// =========================

function isSinkTargetCell(row, col) {
  const side = gameState.tide.previewSide;

  if (side === null) {
    return false;
  }

  if (side === "north") {
    return row <= 1;
  }

  if (side === "south") {
    return row >= MAP_DISPLAY_SIZE - 2;
  }

  if (side === "west") {
    return col <= 1;
  }

  if (side === "east") {
    return col >= MAP_DISPLAY_SIZE - 2;
  }

  return false;
}

// =========================
// 沈没確定
// =========================

function confirmTideSink() {
  const side = gameState.tide.nextSinkSide;

  if (side === null) {
    return;
  }

  if (!gameState.tide.sunkSides.includes(side)) {
    gameState.tide.sunkSides.push(side);
  }

  gameState.tide.nextSinkSide = null;
  gameState.tide.previewSide = null;
}

// =========================
// 沈没済みマス判定
// =========================

function isSunkCell(row, col) {
  for (const side of gameState.tide.sunkSides) {
    if (side === "north" && row <= 1) {
      return true;
    }

    if (side === "south" && row >= MAP_DISPLAY_SIZE - 2) {
      return true;
    }

    if (side === "west" && col <= 1) {
      return true;
    }

    if (side === "east" && col >= MAP_DISPLAY_SIZE - 2) {
      return true;
    }
  }

  return false;
}

// =========================
// コマが沈没済みか
// =========================

function isPieceSunk(piece, pieceType) {
  if (!piece || piece.position === null) {
    return false;
  }

  let displayRow = piece.position.row * 2;
  let displayCol = piece.position.col * 2;

  if (pieceType === "oni") {
    displayRow = piece.position.row * 2 + 1;
    displayCol = piece.position.col * 2 + 1;
  }

  return isSunkCell(displayRow, displayCol);
}

// =========================
// 生存中かつ沈没していない鬼取得
// =========================

function getActiveOniList() {
  return gameState.oni.filter((oni) => oni.alive && !isPieceSunk(oni, "oni"));
}

// =========================
// 生存中かつ沈没していない人間取得
// =========================

function getActiveHumanList() {
  return gameState.humans.filter(
    (human) => human.alive && !isPieceSunk(human, "human"),
  );
}

// =========================
// 勝敗判定
// =========================

function checkGameResult(trigger) {
  const activeOniCount = getActiveOniList().length;

  const activeHumanCount = getActiveHumanList().length;

  // -------------------------
  // 満潮による勝敗
  // -------------------------

  if (trigger === "tide") {
    if (activeOniCount === 0 && activeHumanCount === 0) {
      return {
        type: "draw",
        title: "引き分け",
        messages: ["勝因：鬼も人間も流されました。"],
      };
    }

    if (activeHumanCount === 0) {
      return {
        type: "oniWin",
        title: "鬼の勝利！",
        messages: ["勝因：人間は全員流されました。"],
      };
    }

    if (activeOniCount === 0) {
      return {
        type: "humanWin",
        title: "人間の勝利！",
        messages: ["勝因：鬼は全員流されました。"],
      };
    }
  }

  // -------------------------
  // 人間移動不能
  // -------------------------

  if (trigger === "oniTurnEnd") {
    if (getMovableHumanCount() === 0) {
      return {
        type: "oniWin",

        title: "鬼の勝利！",

        messages: ["勝因：人間は逃げ場を失いました。"],
      };
    }
  }

  // -------------------------
  // Day10 鬼ターン終了
  // -------------------------

  if (trigger === "oniTurnEnd" && gameState.day >= 10) {
    if (activeHumanCount > 0) {
      return {
        type: "humanWin",
        title: "人間の勝利！",
        messages: ["勝因：Day10を生き延びました。"],
      };
    }
  }

  return null;
}

// =========================
// 人間が移動可能か
// =========================

function canHumanMove(human) {
  if (!human.alive) {
    return false;
  }

  if (isPieceSunk(human, "human")) {
    return false;
  }

  return getMovableBuildings(human.id).length > 0;
}

// =========================
// 移動可能な人間数
// =========================

function getMovableHumanCount() {
  return gameState.humans.filter((human) => canHumanMove(human)).length;
}

// =========================
// リザルトデータ作成
// =========================

function createResultData(result) {
  return {
    title: result.title,

    reason: getResultReason(result),

    endDay: gameState.day,

    tideCount: gameState.tide.sunkSides.length,

    foundFootprintCount: getFoundFootprintCount(),

    activeHumanCount: getActiveHumanList().length,

    activeOniCount: getActiveOniList().length,
  };
}

// =========================
// 勝因取得
// =========================

function getResultReason(result) {
  if (!result || !result.messages || result.messages.length === 0) {
    return "";
  }

  return result.messages[0].replace("勝因：", "");
}

// =========================
// 発見済み足跡数取得
// =========================

function getFoundFootprintCount() {
  return gameState.history.filter(
    (item) => item.type === "footprint" && item.found,
  ).length;
}

// =========================
// リプレイ履歴追加
// =========================

function addReplayHistory(actionType, detail) {
  gameState.replayHistory.push({
    day: gameState.day,

    phase: gameState.phase,

    actionType,

    detail: detail || {},

    humans: cloneReplayPieces(gameState.humans),

    oni: cloneReplayPieces(gameState.oni),

    footprints: cloneReplayFootprints(),

    tide: {
      sunkSides: [...gameState.tide.sunkSides],

      nextSinkSide: gameState.tide.nextSinkSide,

      previewSide: gameState.tide.previewSide,
    },

    result: gameState.result
      ? {
          ...gameState.result,
          messages: [...gameState.result.messages],
        }
      : null,
  });
}

// =========================
// リプレイ用コマ情報コピー
// =========================

function cloneReplayPieces(pieces) {
  return pieces.map((piece) => ({
    id: piece.id,

    position: piece.position
      ? {
          row: piece.position.row,

          col: piece.position.col,
        }
      : null,

    alive: piece.alive,

    moved: piece.moved,

    escaped: piece.escaped || false,

    found: piece.found || false,

    hasMovedOnce: piece.hasMovedOnce || false,
  }));
}

// =========================
// リプレイ用足跡コピー
// =========================

function cloneReplayFootprints() {
  return gameState.history
    .filter((item) => item.type === "footprint")
    .map((item) => ({
      row: item.row,

      col: item.col,

      day: item.day,

      found: item.found,

      kind: item.kind || "normal",

      humanId: item.humanId ?? null,
    }));
}
