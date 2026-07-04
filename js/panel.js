"use strict";

// =========================
// パネル表示データ作成
// =========================

function createPanelData(screenData) {
  if (gameState.panel.type !== "normal") {
    return gameState.panel;
  }

  const buttonText =
    gameState.phase === "oniTurn" || gameState.phase === "humanTurn"
      ? ""
      : screenData.buttonText;

  return {
    type: "normal",

    title: "",

    messages: [screenData.message],

    buttonText,

    nextAction: "",
  };
}

// =========================
// パネル設定
// =========================

function setGamePanel(panelData) {
  gameState.panel = {
    type: panelData.type || "normal",

    title: panelData.title || "",

    messages: panelData.messages || [],

    menuButtons: panelData.menuButtons || [],

    buttonText: panelData.buttonText || "",

    nextAction: panelData.nextAction || "",
  };

  renderGamePanel({
    message: "",
    buttonText: gameState.panel.buttonText,
  });

  registerActionButtonEvent();
}

// =========================
// 通常パネルへ戻す
// =========================

function resetGamePanel() {
  gameState.panel = {
    type: "normal",

    title: "",

    messages: [],

    menuButtons: [],

    buttonText: "",

    nextAction: "",
  };
}

// =========================
// パネルアクション処理
// =========================

function handlePanelAction() {
  if (gameState.panel.nextAction === "showGameOverScreen") {
    renderGameOverScreen(gameState.result);

    return;
  }

  if (gameState.panel.nextAction === "confirmTideSink") {
    confirmTideSink();

    addReplayHistory("tideSink", {
      sunkSides: [...gameState.tide.sunkSides],
    });

    const result = checkGameResult("tide");

    if (result) {
      refreshGameView();

      showGameResultPanel(result);

      return;
    }

    resetGamePanel();

    renderGameScreen({
      day: "Day" + gameState.day,
      turn: "🌙 鬼ターン",
      message: "鬼の行動を開始してください",
      buttonText: "行動終了",
    });

    return;
  }

  if (gameState.panel.nextAction === "confirmHumanMove") {
    confirmHumanMove();
    return;
  }

  if (gameState.panel.nextAction === "cancelHumanAction") {
    cancelHumanAction();
    return;
  }

  if (gameState.panel.nextAction === "showHumanTurn") {
    startHumanTurn();
    return;
  }

  if (gameState.panel.nextAction === "showGameOver") {
    showGameResultPanel(gameState.result);

    return;
  }

  if (gameState.panel.nextAction === "showAlreadyActed") {
    const oniId = gameState.turn.selectedOniId;

    showOniAlreadyActedPanel(oniId);

    return;
  }

  if (gameState.panel.nextAction === "closePanel") {
    resetGamePanel();

    renderGameScreen({
      day: "Day" + gameState.day,
      turn: gameState.phase === "oniTurn" ? "🌙 鬼ターン" : "👤 人間ターン",
      message:
        gameState.phase === "oniTurn"
          ? "鬼の行動を開始してください"
          : "人間の行動を開始してください",
      buttonText: "行動終了",
    });

    return;
  }

  if (gameState.panel.nextAction === "confirmOniMove") {
    confirmOniMove();
    return;
  }

  if (gameState.panel.nextAction === "confirmOniSearch") {
    confirmOniSearch();
    return;
  }

  if (gameState.panel.nextAction === "cancelOniAction") {
    cancelOniAction();
    return;
  }

  if (gameState.panel.nextAction === "showHumanSetup") {
    showHumanSetup();
    return;
  }

  resetGamePanel();
  refreshGameView();
}

// =========================
// 人間配置前 受け渡しパネル表示
// =========================

function showPassToHumanSetupPanel() {
  setGamePanel({
    type: "pass",

    title: "👹 → 👤",

    messages: ["端末を人間へ渡してください", "鬼は画面を見ないでください"],

    buttonText: "OK",

    nextAction: "showHumanSetup",
  });
}

// =========================
// 人間受け渡しパネル表示
// =========================

function showPassToHumanPanel() {
  setGamePanel({
    type: "pass",
    title: "👹 → 👤",
    messages: ["端末を人間へ渡してください", "鬼は画面を見ないでください"],
    buttonText: "OK",
    nextAction: "showHumanTurn",
  });
}

// =========================
// 鬼行動パネル表示
// =========================

function showOniActionPanel(oniId) {
  if (!canOniAct(oniId)) {
    showOniAlreadyActedPanel(oniId);

    return;
  }

  gameState.turn.selectedOniId = oniId;

  refreshGameView();

  setGamePanel({
    type: "menu",
    title: "👹 鬼" + (oniId + 1),
    messages: ["何をしますか？"],
    menuButtons: [
      {
        label: "移動",
        action: "oniMove",
      },
      {
        label: "探索",
        action: "oniSearch",
      },
    ],
    buttonText: "",
    nextAction: "",
  });
}

