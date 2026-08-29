// ==========================================================
// ESCUDO SONORO — lógica de la app
// ==========================================================

(function boot() {
  const bootEl = document.getElementById("boot");
  const appEl = document.getElementById("app");
  const enterBtn = document.getElementById("bootEnter");

  enterBtn.addEventListener("click", () => {
    bootEl.classList.add("boot-hide");
    appEl.hidden = false;
    setTimeout(() => { bootEl.hidden = true; }, 650);
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
  const eardrumSvg = document.getElementById("eardrumSvg");
  const refButtons = document.querySelectorAll(".db-ref");
  const compareBtn = document.getElementById("compareBtn");
  const comparePanel = document.getElementById("comparePanel");
  if (!slider) return;

  let attenuation = 0;
  let compareOn = false;
  let wasDanger = false;

  function safeMinutes(effectiveDb) {
    if (effectiveDb <= 80) return Infinity;
    // Regla de intercambio 3 dB: 85 dB = 480 min, cada +3 dB parte el tiempo a la mitad.
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
    return (2.2 - intensity * 1.7).toFixed(2); // de 2.2s (calmo) a 0.5s (frenético)
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
    eardrumSvg.querySelector(".membrane").style.fill = risk.color;

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
    eardrumSvg.style.setProperty("--ring-speed", `${speed}s`);
    eardrumSvg.style.setProperty("--ring-amp", (1.04 + intensity * 0.22).toFixed(3));
    eardrumSvg.style.setProperty("--mem-amp", (1.02 + intensity * 0.14).toFixed(3));

    // Vibración al entrar en zona de peligro (una sola vez por transición)
    if (risk.key === "danger" && !wasDanger && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
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
