"use strict";

// =========================
// ドラッグ判定設定
// =========================

const DRAG_THRESHOLD = 8;

// =========================
// ドラッグ開始
// =========================

function startPieceDrag(pieceId, pointerEvent) {
  gameState.drag.pieceId = pieceId;

  gameState.drag.dragging = true;

  gameState.drag.pointerId = pointerEvent.pointerId;

  gameState.drag.startX = pointerEvent.clientX;
  gameState.drag.startY = pointerEvent.clientY;

  gameState.drag.currentX = pointerEvent.clientX;
  gameState.drag.currentY = pointerEvent.clientY;

  gameState.drag.hoverRow = null;
  gameState.drag.hoverCol = null;

  gameState.drag.wasMoved = false;
  gameState.drag.suppressClick = false;

  if (gameState.phase === "humanTurn") {
    const human = getHumanById(pieceId);

    if (!human || human.moved) {
      return;
    }

    gameState.turn.selectedHumanId = pieceId;
    gameState.turn.actionMode = "humanMove";
  }

  setDraggingPieceStyle(pieceId, true);

  createDragGhost(pieceId);

  moveDragGhost(pointerEvent.clientX, pointerEvent.clientY);

  document.addEventListener("pointermove", onDocumentPointerMove);

  document.addEventListener("pointerup", onDocumentPointerUp);

  document.addEventListener("pointercancel", onDocumentPointerCancel);
}

// =========================
// ドラッグ中
// =========================

function onDocumentPointerMove(event) {
  if (!gameState.drag.dragging) {
    return;
  }

  if (event.pointerId !== gameState.drag.pointerId) {
    return;
  }

  gameState.drag.currentX = event.clientX;
  gameState.drag.currentY = event.clientY;

  const distance = Math.hypot(
    event.clientX - gameState.drag.startX,
    event.clientY - gameState.drag.startY,
  );

  if (distance >= DRAG_THRESHOLD) {
    gameState.drag.wasMoved = true;
  }

  moveDragGhost(event.clientX, event.clientY);

  updateDragTarget(event.clientX, event.clientY);
}

// =========================
// ドラッグ終了
// =========================

function onDocumentPointerUp(event) {
  if (event.pointerId !== gameState.drag.pointerId) {
    return;
  }

  finishPieceDrag(event);
}

// =========================
// ドラッグキャンセル
// =========================

function onDocumentPointerCancel(event) {
  if (event.pointerId !== gameState.drag.pointerId) {
    return;
  }

  cancelPieceDrag();
}

// =========================
// ドラッグ完了
// =========================

function finishPieceDrag(event) {
  if (!gameState.drag.wasMoved) {
    resetDragState();

    return;
  }

  const pieceId = gameState.drag.pieceId;

  const nearestCrossroad = findNearestPlacementTarget(
    event.clientX,
    event.clientY,
  );

  if (pieceId !== null && nearestCrossroad) {
    if (
      gameState.phase === "humanTurn" &&
      !isMovableBuilding(nearestCrossroad.row, nearestCrossroad.col)
    ) {
      resetDragState();

      refreshGameView();

      return;
    }

    if (gameState.phase === "humanTurn") {
      const human = getHumanById(pieceId);

      if (!human || human.moved) {
        resetDragState();
        refreshGameView();
        return;
      }

      gameState.turn.selectedHumanId = pieceId;
      gameState.turn.actionMode = "humanMove";

      if (!isMovableBuilding(nearestCrossroad.row, nearestCrossroad.col)) {
        resetDragState();
        refreshGameView();
        return;
      }

      gameState.turn.pendingMove = {
        row: nearestCrossroad.row,
        col: nearestCrossroad.col,
      };

      showHumanMoveConfirmPanel();

      resetDragState();

      refreshGameView();

      return;
    }

    placeCurrentPiece(pieceId, nearestCrossroad.row, nearestCrossroad.col);

    gameState.placement.selectedPiece = null;

    gameState.drag.suppressClick = true;
  }

  resetDragState();

  refreshGameView();
}

// =========================
// ドラッグ中止
// =========================

