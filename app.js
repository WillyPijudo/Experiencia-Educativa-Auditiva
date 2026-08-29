// ==========================================================
// ESCUDO SONORO — lógica de la app
// ==========================================================


const SOUND = {
  click: new Audio("audio/click.mp3"),
  intro: new Audio("audio/intro.mp3"),
  alerta: new Audio("audio/alerta.mp3"),
};
SOUND.intro.loop = true;
SOUND.intro.volume = 0.5;

function playSound(name) {
  const audio = SOUND[name];
  if (!audio) return;
  try { audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
}

function fadeOutIntro() {
  const step = 0.05;
  const id = setInterval(() => {
    if (SOUND.intro.volume > step) {
      SOUND.intro.volume -= step;
    } else {
      SOUND.intro.pause();
      SOUND.intro.currentTime = 0;
      SOUND.intro.volume = 0.5;
      clearInterval(id);
    }
  }, 60);
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (btn && btn.id !== "bootEnter") playSound("click");
});


function playAlerta() {
  const audio = SOUND.alerta;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    clearTimeout(audio._stopTimer);
    audio._stopTimer = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 1200);
  } catch (e) {}
}



(function boot() {
  const bootEl = document.getElementById("boot");
  const appEl = document.getElementById("app");
  const enterBtn = document.getElementById("bootEnter");

  enterBtn.addEventListener("click", () => {
    playSound("intro");
    bootEl.classList.add("boot-hide");
    appEl.hidden = false;
    setTimeout(() => {
      bootEl.hidden = true;
      fadeOutIntro();
    }, 650);
  });
})();

// ---- Navegación entre pantallas ----
(function nav() {
  const shieldNav = document.getElementById("shieldNav");
  const menu = document.getElementById("menu");
  const menuClose = document.getElementById("menuClose");
  const screens = document.querySelectorAll("[data-screen]");
  const gotoButtons = document.querySelectorAll("[data-goto]");

  function showScreen(id) {
    screens.forEach((s) => { s.hidden = s.id !== `screen-${id}`; });
    document.getElementById("screens").scrollTop = 0;
    if (window.ear3D) {
      const is3D = document.querySelector('.view-toggle-btn[data-view="3d"]')?.classList.contains("active");
      if (id === "oido" && is3D) window.ear3D.resume();
      else window.ear3D.pause();
    }
  }

  function openMenu() { menu.hidden = false; }
  function closeMenu() { menu.hidden = true; }

  shieldNav.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);

  gotoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(btn.dataset.goto);
      closeMenu();
    });
  });
})();

