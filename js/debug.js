"use strict";

let debugPlacement = {
  type: "",
  id: null,
};

// =========================
// デバッグモード判定
// =========================

function isDebugMode() {
  return location.search.includes("debug=1");
}

// =========================
// デバッグUI描画
// =========================

function renderDebugButton() {
  if (!isDebugMode()) {
    return;
  }

  const button = document.createElement("button");

  button.id = "debugButton";

  button.textContent = "🛠 DEBUG";

  button.addEventListener("click", toggleDebugPanel);

  document.body.appendChild(button);
}

// =========================
// デバッグパネル開閉
// =========================

function toggleDebugPanel() {
  const existingPanel = document.getElementById("debugPanel");

  if (existingPanel) {
    existingPanel.remove();
    return;
  }

  renderDebugPanel();
}

// =========================
// デバッグパネル描画
// =========================

function renderDebugPanel() {
  const panel = document.createElement("div");

  panel.id = "debugPanel";

  panel.innerHTML = `
    <div class="debugTitle">
      🛠 DEBUG
    </div>

    <div class="debugSection">
      <div class="debugSectionTitle">Day</div>

      <div class="debugButtonGrid">
        ${createDebugDayButtons()}
      </div>
    </div>

    <div class="debugSection">
      <div class="debugSectionTitle">ターン切替</div>

      <div class="debugButtonGrid">
        <button onclick="debugSetTurn('oniTurn')">鬼ターン</button>
        <button onclick="debugSetTurn('humanTurn')">人間ターン</button>
      </div>
    </div>

    <div class="debugSection">
      <div class="debugSectionTitle">満潮方向</div>

      <div class="debugButtonGrid">
        <button onclick="debugSetSinkSide('north')">北</button>
        <button onclick="debugSetSinkSide('east')">東</button>
        <button onclick="debugSetSinkSide('south')">南</button>
        <button onclick="debugSetSinkSide('west')">西</button>
      </div>
    </div>

    <div class="debugSection">
      <div class="debugSectionTitle">画面確認</div>

      <div class="debugButtonGrid">
        <button onclick="debugShowResult('oniWin')">鬼勝利</button>
        <button onclick="debugShowResult('humanWin')">人間勝利</button>
        <button onclick="debugShowResult('draw')">引き分け</button>
        <button onclick="renderReplayScreen()">リプレイ</button>
      </div>
    </div>

    <div class="debugSection">
      <div class="debugSectionTitle">コマ配置</div>

      <div id="debugPlacementStatus">選択中：なし</div>

      <div class="debugButtonGrid">
        <button onclick="debugSelectPiece('oni', 0)">鬼1</button>
        <button onclick="debugSelectPiece('oni', 1)">鬼2</button>
        <button onclick="debugSelectPiece('oni', 2)">鬼3</button>
        <button onclick="debugSelectPiece('human', 0)">人間1</button>
      </div>

      <button onclick="debugClearPlacement()">
        選択解除
      </button>
    </div>

    <button onclick="toggleDebugPanel()">
      閉じる
    </button>
  `;

  document.body.appendChild(panel);
}

// =========================
// Dayボタン生成
// =========================

function createDebugDayButtons() {
  let html = "";

  for (let day = 1; day <= 10; day++) {
    html += `
      <button onclick="debugGoToDay(${day})">
        Day${day}
      </button>
    `;
  }

  return html;
}

// =========================
// 指定Dayへ移動
// =========================

function debugGoToDay(day) {
  gameState.day = day;

  gameState.phase = "oniTurn";

  gameState.turn.selectedOniId = null;
  gameState.turn.selectedHumanId = null;
  gameState.turn.actionMode = "";
  gameState.turn.pendingMove = null;
  gameState.turn.pendingSearch = null;

  for (const oni of gameState.oni) {
    oni.moved = false;
  }

  for (const human of gameState.humans) {
    human.moved = false;
  }

  resetGamePanel();

  renderGameScreen({
    day: "Day" + gameState.day,
    turn: "🌙 鬼ターン",
    message: "鬼の行動を開始してください",
    buttonText: "行動終了",
  });

  if (isTideSinkDay()) {
    showTideSinkPanel();
    return;
  }

  if (isTideNoticeDay()) {
    showTideNoticePanel();
  }
}