function cancelPieceDrag() {
  resetDragState();

  refreshGameView();
}

// =========================
// ドラッグ状態リセット
// =========================

function resetDragState() {
  removeDragGhost();

  clearDragTarget();

  setDraggingPieceStyle(gameState.drag.pieceId, false);

  gameState.drag.pieceId = null;
  gameState.drag.dragging = false;
  gameState.drag.pointerId = null;

  gameState.drag.hoverRow = null;
  gameState.drag.hoverCol = null;

  gameState.drag.wasMoved = false;

  document.removeEventListener("pointermove", onDocumentPointerMove);

  document.removeEventListener("pointerup", onDocumentPointerUp);

  document.removeEventListener("pointercancel", onDocumentPointerCancel);
}

// =========================
// Ghost生成
// =========================

function createDragGhost(pieceId) {
  removeDragGhost();

  const ghost = document.createElement("div");

  ghost.id = "dragGhost";

  ghost.className = "dragGhost";

  ghost.textContent = getPieceIcon(gameState.placement.pieceType);

  ghost.dataset.id = pieceId;

  document.body.appendChild(ghost);
}

// =========================
// Ghost移動
// =========================

function moveDragGhost(x, y) {
  const ghost = getDragGhost();

  if (!ghost) {
    return;
  }

  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

// =========================
// Ghost取得
// =========================

function getDragGhost() {
  return document.getElementById("dragGhost");
}

// =========================
// Ghost削除
// =========================

function removeDragGhost() {
  const ghost = getDragGhost();

  if (ghost) {
    ghost.remove();
  }
}

// =========================
// 最寄り十字路更新
// =========================

function updateDragTarget(x, y) {
  const nearestTarget = findNearestPlacementTarget(x, y);

  clearDragTarget();

  if (!nearestTarget) {
    return;
  }

  gameState.drag.hoverRow = nearestTarget.row;
  gameState.drag.hoverCol = nearestTarget.col;

  let selector = "";

  if (gameState.placement.pieceType === "oni") {
    selector = `.crossroad[data-row="${nearestTarget.row}"][data-col="${nearestTarget.col}"]`;
  }

  if (gameState.placement.pieceType === "human") {
    selector = `.building[data-row="${nearestTarget.row}"][data-col="${nearestTarget.col}"]`;
  }

  const target = document.querySelector(selector);

  if (
    gameState.phase === "humanTurn" &&
    !isMovableBuilding(nearestTarget.row, nearestTarget.col)
  ) {
    return;
  }

  if (target) {
    target.classList.add("dragTarget");
  }
}

// =========================
// ドラッグ先表示解除
// =========================

function clearDragTarget() {
  const targets = document.querySelectorAll(".dragTarget");

  for (const target of targets) {
    target.classList.remove("dragTarget");
  }
}

// =========================
// ドラッグ元半透明
// =========================

function setDraggingPieceStyle(pieceId, isDragging) {
  if (pieceId === null) {
    return;
  }

  const elements = document.querySelectorAll(`[data-id="${pieceId}"]`);

  for (const element of elements) {
    if (
      !element.classList.contains("mapPiece") &&
      !element.classList.contains("placementPiece")
    ) {
      continue;
    }

    if (isDragging) {
      element.classList.add("draggingPiece");
    } else {
      element.classList.remove("draggingPiece");
    }
  }
}

// =========================
// 最寄り配置先取得
// =========================

function findNearestPlacementTarget(x, y) {
  let selector = "";

  if (gameState.placement.pieceType === "oni") {
    selector = ".crossroad";
  }

  if (gameState.placement.pieceType === "human") {
    selector = ".building";
  }

  if (selector === "") {
    return null;
  }

  const targets = document.querySelectorAll(selector);

  let nearest = null;

  let nearestDistance = Infinity;

  for (const target of targets) {
    const rect = target.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.hypot(x - centerX, y - centerY);

    if (distance < nearestDistance) {
      nearestDistance = distance;

      nearest = {
        row: Number(target.dataset.row),
        col: Number(target.dataset.col),
        distance,
      };
    }
  }

  return nearest;
}