// ---- Simulador de decibeles ----
(function simulator() {
  const slider = document.getElementById("dbSlider");
  const dbValueEl = document.getElementById("dbValue");
  const protectButtons = document.querySelectorAll(".protect-btn");
  const effectiveDbEl = document.getElementById("effectiveDb");
  const safeTimeEl = document.getElementById("safeTime");
  const readoutNoteEl = document.getElementById("readoutNote");
  const riskLabelEl = document.getElementById("riskLabel");
  const earGlowEl = document.getElementById("earGlow");
  const bandEl = document.getElementById("protectBand");
  const earmuffEl = document.getElementById("protectEarmuff");
  const plugFoamEl = document.getElementById("protectPlugFoam");
  const plugMoldedEl = document.getElementById("protectPlugMolded");
  const refButtons = document.querySelectorAll(".db-ref");
  const compareBtn = document.getElementById("compareBtn");
  const comparePanel = document.getElementById("comparePanel");
  if (!slider) return;

  let attenuation = 0;
  let compareOn = false;
  let wasDanger = false;

  function safeMinutes(effectiveDb) {
    if (effectiveDb <= 80) return Infinity;
    return 480 / Math.pow(2, (effectiveDb - 85) / 3);
  }

  function formatTime(minutes) {
    if (!isFinite(minutes)) return "Toda la jornada";
    if (minutes >= 60) return `${(minutes / 60).toFixed(minutes >= 600 ? 0 : 1)} h`;
    if (minutes >= 1) return `${Math.round(minutes)} min`;
    return `${Math.round(minutes * 60)} seg`;
  }

  function riskState(effectiveDb) {
    if (effectiveDb <= 85) return { key: "safe", label: "SEGURO", color: "var(--mint)" };
    if (effectiveDb <= 105) return { key: "caution", label: "PRECAUCIÓN", color: "var(--hologram)" };
    return { key: "danger", label: "PELIGRO", color: "var(--signal)" };
  }

  function ringSpeed(effectiveDb) {
    const intensity = Math.min(1, Math.max(0, (effectiveDb - 40) / 100));
    return (2.2 - intensity * 1.7).toFixed(2);
  }

  function applyProtectionVisual(kind) {
    const showMuff = kind === "orejeras" || kind === "doble";
    const showFoam = kind === "espuma" || kind === "doble";
    const showMolded = kind === "moldeado";
    bandEl.classList.toggle("active", showMuff);
    earmuffEl.classList.toggle("active", showMuff);
    plugFoamEl.classList.toggle("active", showFoam);
    plugMoldedEl.classList.toggle("active", showMolded);
  }

  function update() {
    const rawDb = Number(slider.value);
    const effectiveDb = Math.max(20, rawDb - attenuation);

    dbValueEl.textContent = rawDb;
    effectiveDbEl.textContent = `${Math.round(effectiveDb)} dB`;

    const minutes = safeMinutes(effectiveDb);
    safeTimeEl.textContent = formatTime(minutes);

    const risk = riskState(effectiveDb);
    riskLabelEl.textContent = risk.label;
    riskLabelEl.style.color = risk.color;
    earGlowEl.style.background = risk.color;

    if (risk.key === "safe") {
      readoutNoteEl.textContent = attenuation > 0
        ? "Con esta protección, este nivel no representa riesgo en toda la jornada."
        : "Con este nivel podés trabajar la jornada completa sin riesgo.";
    } else if (risk.key === "caution") {
      readoutNoteEl.textContent = attenuation > 0
        ? "Todavía conviene limitar el tiempo de exposición, aunque estés protegido."
        : "A partir de acá, cada 3 dB de más reduce el tiempo seguro a la mitad. Usá protección.";
    } else {
      readoutNoteEl.textContent = attenuation > 0
        ? "Nivel muy alto: incluso con protección, minimizá el tiempo de exposición."
        : "Riesgo inmediato de daño auditivo. Protección obligatoria.";
    }

    const speed = ringSpeed(effectiveDb);
    const intensity = Math.min(1, Math.max(0, (effectiveDb - 40) / 100));
    earGlowEl.style.setProperty("--ring-speed", `${speed}s`);
    earGlowEl.style.setProperty("--ring-amp", (1.1 + intensity * 0.3).toFixed(3));

    if (risk.key === "danger" && !wasDanger) {
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      playSound("alerta");
    }
    wasDanger = risk.key === "danger";

    if (compareOn) updateCompare(rawDb);
  }

  function updateCompare(rawDb) {
    const dbNone = rawDb;
    const dbProt = Math.max(20, rawDb - attenuation);
    const riskNone = riskState(dbNone);
    const riskProt = riskState(dbProt);

    document.getElementById("compareDbNone").textContent = `${dbNone} dB`;
    document.getElementById("compareDbProt").textContent = `${Math.round(dbProt)} dB`;
    document.getElementById("compareRiskNone").textContent = riskNone.label;
    document.getElementById("compareRiskNone").style.color = riskNone.color;
    document.getElementById("compareRiskProt").textContent = riskProt.label;
    document.getElementById("compareRiskProt").style.color = riskProt.color;

    document.querySelector("#miniNone .mini-dot").style.background = riskNone.color;
    document.querySelector("#miniProt .mini-dot").style.background = riskProt.color;
    document.getElementById("miniNone").style.setProperty("--ring-speed", `${ringSpeed(dbNone)}s`);
    document.getElementById("miniProt").style.setProperty("--ring-speed", `${ringSpeed(dbProt)}s`);
  }

  slider.addEventListener("input", update);

  protectButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      protectButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      attenuation = Number(btn.dataset.atten);
      applyProtectionVisual(btn.dataset.kind);
      update();
    });
  });

  refButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      slider.value = btn.dataset.db;
      update();
    });
  });

  if (compareBtn) {
    compareBtn.addEventListener("click", () => {
      compareOn = !compareOn;
      comparePanel.hidden = !compareOn;
      compareBtn.textContent = compareOn ? "Ocultar comparación" : "Comparar con / sin protección";
      if (compareOn) updateCompare(Number(slider.value));
    });
  }

  applyProtectionVisual("ninguna");
  update();
})();

