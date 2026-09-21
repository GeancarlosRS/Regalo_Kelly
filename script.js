"use strict";

/* =========================================================
   REGALO PARA KELLY JT - JAVASCRIPT DEFINITIVO
========================================================= */

const $ = (id) => document.getElementById(id);

const intro = $("intro");
const grow = $("grow");
const transition = $("transition");
const performance = $("performance");

const startBtn = $("startBtn");
const growBtn = $("growBtn");
const growthStage = $("growthStage");
const growCount = $("growCount");
const growText = $("growText");

const flowerField = $("flowerField");
const monkey = $("monkey");
const monkeyArt = $("monkeyArt");
const armBouquet = $("armBouquet");

const perfHud = $("perfHud");
const pickedCountEl = $("pickedCount");
const totalCountEl = $("totalCount");
const pickedBar = $("pickedBar");
const timeLeftEl = $("timeLeft");
const musicBadge = $("musicBadge");
const finalText = $("finalText");

const music = $("music");

const TOTAL_GROW_CLICKS = 10;
const TOTAL_FLOWERS = 10;

/* =========================================================
   CONFIGURACIÓN DE LA CANCIÓN

   0      = inicio del MP3
   45     = final del fragmento

   Ejemplo:
   72 = 1:12
   115 = 1:55
========================================================= */

const MUSIC_START = 0;
const MUSIC_END = 45;

let growClicks = 0;
let gardenDone = false;
let flowerId = 0;

let audioContext = null;
let performanceActive = false;
let finalizing = false;
let selectedFlower = false;

let performanceClockId = 0;
let currentMonkeyX = 9;
let currentMonkeyY = 67;

/* Posiciones en porcentaje de pantalla */
const performancePositions = [
  { x: 9,  y: 24, scale: .43 },
  { x: 23, y: 65, scale: .39 },
  { x: 42, y: 22, scale: .48 },
  { x: 60, y: 69, scale: .40 },
  { x: 79, y: 23, scale: .45 },
  { x: 91, y: 58, scale: .38 },
  { x: 13, y: 48, scale: .40 },
  { x: 35, y: 44, scale: .42 },
  { x: 69, y: 43, scale: .43 },
  { x: 83, y: 76, scale: .39 }
];

let collectedFlowers = 0;

/* =========================================================
   UTILIDADES
========================================================= */

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("active");
  });

  screen.classList.add("active");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/* =========================================================
   SONIDOS WEB AUDIO
========================================================= */

function startAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

function playTone(
  frequency,
  duration = 0.12,
  volume = 0.06,
  type = "sine"
) {
  startAudioContext();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(
    frequency,
    audioContext.currentTime
  );

  gain.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    audioContext.currentTime + 0.015
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + 0.01);
}

function clickSound() {
  playTone(560, 0.10, 0.055);
  window.setTimeout(() => playTone(780, 0.09, 0.04), 45);
}

function flowerSound() {
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    window.setTimeout(() => {
      playTone(frequency, 0.25, 0.075);
    }, index * 55);
  });
}

function collectSound() {
  [392, 523.25, 659.25].forEach((frequency, index) => {
    window.setTimeout(() => {
      playTone(frequency, 0.22, 0.055);
    }, index * 45);
  });
}

/* =========================================================
   CRECIMIENTO
========================================================= */

function showSeed() {
  growthStage.innerHTML = `
    <div class="growth-seed">
      <div class="seed-shadow"></div>
      <div class="real-seed"></div>
    </div>`;
}

function showSprout() {
  growthStage.innerHTML = `
    <div class="sprout">
      <div class="sprout-stem"></div>
      <div class="sprout-leaf left"></div>
      <div class="sprout-leaf right"></div>
    </div>`;
}

function showPlant() {
  growthStage.innerHTML = `
    <div class="plant">
      <div class="plant-stem"></div>
      <div class="plant-leaf left"></div>
      <div class="plant-leaf right"></div>
      <div class="plant-bud"></div>
    </div>`;
}

function showBud() {
  growthStage.innerHTML = `
    <div class="bud">
      <div class="bud-stem"></div>
      <div class="bud-leaf left"></div>
      <div class="bud-leaf right"></div>
      <div class="closed-bud"></div>
    </div>`;
}