// =========================
// 満潮方向固定
// =========================

function debugSetSinkSide(side) {
  gameState.tide.nextSinkSide = side;

  gameState.tide.previewSide = side;

  showTideSinkPanel();
}

// =========================
// デバッグ配置コマ選択
// =========================

function debugSelectPiece(type, id) {
  debugPlacement.type = type;
  debugPlacement.id = id;

  updateDebugPlacementStatus();
}

// =========================
// デバッグ配置解除
// =========================

function debugClearPlacement() {
  debugPlacement.type = "";
  debugPlacement.id = null;

  updateDebugPlacementStatus();
}

// =========================
// デバッグ配置中か
// =========================

function isDebugPlacementMode() {
  return (
    isDebugMode() && debugPlacement.type !== "" && debugPlacement.id !== null
  );
}

// =========================
// デバッグ配置実行
// =========================

function handleDebugPlacement(targetType, row, col) {
  if (!isDebugPlacementMode()) {
    return false;
  }

  if (debugPlacement.type === "oni" && targetType !== "crossroad") {
    return false;
  }

  if (debugPlacement.type === "human" && targetType !== "building") {
    return false;
  }

  if (debugPlacement.type === "oni") {
    const oni = getOniById(debugPlacement.id);

    if (!oni) {
      return false;
    }

    oni.position = {
      row,
      col,
    };

    oni.moved = false;
  }

  if (debugPlacement.type === "human") {
    const human = getHumanById(debugPlacement.id);

    if (!human) {
      return false;
    }

    human.position = {
      row,
      col,
    };

    human.moved = false;
  }

  debugClearPlacement();

  refreshGameView();

  return true;
}

function updateDebugPlacementStatus() {
  const status = document.getElementById("debugPlacementStatus");

  if (!status) {
    return;
  }

  if (!isDebugPlacementMode()) {
    status.textContent = "選択中：なし";
    return;
  }

  const typeName = debugPlacement.type === "oni" ? "鬼" : "人間";

  status.textContent = "選択中：" + typeName + (debugPlacement.id + 1);
}

// =========================
// ターン切替
// =========================

function debugSetTurn(phase) {
  gameState.phase = phase;

  gameState.turn.selectedOniId = null;
  gameState.turn.selectedHumanId = null;
  gameState.turn.actionMode = "";
  gameState.turn.pendingMove = null;
  gameState.turn.pendingSearch = null;

  resetGamePanel();

  if (phase === "oniTurn") {
    for (const oni of gameState.oni) {
      oni.moved = false;
    }

    renderGameScreen({
      day: "Day" + gameState.day,
      turn: "🌙 鬼ターン",
      message: "鬼の行動を開始してください",
      buttonText: "行動終了",
    });

    return;
  }

  if (phase === "humanTurn") {
    for (const human of gameState.humans) {
      human.moved = false;
    }

    renderGameScreen({
      day: "Day" + gameState.day,
      turn: "👤 人間ターン",
      message: "人間の行動を開始してください",
      buttonText: "行動終了",
    });
  }
}

// =========================
// デバッグ用結果作成
// =========================

function debugCreateResult(type) {
  if (type === "oniWin") {
    return {
      type: "oniWin",
      title: "鬼の勝利！",
      messages: ["勝因：デバッグ確認用です。"],
    };
  }

  if (type === "humanWin") {
    return {
      type: "humanWin",
      title: "人間の勝利！",
      messages: ["勝因：デバッグ確認用です。"],
    };
  }

  return {
    type: "draw",
    title: "引き分け",
    messages: ["勝因：デバッグ確認用です。"],
  };
}

// =========================
// デバッグ用結果表示
// =========================

function debugShowResult(type) {
  const result = debugCreateResult(type);

  showGameResultPanel(result);
}
