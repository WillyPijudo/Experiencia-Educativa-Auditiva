// ==========================================================
// ESCUDO SONORO — lógica de la app
// ==========================================================


const SOUND = {
  click: new Audio("audio/click.mp3"),
  intro: new Audio("audio/intro.mp3"),
  alerta: new Audio("audio/alerta.mp3"),
  slider: new Audio("audio/slider.mp3"),
};
SOUND.intro.loop = true;
SOUND.intro.volume = 0.5;

function playSound(name) {
  const audio = SOUND[name];
  if (!audio) return;
  try { audio.currentTime = 0; audio.play().catch(() => {}); } catch (e) {}
}

function playSlider() {
  const audio = SOUND.slider;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {}
}

document.addEventListener("input", (e) => {
  if (e.target && e.target.type === "range") playSlider();
});

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
    if (id !== "cortos" && window.stopCortos) window.stopCortos();
    if (id !== "herramientas" && window.stopDbMeter) window.stopDbMeter();
  }

  function openMenu() { menu.hidden = false; }
  function closeMenu() {
    menu.hidden = true;
    if (menuCube) menuCube.classList.remove("flipped");
    pagerDots.forEach((d, i) => d.classList.toggle("active", i === 0));
    if (menuPageBtn) menuPageBtn.textContent = "Más secciones ⟩";
  }

  // ---- Cubo de menú: dos caras con más secciones/herramientas ----
  const menuCube = document.getElementById("menuCube");
  const menuPageBtn = document.getElementById("menuPageBtn");
  const pagerDots = [document.getElementById("menuDot0"), document.getElementById("menuDot1")];
  if (menuPageBtn && menuCube) {
    menuPageBtn.addEventListener("click", () => {
      const goingBack = menuCube.classList.contains("flipped");
      menuCube.classList.toggle("flipped");
      pagerDots.forEach((d, i) => d.classList.toggle("active", goingBack ? i === 0 : i === 1));
      menuPageBtn.textContent = goingBack ? "Más secciones ⟩" : "⟨ Secciones principales";
    });
  }

  let navClickTimer = null;
  let navDimmed = false;

  shieldNav.addEventListener("click", () => {
    if (navClickTimer) {
      // segundo tap dentro de la ventana: doble tap -> esconder/mostrar el botón
      clearTimeout(navClickTimer);
      navClickTimer = null;
      navDimmed = !navDimmed;
      shieldNav.classList.toggle("nav-dimmed", navDimmed);
      return;
    }
    navClickTimer = setTimeout(() => {
      navClickTimer = null;
      openMenu();
      armBackButton();
    }, 260);
  });
  menuClose.addEventListener("click", closeMenu);

  gotoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showScreen(btn.dataset.goto);
      closeMenu();
    });
  });

  // ---- Botón "atrás" del celu: muestra el menú en vez de salir de la página ----
  // Truco: mantenemos siempre un "colchón" en el historial. Cuando el usuario
  // toca atrás, en vez de dejar la página, se dispara popstate: ahí abrimos
  // el menú de secciones y volvemos a poner el colchón para la próxima vez.
  function armBackButton() {
    history.pushState({ escudoSonoro: true }, "", location.href);
  }
  armBackButton();

  window.addEventListener("popstate", () => {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
    armBackButton();
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
  const earStageEl = document.getElementById("earPhotoStage");
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

  // ---- Visualizador circular de decibeles (reemplaza las ondas) ----
  const vizRing = document.getElementById("vizRing");
  if (vizRing) {
    // Track de zonas de riesgo (verde/ámbar/rojo) detrás de las barras, si el HTML no lo trae ya
    if (earStageEl && !earStageEl.querySelector(".viz-track")) {
      const track = document.createElement("div");
      track.className = "viz-track";
      earStageEl.insertBefore(track, vizRing);
    }

    const BARS = 40;
    vizRing.style.setProperty("--bars", BARS);
    for (let i = 0; i < BARS; i++) {
      const bar = document.createElement("span");
      bar.className = "viz-bar";
      bar.style.setProperty("--i", i);
      bar.style.setProperty("--radius", "62px");
      // pico levemente ondulado por posición, para que no se vea 100% al azar
      const wobble = Math.sin(i * 0.9) * 4;
      bar.style.setProperty("--peak", `${11 + wobble + Math.round(Math.random() * 6)}px`);
      bar.style.animationDelay = `${(Math.random() * 1.6).toFixed(2)}s`;
      vizRing.appendChild(bar);
    }
  }

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
    return (1.8 - intensity * 1.4).toFixed(2);
  }

  // Mapea el dB efectivo a un ángulo dentro del arco de colores del track (0-216° tras el offset de -108°),
  // así el marcador cae siempre en la franja de color que corresponde a su nivel real.
  const vizMarker = document.getElementById("vizMarker");
  function markerAngle(effectiveDb) {
    const db = Math.max(40, Math.min(140, effectiveDb));
    let sweep;
    if (db <= 85) sweep = ((db - 40) / (85 - 40)) * 130;
    else if (db <= 105) sweep = 130 + ((db - 85) / (105 - 85)) * 65;
    else sweep = 195 + ((db - 105) / (140 - 105)) * 21;
    return -108 + sweep;
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

  const quickRiskDot = document.getElementById("quickRiskDot");
  const quickRiskLabel = document.getElementById("quickRiskLabel");
  const safeTimeFill = document.getElementById("safeTimeFill");

  function updateRefActive(rawDb) {
    refButtons.forEach((btn) => {
      btn.classList.toggle("db-ref-active", Number(btn.dataset.db) === rawDb);
    });
  }

  function update() {
    const rawDb = Number(slider.value);
    const effectiveDb = Math.max(20, rawDb - attenuation);

    dbValueEl.textContent = rawDb;
    effectiveDbEl.textContent = `${Math.round(effectiveDb)} dB`;
    updateRefActive(rawDb);

    const minutes = safeMinutes(effectiveDb);
    safeTimeEl.textContent = formatTime(minutes);

    const risk = riskState(effectiveDb);
    riskLabelEl.textContent = risk.label;
    riskLabelEl.style.color = risk.color;

    if (quickRiskLabel) {
      quickRiskLabel.textContent = risk.label;
      quickRiskLabel.style.color = risk.color;
      quickRiskDot.style.background = risk.color;
      quickRiskDot.style.boxShadow = `0 0 8px 1px ${risk.color}`;
    }
    safeTimeEl.style.color = risk.color;
    effectiveDbEl.style.color = risk.color;
    if (safeTimeFill) {
      const clampedMinutes = isFinite(minutes) ? minutes : 480;
      const pct = Math.max(3, Math.min(100, (Math.log(clampedMinutes + 1) / Math.log(481)) * 100));
      safeTimeFill.style.width = `${pct}%`;
      safeTimeFill.style.backgroundColor = risk.color;
    }

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
    earStageEl.style.setProperty("--wave-color", risk.color);
    earStageEl.style.setProperty("--wave-speed", `${speed}s`);
    earStageEl.style.setProperty("--wave-max", (2.4 + intensity * 1.8).toFixed(2));
    earStageEl.style.setProperty("--amp-mult", (0.55 + intensity * 1.1).toFixed(2));
    if (vizMarker) vizMarker.style.setProperty("--marker-angle", `${markerAngle(effectiveDb)}deg`);

    if (risk.key === "danger" && !wasDanger) {
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      playAlerta();
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
  const typeBadgeEl = document.getElementById("quizTypeBadge");
  const progressFill = document.getElementById("quizProgressFill");
  const feedbackEl = document.getElementById("quizFeedback");
  const quizCard = document.getElementById("quizCard");
  const resultEl = document.getElementById("quizResult");
  const resultScoreEl = document.getElementById("quizResultScore");
  const resultTextEl = document.getElementById("quizResultText");
  const certNameInput = document.getElementById("certName");
  const certError = document.getElementById("certError");
  const certBtn = document.getElementById("certDownload");
  const certMedal = document.getElementById("certMedal");
  const certSealMedal = document.getElementById("certSealMedal");
  if (!questionEl) return;

  function medalTier(correct, total) {
    const pct = total ? correct / total : 0;
    if (pct >= 0.9) return "tier-gold";
    if (pct >= 0.7) return "tier-silver";
    return "tier-bronze";
  }
  function applyMedalTier(el, tier) {
    if (!el) return;
    el.classList.remove("tier-mint", "tier-gold", "tier-silver", "tier-bronze");
    el.classList.add(tier);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const TYPE_LABELS = {
    mcq: "Opción múltiple",
    truefalse: "Verdadero o falso",
    order: "Ordenar",
    slider: "Estimar",
    scenario: "Comparar escenarios",
    timeline: "Línea de tiempo",
    aging: "Comparar exposición",
    multiselect: "Selección múltiple",
  };

  function riskColor(effectiveDb) {
    if (effectiveDb <= 85) return "var(--mint)";
    if (effectiveDb <= 105) return "var(--hologram)";
    return "var(--signal)";
  }

   // Silueta vectorial de persona, con dos capas independientes:
  //  - role: "obrero" (casco) · "oficina" (camisa+corbata) · "casa" (sin accesorio)
  //  - protection: "none" | "foam" | "molded" | "earmuff" | "double" — la protección auditiva puesta
  function personFigureSvg(role, protection, color) {
    const HEAD = '<circle cx="30" cy="18" r="12.5" class="figure-head"/>';
    const HEAD_SHADE = '<path d="M30 5.5 A12.5 12.5 0 0 1 39 29 A12.5 12.5 0 0 1 30 5.5 Z" class="figure-head-shadow"/>';
    const HEAD_SHINE = '<ellipse cx="25" cy="13" rx="5" ry="3.4" class="figure-shine"/>';
    const BODY = '<path d="M30 31 C16 31 10 44 10 59 L10 78 C10 84 15 88 21 88 L21 95 L29 95 L29 88 L31 88 L31 95 L39 95 L39 88 C45 88 50 84 50 78 L50 59 C50 44 44 31 30 31 Z" class="figure-body"/>';
    const BODY_SHADE = '<path d="M30 31 C40 31 46 40 48 52 L48 78 C48 83 44 87 39 88 L39 60 C39 46 35 35 30 31 Z" class="figure-body-shadow"/>';
    const BODY_SHINE = '<path d="M18 40 C15 47 13 55 13 63 L13 76" class="figure-shine-line"/>';

    let accessory = "";
    if (role === "obrero") {
      accessory = `
        <path d="M17 8.5 C17 1 43 1 43 8.5 L43.5 10.5 L16.5 10.5 Z" class="figure-hardhat"/>
        <ellipse cx="24" cy="5.5" rx="6" ry="3" class="figure-hardhat-shine"/>
        <rect x="14.5" y="9.5" width="31" height="3" rx="1.5" class="figure-hardhat-brim"/>`;
    } else if (role === "oficina") {
      accessory = `
        <path d="M21.5 31 L30 41 L26 31.5 Z" class="figure-collar"/>
        <path d="M38.5 31 L30 41 L34 31.5 Z" class="figure-collar"/>
        <path d="M27.5 32.5 L32.5 32.5 L31 39 L33 56 L30 61 L27 56 L29 39 Z" class="figure-tie"/>`;
    }

    let gear = "";
    if (protection === "earmuff" || protection === "double") {
      gear += `
        <path d="M12 20 C12 8 20 2 30 2 C40 2 48 8 48 20" class="figure-muff-band"/>
        <rect x="6" y="17" width="11" height="15" rx="5" class="figure-muff"/>
        <rect x="43" y="17" width="11" height="15" rx="5" class="figure-muff"/>
        <ellipse cx="9.5" cy="21" rx="3" ry="4" class="figure-muff-shine"/>
        <ellipse cx="46.5" cy="21" rx="3" ry="4" class="figure-muff-shine"/>`;
    }
    if (protection === "foam" || protection === "double") {
      gear += `
        <ellipse cx="9" cy="19" rx="3.4" ry="4.4" class="figure-plug-foam"/>
        <ellipse cx="51" cy="19" rx="3.4" ry="4.4" class="figure-plug-foam"/>`;
    }
    if (protection === "molded") {
      gear += `
        <path d="M6 15 C10 13 12 16 11 21 C10 25 6 24 5.5 20 Z" class="figure-plug-molded"/>
        <path d="M54 15 C50 13 48 16 49 21 C50 25 54 24 54.5 20 Z" class="figure-plug-molded"/>`;
    }
    if (protection === "cotton") {
      gear += `
        <circle cx="8.5" cy="19" r="4" class="figure-cotton"/>
        <circle cx="6.5" cy="17" r="2.2" class="figure-cotton figure-cotton-tuft"/>
        <circle cx="10" cy="16.5" r="2" class="figure-cotton figure-cotton-tuft"/>
        <circle cx="51.5" cy="19" r="4" class="figure-cotton"/>
        <circle cx="53.5" cy="17" r="2.2" class="figure-cotton figure-cotton-tuft"/>
        <circle cx="50" cy="16.5" r="2" class="figure-cotton figure-cotton-tuft"/>`;
    }

    return `<svg viewBox="0 0 60 100" class="scenario-figure-svg" style="color:${color};" aria-hidden="true">
      ${BODY}${BODY_SHADE}${BODY_SHINE}
      ${HEAD}${HEAD_SHADE}${HEAD_SHINE}
      ${accessory}
      <g class="figure-gear-in">${gear}</g>
    </svg>`;
  }
  window.personFigureSvg = personFigureSvg;

  
  // ---- Banco de preguntas (se arma un test nuevo y random cada vez) ----
  const BANK = [
    { type: "mcq", q: "¿A partir de qué nivel de ruido continuo (8 h) suele exigirse protección auditiva?", options: ["70 dB", "85 dB", "110 dB", "130 dB"], correct: 1, explain: "85 dB es el umbral típico de acción: de ahí en adelante el tiempo seguro se acorta muy rápido." },
    { type: "mcq", q: "¿Qué pasa con las células ciliadas del oído interno una vez dañadas por ruido?", options: ["Se regeneran en unos días", "No se regeneran nunca", "Se regeneran con vitaminas", "Sanan solas con reposo"], correct: 1, explain: "A diferencia de otras células del cuerpo, no se regeneran: el daño es permanente." },
    { type: "mcq", q: "Por la regla de intercambio de 3 dB, si a 85 dB el tiempo seguro es 8 horas, ¿cuánto es a 91 dB?", options: ["4 horas", "2 horas", "1 hora", "30 minutos"], correct: 1, explain: "Cada +3 dB divide el tiempo seguro a la mitad: 85→8h, 88→4h, 91→2h." },
    { type: "mcq", q: "¿Cuál de estas opciones ofrece, en general, mayor atenuación por sí sola?", options: ["Orejeras", "Tapones de espuma", "Doble protección (tapones + orejeras)", "Todas atenúan igual"], correct: 2, explain: "Combinar tapones y orejeras suma atenuación — se usa en los puntos más ruidosos de una planta." },
    { type: "mcq", q: "¿Qué zona convierte las vibraciones mecánicas en señal eléctrica para el cerebro?", options: ["Oído externo", "Oído medio", "Oído interno (cóclea)", "El tímpano"], correct: 2, explain: "En la cóclea, las células ciliadas transforman el sonido en señal nerviosa." },
    { type: "mcq", q: "Trabajás en un puesto de 100 dB toda la jornada. ¿Qué corresponde hacer?", options: ["Nada, no pasa nada", "Usar protección y/o limitar mucho el tiempo de exposición", "Solo bajar la música", "Tomar agua"], correct: 1, explain: "A 100 dB el tiempo seguro sin protección es de minutos: la protección es obligatoria." },
    { type: "mcq", q: "¿Qué parte transmite y amplifica la vibración del tímpano hacia el oído interno?", options: ["Los huesecillos (martillo, yunque, estribo)", "La trompa de Eustaquio", "El pabellón auricular", "El nervio auditivo"], correct: 0, explain: "Los tres huesecillos forman una palanca que amplifica la señal antes de llegar a la cóclea." },
    { type: "mcq", q: "¿Cuál de estas NO es una protección auditiva adecuada?", options: ["Tapones de espuma", "Orejeras", "Algodón común en la oreja", "Tapones moldeados"], correct: 2, explain: "El algodón no está diseñado para atenuar ruido: prácticamente no reduce los decibeles." },

    { type: "truefalse", q: "La pérdida auditiva causada por ruido es reversible si dejás de exponerte un tiempo.", answer: false, explain: "Es permanente: las células ciliadas dañadas no se regeneran nunca." },
    { type: "truefalse", q: "Usar tapones y orejeras juntos (doble protección) puede sumar más atenuación que usar solo uno.", answer: true, explain: "Por eso se usa en los puestos más ruidosos: la combinación suma decibeles de atenuación." },
    { type: "truefalse", q: "El ruido de una oficina tranquila (unos 45 dB) representa un riesgo real para el oído.", answer: false, explain: "A ese nivel se puede trabajar toda la jornada sin ningún riesgo auditivo." },
    { type: "truefalse", q: "Cuanto más alto el nivel de ruido, menos tiempo podés estar expuesto sin protección de forma segura.", answer: true, explain: "Es la regla de intercambio: cada +3 dB reduce el tiempo seguro a la mitad." },

    { type: "order", q: "Ordená estos ambientes de más silencioso a más ruidoso (tocalos en orden).", items: [
        { label: "Oficina", db: 45 },
        { label: "Conversación normal", db: 60 },
        { label: "Tránsito intenso", db: 80 },
        { label: "Taladro", db: 100 },
      ], explain: "El orden correcto va de menor a mayor dB: cada escalón representa un salto real de intensidad." },
    { type: "order", q: "Ordená estos ambientes de más silencioso a más ruidoso (tocalos en orden).", items: [
        { label: "Biblioteca", db: 35 },
        { label: "Taller mecánico", db: 90 },
        { label: "Amoladora", db: 115 },
        { label: "Martillo neumático", db: 130 },
      ], explain: "De 35 a 130 dB hay un salto enorme de energía sonora, no solo de 'volumen percibido'." },

    { type: "slider", q: "¿Cuántos decibeles tiene aproximadamente una amoladora en uso?", target: 115, tolerance: 10, min: 60, max: 140, explain: "Una amoladora ronda los 115 dB: a ese nivel, el daño puede ser cuestión de minutos sin protección." },
    { type: "slider", q: "¿Cuál es, aproximadamente, el límite legal habitual de ruido para una jornada de 8 horas?", target: 85, tolerance: 5, min: 40, max: 120, explain: "85 dB en 8 horas es el valor de referencia más usado como umbral de acción." },

    { type: "scenario", q: "Estos tres trabajadores están en sus puestos ahora mismo. ¿Cuál corre MENOS riesgo auditivo?",
      scenarios: [
        { label: "Amoladora, sin protección", effective: 115, protected: false, role: "obrero" },
        { label: "Amoladora, doble protección", effective: 83, protected: true, role: "obrero", protectionType: "double" },
        { label: "Oficina, sin protección", effective: 45, protected: false, role: "oficina" },
      ], correct: 2, explain: "La oficina a 45 dB no representa riesgo. El de doble protección bajó bastante su exposición, pero sigue siendo más alta que la oficina." },
    { type: "scenario", q: "Mismo puesto de taladro (100 dB), tres formas distintas de trabajar. ¿Cuál es la más riesgosa?",
      scenarios: [
        { label: "Con orejeras", effective: 78, protected: true, role: "casa", protectionType: "earmuff" },
        { label: "Con tapones de espuma", effective: 75, protected: true, role: "casa", protectionType: "foam" },
        { label: "Sin ninguna protección", effective: 100, protected: false, role: "casa" },
      ], correct: 2, explain: "Sin protección, 100 dB puede dañar el oído en minutos. Cualquiera de las dos protecciones baja el riesgo a un nivel seguro." },

    { type: "timeline", q: "Un trabajador está expuesto a 100 dB, sin protección, 8 horas por día, todos los días. ¿En cuánto tiempo el daño en las células ciliadas suele volverse severo?",
      options: ["Unas pocas horas", "2 a 5 años", "15 a 20 años", "El oído se acostumbra y no se daña"],
      correct: 1, explain: "El daño es acumulativo: a niveles altos y constantes, el deterioro serio puede instalarse en pocos años — mucho antes de lo que la mayoría cree." },
    { type: "timeline", q: "Ese mismo trabajador empieza a usar protección adecuada todos los días. ¿Qué pasa con el daño ya acumulado?",
      options: ["Se revierte con el tiempo", "Se frena: no se suma daño nuevo, pero lo perdido no vuelve", "Sigue avanzando igual de rápido", "Depende de la marca de la protección"],
      correct: 1, explain: "La protección no repara nada: evita que se sume MÁS daño. Lo que ya se perdió, no se recupera." },
    { type: "aging", q: "Estos tres trabajadores llevan distinta cantidad de años en un puesto de 100 dB sin protección. ¿Cuál tiene el oído más dañado?",
      people: [
        { label: "6 meses en el puesto", years: 0.5, damage: 10 },
        { label: "8 años en el puesto", years: 8, damage: 55 },
        { label: "20 años en el puesto", years: 20, damage: 85 },
      ], correct: 2, explain: "El daño se acumula con los años: a 20 años sin protección, la mayoría de las células ciliadas de esa zona ya están destruidas y no vuelven." },
    { type: "aging", q: "Mismo puesto, 10 años de antigüedad, pero hábitos distintos. ¿Cuál probablemente tiene MENOS daño acumulado?",
      people: [
        { label: "10 años, sin protección nunca", years: 10, damage: 65 },
        { label: "10 años, con protección desde el día 1", years: 10, damage: 8 },
        { label: "10 años, protección solo \"a veces\"", years: 10, damage: 40 },
      ], correct: 1, explain: "Usar protección desde el principio, todos los días, es lo que realmente frena el daño — no alcanza con usarla 'a veces'." },

      { type: "scenario", q: "Tres situaciones en una planta de neumáticos. ¿Cuál necesita protección auditiva SÍ o SÍ?",
      scenarios: [
        { label: "Operando la extrusora de banda de rodamiento (ruido continuo alto)", effective: 102, protected: false, role: "obrero" },
        { label: "Cargando datos en la oficina de control de calidad", effective: 48, protected: false, role: "oficina" },
        { label: "Usando un taladro en casa, 10 minutos, un sábado", effective: 100, protected: false, role: "casa" },
      ], correct: 0, explain: "El puesto de extrusora es ruido alto y continuo durante toda la jornada: ahí la protección no es opcional. El taladro en casa es un uso breve y ocasional; igual conviene protegerse, pero el riesgo acumulado no es comparable a 8 horas por día en planta." },
       { type: "scenario", q: "Herramienta eléctrica en casa vs. la misma máquina en la fábrica, ambas a 100 dB. ¿Qué cambia realmente el riesgo?",
      scenarios: [
        { label: "En casa: 15 minutos, un fin de semana", effective: 100, protected: false, role: "casa" },
        { label: "En la fábrica: 8 horas, todos los días laborales", effective: 100, protected: false, role: "obrero" },
        { label: "Ambas son exactamente el mismo riesgo", effective: 100, protected: false, role: "obrero" },
      ], correct: 1, explain: "El nivel en dB es el mismo, pero el riesgo depende del TIEMPO acumulado de exposición. 8 horas diarias, todos los días, es un riesgo muchísimo mayor que 15 minutos esporádicos — por eso en la fábrica la protección es obligatoria, no opcional." },
    { type: "aging", q: "Tres operarios de la misma línea de producción de neumáticos, distinta antigüedad, todos sin protección constante. ¿Cuál tiene más riesgo de pérdida auditiva permanente?",
      people: [
        { label: "3 meses en la línea, recién ingresado", years: 0.25, damage: 6 },
        { label: "12 años en la línea, protección \"cuando se acuerda\"", years: 12, damage: 60 },
        { label: "25 años en la línea, sin protección desde siempre", years: 25, damage: 88 },
      ], correct: 2, explain: "25 años de exposición sin protección constante es el escenario de mayor daño acumulado — y es exactamente el tipo de antigüedad que puede tener un operario en una planta industrial. Por eso la protección tiene que ser un hábito desde el primer día, no algo que se adopta después." },
    { 
      type: "multiselect", 
      q: "¿Cuáles de estos elementos brindan una protección auditiva real y efectiva? (Seleccioná todas las que correspondan)",
      people: [
        { label: "Tapones de espuma certificados", correct: true, role: "casa", protectionType: "foam" },
        { label: "Orejeras de copa certificadas", correct: true, role: "casa", protectionType: "earmuff" },
        { label: "Algodón en el oído", correct: false, role: "casa", protectionType: "cotton" },
        { label: "Auriculares comunes de música", correct: false, role: "casa" },
      ],
      explain: "Solo los tapones y las orejeras certificadas atenúan de forma real. El algodón casi no reduce decibeles, y los auriculares de música no están diseñados para atenuar ruido ambiente." 
    },

    { type: "order", q: "Ordená estos elementos de protección de MENOR a MAYOR atenuación real (tocalos en orden).",
      items: [
        { label: "Orejeras", db: 22 },
        { label: "Tapones de espuma", db: 25 },
        { label: "Tapones moldeados", db: 28 },
        { label: "Doble protección", db: 32 },
      ], explain: "Así lo mide este mismo simulador: orejeras 22 dB, espuma 25 dB, moldeados 28 dB y doble protección 32 dB — combinar suma atenuación." },

    { type: "scenario", q: "Misma extrusora, 102 dB. Tres formas de encararla. ¿Cuál deja al trabajador con MENOS riesgo?",
      scenarios: [
        { label: "Sin protección", effective: 102, protected: false, role: "casa" },
        { label: "Con tapones de espuma (-25 dB)", effective: 77, protected: true, role: "casa", protectionType: "foam" },
        { label: "Con doble protección (-32 dB)", effective: 70, protected: true, role: "casa", protectionType: "double" },
      ], correct: 2, explain: "Ambas protecciones bajan el riesgo a zona segura, pero la doble protección deja el nivel efectivo más bajo de las tres." },

    { type: "aging", q: "Tres plantas con el mismo nivel de ruido, 15 años de operación. ¿Cuál va a tener MÁS problemas de audición entre su personal?",
      people: [
        { label: "Planta A: protección obligatoria y controlada", years: 15, damage: 12 },
        { label: "Planta B: protección disponible, pero no controlada", years: 15, damage: 45 },
        { label: "Planta C: sin protección provista", years: 15, damage: 80 },
      ], correct: 2, explain: "Proveer protección no alcanza si no se controla el uso real. La política que menos daño genera es la que se cumple todos los días, como en la Planta A." },

    { type: "mcq", q: "Según los valores de este simulador, ¿cuál protección atenúa MÁS por sí sola (sin combinar)?", options: ["Tapones de espuma (25 dB)", "Orejeras (22 dB)", "Tapones moldeados (28 dB)", "Todas atenúan igual"], correct: 2, explain: "En este simulador, los tapones moldeados son los de mayor atenuación individual: 28 dB." },
    { type: "mcq", q: "Trabajás con una amoladora a 115 dB y te tapás una oreja con la mano. ¿Cuánto baja realmente el riesgo?", options: ["Baja mucho, es casi como usar protección real", "Casi nada: la mano no sella ni atenúa como un EPP certificado", "El riesgo sube", "Depende de qué mano uses"], correct: 1, explain: "La mano no forma un sello acústico ni atenúa de forma medible. Es un mito común: solo un EPP certificado reduce el riesgo de verdad." },
  ];

  const TOTAL_QUESTIONS = 9;
  let QUESTIONS = [];
  let current = 0;
  let score = 0;
  let answered = false;

  function buildSession() {
    const byType = (t) => shuffle(BANK.filter((b) => b.type === t));
    const picked = [
      ...byType("truefalse").slice(0, 2),
      ...byType("order").slice(0, 1),
      ...byType("slider").slice(0, 1),
      ...byType("scenario").slice(0, 1),
      ...byType("timeline").slice(0, 1),
      ...byType("aging").slice(0, 1),
      ...byType("multiselect").slice(0, 1),
      ...byType("mcq").slice(0, TOTAL_QUESTIONS - 8),
    ];
    return shuffle(picked).map((item) => {
      if (item.type === "mcq") {
        const optIdx = shuffle(item.options.map((_, i) => i));
        return {
          ...item,
          options: optIdx.map((i) => item.options[i]),
          correct: optIdx.indexOf(item.correct),
        };
      }
      if (item.type === "order") {
        return { ...item, items: shuffle(item.items) };
      }
      return { ...item };
    });
  }

function avoidWeakOpener(session) {
  // La pregunta de "seleccioná todas las que correspondan" es más pesada
  // para arrancar el test: si cae primera, la reubicamos más adelante.
  if (session.length > 1 && session[0].type === "multiselect") {
    const swapWith = 1 + Math.floor(Math.random() * (session.length - 1));
    [session[0], session[swapWith]] = [session[swapWith], session[0]];
  }
  return session;
}
  
  function completeQuestion(isCorrect, explainText) {
    if (answered) return;
    answered = true;
    if (isCorrect) score++;

    feedbackEl.hidden = false;
    feedbackEl.innerHTML = `<strong>${isCorrect ? "¡Correcto!" : "No exactamente."}</strong> ${explainText}`;

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

    if (isCorrect && navigator.vibrate) navigator.vibrate(30);
  }

  function renderMCQ(item) {
    item.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option quiz-option-mcq";
      btn.innerHTML = `<span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span><span>${opt}</span>`;
      btn.addEventListener("click", () => {
        if (answered) return;
        [...optionsEl.children].forEach((b, idx) => {
          b.disabled = true;
          if (idx === item.correct) b.classList.add("quiz-correct");
          else if (idx === i) b.classList.add("quiz-incorrect");
        });
        completeQuestion(i === item.correct, item.explain);
      });
      optionsEl.appendChild(btn);
    });
  }

  function renderTrueFalse(item) {
    const duel = document.createElement("div");
    duel.className = "tf-duel";
    duel.innerHTML = `
      <button type="button" class="tf-card tf-card-true">
        <span class="tf-card-icon">✔</span>
        <span class="tf-card-label">Verdadero</span>
      </button>
      <span class="tf-vs">VS</span>
      <button type="button" class="tf-card tf-card-false">
        <span class="tf-card-icon">✖</span>
        <span class="tf-card-label">Falso</span>
      </button>`;
    optionsEl.appendChild(duel);

    const trueBtn = duel.querySelector(".tf-card-true");
    const falseBtn = duel.querySelector(".tf-card-false");

    function pick(value, btn) {
      if (answered) return;
      trueBtn.disabled = true;
      falseBtn.disabled = true;
      const correctBtn = item.answer ? trueBtn : falseBtn;
      const wrongBtn = item.answer ? falseBtn : trueBtn;
      correctBtn.classList.add("tf-card-correct");
      if (btn !== correctBtn) {
        btn.classList.add("tf-card-incorrect");
      } else {
        wrongBtn.classList.add("tf-card-dim");
      }
      completeQuestion(value === item.answer, item.explain);
    }
    trueBtn.addEventListener("click", () => pick(true, trueBtn));
    falseBtn.addEventListener("click", () => pick(false, falseBtn));
  }

  function renderOrder(item) {
    const sortedIds = item.items
      .map((it, i) => ({ ...it, id: i }))
      .sort((a, b) => a.db - b.db)
      .map((it) => it.label);

    const pool = document.createElement("div");
    pool.className = "order-pool";
    const track = document.createElement("div");
    track.className = "order-track";
    const picked = [];

    item.items.forEach((it) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "order-chip";
      chip.textContent = it.label;
      chip.addEventListener("click", () => {
        if (answered || chip.classList.contains("order-picked")) return;
        picked.push(it.label);
        chip.classList.add("order-picked");
        const num = document.createElement("span");
        num.className = "order-chip-num";
        num.textContent = picked.length;
        chip.appendChild(num);

        const tag = document.createElement("span");
        tag.className = "order-track-item";
        tag.textContent = `${picked.length}. ${it.label}`;
        track.appendChild(tag);

        if (picked.length === item.items.length) {
          const isCorrect = picked.every((label, idx) => label === sortedIds[idx]);
          [...track.children].forEach((tagEl, idx) => {
            tagEl.classList.add(picked[idx] === sortedIds[idx] ? "order-track-ok" : "order-track-bad");
          });
          const correctOrderText = sortedIds.join(" → ");
          completeQuestion(isCorrect, `${item.explain} Orden correcto: ${correctOrderText}.`);
        }
      });
      pool.appendChild(chip);
    });

    optionsEl.appendChild(track);
    optionsEl.appendChild(pool);
  }

  function renderSlider(item) {
    const readout = document.createElement("div");
    readout.className = "slider-quiz-readout";
    const mid = Math.round((item.min + item.max) / 2);
    readout.innerHTML = `<span id="quizSliderValue">${mid}</span><span class="slider-quiz-unit">dB</span>`;

    const input = document.createElement("input");
    input.type = "range";
    input.className = "slider-quiz-input";
    input.min = item.min;
    input.max = item.max;
    input.value = mid;
    input.addEventListener("input", () => {
      readout.querySelector("#quizSliderValue").textContent = input.value;
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "cta-btn slider-quiz-confirm";
    confirmBtn.textContent = "Confirmar estimación";
    confirmBtn.addEventListener("click", () => {
      if (answered) return;
      input.disabled = true;
      confirmBtn.disabled = true;
      const value = Number(input.value);
      const isCorrect = Math.abs(value - item.target) <= item.tolerance;
      completeQuestion(isCorrect, `${item.explain} (tu estimación: ${value} dB, valor real aprox.: ${item.target} dB)`);
    });

    optionsEl.appendChild(readout);
    optionsEl.appendChild(input);
    optionsEl.appendChild(confirmBtn);
  }

  function renderScenario(item) {
    const grid = document.createElement("div");
    grid.className = "scenario-grid";
    item.scenarios.forEach((sc, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "scenario-card";
      const color = riskColor(sc.effective);
      card.innerHTML = `
        <span class="scenario-risk-dot" style="background:${color}; color:${color};"></span>
        ${personFigureSvg(sc.role || "casa", sc.protectionType || (sc.protected ? "earmuff" : "none"), color)}
        <span class="scenario-label">${sc.label}</span>
        <span class="scenario-db" style="color:${color};">${sc.effective} dB efectivos</span>`;
      card.addEventListener("click", () => {
        if (answered) return;
        [...grid.children].forEach((c, idx) => {
          c.disabled = true;
          if (idx === item.correct) c.classList.add("quiz-correct");
          else if (idx === i) c.classList.add("quiz-incorrect");
        });
        completeQuestion(i === item.correct, item.explain);
      });
      grid.appendChild(card);
    });
    optionsEl.appendChild(grid);
  }


  function renderAging(item) {
    const grid = document.createElement("div");
    grid.className = "aging-grid";
    item.people.forEach((p, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "aging-card";
      const deadCount = Math.round((p.damage / 100) * 10);
      let bars = "";
      for (let b = 0; b < 10; b++) {
        bars += `<span class="aging-bar ${b < deadCount ? "aging-bar-dead" : ""}"></span>`;
      }
      const yearsLabel = p.years < 1 ? `${Math.round(p.years * 12)} meses` : `${p.years} años`;
      card.innerHTML = `
        <span class="aging-years">${yearsLabel}</span>
        <div class="aging-bars">${bars}</div>
        <span class="aging-damage">${p.damage}% de células ciliadas dañadas</span>
        <span class="aging-label">${p.label}</span>`;
      card.addEventListener("click", () => {
        if (answered) return;
        [...grid.children].forEach((c, idx) => {
          c.disabled = true;
          if (idx === item.correct) c.classList.add("quiz-correct");
          else if (idx === i) c.classList.add("quiz-incorrect");
        });
        completeQuestion(i === item.correct, item.explain);
      });
      grid.appendChild(card);
    });
    optionsEl.appendChild(grid);
  }

  
  function renderTimelineViz() {
    const viz = document.createElement("div");
    viz.className = "mini-cilia-row";
    for (let i = 0; i < 14; i++) {
      const hair = document.createElement("span");
      hair.className = "mini-cilia-hair";
      hair.style.animationDelay = `${(i * 0.12).toFixed(2)}s`;
      viz.appendChild(hair);
    }
    optionsEl.appendChild(viz);
  }

  function renderMultiselect(item) {
    const grid = document.createElement("div");
    grid.className = "scenario-grid multiselect-grid";
    const selected = new Set();

    item.people.forEach((p, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "scenario-card multiselect-card";
      card.innerHTML = `
        <span class="multiselect-check" aria-hidden="true"></span>
        ${personFigureSvg(p.role || "casa", p.protectionType || "none", "var(--mist)")}
        <span class="scenario-label">${p.label}</span>`;
      card.addEventListener("click", () => {
        if (answered) return;
        card.classList.toggle("multiselect-selected");
        if (selected.has(i)) selected.delete(i); else selected.add(i);
      });
      grid.appendChild(card);
    });
    optionsEl.appendChild(grid);

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "cta-btn multiselect-confirm";
    confirmBtn.textContent = "Confirmar selección";
    confirmBtn.addEventListener("click", () => {
      if (answered) return;
      let isCorrect = true;
      item.people.forEach((p, i) => {
        const card = grid.children[i];
        const wasPicked = selected.has(i);
        if (wasPicked !== !!p.correct) isCorrect = false;
        card.disabled = true;
        if (p.correct) card.classList.add("quiz-correct");
        else if (wasPicked) card.classList.add("quiz-incorrect");
      });
      completeQuestion(isCorrect, item.explain);
    });
    optionsEl.appendChild(confirmBtn);
  }

  
  function renderQuestion() {
    answered = false;
    feedbackEl.hidden = true;
    feedbackEl.innerHTML = "";
    const item = QUESTIONS[current];
    counterEl.textContent = `Pregunta ${current + 1} de ${QUESTIONS.length}`;
    typeBadgeEl.textContent = TYPE_LABELS[item.type] || "";
    progressFill.style.width = `${(current / QUESTIONS.length) * 100}%`;
    questionEl.textContent = item.q;
    optionsEl.innerHTML = "";
    optionsEl.classList.remove("quiz-anim-in");
    void optionsEl.offsetWidth;
    optionsEl.classList.add("quiz-anim-in");

    if (item.type === "mcq") renderMCQ(item);
    else if (item.type === "truefalse") renderTrueFalse(item);
    else if (item.type === "order") renderOrder(item);
    else if (item.type === "slider") renderSlider(item);
    else if (item.type === "scenario") renderScenario(item);
    else if (item.type === "aging") renderAging(item);
    else if (item.type === "timeline") { renderTimelineViz(); renderMCQ(item); }
    else if (item.type === "multiselect") renderMultiselect(item);
  }

  function showResult() {
    progressFill.style.width = "100%";
    quizCard.hidden = true;
    resultEl.hidden = false;
    resultScoreEl.textContent = `${score}/${QUESTIONS.length}`;
    resultTextEl.textContent =
      score === QUESTIONS.length ? "Perfecto. Sabés más de protección auditiva que la mayoría de la planta." :
      score >= QUESTIONS.length - 2 ? "Muy bien — te falta afinar algún detalle, pero la idea general está clara." :
      "Vale la pena repasar el simulador y la sección de EPP para reforzar esos temas.";
    applyMedalTier(certMedal, medalTier(score, QUESTIONS.length));
  }

  function startQuiz() {
    QUESTIONS = avoidWeakOpener(buildSession());
    current = 0; score = 0;
    quizCard.hidden = false;
    resultEl.hidden = true;
    renderQuestion();
  }

  // ---- Certificado descargable (canvas, sin backend) ----
  const certCinema = document.getElementById("certCinema");
  const certCinemaText = document.getElementById("certCinemaText");

  const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyav3-HETOJY0AqoypCOyI5oKTfO7fLcHXiviWb8DTJzFGWDmMzw5S3HACje0k_ub0yqw/exec";

  function sendCertRecord(name, scoreValue, totalValue, code) {
    if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.includes("PEGÁ_ACÁ")) return;
    fetch(SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ nombre: name, puntaje: scoreValue, total: totalValue, codigo: code }),
    }).catch(() => {});
  }

  if (certBtn) {
    certBtn.addEventListener("click", () => {
      const raw = (certNameInput.value || "").trim().replace(/\s+/g, " ");
      const parts = raw.split(" ").filter(Boolean);
      const hasNameAndSurname = parts.length >= 2 && parts.every((p) => p.length >= 2);
      if (!hasNameAndSurname) {
        certError.hidden = false;
        certNameInput.classList.add("cert-input-error");
        certNameInput.classList.remove("cert-shake");
        void certNameInput.offsetWidth;
        certNameInput.classList.add("cert-shake");
        certNameInput.focus();
        if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
        return;
      }
      certError.hidden = true;
      certNameInput.classList.remove("cert-input-error");
      const name = parts.join(" ");
      const code = `ES-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      applyMedalTier(certSealMedal, medalTier(score, QUESTIONS.length));
      certBtn.disabled = true;
      certCinema.hidden = false;
      certCinema.classList.remove("playing");
      void certCinema.offsetWidth;
      certCinema.classList.add("playing");
      certCinemaText.textContent = "Validando capacitación…";
      sendCertRecord(name, score, QUESTIONS.length, code);
      setTimeout(() => { certCinemaText.textContent = "Sellando certificado…"; }, 1000);
      setTimeout(() => { certCinemaText.textContent = "Firmando…"; }, 1550);
      setTimeout(() => {
        drawCertificate(name, score, QUESTIONS.length, code);
        certCinema.hidden = true;
        certCinema.classList.remove("playing");
        certBtn.disabled = false;
      }, 2650);
    });
    certNameInput.addEventListener("input", () => {
      if (!certError.hidden) {
        certError.hidden = true;
        certNameInput.classList.remove("cert-input-error");
      }
    });
  }

  function drawCertificate(name, scoreValue, totalValue, code) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 840;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 1200, 840);
    bg.addColorStop(0, "#0a0e17");
    bg.addColorStop(0.55, "#10182a");
    bg.addColorStop(1, "#141c30");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 840);

    const glow = ctx.createRadialGradient(600, 40, 40, 600, 40, 560);
    glow.addColorStop(0, "rgba(79,214,255,0.20)");
    glow.addColorStop(1, "rgba(79,214,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 840);

    // textura sutil, da sensación de profundidad
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let y = 0; y < 840; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(79,214,255,0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, 1128, 768);
    ctx.strokeStyle = "rgba(79,214,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(52, 52, 1096, 736);

    function corner(x, y, sx, sy) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sx, sy);
      ctx.strokeStyle = "#4fd6ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(0, 0);
      ctx.lineTo(26, 0);
      ctx.stroke();
      ctx.restore();
    }
    corner(64, 64, 1, 1);
    corner(1136, 64, -1, 1);
    corner(64, 776, 1, -1);
    corner(1136, 776, -1, -1);

    ctx.save();
    ctx.translate(600, 150);
    ctx.shadowColor = "rgba(79,214,255,0.55)";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(0, -85);
    ctx.lineTo(78, -50);
    ctx.lineTo(78, 22);
    ctx.bezierCurveTo(78, 78, 42, 118, 0, 138);
    ctx.bezierCurveTo(-42, 118, -78, 78, -78, 22);
    ctx.lineTo(-78, -50);
    ctx.closePath();
    const shieldFill = ctx.createLinearGradient(-78, -85, 78, 138);
    shieldFill.addColorStop(0, "rgba(30,44,70,0.95)");
    shieldFill.addColorStop(1, "rgba(14,20,34,0.95)");
    ctx.fillStyle = shieldFill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#4fd6ff";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-70, -60);
    ctx.lineTo(0, -78);
    ctx.stroke();

    const barHeights = [26, 46, 66, 50, 32];
    barHeights.forEach((h, i) => {
      const x = -46 + i * 23;
      const barGrad = ctx.createLinearGradient(0, 40 - h, 0, 40);
      barGrad.addColorStop(0, "#8be9ff");
      barGrad.addColorStop(1, "#2a7fa3");
      ctx.fillStyle = barGrad;
      ctx.fillRect(x, 40 - h, 10, h);
    });
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#8093b4";
    ctx.font = "600 20px 'Space Mono', monospace";
    ctx.fillText("ESCUDO SONORO — PROGRAMA DE SEGURIDAD AUDITIVA", 600, 300);

    ctx.shadowColor = "rgba(79,214,255,0.35)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#eef3fb";
    ctx.font = "900 44px 'Orbitron', sans-serif";
    ctx.fillText("CERTIFICADO DE CAPACITACIÓN", 600, 355);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#4fd6ff";
    ctx.font = "500 20px 'Space Grotesk', sans-serif";
    ctx.fillText("Se certifica que", 600, 420);

    ctx.fillStyle = "#34e0a1";
    ctx.font = "700 52px 'Space Grotesk', sans-serif";
    ctx.fillText(name, 600, 490);

    ctx.fillStyle = "#8093b4";
    ctx.font = "500 20px 'Space Grotesk', sans-serif";
    ctx.fillText("completó la capacitación de protección auditiva laboral", 600, 535);

    ctx.fillStyle = "#eef3fb";
    ctx.font = "700 26px 'Space Mono', monospace";
    ctx.fillText(`Resultado del test: ${scoreValue} / ${totalValue}`, 600, 610);

    const dateStr = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
    ctx.fillStyle = "#8093b4";
    ctx.font = "400 16px 'Space Mono', monospace";
    ctx.fillText(dateStr, 600, 650);

    ctx.fillStyle = "rgba(238,243,251,0.85)";
    ctx.font = "700 34px 'Dancing Script', cursive";
    ctx.fillText(name, 340, 700);
    ctx.strokeStyle = "rgba(128,147,180,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(230, 712);
    ctx.lineTo(450, 712);
    ctx.stroke();
    ctx.font = "400 12px 'Space Mono', monospace";
    ctx.fillStyle = "#8093b4";
    ctx.fillText("Firma", 340, 726);

    ctx.fillText(`N.º de registro interno: ${code}`, 340, 742);

    ctx.save();
    ctx.translate(870, 660);
    const sealGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 60);
    sealGrad.addColorStop(0, "#6ff0c4");
    sealGrad.addColorStop(1, "#1f9a78");
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad;
    ctx.shadowColor = "rgba(52,224,161,0.5)";
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#eafff5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#0e9e6f";
    ctx.beginPath();
    ctx.moveTo(-20, 40); ctx.lineTo(-2, 72); ctx.lineTo(-20, 62); ctx.lineTo(-38, 72); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 40); ctx.lineTo(2, 72); ctx.lineTo(20, 62); ctx.lineTo(38, 72); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0a2d20";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-20, 2);
    ctx.lineTo(-4, 20);
    ctx.lineTo(24, -18);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(128,147,180,0.4)";
    ctx.beginPath();
    ctx.moveTo(430, 758);
    ctx.lineTo(770, 758);
    ctx.stroke();
    ctx.font = "400 14px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#8093b4";
    ctx.fillText("Capacitación interna — no reemplaza controles médicos ni normativa vigente", 600, 780);

    const trigger = () => {
      const link = document.createElement("a");
      link.download = `certificado-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(trigger).catch(trigger);
    } else {
      trigger();
    }
  }

  startQuiz();
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


// ---- Cortometrajes: reproductor + relato en 2 partes + libro de subtítulos ----
(function cortos() {
  const clipTabs = document.querySelectorAll(".clip-tab");
  const video = document.getElementById("storyVideo");
  const videoSource = document.getElementById("storyVideoSource");
  const playBtn = document.getElementById("videoPlayBtn");
  const muteBtn = document.getElementById("videoMuteBtn");
  const progressFill = document.getElementById("videoProgressFill");
  const jumpCta = document.getElementById("videoJumpCta");
  const narrateBtn = document.getElementById("narrateBtn");
  const subBook = document.getElementById("subBook");
  const subBookInner = document.getElementById("subBookInner");
  const subDots = [document.getElementById("subDot0"), document.getElementById("subDot1")];
  const subWordsEl = { 1: document.getElementById("subWords1"), 2: document.getElementById("subWords2") };
  const narrAudio = { 1: document.getElementById("narrationAudio1"), 2: document.getElementById("narrationAudio2") };
  const keyBackdrop = document.getElementById("keyInfoBackdrop");
  const keyCard = document.getElementById("keyInfoCard");
  const keyClose = document.getElementById("keyInfoClose");
  const keyImg = document.getElementById("keyInfoImg");
  const keyImgFallback = document.getElementById("keyInfoImgFallback");
  const keyTitle = document.getElementById("keyInfoTitle");
  const keyText = document.getElementById("keyInfoText");
  const videoStage = document.getElementById("videoStage");
  const keyTag = document.getElementById("keyInfoTag");
  const keyTip = document.getElementById("keyInfoTip");
  const keyTipText = document.getElementById("keyInfoTipText");
  if (!video) return;

  const VIDEO_SRC = { 1: "video/videoedu1.mp4", 2: "video/videoedu2.mp4" };
  const MICRO_PAUSE_MS = 500;

  // [segundo de inicio, palabra] — el relato es UNO solo, partido en 2 audios
  const WORDS = {
    1: [
      [0.2, "Lo"], [0.3, "que"], [0.42, "viste"], [0.68, "en"], [0.76, "los"], [0.92, "2"],
      [1.08, "cortometrajes"], [1.8, "breves"], [2.46, "muestra"], [2.76, "lo"], [2.86, "que"],
      [3.0, "puede"], [3.24, "llegar"], [3.5, "a"], [3.6, "pasar"], [3.84, "a"], [3.92, "lo"],
      [4.02, "largo"], [4.28, "de"], [4.38, "los"], [4.58, "años"], [4.8, "trabajando"], [5.48, "y"],
      [5.58, "siguiendo"], [6.0, "tu"], [6.1, "vida"], [6.34, "diaria"], [6.88, "sin"], [7.02, "tener"],
      [7.26, "en"], [7.4, "cuenta"], [7.68, "la"], [7.8, "protección"], [8.26, "de"], [8.4, "tus"],
      [8.62, "oídos,"], [9.2, "provocando"], [9.66, "una"], [9.86, "serie"], [10.1, "de"],
      [10.28, "daños"], [10.66, "irreversibles"], [11.3, "en"], [11.42, "las"], [11.58, "células"],
      [12.02, "ciliadas,"], [12.88, "mostrando"], [13.32, "cómo"], [13.5, "esa"], [13.7, "persona"],
      [14.06, "le"], [14.14, "da"], [14.36, "tinnitus,"], [14.98, "haciendo"], [15.36, "que"],
      [15.48, "no"], [15.64, "pueda"], [15.9, "seguir"], [16.2, "su"], [16.34, "vida"], [16.58, "de"],
      [16.7, "manera"], [17.06, "normal."],
    ],
    2: [
      [0.16, "En"], [0.3, "cambio,"], [0.68, "el"], [0.96, "2do"], [1.18, "video"], [1.52, "muestra"],
      [1.86, "cómo"], [2.02, "es"], [2.14, "que"], [2.24, "la"], [2.36, "persona"], [2.72, "trabaja"],
      [3.16, "y"], [3.26, "vive"], [3.52, "con"], [3.64, "normalidad"], [4.28, "al"], [4.4, "no"],
      [4.52, "tener"], [4.8, "ningún"], [5.14, "dolor"], [5.4, "o"], [5.5, "molestia"], [5.92, "en"],
      [6.02, "el"], [6.16, "oído,"], [6.5, "teniendo"], [6.8, "en"], [6.92, "cuenta"], [7.18, "las"],
      [7.34, "precauciones"], [7.94, "que"], [8.02, "hay"], [8.16, "que"], [8.3, "tomar"], [8.74, "y"],
      [8.82, "generando"], [9.36, "menos"], [9.68, "estrés"], [10.06, "en"], [10.18, "su"],
      [10.3, "vida"], [10.58, "diaria."], [11.22, "Todo"], [11.46, "esto"], [11.7, "con"], [11.82, "el"],
      [11.94, "objetivo"], [12.36, "de"], [12.42, "intentar"], [12.84, "convencerte"], [13.46, "que"],
      [13.54, "al"], [13.64, "menos"], [13.92, "intentes"], [14.36, "tener"], [14.6, "en"],
      [14.72, "cuenta"], [15.0, "de"], [15.12, "conseguir"], [15.54, "algo"], [15.74, "de"],
      [15.86, "protección"], [16.38, "para"], [16.58, "tus"], [16.78, "oídos"], [17.22, "y"],
      [17.3, "no"], [17.42, "tener"], [17.68, "que"], [17.8, "preocuparte"], [18.4, "más"],
      [18.62, "sobre"], [18.88, "problemas"], [19.34, "permanentes"], [20.1, "en"], [20.26, "tu"],
      [20.38, "futuro."],
    ],
  };

  // Palabra normalizada -> ficha de información tocable
  const KEY_MAP = {
    celulas: "cel_ciliadas", ciliadas: "cel_ciliadas",
    tinnitus: "tinnitus",
    danos: "dano_irreversible", dano: "dano_irreversible",
    irreversibles: "dano_irreversible", irreversible: "dano_irreversible",
    permanentes: "dano_irreversible",
    proteccion: "proteccion", precauciones: "proteccion",
    estres: "estres",
  };

  const KEY_INFO = {
    cel_ciliadas: {
      title: "Células ciliadas",
      img: "img/celulas-ciliadas.jpg",
      fallback: "🧬",
      cat: "riesgo",
      text: "Son las que traducen el sonido en señales para el cerebro, adentro de la cóclea. El cuerpo nace con una cantidad fija: cuando el ruido las daña, no vuelven a crecer nunca más. Cada exposición sin protección es, literalmente, gastar una reserva que no se recarga.",
      tip: "Una vez perdidas, no existe cirugía, aparato ni tratamiento que las regenere.",
    },
    tinnitus: {
      title: "Tinnitus (zumbido constante)",
      img: "img/tinnitus.jpg",
      fallback: "🔔",
      cat: "riesgo",
      text: "Es un pitido o zumbido que se escucha aunque no haya ningún sonido real. Suele aparecer después de exposiciones fuertes y, en muchos casos, se queda para siempre: no hay una cura garantizada. Puede afectar el sueño, la concentración y el humor día a día.",
    },
    dano_irreversible: {
      title: "Daño irreversible",
      img: "img/dano-auditivo.jpg",
      fallback: "⚠️",
      cat: "riesgo",
      text: "A diferencia de un corte o un moretón, el daño en el oído interno no cicatriza. Una vez perdida, esa audición no vuelve — por eso la única estrategia que funciona es prevenir antes, no tratar después.",
    },
    proteccion: {
      title: "Protección auditiva",
      img: "img/proteccion-auditiva.jpg",
      fallback: "🎧",
      cat: "cuidado",
      text: "Tapones de espuma, moldeados u orejeras: cualquiera de estas opciones reduce muchísimo el riesgo, y combinadas (doble protección) todavía más. Es un segundo de esfuerzo hoy a cambio de seguir escuchando bien dentro de 20 años.",
      tip: "Dejá un par de tapones en tu mochila o en tu puesto de trabajo, así siempre los tenés a mano.",
    },
    estres: {
      title: "Estrés por ruido",
      img: "img/estres-ruido.jpg",
      fallback: "😣",
      cat: "riesgo",
      text: "El ruido constante no solo daña el oído: también sube el cansancio, la irritabilidad y baja la concentración en la tarea. Trabajar más silencioso (o bien protegido) es trabajar más seguro, en más de un sentido.",
    },
  };

  function normalize(w) {
    return w.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function buildWords(part) {
    const container = subWordsEl[part];
    container.innerHTML = "";
    WORDS[part].forEach(([start, text]) => {
      const span = document.createElement("span");
      span.className = "sub-word";
      const keyId = KEY_MAP[normalize(text)];
      if (keyId) {
        span.classList.add("sub-key");
        span.dataset.key = keyId;
        span.setAttribute("role", "button");
      }
      span.dataset.start = start;
      span.textContent = text;
      if (keyId) {
        const dot = document.createElement("sup");
        dot.className = "sub-key-dot";
        dot.textContent = "●";
        span.appendChild(dot);
      }
      container.appendChild(span);
      container.appendChild(document.createTextNode(" "));
    });
  }
  buildWords(1);
  buildWords(2);

  function resetWords(part) {
    subWordsEl[part].querySelectorAll(".sub-word").forEach((s) => {
      s.classList.remove("sub-shown", "sub-active");
    });
    const p = document.getElementById(`subProgress${part}`);
    if (p) p.style.width = "0%";
  }

  // ---- Libro de subtítulos: flip + swipe + puntitos ----
  let currentPage = 1;
  function goToPage(n, opts) {
    const silent = opts && opts.silent;
    currentPage = n;
    subBookInner.classList.toggle("flipped", n === 2);
    subDots.forEach((d, i) => d.classList.toggle("active", i === n - 1));
    if (!silent) stopNarration();
  }
  subDots.forEach((dot) => {
    dot.addEventListener("click", () => goToPage(Number(dot.dataset.page)));
  });
  let touchStartX = null;
  subBook.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  subBook.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && currentPage === 1) goToPage(2);
    else if (dx > 0 && currentPage === 2) goToPage(1);
  }, { passive: true });

  // ---- Tarjeta de palabra clave ----
  function openKeyInfo(id) {
    const info = KEY_INFO[id];
    if (!info) return;
    stopNarration();
    keyTitle.textContent = info.title;
    keyText.textContent = info.text;
    keyImgFallback.textContent = info.fallback;
    keyCard.classList.toggle("key-info-cuidado", info.cat === "cuidado");
    if (keyTag) keyTag.textContent = info.cat === "cuidado" ? "🛡 Se puede prevenir" : "⚠ Riesgo real";
    if (info.tip) {
      keyTipText.textContent = info.tip;
      keyTip.hidden = false;
    } else {
      keyTip.hidden = true;
    }
    keyImg.removeAttribute("src");
    keyImg.style.display = "none";
    keyImgFallback.style.display = "flex";
    const probe = new Image();
    probe.onload = () => {
      keyImg.src = info.img;
      keyImg.style.display = "block";
      keyImgFallback.style.display = "none";
    };
    probe.src = info.img;
    keyBackdrop.hidden = false;
    requestAnimationFrame(() => keyBackdrop.classList.add("open"));
  }
  function closeKeyInfo() {
    keyBackdrop.classList.remove("open");
    setTimeout(() => { keyBackdrop.hidden = true; }, 250);
  }
  [subWordsEl[1], subWordsEl[2]].forEach((el) => {
    el.addEventListener("click", (e) => {
      const target = e.target.closest(".sub-key");
      if (target) openKeyInfo(target.dataset.key);
    });
  });
  keyClose.addEventListener("click", closeKeyInfo);
  keyBackdrop.addEventListener("click", (e) => { if (e.target === keyBackdrop) closeKeyInfo(); });

  // ---- Video: tabs, play/pause, mute, progreso, cta al video 2 ----
  let currentClip = 1;
  let narrateTimer = null;
  let narratingPart = null;

  function stopNarration() {
    clearTimeout(narrateTimer);
    narrAudio[1].pause();
    narrAudio[2].pause();
    narrateBtn.classList.remove("is-narrating");
    narrateBtn.innerHTML = narratingPart
      ? `<span class="narrate-btn-icon">▶</span> Seguir escuchando (parte ${narratingPart} de 2)`
      : '<span class="narrate-btn-icon">▶</span> Escuchar el relato completo';
  }

  function stopAll() {
    video.pause();
    stopNarration();
    narratingPart = null;
    playBtn.classList.remove("is-playing");
  }
  window.stopCortos = stopAll;

  function switchClip(n) {
    video.pause();
    playBtn.classList.remove("is-playing");
    videoStage.classList.remove("story-video-ended");
    currentClip = n;
    clipTabs.forEach((b) => b.classList.toggle("active", Number(b.dataset.clip) === n));
    videoSource.src = VIDEO_SRC[n];
    video.load();
    progressFill.style.width = "0%";
    jumpCta.hidden = true;
  }
  clipTabs.forEach((btn) => {
    btn.addEventListener("click", () => switchClip(Number(btn.dataset.clip)));
  });

  video.addEventListener("ended", () => {
    playBtn.classList.remove("is-playing");
    if (currentClip === 1) {
      videoStage.classList.add("story-video-ended");
      jumpCta.hidden = false;
      jumpCta.style.animation = "none";
      void jumpCta.offsetWidth;
      jumpCta.style.animation = "";
    }
  });

  function togglePlay() {
    if (video.paused) {
      stopNarration();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }
  playBtn.addEventListener("click", togglePlay);
  video.addEventListener("click", togglePlay);
  video.addEventListener("play", () => playBtn.classList.add("is-playing"));
  video.addEventListener("pause", () => playBtn.classList.remove("is-playing"));
  video.addEventListener("timeupdate", () => {
    if (video.duration) progressFill.style.width = `${(video.currentTime / video.duration) * 100}%`;
  });


  muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? "🔇" : "🔊";
  });

  jumpCta.addEventListener("click", () => {
    jumpCta.hidden = true;
    switchClip(2);
    video.play().catch(() => {});
  });

  // ---- Relato completo: parte 1 -> micropausa -> parte 2, con flip automático ----
  function playPart(part, opts) {
    const fresh = !opts || opts.fresh !== false;
    video.pause();
    narratingPart = part;
    if (fresh) {
      resetWords(part);
      narrAudio[part].currentTime = 0;
    }
    goToPage(part, { silent: true });
    narrateBtn.classList.add("is-narrating");
    narrateBtn.innerHTML = `<span class="narrate-btn-icon">⏸</span> Relatando… (parte ${part} de 2)`;
    narrAudio[part].play().catch(() => stopNarration());
  }

  narrateBtn.addEventListener("click", () => {
    const isNarrating = narrateBtn.classList.contains("is-narrating");
    if (isNarrating) { stopNarration(); return; }
    playPart(narratingPart || 1, { fresh: !narratingPart });
  });

  narrAudio[1].addEventListener("ended", () => {
    if (narratingPart !== 1) return;
    narrateTimer = setTimeout(() => playPart(2), MICRO_PAUSE_MS);
  });
  narrAudio[2].addEventListener("ended", () => {
    stopNarration();
    narratingPart = null;
  });

  [1, 2].forEach((part) => {
    const audio = narrAudio[part];
    const progressEl = document.getElementById(`subProgress${part}`);
    audio.addEventListener("timeupdate", () => {
      const spans = subWordsEl[part].querySelectorAll(".sub-word");
      let activeSpan = null;
      let shownCount = 0;
      spans.forEach((span) => {
        const start = Number(span.dataset.start);
        if (start <= audio.currentTime) {
          span.classList.add("sub-shown");
          activeSpan = span;
          shownCount++;
        } else {
          span.classList.remove("sub-shown");
        }
        span.classList.remove("sub-active");
      });
      if (activeSpan) activeSpan.classList.add("sub-active");
      if (progressEl) progressEl.style.width = `${(shownCount / spans.length) * 100}%`;
    });
  });

  goToPage(1, { silent: true });
})();