function createGardenFlower(x, scale, delay = 0) {
  const flower = document.createElement("div");

  flower.className = "garden-flower";

  const isMobile = window.innerWidth <= 650;

  const responsiveX = isMobile
    ? x * 0.40
    : x;

  const responsiveScale = isMobile
    ? scale * 0.82
    : scale;

  flower.style.left = `calc(50% + ${responsiveX}px)`;
  flower.style.setProperty("--scale", responsiveScale);
  flower.style.animationDelay = `${delay}s`;

  flower.innerHTML = sunflowerSVG(`garden_${flowerId++}`);
  growthStage.appendChild(flower);
}

function sunflowerSVG(prefix) {
  const outer = [];
  const inner = [];

  for (let i = 0; i < 20; i += 1) {
    const angle = i * 18;

    outer.push(`
      <ellipse
        cx="150"
        cy="135"
        rx="21"
        ry="68"
        transform="rotate(${angle} 150 135) translate(0 -54)"
        fill="url(#${prefix}o)"
      />
    `);

    inner.push(`
      <ellipse
        cx="150"
        cy="135"
        rx="16"
        ry="53"
        transform="rotate(${angle + 9} 150 135) translate(0 -43)"
        fill="url(#${prefix}i)"
      />
    `);
  }

  return `
    <svg viewBox="0 0 300 520" aria-hidden="true">
      <defs>
        <linearGradient id="${prefix}o" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff47b"/>
          <stop offset=".48" stop-color="#ffd532"/>
          <stop offset="1" stop-color="#e8a400"/>
        </linearGradient>

        <linearGradient id="${prefix}i" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffeb64"/>
          <stop offset="1" stop-color="#eead06"/>
        </linearGradient>

        <radialGradient id="${prefix}c" cx="35%" cy="30%">
          <stop offset="0" stop-color="#ad7135"/>
          <stop offset=".48" stop-color="#75440f"/>
          <stop offset="1" stop-color="#2f1203"/>
        </radialGradient>
      </defs>

      <path
        d="M150 505 C146 415 154 320 150 220"
        stroke="#347b2c"
        stroke-width="12"
        stroke-linecap="round"
        fill="none"
      />

      <path
        d="M147 405 C103 383 68 396 53 426 C90 440 122 432 150 414 Z"
        fill="#438e31"
      />

      <path
        d="M152 354 C194 327 230 334 248 361 C214 377 183 370 151 359 Z"
        fill="#4b9635"
      />

      ${outer.join("")}
      ${inner.join("")}

      <circle cx="150" cy="135" r="58" fill="#d19319"/>
      <circle cx="150" cy="135" r="50" fill="url(#${prefix}c)"/>

      <g fill="#351603" opacity=".72">
        <circle cx="128" cy="114" r="3"/>
        <circle cx="145" cy="106" r="3"/>
        <circle cx="162" cy="111" r="3"/>
        <circle cx="178" cy="124" r="3"/>
        <circle cx="121" cy="136" r="3"/>
        <circle cx="139" cy="131" r="3"/>
        <circle cx="158" cy="136" r="3"/>
        <circle cx="178" cy="141" r="3"/>
        <circle cx="128" cy="158" r="3"/>
        <circle cx="146" cy="166" r="3"/>
        <circle cx="165" cy="160" r="3"/>
      </g>
    </svg>
  `;
}

/* =========================================================
   ARRANQUE DEL CRECIMIENTO
========================================================= */

startBtn.addEventListener("click", () => {
  startAudioContext();
  showScreen(grow);
  showSeed();
});

