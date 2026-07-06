"use strict";

// =========================
// タイトル画面
// =========================

function renderTitleScreen() {
  app.innerHTML = `
        <div class="screen titleScreen">

            <h1 class="titleLogo">OniGoGo!</h1>

            <img
              src="images/title_island01.png"
              alt="海に浮かぶ鬼ヶ島"
              class="titleIslandImage"
            >

            <p
              id="titleStoryText"
              class="titleStoryText"
            ></p>

            <button id="startButton" class="titleStartButton">
                スタート
            </button>

        </div>
    `;

  // -------------------------
  // タイトル文章表示演出
  // -------------------------

  playTitleStory();

  // -------------------------
  // スタートボタン
  // -------------------------

  document
    .getElementById("startButton")
    .addEventListener("click", renderRuleScreen);
}

// =========================
// タイトル文章表示演出
// =========================

async function playTitleStory() {
  const textArea = document.getElementById("titleStoryText");

  if (!textArea) {
    return;
  }

  const firstLine = "海で遭難した人間が漂流したのは、";

  const secondLine = "鬼の住む島だった";

  textArea.innerHTML = "";

  for (const char of firstLine) {
    textArea.textContent += char;

    await wait(90);
  }

  await wait(500);

  textArea.innerHTML += "<br>";

  for (const char of secondLine) {
    textArea.innerHTML += char;

    await wait(110);
  }

  for (let i = 0; i < 3; i++) {
    await wait(500);

    textArea.innerHTML += "・";
  }
}

// =========================
// 待機処理
// =========================

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================
// ルール説明画面
// =========================

