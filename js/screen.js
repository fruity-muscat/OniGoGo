"use strict";

// =========================
// タイトル画面
// =========================

function renderTitleScreen() {
  app.innerHTML = `
        <div class="screen">

            <h1>OniGoGo!</h1>

            <p>
                海で遭難した人間が漂流したのは、
                鬼の住む島だった。
            </p>

            <button id="startButton">
                スタート
            </button>

        </div>
    `;

  // -------------------------
  // スタートボタン
  // -------------------------

  document
    .getElementById("startButton")
    .addEventListener("click", renderRuleScreen);
}

// =========================
// ルール説明画面
// =========================

function renderRuleScreen() {
  app.innerHTML = `
        <div class="screen">

            <h2>ルール説明</h2>

            <p>

                ① 人間は10日間逃げ切れば勝利

            </p>

            <p>

                ② 鬼は人間を見つければ勝利

            </p>

            <p>

                ③ Day3・6・9で島が沈みます

            </p>

            <button id="nextButton">

                次へ

            </button>

        </div>
    `;

  // -------------------------
  // 次へボタン
  // -------------------------

  document.getElementById("nextButton").addEventListener("click", function () {
    renderGameScreen({
      day: "Day0",
      turn: "🌙 鬼配置",
      message: "鬼を配置してください",
      buttonText: "行動終了",
    });
  });
}

// =========================
// 共通ゲーム画面
// =========================

function renderGameScreen(screenData) {
  app.innerHTML = `

        <div class="screen">

            <div class="gameHeader">

                <div class="gameHeaderMain">

                    <span>${screenData.day}</span>

                    <span>${screenData.turn}</span>

                </div>

                <div class="gameHeaderSub">

                    ${getTideHeaderText()}

                </div>

            </div>

            <div id="mapArea"></div>

            <div id="placementArea"></div>

            <div id="gamePanel"></div>

        </div>

    `;

  refreshGameView();

  renderGamePanel(screenData);

  registerActionButtonEvent();
}

// =========================
// ゲーム下部パネル描画
// =========================

function renderGamePanel(screenData) {
  const gamePanel = document.getElementById("gamePanel");

  if (!gamePanel) {
    return;
  }

  const panelData = createPanelData(screenData);

  gamePanel.innerHTML = `
    <div class="gamePanel ${panelData.type}">

      ${panelData.title ? `<div class="panelTitle">${panelData.title}</div>` : ""}

      <div class="panelMessages">
        ${panelData.messages.map((message) => `<div>${message}</div>`).join("")}
      </div>

      ${renderPanelMenuButtons(panelData)}

      ${
        panelData.buttonText
          ? `
            <button id="actionButton">
              ${panelData.buttonText}
            </button>
          `
          : ""
      }

      ${renderTurnEndButton()}

    </div>
  `;

  registerPanelMenuButtonEvents();
}

// =========================
// パネルメニューボタン描画
// =========================

function renderPanelMenuButtons(panelData) {
  if (!panelData.menuButtons) {
    return "";
  }

  return `
    <div class="panelMenuButtons">
      ${panelData.menuButtons
        .map(
          (button) => `
            <button
              class="panelMenuButton"
              data-action="${button.action}"
            >
              ${button.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

// =========================
// ターン終了ボタン描画
// =========================

function renderTurnEndButton() {
  if (gameState.panel.type === "pass") {
    return "";
  }

  if (gameState.phase === "oniTurn") {
    if (!isOniTurnComplete()) {
      return "";
    }

    return `
      <button
        id="endOniTurnButton"
        class="turnEndButton"
      >
        行動終了
      </button>
    `;
  }

  if (gameState.phase === "humanTurn") {
    if (!isHumanTurnComplete()) {
      return "";
    }

    return `
      <button
        id="endHumanTurnButton"
        class="turnEndButton"
      >
        行動終了
      </button>
    `;
  }

  return "";
}

// =========================
// 満潮ヘッダー文言取得
// =========================

function getTideHeaderText() {
  const nextTideDay = getNextTideDay();

  if (nextTideDay === null) {
    return "🌊 次の満潮：なし";
  }

  return "🌊 次の満潮：Day" + nextTideDay;
}

// =========================
// ゲーム終了画面
// =========================

function renderGameOverScreen(result) {
  const resultData = createResultData(result);

  app.innerHTML = `
    <div class="screen">

      <div class="gameOverScreen">

        <h2>
          ${resultData.title}
        </h2>

        <div class="gameOverMessages">
          <p>
            勝因：${resultData.reason}
          </p>
        </div>

        <div class="resultInfo">

          <div class="resultInfoRow">
            <span>終了Day</span>
            <strong>Day${resultData.endDay}</strong>
          </div>

          <div class="resultInfoRow">
            <span>満潮発生回数</span>
            <strong>${resultData.tideCount}回</strong>
          </div>

          <div class="resultInfoRow">
            <span>発見された足跡</span>
            <strong>${resultData.foundFootprintCount}個</strong>
          </div>

          <div class="resultInfoRow">
            <span>生存した人間</span>
            <strong>${resultData.activeHumanCount}人</strong>
          </div>

          <div class="resultInfoRow">
            <span>残った鬼</span>
            <strong>${resultData.activeOniCount}体</strong>
          </div>

        </div>

        <button id="toReplayButton">
          リプレイへ進む
        </button>

      </div>

    </div>
  `;

  document
    .getElementById("toReplayButton")
    .addEventListener("click", renderReplayScreen);
}

// =========================
// リプレイ画面
// =========================

function renderReplayScreen() {
  gameState.replay.index = 0;
  gameState.replay.playing = false;
  gameState.replay.timerId = null;

  app.innerHTML = `
    <div class="screen">

      <div class="replayHeader">

        <div id="replayDay">
          Day -
        </div>

        <div id="replayTurn">
          -
        </div>

      </div>

      <div id="replayMapArea" class="mapArea"></div>

      <div class="replayControls">

        <button id="replayPrevDayButton">
          ◀◀
        </button>

        <button id="replayPrevButton">
          ◀
        </button>

        <button id="replayNextButton">
          ▶
        </button>

        <button id="replayNextDayButton">
          ▶▶
        </button>

      </div>

      <div id="replayDayButtons" class="replayDayButtons"></div>

      <div class="replayControls">

        <button id="replayAutoButton">
          自動再生
        </button>

        <button id="replayStopButton">
          停止
        </button>

      </div>

      <button id="replayExitButton">
        終了
      </button>

    </div>
  `;

  renderReplayDayButtons();

  registerReplayEvents();

  renderReplay();

  updateReplayButtonState();
}

// =========================
// リプレイDayボタン描画
// =========================

function renderReplayDayButtons() {
  const area = document.getElementById("replayDayButtons");

  if (!area) {
    return;
  }

  const days = [...new Set(gameState.replayHistory.map((item) => item.day))];

  area.innerHTML = days
    .map(
      (day) => `
        <button class="replayDayButton" data-day="${day}">
          Day${day}
        </button>
      `,
    )
    .join("");
}