// ---- Modelo del oído: zonas + simulación de células ciliadas ----
(function earModel() {
  const zoneButtons = document.querySelectorAll(".ear-zone-btn");
  const descEl = document.getElementById("earZoneDesc");
  const ciliaSlider = document.getElementById("ciliaSlider");
  const ciliaSvg = document.getElementById("ciliaSvg");
  const ciliaYearsEl = document.getElementById("ciliaYears");
  const ciliaNoteEl = document.getElementById("ciliaNote");
  const ciliaReset = document.getElementById("ciliaReset");
  if (!zoneButtons.length) return;

  const DESCRIPTIONS = {
    externo: "El pabellón capta el sonido y el conducto auditivo lo lleva hacia el tímpano. Acá el ruido todavía no daña nada — es solo la entrada.",
    timpano: "Una membrana delgadísima que vibra con el sonido. Un ruido explosivo muy fuerte puede perforarla, pero el daño auditivo crónico ocurre más adentro.",
    huesecillos: "Martillo, yunque y estribo: tres huesitos que amplifican la vibración del tímpano y la empujan hacia el oído interno.",
    trompa: "La trompa de Eustaquio equilibra la presión entre el oído medio y la garganta. No participa en el daño por ruido, pero es clave para la salud del oído.",
    coclea: "Dentro de la cóclea viven las células ciliadas: convierten la vibración en señal eléctrica. Son las que el ruido excesivo destruye — y no se reemplazan.",
    canales: "Los conductos semicirculares no procesan sonido: controlan el equilibrio. Están al lado de la cóclea, por eso a veces el ruido fuerte también marea.",
    nervio: "El nervio auditivo lleva la señal eléctrica desde la cóclea hasta el cerebro, donde recién ahí se interpreta como sonido.",
  };

  zoneButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      zoneButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll("[data-part]").forEach((el) => {
        el.classList.toggle("zone-active", el.dataset.part === btn.dataset.zone);
      });
      descEl.textContent = DESCRIPTIONS[btn.dataset.zone];
    });
  });

  const CILIA_COUNT = 24;
  for (let i = 0; i < CILIA_COUNT; i++) {
    const x = 8 + i * (284 / (CILIA_COUNT - 1));
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x); line.setAttribute("y1", 80);
    line.setAttribute("x2", x); line.setAttribute("y2", 34);
    line.classList.add("cilia-hair");
    line.dataset.index = i;
    line.style.animationDelay = `${(i % 6) * 0.15}s`;
    ciliaSvg.appendChild(line);
  }

  const STEPS = [
    { years: "0 años", damaged: 0, note: "Sin exposición a ruido excesivo: todas las células funcionan." },
    { years: "5 años", damaged: 4, note: "Empiezan a caer las primeras células, sobre todo las que detectan agudos." },
    { years: "10 años", damaged: 9, note: "Casi el 40% ya no responde. Se nota como dificultad para entender voces en ambientes ruidosos." },
    { years: "20 años", damaged: 16, note: "Más de la mitad de las células dañadas. La pérdida ya se percibe en la vida diaria." },
    { years: "30 años", damaged: 22, note: "Casi todas las células de esta zona están dañadas. La pérdida es permanente e irreversible." },
  ];

  let maxDamaged = 0;
  function applyStep(i) {
    const step = STEPS[i];
    ciliaYearsEl.textContent = step.years;
    ciliaNoteEl.textContent = step.note;
    maxDamaged = Math.max(maxDamaged, step.damaged);
    document.querySelectorAll(".cilia-hair").forEach((hair) => {
      hair.classList.toggle("cilia-damaged", Number(hair.dataset.index) < maxDamaged);
    });
  }

  ciliaSlider.addEventListener("input", () => applyStep(Number(ciliaSlider.value)));
  ciliaReset.addEventListener("click", () => {
    maxDamaged = 0;
    ciliaSlider.value = 0;
    applyStep(0);
  });

  applyStep(0);
})();

