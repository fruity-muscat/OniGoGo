"use strict";

// =========================
// 配置駒クリック
// =========================

function onPlacementPieceClick(event) {
  if (gameState.inputLocked) {
    return;
  }

  if (gameState.drag.suppressClick) {
    gameState.drag.suppressClick = false;
    return;
  }

  const id = Number(event.currentTarget.dataset.id);

  gameState.placement.selectedPiece = id;

  refreshGameView();
}

// =========================
// 配置駒ドラッグ開始
// =========================

function onPlacementPiecePointerDown(event) {
  if (gameState.inputLocked) {
    return;
  }

  event.preventDefault();

  const id = Number(event.currentTarget.dataset.id);

  startPieceDrag(id, event);
}

// =========================
// マップ上のコマクリック
// =========================

function onMapPieceClick(event) {
  if (gameState.inputLocked) {
    return;
  }

  if (gameState.drag.suppressClick) {
    gameState.drag.suppressClick = false;
    return;
  }

  if (gameState.phase === "oniTurn" && gameState.turn.actionMode === "move") {
    return;
  }

  if (gameState.phase === "oniTurn") {
    event.stopPropagation();

    const pieceType = event.currentTarget.dataset.type;

    if (pieceType !== "oni") {
      return;
    }

    const oniId = Number(event.currentTarget.dataset.id);

    showOniActionPanel(oniId);

    return;
  }

  if (gameState.phase === "humanTurn") {
    event.stopPropagation();

    const pieceType = event.currentTarget.dataset.type;

    if (pieceType !== "human") {
      return;
    }

    const humanId = Number(event.currentTarget.dataset.id);

    startHumanMoveMode(humanId);

    return;
  }

  if (gameState.placement.selectedPiece !== null) {
    return;
  }

  event.stopPropagation();

  const id = Number(event.currentTarget.dataset.id);

  gameState.placement.selectedPiece = id;

  refreshGameView();
}

// =========================
// マップ上のコマドラッグ開始
// =========================

function onMapPiecePointerDown(event) {
  if (gameState.inputLocked) {
    return;
  }

  if (gameState.phase === "oniTurn") {
    return;
  }
  event.preventDefault();

  event.stopPropagation();

  const id = Number(event.currentTarget.dataset.id);

  startPieceDrag(id, event);
}

// =========================
// 十字路クリック
// =========================

function onCrossroadClick(event) {
  if (gameState.inputLocked) {
    return;
  }

  if (
    typeof handleDebugPlacement === "function" &&
    handleDebugPlacement(
      "crossroad",
      Number(event.currentTarget.dataset.row),
      Number(event.currentTarget.dataset.col),
    )
  ) {
    return;
  }

  if (
    gameState.phase === "oniTurn" &&
    (gameState.turn.actionMode === "move" ||
      gameState.turn.actionMode === "oniReady")
  ) {
    selectOniMoveTarget(event);
    return;
  }

  if (gameState.placement.pieceType !== "oni") {
    return;
  }

  placeSelectedPiece(event);
}

// =========================
// 建物クリック
// =========================

function onBuildingClick(event) {
  if (gameState.inputLocked) {
    return;
  }

  if (
    typeof handleDebugPlacement === "function" &&
    handleDebugPlacement(
      "building",
      Number(event.currentTarget.dataset.row),
      Number(event.currentTarget.dataset.col),
    )
  ) {
    return;
  }

  if (
    gameState.phase === "humanTurn" &&
    gameState.turn.actionMode === "humanMove"
  ) {
    selectHumanMoveTarget(event);
    return;
  }

  if (
    gameState.phase === "oniTurn" &&
    (gameState.turn.actionMode === "search" ||
      gameState.turn.actionMode === "oniReady")
  ) {
    selectOniSearchTarget(event);
    return;
  }

  if (gameState.placement.pieceType !== "human") {
    return;
  }

  placeSelectedPiece(event);
}

// =========================
// 選択中コマ配置
// =========================