growBtn.addEventListener("click", () => {
  if (gardenDone) {
    startFinalScene();
    return;
  }

  clickSound();
  growClicks += 1;
  growCount.textContent = `${growClicks} / ${TOTAL_GROW_CLICKS}`;

  switch (growClicks) {
    case 1:
      showSeed();
      growText.textContent = "Algo empieza aquí.";
      break;

    case 2:
      showSprout();
      growText.textContent = "Ya salió.";
      break;

    case 3:
      showPlant();
      growText.textContent = "Está creciendo.";
      break;

    case 4:
      showBud();
      growText.textContent = "Espera...";
      break;

    case 5:
      growthStage.innerHTML = "";
      createGardenFlower(0, .84);
      flowerSound();
      growText.textContent = "Ahí está.";
      break;

    case 6:
      createGardenFlower(-128, .68, .05);
      flowerSound();
      growText.textContent = "Otra más.";
      break;

    case 7:
      createGardenFlower(128, .68, .10);
      flowerSound();
      growText.textContent = "Y otra.";
      break;

    case 8:
      createGardenFlower(-220, .54, .05);
      createGardenFlower(220, .54, .12);
      flowerSound();
      growText.textContent = "Ahora sí.";
      break;

    case 9:
      createGardenFlower(-65, .56, .05);
      createGardenFlower(65, .56, .12);
      flowerSound();
      growText.textContent = "Una última.";
      break;

    case 10:
      createGardenFlower(-292, .42, .05);
      createGardenFlower(292, .42, .12);
      flowerSound();
      gardenDone = true;
      growText.textContent = "Listo.";
      growBtn.innerHTML = "Continuar <span>→</span>";
      break;

    default:
      break;
  }
});

/* =========================================================
   ESCENA FINAL INTERACTIVA
========================================================= */

function startFinalScene() {
  startAudioContext();
  showScreen(transition);

  /* Preparar el audio sin que se escuche durante la transición. */
  music.currentTime = MUSIC_START;
  music.muted = true;

  music.play().catch(() => null);

  window.setTimeout(() => {
    showPerformance();
  }, 2000);
}

function showPerformance() {
  showScreen(performance);

  performanceActive = true;
  finalizing = false;
  selectedFlower = false;
  collectedFlowers = 0;
  currentMonkeyX = 9;
  currentMonkeyY = 67;

  music.currentTime = MUSIC_START;
  perfHud.classList.remove("hidden");
  finalText.classList.remove("show");
  musicBadge.classList.remove("hidden");

  totalCountEl.textContent = TOTAL_FLOWERS;

  createPerformanceFlowers();
  createMonkey();
  clearBouquet();
  updateHUD();

  monkey.className = "monkey dancing";
  monkey.style.left = `${currentMonkeyX}vw`;
  monkey.style.top = `${currentMonkeyY}vh`;
  monkey.style.transform = "translate(-50%,-50%)";

 music.muted = false;
music.volume = 0.25;

music.play().catch(() => {
  musicBadge.classList.add("hidden");
});

  updateTimeDisplay();
  performanceClockId = requestAnimationFrame(performanceClock);
}

/* =========================================================
   FLORES INTERACTIVAS
========================================================= */

function createPerformanceFlowers() {
  flowerField.innerHTML = "";

  performancePositions.forEach((position, index) => {
    const flower = document.createElement("button");

    flower.type = "button";
    flower.className = "performance-flower";
    flower.dataset.index = String(index);
    flower.dataset.collected = "false";
    flower.setAttribute("aria-label", `Girasol ${index + 1}`);

    flower.style.left = `${position.x}vw`;
    flower.style.top = `${position.y}vh`;
    flower.style.setProperty("--scale", position.scale);
    flower.style.animationDelay = `${index * .08}s`;

    flower.innerHTML = sunflowerSVG(`performance_${flowerId++}`);

    /* Funciona con mouse, lápiz y dedo. */
    flower.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      collectFlower(flower);
    });

    flowerField.appendChild(flower);

    window.setTimeout(() => {
      if (!flower.dataset.collected) return;
      flower.classList.add("float");
    }, 900);
  });

  /* Separar el aparecimiento para que se note que nacen en la escena. */
  window.setTimeout(() => {
    flowerField.querySelectorAll(".performance-flower").forEach((flower) => {
      if (flower.dataset.collected !== "true") {
        flower.classList.add("float");
      }
    });
  }, 850);
}

/* =========================================================
   RECOGER FLOR
========================================================= */