// ---- Medidor de decibeles en vivo (micrófono real, para demo en vivo) ----
(function dbMeterTool() {
  const startBtn = document.getElementById("dbMeterStart");
  const stopBtn = document.getElementById("dbMeterStop");
  const valueEl = document.getElementById("dbMeterValue");
  const statusEl = document.getElementById("dbMeterStatus");
  const arcFill = document.getElementById("dbMeterArcFill");
  if (!startBtn) return;

  const ARC_LEN = 157;
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let stream = null;
  let rafId = null;

  function setStatus(text, cls) {
    statusEl.textContent = text;
    statusEl.className = `db-meter-status${cls ? " " + cls : ""}`;
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (audioCtx) audioCtx.close().catch(() => {});
    audioCtx = null;
    analyser = null;
    source = null;
    startBtn.hidden = false;
    stopBtn.hidden = true;
    valueEl.textContent = "--";
    arcFill.style.strokeDashoffset = String(ARC_LEN);
    setStatus("Tocá «Iniciar» y permití el uso del micrófono.");
  }
  window.stopDbMeter = stop;

  function loop() {
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const dbfs = 20 * Math.log10(rms || 0.0001);
    // calibración aproximada: no es un instrumento certificado, es orientativo
    let approx = Math.round(dbfs + 100);
    approx = Math.max(30, Math.min(120, approx));

    valueEl.textContent = approx;
    const pct = (approx - 30) / (120 - 30);
    arcFill.style.strokeDashoffset = String(ARC_LEN * (1 - pct));

    if (approx >= 85) {
      arcFill.style.stroke = "var(--signal)";
      setStatus("Nivel de riesgo — usá protección auditiva ya.", "status-danger");
    } else if (approx >= 70) {
      arcFill.style.stroke = "var(--hologram)";
      setStatus("Nivel moderado — considerá usar protección.", "status-warn");
    } else {
      arcFill.style.stroke = "var(--mint)";
      setStatus("Nivel seguro por ahora.", "status-ok");
    }
    rafId = requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Tu navegador no permite acceder al micrófono acá.", "status-danger");
      return;
    }
    setStatus("Pidiendo permiso del micrófono…");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      startBtn.hidden = true;
      stopBtn.hidden = false;
      loop();
    } catch (err) {
      setStatus("No pudimos acceder al micrófono. Revisá los permisos del navegador.", "status-danger");
    }
  });

  stopBtn.addEventListener("click", stop);
})();

