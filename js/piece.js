"use strict";

// =========================
// コマ描画
// =========================

function renderPieces() {
  renderOni();

  renderHumans();

  renderFootprints();
}

// =========================
// 鬼の描画
// =========================

function renderOni() {
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const pieces = getPiecesAt(row, col);

      const oniList = pieces.filter((piece) => piece.type === "oni");

      if (oniList.length === 0) {
        continue;
      }

      const crossroad = document.querySelector(
        `.crossroad[data-row="${row}"][data-col="${col}"]`,
      );

      if (!crossroad) {
        continue;
      }

      crossroad.innerHTML = createMapPieceHtml("oni", oniList);
    }
  }
}

// =========================
// 人間の描画
// =========================

function renderHumans() {
  if (gameState.phase === "oniTurn") {
    return;
  }
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const pieces = getPiecesAt(row, col);

      const humanList = pieces.filter((piece) => piece.type === "human");

      if (humanList.length === 0) {
        continue;
      }

      const building = document.querySelector(
        `.building[data-row="${row}"][data-col="${col}"]`,
      );

      if (!building) {
        continue;
      }

      building.innerHTML += createMapPieceHtml("human", humanList);
    }
  }
}

// =========================
// 足跡描画
// =========================

function renderFootprints() {
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const footprints = getVisibleFootprints(row, col);

      if (footprints.length === 0) {
        continue;
      }

      const building = document.querySelector(
        `.building[data-row="${row}"][data-col="${col}"]`,
      );

      if (!building) {
        continue;
      }

      for (const footprint of footprints) {
        building.innerHTML += `
          <div class="footprint">
            ${getFootprintIcon(footprint)}
          </div>
        `;
      }
    }
  }
}

// =========================
// マップ上コマHTML生成
// =========================

function createMapPieceHtml(pieceType, pieceList) {
  const icon = getPieceIcon(pieceType);

  if (pieceList.length === 1) {
    const piece = pieceList[0];

    const isSelected =
      (gameState.phase === "oniTurn" &&
        pieceType === "oni" &&
        piece.data.id === gameState.turn.selectedOniId) ||
      (gameState.phase === "humanTurn" &&
        pieceType === "human" &&
        piece.data.id === gameState.turn.selectedHumanId) ||
      (gameState.placement.pieceType === pieceType &&
        piece.data.id === gameState.placement.selectedPiece);

    const isActed =
      gameState.phase === "oniTurn" &&
      pieceType === "oni" &&
      isOniActionComplete(piece.data);

    const isFoundHuman = pieceType === "human" && piece.data.found;

    return `
      <div
        class="mapPiece ${isSelected ? "selectedPiece" : ""} ${
          isActed ? "actedPiece" : ""
        } ${isFoundHuman ? "foundHumanPiece" : ""}"
        data-type="${pieceType}"
        data-id="${piece.data.id}"
      >
        ${icon}
      </div>
    `;
  }

  return `
    <div class="stackedPieces">
      ${pieceList
        .map((piece) => {
          const isSelected =
            (gameState.phase === "oniTurn" &&
              pieceType === "oni" &&
              piece.data.id === gameState.turn.selectedOniId) ||
            (gameState.phase === "humanTurn" &&
              pieceType === "human" &&
              piece.data.id === gameState.turn.selectedHumanId) ||
            (gameState.placement.pieceType === pieceType &&
              piece.data.id === gameState.placement.selectedPiece);

          const isActed =
            gameState.phase === "oniTurn" &&
            pieceType === "oni" &&
            isOniActionComplete(piece.data);

          const isFoundHuman = pieceType === "human" && piece.data.found;

          return `
            <div
              class="mapPiece stackedPiece ${
                isSelected ? "selectedPiece" : ""
              } ${isActed ? "actedPiece" : ""} ${isFoundHuman ? "foundHumanPiece" : ""}"
              data-type="${pieceType}"
              data-id="${piece.data.id}"
            >
              ${icon}
            </div>
          `;
        })
        .join("")}

      <div class="pieceCount">
        ×${pieceList.length}
      </div>
    </div>
  `;
}

// =========================
// 配置エリア描画
// =========================

function renderPlacementArea() {
  const placementArea = document.getElementById("placementArea");

  if (!placementArea) {
    return;
  }

  if (gameState.phase !== "oniSetup" && gameState.phase !== "humanSetup") {
    placementArea.innerHTML = "";
    return;
  }

  let html = "";

  const pieces = getCurrentPlacementPieces();

  for (const piece of pieces) {
    if (piece.position !== null) {
      continue;
    }

    const isSelected = gameState.placement.selectedPiece === piece.id;

    html += `
      <div
        class="placementPiece ${isSelected ? "selectedPiece" : ""}"
        data-type="${gameState.placement.pieceType}"
        data-id="${piece.id}"
      >

        <div class="pieceIcon">

          ${getPieceIcon(gameState.placement.pieceType)}

        </div>

        <div class="pieceNumber">

          ${piece.id + 1}

        </div>

      </div>
    `;
  }

  placementArea.innerHTML = html;

  // -------------------------
  // イベント登録
  // -------------------------

  const placementPieces = document.querySelectorAll(".placementPiece");

  for (const placementPiece of placementPieces) {
    placementPiece.addEventListener("click", onPlacementPieceClick);

    placementPiece.addEventListener("pointerdown", onPlacementPiecePointerDown);
  }
}

// =========================
// マップ上のコマイベント登録
// =========================

function registerMapPieceEvents() {
  const pieces = document.querySelectorAll(".mapPiece");

  for (const piece of pieces) {
    piece.addEventListener("click", onMapPieceClick);

    piece.addEventListener("pointerdown", onMapPiecePointerDown);
  }
}

// =========================
// コマアイコン取得
// =========================

function getPieceIcon(pieceType) {
  if (pieceType === "oni") {
    return ONI_ICON;
  }

  if (pieceType === "human") {
    return HUMAN_ICON;
  }

  return "";
}