// ---- Quiz educativo ----
(function quiz() {
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  const counterEl = document.getElementById("quizCounter");
  const progressFill = document.getElementById("quizProgressFill");
  const feedbackEl = document.getElementById("quizFeedback");
  const quizCard = document.getElementById("quizCard");
  const resultEl = document.getElementById("quizResult");
  const resultScoreEl = document.getElementById("quizResultScore");
  const resultTextEl = document.getElementById("quizResultText");
  const retryBtn = document.getElementById("quizRetry");
  if (!questionEl) return;

  const QUESTIONS = [
    { q: "¿A partir de qué nivel de ruido continuo (8 h) suele exigirse protección auditiva?", options: ["70 dB", "85 dB", "110 dB", "130 dB"], correct: 1, explain: "85 dB es el umbral típico de acción: de ahí en adelante el tiempo seguro se acorta muy rápido." },
    { q: "¿Qué pasa con las células ciliadas del oído interno una vez dañadas por ruido?", options: ["Se regeneran en unos días", "No se regeneran nunca", "Se regeneran con vitaminas", "Sanan solas con reposo"], correct: 1, explain: "A diferencia de otras células del cuerpo, no se regeneran: el daño es permanente." },
    { q: "Por la regla de intercambio de 3 dB, si a 85 dB el tiempo seguro es 8 horas, ¿cuánto es a 91 dB?", options: ["4 horas", "2 horas", "1 hora", "30 minutos"], correct: 1, explain: "Cada +3 dB divide el tiempo seguro a la mitad: 85→8h, 88→4h, 91→2h." },
    { q: "¿Cuál de estas opciones ofrece, en general, mayor atenuación por sí sola?", options: ["Orejeras", "Tapones de espuma", "Doble protección (tapones + orejeras)", "Todas atenúan igual"], correct: 2, explain: "Combinar tapones y orejeras suma atenuación — se usa en los puntos más ruidosos de una planta." },
    { q: "¿Qué zona convierte las vibraciones mecánicas en señal eléctrica para el cerebro?", options: ["Oído externo", "Oído medio", "Oído interno (cóclea)", "El tímpano"], correct: 2, explain: "En la cóclea, las células ciliadas transforman el sonido en señal nerviosa." },
    { q: "Trabajás en un puesto de 100 dB toda la jornada. ¿Qué corresponde hacer?", options: ["Nada, no pasa nada", "Usar protección y/o limitar mucho el tiempo de exposición", "Solo bajar la música", "Tomar agua"], correct: 1, explain: "A 100 dB el tiempo seguro sin protección es de minutos: la protección es obligatoria." },
  ];

  let current = 0;
  let score = 0;
  let answered = false;

  function renderQuestion() {
    answered = false;
    feedbackEl.hidden = true;
    feedbackEl.innerHTML = "";
    const item = QUESTIONS[current];
    counterEl.textContent = `Pregunta ${current + 1} de ${QUESTIONS.length}`;
    progressFill.style.width = `${(current / QUESTIONS.length) * 100}%`;
    questionEl.textContent = item.q;
    optionsEl.innerHTML = "";
    item.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => selectOption(i, item));
      optionsEl.appendChild(btn);
    });
  }

  function selectOption(i, item) {
    if (answered) return;
    answered = true;
    if (i === item.correct) score++;

    [...optionsEl.children].forEach((b, idx) => {
      b.disabled = true;
      if (idx === item.correct) b.classList.add("quiz-correct");
      else if (idx === i) b.classList.add("quiz-incorrect");
    });

    feedbackEl.hidden = false;
    feedbackEl.innerHTML = `<strong>${i === item.correct ? "¡Correcto!" : "No exactamente."}</strong> ${item.explain}`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "cta-btn quiz-next";
    nextBtn.textContent = current + 1 < QUESTIONS.length ? "Siguiente" : "Ver resultado";
    nextBtn.addEventListener("click", () => {
      current += 1;
      if (current < QUESTIONS.length) renderQuestion();
      else showResult();
    });
    feedbackEl.appendChild(nextBtn);
  }

  function showResult() {
    progressFill.style.width = "100%";
    quizCard.hidden = true;
    resultEl.hidden = false;
    resultScoreEl.textContent = `${score}/${QUESTIONS.length}`;
    resultTextEl.textContent =
      score === QUESTIONS.length ? "Perfecto. Sabés más de protección auditiva que la mayoría de la planta." :
      score >= QUESTIONS.length - 2 ? "Muy bien — te falta afinar algún detalle, pero la idea general está clara." :
      "Vale la pena repasar el simulador y la sección de EPP antes de reintentar.";
  }

  retryBtn.addEventListener("click", () => {
    current = 0; score = 0;
    quizCard.hidden = false;
    resultEl.hidden = true;
    renderQuestion();
  });

  renderQuestion();
})();



(function earViewToggle() {
  const toggleButtons = document.querySelectorAll(".view-toggle-btn");
  const view2D = document.getElementById("earView2D");
  const view3D = document.getElementById("earView3D");
  if (!toggleButtons.length) return;

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const is3D = btn.dataset.view === "3d";
      view2D.hidden = is3D;
      view3D.hidden = !is3D;
      if (window.ear3D) {
        if (is3D) { window.ear3D.init(); window.ear3D.resume(); }
        else window.ear3D.pause();
      }
    });
  });
})();