// ---- Checklist diaria de EPP + racha (persistida en localStorage) ----
(function checklistTool() {
  const checklistEl = document.getElementById("toolChecklist");
  const streakNumberEl = document.getElementById("toolStreakNumber");
  const streakNoteEl = document.getElementById("toolStreakNote");
  if (!checklistEl) return;

  const checkboxes = [...checklistEl.querySelectorAll('input[type="checkbox"]')];
  const STORAGE_KEY = "escudo-sonoro-checklist";

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && typeof parsed.streak === "number") return parsed;
    } catch (e) { /* ignore */ }
    return { streak: 0, lastDate: null };
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function isYesterday(dateKey) {
    if (!dateKey) return false;
    const [y, m, d] = dateKey.split("-").map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() + 1);
    return `${prev.getFullYear()}-${prev.getMonth() + 1}-${prev.getDate()}` === todayKey();
  }

  let state = readState();
  streakNumberEl.textContent = state.streak;

  if (state.lastDate === todayKey()) {
    checkboxes.forEach((cb) => { cb.checked = true; cb.disabled = true; });
    streakNoteEl.textContent = "Ya completaste el checklist de hoy. ¡Volvé mañana!";
  } else {
    streakNoteEl.textContent = "Marcá los tres puntos para sumar el día de hoy a tu racha.";
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (!checkboxes.every((c) => c.checked)) return;
      if (state.lastDate === todayKey()) return;

      const continued = isYesterday(state.lastDate);
      state.streak = continued ? state.streak + 1 : 1;
      state.lastDate = todayKey();
      saveState(state);

      streakNumberEl.textContent = state.streak;
      streakNumberEl.classList.remove("streak-bump");
      void streakNumberEl.offsetWidth;
      streakNumberEl.classList.add("streak-bump");

      checkboxes.forEach((c) => { c.disabled = true; });
      streakNoteEl.textContent = "¡Listo! Sumaste el día de hoy. Volvé mañana para seguir la racha.";
      if (navigator.vibrate) navigator.vibrate(25);
    });
  });
})();