function placeSelectedPiece(event) {
  const selected = gameState.placement.selectedPiece;

  if (selected === null) {
    return;
  }

  const row = Number(event.currentTarget.dataset.row);

  const col = Number(event.currentTarget.dataset.col);

  placeCurrentPiece(selected, row, col);

  gameState.placement.selectedPiece = null;

  refreshGameView();
}

// =========================
// 行動ボタンイベント登録
// =========================

function registerActionButtonEvent() {
  const actionButton = document.getElementById("actionButton");

  if (actionButton) {
    actionButton.addEventListener("click", onActionButtonClick);
  }

  const endOniTurnButton = document.getElementById("endOniTurnButton");

  if (endOniTurnButton) {
    endOniTurnButton.addEventListener("click", onEndOniTurnButtonClick);
  }

  const endHumanTurnButton = document.getElementById("endHumanTurnButton");

  if (endHumanTurnButton) {
    endHumanTurnButton.addEventListener("click", onEndHumanTurnButtonClick);
  }
}

// =========================
// パネルメニューボタンイベント登録
// =========================

function registerPanelMenuButtonEvents() {
  const buttons = document.querySelectorAll(".panelMenuButton");

  for (const button of buttons) {
    button.addEventListener("click", onPanelMenuButtonClick);
  }
}

// =========================
// パネルメニューボタンクリック
// =========================

function onPanelMenuButtonClick(event) {
  const action = event.currentTarget.dataset.action;

  if (action === "oniMove") {
    showOniMoveModePanel();
    return;
  }

  if (action === "oniSearch") {
    showOniSearchModePanel();
    return;
  }

  if (action === "cancelOniAction") {
    cancelOniAction();
  }

  if (action === "cancelHumanAction") {
    cancelHumanAction();
    return;
  }
}

// =========================
// 行動ボタンクリック
// =========================

function onActionButtonClick() {
  // -------------------------
  // パネル専用アクションがある場合
  // -------------------------

  if (gameState.panel.nextAction !== "") {
    handlePanelAction();

    return;
  }

  // -------------------------
  // 特殊パネル表示中
  // -------------------------

  if (gameState.panel.type !== "normal") {
    handlePanelAction();

    return;
  }

  // -------------------------
  // 鬼配置完了
  // -------------------------

  if (gameState.phase === "oniSetup") {
    if (!isOniSetupComplete()) {
      const settings = getGameSettings();

      alert("鬼を" + settings.oniCount + "体配置してください。");

      return;
    }

    showPassToHumanSetupPanel();

    return;
  }

  // -------------------------
  // 人間配置完了
  // -------------------------

  if (gameState.phase === "humanSetup") {
    if (!isHumanSetupComplete()) {
      alert("人間を配置してください。");
      return;
    }

    startDay1();

    return;
  }
}

// =========================
// 人間配置画面へ進む
// =========================

function showHumanSetup() {
  resetGamePanel();

  gameState.phase = "humanSetup";
  gameState.placement.pieceType = "human";
  gameState.placement.selectedPiece = null;

  renderGameScreen({
    day: "Day0",
    turn: "👤 人間配置",
    message: "人間を配置してください",
    buttonText: "配置完了",
  });
}

// =========================
// Day1開始（鬼ターン開始）
// =========================

function startDay1() {
  resetGamePanel();

  gameState.day = 1;

  gameState.phase = "oniTurn";

  gameState.turn.selectedOniId = null;
  gameState.turn.actionMode = "";

  gameState.placement.selectedPiece = null;

  gameState.drag.suppressClick = false;

  renderGameScreen({
    day: "Day1",
    turn: "🌙 鬼ターン",
    message: "鬼の行動を開始してください。<br>（人間も画面を見てOKです。）",
    buttonText: "行動終了",
  });

  addReplayHistory("dayStart", {
    turn: "oniTurn",
  });

  if (isTideNoticeDay()) {
    showTideNoticePanel();
  }
}

