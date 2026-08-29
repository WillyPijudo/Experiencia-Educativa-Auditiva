// ==========================================================
// ESCUDO SONORO — lógica de la app
// ==========================================================

// ---- Arranque: la secuencia holográfica ya corre sola por CSS.
// Acá solo esperamos a que el usuario toque "Entrar".
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
  const protectSwitch = document.getElementById("protectSwitch");
  const protectStateEl = document.getElementById("protectState");
  const effectiveDbEl = document.getElementById("effectiveDb");
  const safeTimeEl = document.getElementById("safeTime");
  const readoutNoteEl = document.getElementById("readoutNote");
  const riskLabelEl = document.getElementById("riskLabel");
  const eardrumSvg = document.getElementById("eardrumSvg");
  const refButtons = document.querySelectorAll(".db-ref");
  if (!slider) return;

  // Atenuación típica de un protector auditivo bien calzado (NRR promedio).
  const PROTECTION_ATTENUATION = 24;

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

  function update() {
    const rawDb = Number(slider.value);
    const protectedOn = protectSwitch.checked;
    const effectiveDb = Math.max(20, protectedOn ? rawDb - PROTECTION_ATTENUATION : rawDb);

    dbValueEl.textContent = rawDb;
    protectStateEl.textContent = protectedOn ? "Activada" : "Desactivada";
    effectiveDbEl.textContent = `${Math.round(effectiveDb)} dB`;

    const minutes = safeMinutes(effectiveDb);
    safeTimeEl.textContent = formatTime(minutes);

    const risk = riskState(effectiveDb);
    riskLabelEl.textContent = risk.label;
    riskLabelEl.style.color = risk.color;
    eardrumSvg.querySelector(".membrane").style.fill = risk.color;

    if (risk.key === "safe") {
      readoutNoteEl.textContent = protectedOn
        ? "Con protección, este nivel no representa riesgo en toda la jornada."
        : "Con este nivel podés trabajar la jornada completa sin riesgo.";
    } else if (risk.key === "caution") {
      readoutNoteEl.textContent = protectedOn
        ? "Todavía conviene limitar el tiempo de exposición, aunque estés protegido."
        : "A partir de acá, cada 3 dB de más reduce el tiempo seguro a la mitad. Usá protección.";
    } else {
      readoutNoteEl.textContent = protectedOn
        ? "Nivel muy alto: incluso con protección, minimizá el tiempo de exposición."
        : "Riesgo inmediato de daño auditivo. Protección obligatoria.";
    }

    // Animación del tímpano: más intensidad = pulso más rápido y más amplio.
    const intensity = Math.min(1, Math.max(0, (effectiveDb - 40) / 100));
    const speed = 2.2 - intensity * 1.7; // de 2.2s (calmo) a 0.5s (frenético)
    eardrumSvg.style.setProperty("--ring-speed", `${speed.toFixed(2)}s`);
    eardrumSvg.style.setProperty("--ring-amp", (1.04 + intensity * 0.22).toFixed(3));
    eardrumSvg.style.setProperty("--mem-amp", (1.02 + intensity * 0.14).toFixed(3));
  }

  slider.addEventListener("input", update);
  protectSwitch.addEventListener("change", update);
  refButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      slider.value = btn.dataset.db;
      update();
    });
  });

  update();
})();