(function ear3DModel() {
  const canvas = document.getElementById("ear3dCanvas");
  const wrap = document.getElementById("ear3dWrap");
  const descEl = document.getElementById("ear3dDesc");
  const playBtn = document.getElementById("ear3dPlay");
  const ciliaSlider = document.getElementById("ciliaSlider");
  if (!canvas || typeof THREE === "undefined") return;

  let inited = false;
  let renderer, scene, camera, controls, raycaster, mouse;
  let animId = null;
  let running = false;
  let playing = false;
  let playStart = 0;

  const PART_INFO = {
    canal: "El sonido entra por acá y viaja como una onda de presión hacia el tímpano.",
    timpano: "Vibra con la onda sonora y transmite el movimiento a los huesecillos.",
    huesecillos: "Martillo, yunque y estribo amplifican la vibración antes de entrar a la cóclea.",
    coclea: "La onda viaja por el líquido de la cóclea y mueve las células ciliadas según la frecuencia del sonido.",
    canales: "Los conductos semicirculares detectan movimiento de la cabeza, no sonido — controlan el equilibrio.",
    nervio: "La señal eléctrica viaja por el nervio auditivo hasta el cerebro.",
  };

  const parts = {};
  const hairCells = [];
  let maxDamagedHairs = 0;
  const SEQUENCE = ["canal", "timpano", "huesecillos", "coclea", "nervio"];

  class CochleaCurve extends THREE.Curve {
    getPoint(t, target) {
      const turns = 2.4;
      const angle = t * Math.PI * 2 * turns;
      const radius = 0.75 - t * 0.62;
      const x = Math.cos(angle) * radius;
      const y = t * 1.1 - 0.2;
      const z = Math.sin(angle) * radius;
      return (target || new THREE.Vector3()).set(x, y, z);
    }
  }

  function buildScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 1.4, 5.2);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0x9fd8ff, 0.6));
    const point = new THREE.PointLight(0x4fd6ff, 1.1, 20);
    point.position.set(3, 3, 4);
    scene.add(point);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 8;

    const canalMat = new THREE.MeshStandardMaterial({ color: 0x4fd6ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, emissive: 0x0b3a4a, roughness: 0.4 });
    const canal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.8, 24, 1, true), canalMat);
    canal.rotation.z = Math.PI / 2;
    canal.position.set(-2.1, 0, 0);
    scene.add(canal);
    parts.canal = canal;

    const timpanoMat = new THREE.MeshStandardMaterial({ color: 0xff5c7a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: 0x4a0f1c });
    const timpano = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), timpanoMat);
    timpano.rotation.y = Math.PI / 2;
    timpano.position.set(-1.2, 0, 0);
    scene.add(timpano);
    parts.timpano = timpano;

    const ossicleMat = new THREE.MeshStandardMaterial({ color: 0xeef3fb, emissive: 0x1a2740, roughness: 0.3 });
    const oss1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), ossicleMat);
    oss1.position.set(-0.95, 0.1, 0);
    const oss2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), ossicleMat);
    oss2.position.set(-0.72, 0.2, 0.05);
    const oss3 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), ossicleMat);
    oss3.position.set(-0.5, 0.28, 0.08);
    const ossGroup = new THREE.Group();
    ossGroup.add(oss1, oss2, oss3);
    scene.add(ossGroup);
    parts.huesecillos = ossGroup;

    const cochleaCurve = new CochleaCurve();
    const cochleaMat = new THREE.MeshStandardMaterial({ color: 0x34e0a1, transparent: true, opacity: 0.5, emissive: 0x0c3f2c, roughness: 0.4 });
    const cochlea = new THREE.Mesh(new THREE.TubeGeometry(cochleaCurve, 220, 0.09, 10, false), cochleaMat);
    cochlea.position.set(0.55, 0, 0);
    scene.add(cochlea);
    parts.coclea = cochlea;

    const HAIR_COUNT = 30;
    const hairGroup = new THREE.Group();
    for (let i = 0; i < HAIR_COUNT; i++) {
      const t = i / (HAIR_COUNT - 1);
      const p = cochleaCurve.getPoint(t);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x34e0a1, emissive: 0x0c3f2c });
      const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6), hairMat);
      hair.position.copy(p).add(new THREE.Vector3(0.55, 0.11, 0));
      hairCells.push({ mesh: hair, damaged: false });
      hairGroup.add(hair);
    }
    scene.add(hairGroup);

    const semiMat = new THREE.MeshStandardMaterial({ color: 0x4fd6ff, transparent: true, opacity: 0.4, emissive: 0x0b3a4a });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 40), semiMat);
    const ring2 = ring1.clone();
    const ring3 = ring1.clone();
    ring1.position.set(0.4, 1.05, 0);
    ring2.position.set(0.4, 1.05, 0);
    ring2.rotation.x = Math.PI / 2;
    ring3.position.set(0.4, 1.05, 0);
    ring3.rotation.y = Math.PI / 2;
    const semiGroup = new THREE.Group();
    semiGroup.add(ring1, ring2, ring3);
    scene.add(semiGroup);
    parts.canales = semiGroup;

    const nerveMat = new THREE.LineBasicMaterial({ color: 0xff5c7a, transparent: true, opacity: 0.6 });
    const nerveGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const start = new THREE.Vector3(0.9, 0.1 + i * 0.05, 0);
      const end = new THREE.Vector3(2.3, -0.4 + i * 0.35, 0.2);
      const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
      nerveGroup.add(new THREE.Line(geo, nerveMat));
    }
    scene.add(nerveGroup);
    parts.nervio = nerveGroup;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    canvas.addEventListener("pointerdown", onPick);
    window.addEventListener("resize", onResize);
    onResize();
  }

  function onResize() {
    if (!wrap || !renderer) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function onPick(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const pickable = [parts.canal, parts.timpano, parts.huesecillos, parts.coclea, parts.canales, parts.nervio]
      .flatMap((p) => (p.isGroup ? p.children : [p]));
    const hits = raycaster.intersectObjects(pickable, false);
    if (!hits.length) return;
    const hitObj = hits[0].object;
    for (const key in parts) {
      const group = parts[key];
      const objList = group.isGroup ? group.children : [group];
      if (objList.includes(hitObj)) { descEl.textContent = PART_INFO[key]; return; }
    }
  }

  function updateHairDamage() {
    if (!ciliaSlider) return;
    const STEP_DAMAGE = [0, 4, 9, 16, 22];
    const damaged = STEP_DAMAGE[Number(ciliaSlider.value)] || 0;
    maxDamagedHairs = Math.max(maxDamagedHairs, damaged);
    hairCells.forEach((h, i) => {
      const isDamaged = i < maxDamagedHairs;
      h.damaged = isDamaged;
      h.mesh.material.color.set(isDamaged ? 0x8093b4 : 0x34e0a1);
      h.mesh.material.emissive.set(isDamaged ? 0x1a1e29 : 0x0c3f2c);
    });
  }

  function playSequence() {
    if (playing) return;
    playing = true;
    playStart = performance.now();
    descEl.textContent = "Siguiendo el camino del sonido...";
  }

  function tick(now) {
    const t = now * 0.001;
    hairCells.forEach((h) => {
      if (!h.damaged) h.mesh.rotation.z = Math.sin(t * 4 + h.mesh.position.y * 10) * 0.25;
    });

    if (playing) {
      const elapsed = now - playStart;
      const stepDuration = 550;
      const activeIndex = Math.floor(elapsed / stepDuration);
      SEQUENCE.forEach((key, i) => {
        const group = parts[key];
        const scale = i === activeIndex ? 1.15 + Math.sin(t * 12) * 0.05 : 1;
        group.scale.setScalar(scale);
      });
      if (activeIndex >= SEQUENCE.length) {
        playing = false;
        SEQUENCE.forEach((key) => parts[key].scale.setScalar(1));
        descEl.textContent = "Tocá cualquier parte del modelo para ver qué hace, o arrastrá para girarlo.";
      }
    }

    controls.update();
    renderer.render(scene, camera);
    if (running) animId = requestAnimationFrame(tick);
  }

  function init() {
    if (inited) return;
    inited = true;
    buildScene();
    updateHairDamage();
    if (ciliaSlider) ciliaSlider.addEventListener("input", updateHairDamage);
    if (playBtn) playBtn.addEventListener("click", playSequence);
  }

  function pause() { running = false; if (animId) cancelAnimationFrame(animId); }
  function resume() { if (!inited || running) return; running = true; animId = requestAnimationFrame(tick); }

  window.ear3D = { init, pause, resume };
})();