// =========================
// 人間ターン開始
// =========================

function startHumanTurn() {
  gameState.inputLocked = false;

  resetGamePanel();

  gameState.phase = "humanTurn";

  gameState.turn.selectedOniId = null;
  gameState.turn.selectedHumanId = null;
  gameState.turn.actionMode = "";

  renderGameScreen({
    day: "Day" + gameState.day,
    turn: "👤 人間ターン",
    message: "人間の行動を開始してください",
    buttonText: "行動終了",
  });

  addReplayHistory("turnStart", {
    turn: "humanTurn",
  });
}

// =========================
// 鬼行動キャンセル
// =========================

function cancelOniAction() {
  const oniId = gameState.turn.selectedOniId;

  gameState.turn.actionMode = "";
  gameState.turn.pendingMove = null;
  gameState.turn.pendingSearch = null;

  refreshGameView();

  if (oniId !== null) {
    showOniActionPanel(oniId);
    return;
  }

  resetGamePanel();

  refreshGameView();
}

// =========================
// 鬼移動先選択
// =========================

function selectOniMoveTarget(event) {
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);

  if (!isMovableCrossroad(row, col)) {
    return;
  }

  gameState.turn.pendingMove = { row, col };

  refreshGameView();

  showOniMoveConfirmPanel();
}

// =========================
// 鬼移動確定
// =========================

function confirmOniMove() {
  const oniId = gameState.turn.selectedOniId;
  const move = gameState.turn.pendingMove;

  if (oniId === null || move === null) {
    cancelOniAction();
    return;
  }

  const oni = getOniById(oniId);

  if (!oni) {
    cancelOniAction();
    return;
  }

  oni.position = {
    row: move.row,
    col: move.col,
  };

  oni.actionCount++;

  const settings = getGameSettings();

  oni.moved = oni.actionCount >= settings.oniMaxActions;

  addReplayHistory("oniMove", {
    oniId,
    to: {
      row: move.row,
      col: move.col,
    },
  });

  gameState.turn.selectedOniId = null;
  gameState.turn.actionMode = "";
  gameState.turn.pendingMove = null;

  resetGamePanel();

  refreshGameView();

  if (canOniAct(oniId)) {
    showOniActionPanel(oniId);
    return;
  }

  showOniAlreadyActedPanel(oniId);
}

// =========================
// 鬼探索先選択
// =========================

function selectOniSearchTarget(event) {
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);

  if (!isSearchableBuilding(row, col)) {
    return;
  }

  gameState.turn.pendingSearch = { row, col };

  refreshGameView();

  showOniSearchConfirmPanel();
}

// =========================
// 鬼探索確定
// =========================

function confirmOniSearch() {
  const oniId = gameState.turn.selectedOniId;
  const search = gameState.turn.pendingSearch;

  if (oniId === null || search === null) {
    cancelOniAction();
    return;
  }

  const oni = getOniById(oniId);

  if (!oni) {
    cancelOniAction();
    return;
  }

  const result = getSearchResult(search.row, search.col);

  oni.actionCount++;

  const settings = getGameSettings();

  oni.moved = oni.actionCount >= settings.oniMaxActions;

  addReplayHistory("oniSearch", {
    oniId,
    target: {
      row: search.row,
      col: search.col,
    },
    resultType: result.type,
  });

  gameState.turn.selectedOniId = oniId;
  gameState.turn.actionMode = "";
  gameState.turn.pendingSearch = null;

  refreshGameView();

  showOniSearchResultPanel(result);
}

// =========================
// 鬼ターン終了ボタンクリック
// =========================