// =========================
// 鬼行動済みパネル表示
// =========================

function showOniAlreadyActedPanel(oniId) {
  setGamePanel({
    type: "message",
    title: "👹 鬼" + (oniId + 1),
    messages: ["この鬼はすでに行動済みです。"],
    buttonText: "",
    nextAction: "",
  });
}

// =========================
// 鬼移動モードパネル表示
// =========================

function showOniMoveModePanel() {
  gameState.turn.actionMode = "move";

  refreshGameView();

  setGamePanel({
    type: "normal",
    title: "👹 移動",
    messages: ["移動先の十字路を選んでください。"],
    buttonText: "キャンセル",
    nextAction: "cancelOniAction",
  });
}

// =========================
// 鬼探索モードパネル表示
// =========================

function showOniSearchModePanel() {
  gameState.turn.actionMode = "search";
  gameState.turn.pendingSearch = null;

  refreshGameView();

  setGamePanel({
    type: "normal",
    title: "👹 探索",
    messages: ["探索する場所を選んでください。"],
    buttonText: "キャンセル",
    nextAction: "cancelOniAction",
  });
}

// =========================
// 鬼移動確認パネル表示
// =========================

function showOniMoveConfirmPanel() {
  setGamePanel({
    type: "confirm",
    title: "👹 移動確認",
    messages: ["この十字路へ移動しますか？"],
    menuButtons: [
      {
        label: "キャンセル",
        action: "cancelOniAction",
      },
    ],
    buttonText: "OK",
    nextAction: "confirmOniMove",
  });
}

// =========================
// 鬼探索確認パネル表示
// =========================

function showOniSearchConfirmPanel() {
  setGamePanel({
    type: "confirm",
    title: "👹 探索確認",
    messages: ["この場所を探索しますか？"],
    menuButtons: [
      {
        label: "キャンセル",
        action: "cancelOniAction",
      },
    ],
    buttonText: "OK",
    nextAction: "confirmOniSearch",
  });
}

// =========================
// 鬼探索結果パネル表示
// =========================

function showOniSearchResultPanel(result) {
  if (result.type === "foundHuman") {
    gameState.result = result;

    showGameResultPanel(result);

    return;
  }

  setGamePanel({
    type: "result",

    title: result.title,

    messages: result.messages,

    buttonText: "OK",

    nextAction: "showAlreadyActed",
  });
}

// =========================
// 鬼勝利パネル表示
// =========================

function showOniWinPanel() {
  setGamePanel({
    type: "result",

    title: "鬼の勝利！",

    messages: ["ゲーム終了画面は今後実装します。"],

    buttonText: "",

    nextAction: "",
  });
}

// =========================
// 人間移動確認パネル表示
// =========================

function showHumanMoveConfirmPanel() {
  setGamePanel({
    type: "confirm",

    title: "👤 移動確認",

    messages: ["この場所へ移動しますか？"],

    menuButtons: [
      {
        label: "キャンセル",
        action: "cancelHumanAction",
      },
    ],

    buttonText: "OK",

    nextAction: "confirmHumanMove",
  });
}

// =========================
// 満潮予報パネル表示
// =========================

function showTideNoticePanel() {
  const nextTideDay = getNextTideDay();

  if (nextTideDay === null) {
    return;
  }

  setGamePanel({
    type: "progress",

    title: "🌊 満潮予報",

    messages: ["Day" + nextTideDay + "に満潮が発生します。"],

    buttonText: "OK",

    nextAction: "closePanel",
  });
}

// =========================
// 満潮発生パネル表示
// =========================

function showTideSinkPanel() {
  const side = decideNextSinkSide();

  if (side === null) {
    return;
  }

  setGamePanel({
    type: "progress",

    title: "🌊 満潮",

    messages: [getSinkSideName(side) + "が沈みます。"],

    buttonText: "OK",

    nextAction: "confirmTideSink",
  });

  refreshGameView();
}

// =========================
// ゲーム結果パネル表示
// =========================

function showGameResultPanel(result) {
  gameState.phase = "gameOver";

  gameState.gameOver = true;

  gameState.result = result;

  addReplayHistory("gameResult", {
    resultType: result.type,
  });

  setGamePanel({
    type: "result",

    title: result.title,

    messages: result.messages,

    buttonText: "ゲーム終了",

    nextAction: "showGameOverScreen",
  });

  refreshGameView();
}