function collectFlower(flower) {
  if (!performanceActive || finalizing) return;
  if (selectedFlower) return;
  if (flower.dataset.collected === "true") return;

  selectedFlower = true;
  flower.dataset.collected = "true";

  monkey.classList.remove("dancing", "final", "celebrate");
  monkey.classList.add("walking");

  const flowerRect = flower.getBoundingClientRect();
  const targetX = flowerRect.left + flowerRect.width / 2;
  const targetY = flowerRect.top + flowerRect.height * .55;

  const monkeyRect = monkey.getBoundingClientRect();
  const currentX = monkeyRect.left + monkeyRect.width / 2;
  const currentY = monkeyRect.top + monkeyRect.height / 2;

  if (targetX < currentX) {
    monkey.classList.add("flip");
  } else {
    monkey.classList.remove("flip");
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const newX = clamp((targetX / screenWidth) * 100, 7, 93);
  const newY = clamp((targetY / screenHeight) * 100, 35, 78);

  const distance = Math.hypot(
    targetX - currentX,
    targetY - currentY
  );

  const walkDuration = Math.max(
    700,
    Math.min(1600, 550 + distance * .85)
  );

  monkey.style.transition =
    `left ${walkDuration}ms cubic-bezier(.2,.75,.2,1),` +
    `top ${walkDuration}ms cubic-bezier(.2,.75,.2,1)`;

  monkey.style.left = `${newX}vw`;
  monkey.style.top = `${newY}vh`;

  currentMonkeyX = newX;
  currentMonkeyY = newY;

  window.setTimeout(() => {
    if (!performanceActive || finalizing) return;

    monkey.classList.remove("walking");
    monkey.classList.add("picking");

    collectSound();

    const updatedMonkey = monkey.getBoundingClientRect();
    const armX = updatedMonkey.left + updatedMonkey.width * .60;
    const armY = updatedMonkey.top + updatedMonkey.height * .50;

    flower.style.setProperty(
      "--travel-x",
      `${armX - targetX}px`
    );

    flower.style.setProperty(
      "--travel-y",
      `${armY - targetY}px`
    );

    flower.classList.add("collecting");

    window.setTimeout(() => {
      addFlowerToBouquet();
      flower.remove();

      collectedFlowers += 1;
updateHUD();

/* =====================================
   SI YA RECOGIÓ LAS 10 FLORES
===================================== */

if (collectedFlowers >= TOTAL_FLOWERS) {

    selectedFlower = false;

    monkey.classList.remove("picking");
    monkey.classList.remove("celebrate");

    setTimeout(() => {

        finishPerformance();

    }, 450);

    return;
}


/* =====================================
   TODAVÍA QUEDAN FLORES
===================================== */

monkey.classList.remove("picking");
monkey.classList.add("celebrate");

window.setTimeout(() => {

    monkey.classList.remove("celebrate");

    if (performanceActive && !finalizing) {

        monkey.classList.add("dancing");

    }

    selectedFlower = false;

}, 400);
    }, 680);
  }, walkDuration + 80);
}

/* =========================================================
   HUD / RELOJ
========================================================= */

function updateHUD() {
  pickedCountEl.textContent = collectedFlowers;
  pickedBar.style.width = `${(collectedFlowers / TOTAL_FLOWERS) * 100}%`;
}

function updateTimeDisplay() {
  if (!Number.isFinite(music.currentTime)) return;

  const elapsed = Math.max(
    0,
    music.currentTime - MUSIC_START
  );

  const remaining = Math.max(
    0,
    MUSIC_END - MUSIC_START - elapsed
  );

  const seconds = Math.ceil(remaining);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  timeLeftEl.textContent =
    `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function performanceClock() {
  if (!performanceActive || finalizing) return;

  updateTimeDisplay();

  const elapsed =
    music.currentTime - MUSIC_START;

  /* Si el audio realmente terminó, termina aquí. */
  if (
    music.ended ||
    elapsed >= MUSIC_END - MUSIC_START
  ) {
    finishPerformance();
    return;
  }

  performanceClockId =
    requestAnimationFrame(performanceClock);
}

/* =========================================================
   MONO SVG
========================================================= */

function createMonkey() {
  monkeyArt.innerHTML = `
    <svg viewBox="0 0 360 460" aria-hidden="true">

      <!-- COLA -->
      <path
        d="M75 307 C18 300 24 238 75 235 C105 233 108 271 80 276"
        fill="none"
        stroke="#70401f"
        stroke-width="22"
        stroke-linecap="round"
      />

      <!-- PIERNAS COMPLETAS -->
      <g class="leg-left">
        <path
          d="M145 351 L112 420"
          fill="none"
          stroke="#70401f"
          stroke-width="31"
          stroke-linecap="round"
        />
        <ellipse
          cx="100"
          cy="426"
          rx="36"
          ry="15"
          fill="#3b271b"
        />
      </g>

      <g class="leg-right">
        <path
          d="M215 351 L248 420"
          fill="none"
          stroke="#70401f"
          stroke-width="31"
          stroke-linecap="round"
        />
        <ellipse
          cx="260"
          cy="426"
          rx="36"
          ry="15"
          fill="#3b271b"
        />
      </g>

      <!-- CUERPO -->
      <ellipse
        cx="180"
        cy="270"
        rx="88"
        ry="105"
        fill="#7b4728"
      />

      <!-- PANZA -->
      <ellipse
        cx="180"
        cy="283"
        rx="54"
        ry="67"
        fill="#bd804b"
      />

      <!-- CAMISA -->
      <path
        d="M116 239 Q180 273 244 239 L236 337 Q180 358 124 337 Z"
        fill="#f2efe6"
      />

      <!-- CHALECO -->
      <path
        d="M138 243 L180 272 L222 243 L214 343 L180 353 L146 343 Z"
        fill="#252525"
      />

      <!-- CORBATA -->
      <path
        d="M165 251 L195 251 L187 315 L180 323 L173 315 Z"
        fill="#bd871f"
      />

      <!-- CABEZA -->
      <circle
        cx="180"
        cy="112"
        r="94"
        fill="#7b4728"
      />

      <!-- OREJAS -->
      <circle cx="90" cy="116" r="38" fill="#6d3c1c" />
      <circle cx="270" cy="116" r="38" fill="#6d3c1c" />
      <circle cx="92" cy="116" r="21" fill="#c0814b" />
      <circle cx="268" cy="116" r="21" fill="#c0814b" />

      <!-- CARA -->
      <ellipse
        cx="180"
        cy="142"
        rx="65"
        ry="53"
        fill="#c28750"
      />

      <!-- CEJAS -->
      <path
        d="M126 102 Q144 89 159 99"
        fill="none"
        stroke="#4b2713"
        stroke-width="7"
        stroke-linecap="round"
      />
      <path
        d="M201 99 Q217 89 234 102"
        fill="none"
        stroke="#4b2713"
        stroke-width="7"
        stroke-linecap="round"
      />

      <!-- OJOS -->
      <circle cx="145" cy="113" r="9" fill="#17100b" />
      <circle cx="215" cy="113" r="9" fill="#17100b" />
      <circle cx="148" cy="110" r="3" fill="#ffffff" />
      <circle cx="218" cy="110" r="3" fill="#ffffff" />

      <!-- NARIZ -->
      <ellipse
        cx="180"
        cy="143"
        rx="12"
        ry="9"
        fill="#45210e"
      />

      <!-- SONRISA -->
      <path
        d="M146 164 Q180 195 214 164"
        fill="none"
        stroke="#49230f"
        stroke-width="6"
        stroke-linecap="round"
      />

      <!-- BRAZOS COMPLETOS -->
      <g class="arm-left">
        <path
          d="M116 253 Q63 276 78 337"
          fill="none"
          stroke="#7b4728"
          stroke-width="31"
          stroke-linecap="round"
        />
        <circle cx="79" cy="338" r="22" fill="#c28750" />
      </g>

      <g class="arm-right">
        <path
          d="M244 253 Q297 276 282 337"
          fill="none"
          stroke="#7b4728"
          stroke-width="31"
          stroke-linecap="round"
        />
        <circle cx="281" cy="338" r="22" fill="#c28750" />
      </g>

    </svg>
  `;
}

/* =========================================================
   RAMO DEL MONO
========================================================= */

function clearBouquet() {
  armBouquet.innerHTML = "";
  armBouquet.className = "arm-bouquet";
}

function addFlowerToBouquet() {
  const positions = [
    [8, 78, -24],
    [35, 61, -12],
    [60, 75, 8],
    [28, 43, -18],
    [55, 39, 5],
    [83, 52, 20],
    [47, 24, -5],
    [69, 27, 14],
    [94, 40, 24],
    [58, 15, 0]
  ];

  const index = Math.min(
    collectedFlowers,
    positions.length - 1
  );

  const [x, y, rotation] = positions[index];

  const flower = document.createElement("div");
  flower.className = `bouquet-mini bm${index + 1}`;
  flower.style.left = `${x}px`;
  flower.style.top = `${y}px`;
  flower.style.transform = `rotate(${rotation}deg)`;
  flower.innerHTML = miniSunflowerSVG(`mini_${flowerId++}`);

  armBouquet.appendChild(flower);
  armBouquet.classList.add("visible");
}

function miniSunflowerSVG(prefix) {
  const petals = [];

  for (let i = 0; i < 14; i += 1) {
    const angle = i * (360 / 14);

    petals.push(`
      <ellipse
        cx="75"
        cy="57"
        rx="12"
        ry="35"
        transform="rotate(${angle} 75 57) translate(0 -28)"
        fill="url(#${prefix}p)"
      />
    `);
  }

  return `
    <svg viewBox="0 0 150 180" aria-hidden="true">
      <defs>
        <linearGradient id="${prefix}p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff36a"/>
          <stop offset="1" stop-color="#eca900"/>
        </linearGradient>
        <radialGradient id="${prefix}c">
          <stop offset="0" stop-color="#9d6125"/>
          <stop offset="1" stop-color="#3a1804"/>
        </radialGradient>
      </defs>

      <path
        d="M75 175 C74 130 76 100 75 72"
        stroke="#31762a"
        stroke-width="6"
        fill="none"
        stroke-linecap="round"
      />

      ${petals.join("")}

      <circle cx="75" cy="57" r="27" fill="#cb8b16"/>
      <circle cx="75" cy="57" r="23" fill="url(#${prefix}c)"/>
    </svg>
  `;
}

/* =========================================================
   MÚSICA
========================================================= */

music.addEventListener("loadedmetadata", () => {
  /* Si el MP3 es más corto, terminamos al final real. */
  if (
    Number.isFinite(music.duration) &&
    MUSIC_END > music.duration - MUSIC_START
  ) {
    console.info(
      "MUSIC_END supera la duración del MP3; se usará el final real."
    );
  }
});

music.addEventListener("error", () => {
  console.warn(
    "No se pudo cargar audio/musica.mp3. Revisa que el archivo exista con ese nombre."
  );
  musicBadge.classList.add("hidden");
});

music.addEventListener("ended", () => {
  if (performanceActive && !finalizing) {
    finishPerformance();
  }
});

/* =========================================================
   FINAL
========================================================= */

function finishPerformance() {
  if (finalizing) return;

  finalizing = true;
  performanceActive = false;

  cancelAnimationFrame(performanceClockId);

  perfHud.classList.add("hidden");
  musicBadge.classList.add("hidden");

  flowerField.querySelectorAll(".performance-flower").forEach((flower) => {
    flower.style.pointerEvents = "none";
    flower.style.opacity = ".07";
  });

  monkey.classList.remove(
    "dancing",
    "walking",
    "picking",
    "celebrate",
    "flip"
  );

  monkey.classList.add("final");

  monkey.style.transition =
    "left 1.15s cubic-bezier(.2,.75,.2,1)," +
    "top 1.15s cubic-bezier(.2,.75,.2,1)";

  monkey.style.left = "50vw";

    if (window.innerWidth <= 650) {
    monkey.style.setProperty("top", "57vh", "important");
  } else {
    monkey.style.top = "72vh";
  }
  armBouquet.classList.add("final-bouquet");

  window.setTimeout(() => {
    finalText.classList.add("show");
  }, 1700);
}

/* =========================================================
   EFECTOS FINALES
========================================================= */

function petalRain() {
  for (let i = 0; i < 65; i += 1) {
    window.setTimeout(() => {
      const petal = document.createElement("div");
      petal.className = "falling-petal";
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.animationDuration = `${3 + Math.random() * 4}s`;
      document.body.appendChild(petal);

      window.setTimeout(() => {
        petal.remove();
      }, 8000);
    }, i * 55);
  }
}

function sparkleBurst() {
  for (let i = 0; i < 32; i += 1) {
    window.setTimeout(() => {
      const sparkle = document.createElement("div");
      sparkle.className = "final-spark";
      sparkle.textContent = "✦";
      sparkle.style.left = `${20 + Math.random() * 60}vw`;
      sparkle.style.top = `${20 + Math.random() * 55}vh`;
      document.body.appendChild(sparkle);

      window.setTimeout(() => {
        sparkle.remove();
      }, 2000);
    }, i * 65);
  }
}