function onEndOniTurnButtonClick() {
  if (!isOniTurnComplete()) {
    const ok = confirm("まだ行動できる鬼がいます。\n鬼ターンを終了しますか？");

    if (!ok) {
      return;
    }
  }

  // -------------------------
  // 鬼ターンを強制終了
  // 残り行動がある鬼も行動終了扱いにする
  // -------------------------

  const settings = getGameSettings();

  for (const oni of gameState.oni) {
    if (!oni.alive) {
      continue;
    }

    if (isPieceSunk(oni, "oni")) {
      continue;
    }

    oni.actionCount = settings.oniMaxActions;

    oni.moved = true;
  }

  refreshGameView();

  const result = checkGameResult("oniTurnEnd");

  if (result) {
    showGameResultPanel(result);
    return;
  }

  showPassToHumanPanel();
}

// =========================
// 人間移動モード開始
// =========================

function startHumanMoveMode(humanId) {
  const human = getHumanById(humanId);

  if (!human || human.moved) {
    return;
  }
  gameState.turn.selectedHumanId = humanId;
  gameState.turn.actionMode = "humanMove";

  refreshGameView();

  setGamePanel({
    type: "normal",
    title: "👤 人間",
    messages: ["移動先の建物を選んでください。"],
    buttonText: "キャンセル",
    nextAction: "cancelHumanAction",
  });
}

// =========================
// 人間行動キャンセル
// =========================

function cancelHumanAction() {
  gameState.turn.selectedHumanId = null;
  gameState.turn.actionMode = "";

  resetGamePanel();

  refreshGameView();
}

// =========================
// 人間移動先選択
// =========================

function selectHumanMoveTarget(event) {
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);

  if (!isMovableBuilding(row, col)) {
    return;
  }

  gameState.turn.pendingMove = { row, col };

  refreshGameView();

  showHumanMoveConfirmPanel();
}

// =========================
// 人間移動確定
// =========================

function confirmHumanMove() {
  const humanId = gameState.turn.selectedHumanId;
  const move = gameState.turn.pendingMove;

  if (humanId === null || move === null) {
    cancelHumanAction();
    return;
  }

  const human = getHumanById(humanId);

  if (!human || human.position === null) {
    cancelHumanAction();
    return;
  }

  addFootprint(human.position.row, human.position.col, {
    humanId,
    kind: human.hasMovedOnce ? "normal" : "start",
  });

  const from = {
    row: human.position.row,
    col: human.position.col,
  };

  human.position = {
    row: move.row,
    col: move.col,
  };

  human.moved = true;

  human.hasMovedOnce = true;

  addReplayHistory("humanMove", {
    humanId,

    from,

    to: {
      row: move.row,
      col: move.col,
    },
  });

  gameState.turn.selectedHumanId = null;
  gameState.turn.actionMode = "";
  gameState.turn.pendingMove = null;

  refreshGameView();

  setGamePanel({
    type: "message",
    title: "👤 人間",
    messages: ["人間の行動は完了しました。"],
    buttonText: "",
    nextAction: "",
  });
}

// =========================
// 人間ターン終了ボタンクリック
// =========================

function onEndHumanTurnButtonClick() {
  if (!isHumanTurnComplete()) {
    return;
  }

  startNextOniTurn();
}

// =========================
// 次の鬼ターン開始
// =========================

function startNextOniTurn() {
  resetGamePanel();

  gameState.day++;

  gameState.phase = "oniTurn";

  gameState.turn.selectedHumanId = null;
  gameState.turn.selectedOniId = null;
  gameState.turn.actionMode = "";
  gameState.turn.pendingMove = null;
  gameState.turn.pendingSearch = null;

  gameState.drag.suppressClick = false;

  for (const oni of gameState.oni) {
    oni.moved = false;

    oni.actionCount = 0;
  }

  for (const human of gameState.humans) {
    human.moved = false;
  }

  renderGameScreen({
    day: "Day" + gameState.day,
    turn: "🌙 鬼ターン",
    message: "鬼の行動を開始してください。<br>（人間も画面を見てOKです。）",
    buttonText: "行動終了",
  });

  if (isTideSinkDay()) {
    showTideSinkPanel();
    return;
  }

  if (isTideNoticeDay()) {
    showTideNoticePanel();
  }

  addReplayHistory("dayStart", {
    turn: "oniTurn",
  });
}