function renderRuleScreen() {
  app.innerHTML = `
    <div class="screen ruleScreen">

      <h2 class="ruleTitle">ルール説明</h2>

      <div class="ruleCard">
        <div class="ruleCardTitle">🎯 目的</div>
        <p>
          <strong>Day10まで、生き残れ。</strong><br>
          人間はDay10まで鬼から逃げ切れば勝利。<br>
          鬼は人間を見つければ勝利。<br>
          ただし、島は満潮で少しずつ沈んでいく。
        </p>
      </div>

      <div class="ruleCard">
        <div class="ruleCardTitle">行動</div>

        <div class="ruleIconRow">
          <img src="images/aka-oni01.png" alt="鬼" class="ruleIcon">
          <span>
            <strong>鬼</strong>：十字路を1マス移動するか、近隣の建物を1か所探索する。
          </span>
        </div>

        <div class="ruleIconRow">
          <img src="images/human01.png" alt="人間" class="ruleIcon">
          <span>
            <strong>人間</strong>：隣の建物へ1マス移動する。同じ場所にとどまることはできない。1度移動した建物へは移動できない。
          </span>
        </div>
      </div>

      <div class="ruleCard">
        <div class="ruleCardTitle">足跡</div>
        <p>
          人間が移動すると、移動前の建物に足跡が残る。<br>
          鬼には足跡が見えない。ただし、その建物を探索すると発見できる。<br>
          一度発見した足跡は、その後もずっと見ることができる。
        </p>

        <div class="ruleIconRow">
          <img src="images/footprint01.png" alt="通常足跡" class="ruleSmallIcon">
          <span>通常の足跡</span>
        </div>

        <div class="ruleIconRow">
          <img src="images/start_footprint01.png" alt="スタート地点" class="ruleSmallIcon">
          <span>スタート地点</span>
        </div>
      </div>

      <div class="ruleCard">
        <div class="ruleCardTitle">🌊 満潮</div>
        <p>
          Day3・Day6・Day9に満潮が発生。<br>
          北・東・南・西のどこか1方向が沈み、そこにいた鬼も人間も流される。<br>
          一度沈んだ方向が、再度沈むことはない。
        </p>
      </div>

      <p class="ruleCatch">
        鬼から逃げるだけでは、生き残れない。<br>
        沈む島を読み、Day10まで生き延びろ。
      </p>

      <button id="nextButton" class="ruleStartButton">
        ゲーム開始
      </button>

    </div>
  `;

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
    <div class="gamePanel ${gameState.panel.type}">

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
  if (gameState.panel.type.includes("pass")) {
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
  if (!canShowTideHeader()) {
    return "";
  }

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

  const endingData = getEndingData(result, resultData);

  app.innerHTML = `
    <div class="screen gameOverPage">

      <div class="gameOverScreen">

        <h2>
          ${resultData.title}
        </h2>

        <div class="gameOverMessages">
          勝因：${resultData.reason}
        </div>

        ${renderEndingContent(endingData)}

        <div class="resultInfo resultInfoCompact">

          <div class="resultInfoRow">
            <span>終了Day</span>
            <strong>Day${resultData.endDay}</strong>
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

        <button id="toReplayButton" class="toReplayButton">
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
// エンディングデータ取得
// =========================

function getEndingData(result, resultData) {
  const reason = resultData.reason;

  if (result.type === "foundHuman") {
    return {
      title: "鬼ヶ島の大宴会",
      image: "images/ending_oni_found01.png",
      alt: "鬼ヶ島の大宴会",
      story: [
        "捕まった――そう思った。",
        "しかし、連れていかれた先で待っていたのは、",
        "ごちそうと鬼饅頭、そしてたくさんの笑顔だった。",
        "鬼たちはただ、人間を沈む島から助けたかったのだ。",
      ],
      closing: "こうして鬼ヶ島史上、初めての大宴会が始まった。",
    };
  }

  if (result.type === "oniWin" && reason === "人間は逃げ場を失いました。") {
    return {
      title: "鬼ヶ島のおみやげ",
      image: "images/ending_oni_blocked01.png",
      alt: "鬼ヶ島のおみやげ",
      story: [
        "逃げ場を失い、海賊たちは覚悟を決めた。",
        "しかし、鬼が差し出したのは武器ではなく鬼饅頭だった。",
        "鬼たちは帰りの船まで貸してくれた。",
        "ずっと追っていたのは、沈む島から助けるためだったのだ。",
      ],
      closing: "鬼たちに見送られ、海賊たちは鬼ヶ島をあとにした。",
    };
  }

  if (result.type === "oniWin" && reason === "人間は全員流されました。") {
    return {
      title: "鬼の救助隊",
      image: "images/ending_oni_rescue01.png",
      alt: "鬼の救助隊",
      story: [
        "海へ流され、すべてが終わった――そう思った。",
        "そのとき海へ飛び込んだのは、追ってきた鬼たちだった。",
        "海賊たちは救い出され、温かい食事と鬼饅頭をもらった。",
        "鬼たちはずっと、沈む島から人間を守ろうとしていたのだ。",
      ],
      closing: "追跡者だと思っていた鬼たちは、命の恩人になった。",
    };
  }

  if (result.type === "humanWin" && reason === "Day10を生き延びました。") {
    return {
      title: "鬼の子どもたち",
      image: "images/ending_human_day10_01.png",
      alt: "鬼の子どもたち",
      story: [
        "10日間逃げ続けた海賊たちは、鬼の集落を見つけた。",
        "そこで出会ったのは、鬼饅頭を分けてくれる子どもたちだった。",
        "鬼たちは人間を捕まえたかったのではない。",
        "沈む島の危険から、守ろうと追いかけていたのだ。",
      ],
      closing: "こうして海賊たちは、鬼ヶ島に新しい友達を見つけた。",
    };
  }

  if (result.type === "humanWin" && reason === "鬼は全員流されました。") {
    return {
      title: "人間の救助隊",
      image: "images/ending_human_rescue01.png",
      alt: "人間の救助隊",
      story: [
        "流された鬼たちを見て、鬼の子どもたちが助けを求めた。",
        "海賊たちは集落の船を借り、迷わず鬼たちを救い出した。",
        "鬼たちは、沈む島の危険から守ろうと追いかけていたのだと。",
        "理由を知った今、もう敵ではなかった。",
      ],
      closing: "鬼を救った海賊たちは、鬼ヶ島の英雄になった。",
    };
  }

  if (result.type === "draw") {
    return {
      title: "みんな、生きていた！",
      image: "images/ending_draw01.png",
      alt: "みんな、生きていた！",
      story: [
        "鬼も海賊も、満潮の海へ流されてしまった。",
        "しかし海の中では、もう敵も味方もなかった。",
        "泳ぎの得意な者たちが、互いの仲間を助け合った。",
        "やがて全員が、無事に鬼ヶ島へたどり着いた。",
      ],
      closing: "海岸には、笑顔と鬼饅頭があふれていた。",
    };
  }

  return null;
}

// =========================
// エンディングHTML作成
// =========================

function renderEndingContent(endingData) {
  if (!endingData) {
    return "";
  }

  return `
    <div class="endingArea">

      <div class="endingTitle">
        ${endingData.title}
      </div>

      <img
        src="${endingData.image}"
        alt="${endingData.alt}"
        class="endingImage"
      >

      <div class="endingStory">
        ${endingData.story.map((line) => `<div>${line}</div>`).join("")}
      </div>

      <div class="endingClosing">
        ${endingData.closing}
      </div>

    </div>
  `;
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

      <div class="replaySpeedArea">
        <span class="replaySpeedLabel">
          再生速度
        </span>

        <div class="replaySpeedButtons">
          <button
            class="replaySpeedButton"
            data-speed="500"
          >
            0.5秒
          </button>

          <button
            class="replaySpeedButton active"
            data-speed="1000"
          >
            1秒
          </button>

          <button
            class="replaySpeedButton"
            data-speed="1500"
          >
            1.5秒
          </button>

          <button
            class="replaySpeedButton"
            data-speed="2000"
          >
            2秒
          </button>
        </div>
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
