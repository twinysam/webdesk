(function () {
  const root = document.documentElement;
  const container = document.querySelector(".caja");
  const ghosts = Array.from(document.querySelectorAll(".halloween-ghost"));
  const timers = new Map();
  const flights = new Map();
  let runId = 0;
  let resizeTimer = null;
  let patternLibraryPromise = null;
  let paused = false;
  let started = false;

  function pageIsFocused() {
    return !document.hidden && (!document.hasFocus || document.hasFocus());
  }

  function stop() {
    runId++;
    timers.forEach(timer => clearTimeout(timer.id));
    timers.clear();
    flights.forEach(flight => flight.cancel());
    flights.clear();
    ghosts.forEach(ghost => {
      ghost.style.opacity = "0";
    });
  }

  function later(callback, delay) {
    const timer = { callback, remaining: delay, id: null, dueAt: 0 };
    timers.set(timer, timer);
    if (!paused) armTimer(timer);
  }

  function armTimer(timer) {
    timer.dueAt = performance.now() + timer.remaining;
    timer.id = setTimeout(function () {
      timers.delete(timer);
      timer.id = null;
      timer.callback();
    }, timer.remaining);
  }

  function pause() {
    if (paused) return;
    paused = true;
    root.classList.add("halloween-motion-paused");
    const now = performance.now();
    timers.forEach(function (timer) {
      if (timer.id !== null) {
        clearTimeout(timer.id);
        timer.id = null;
        timer.remaining = Math.max(0, timer.dueAt - now);
      }
    });
    flights.forEach(flight => flight.pause());
  }

  function resume() {
    if (!root.classList.contains("halloween-theme") || !pageIsFocused()) return;
    if (!started) {
      start();
      return;
    }
    if (!paused) return;
    paused = false;
    root.classList.remove("halloween-motion-paused");
    flights.forEach(flight => flight.play());
    timers.forEach(timer => {
      if (timer.id === null) armTimer(timer);
    });
  }

  function placeRandomly(ghost) {
    const halfWidth = ghost.offsetWidth / 2;
    const halfHeight = ghost.offsetHeight / 2;
    const radiusLimit = Math.max(0, Math.min(
      (container.clientWidth - ghost.offsetWidth) / 2,
      (container.clientHeight - ghost.offsetHeight) / 2
    ) - 8);
    const maxRadius = Math.min(72, radiusLimit);
    const radius = maxRadius < 22 ? maxRadius : 22 + Math.random() * (maxRadius - 22);
    const minX = halfWidth + radius;
    const minY = halfHeight + radius;
    const maxX = Math.max(minX, container.clientWidth - halfWidth - radius);
    const maxY = Math.max(minY, container.clientHeight - halfHeight - radius);
    const centerX = minX + Math.random() * (maxX - minX);
    const centerY = minY + Math.random() * (maxY - minY);

    ghost.style.left = centerX + "px";
    ghost.style.top = centerY + "px";
    ghost.style.transform = "translate(-50%, -50%)";
    // Negative z-index ghosts sit behind the app icons; others fly above them.
    ghost.style.zIndex = Math.random() < 0.45 ? "-1" : "2";
    return radius;
  }

  function startFlight(ghost, radius, duration, peakOpacity) {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const startAngle = Math.random() * Math.PI * 2;
    const frames = [];

    for (let step = 0; step <= 12; step++) {
      const progress = step / 12;
      const angle = startAngle + direction * progress * Math.PI * 2;
      let opacity;
      if (progress < 1 / 6) {
        opacity = peakOpacity * progress * 6;
      } else if (progress < 2 / 3) {
        opacity = peakOpacity;
      } else {
        opacity = peakOpacity * (1 - (progress - 2 / 3) * 3);
      }

      frames.push({
        transform: "translate(-50%, -50%) translate(" +
          Math.cos(angle) * radius + "px, " +
          Math.sin(angle) * radius + "px)",
        opacity: String(Math.max(0, opacity))
      });
    }

    const flight = ghost.animate(frames, {
      duration,
      iterations: 1,
      easing: "linear",
      fill: "forwards"
    });
    flights.set(ghost, flight);
  }

  function start() {
    stop();
    started = false;
    if (!root.classList.contains("halloween-theme")) return;

    paused = false;
    started = true;
    if (!pageIsFocused()) pause();
    else root.classList.remove("halloween-motion-paused");
    const run = runId;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function waitForLayout(attempt) {
      if (run !== runId) return;
      if (container.clientWidth < 1 || container.clientHeight < 1) {
        if (attempt < 20) later(() => waitForLayout(attempt + 1), 250);
        return;
      }

      ghosts.forEach(function (ghost) {
        placeRandomly(ghost);

        if (reducedMotion) {
          ghost.style.opacity = "0.45";
          return;
        }

        function appear() {
          if (run !== runId || !pageIsFocused() || !root.classList.contains("halloween-theme")) return;
          const previousFlight = flights.get(ghost);
          if (previousFlight) previousFlight.cancel();
          flights.delete(ghost);

          const radius = placeRandomly(ghost);
          const duration = 4200 + Math.random() * 2200;
          const peakOpacity = (35 + Math.random() * 40) / 100;
          startFlight(ghost, radius, duration, peakOpacity);
          later(appear, duration + 10000);
        }

        later(appear, 300 + Math.random() * 8500);
      });
    }

    waitForLayout(0);
  }

  function scheduleRestart() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 180);
  }

  function loadPatternLibrary() {
    if (typeof generatePatternUri === "function" && typeof bgPatterns !== "undefined") {
      return Promise.resolve();
    }
    if (patternLibraryPromise) return patternLibraryPromise;

    patternLibraryPromise = new Promise(function (resolve, reject) {
      let script = Array.from(document.scripts).find(item =>
        item.src && item.src.endsWith("/js/bg-patterns.js")
      );
      const alreadyPresent = !!script;
      if (!script) {
        script = document.createElement("script");
        script.src = "js/bg-patterns.js";
      }
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      if (!alreadyPresent) document.head.appendChild(script);
    }).then(function () {
      if (typeof generatePatternUri !== "function" || typeof bgPatterns === "undefined") {
        throw new Error("The background pattern library did not initialize.");
      }
    });

    return patternLibraryPromise;
  }

  async function applySeasonalBackground() {
    if (!root.classList.contains("halloween-theme")) return;
    let prefs = {};
    try {
      prefs = JSON.parse(localStorage.getItem("userPreferences") || "{}");
    } catch (error) {}
    if (prefs.disableHalloweenDecorations === true) return;

    try {
      await loadPatternLibrary();
      const opacity = prefs.patternOpacity ?? 0.2;
      const light = generatePatternUri("Skulls", prefs.patternColorLight || "#014669", opacity);
      const dark = generatePatternUri("Skulls", prefs.patternColorDark || "#313131", opacity);
      const pattern = bgPatterns.find(item => item.name === "Skulls");
      if (!light || !dark || !pattern) return;

      root.style.setProperty("--bg-image-light", 'url("' + light + '")');
      root.style.setProperty("--bg-image-dark", 'url("' + dark + '")');

      const width = pattern.width || pattern.size || 180;
      const height = pattern.height || pattern.size || width;
      const body = document.body;
      // PreferencesManager stores the selected pattern on body; override those
      // inline values for the seasonal view while leaving saved preferences intact.
      body.style.setProperty("--bg-image-light", 'url("' + light + '")');
      body.style.setProperty("--bg-image-dark", 'url("' + dark + '")');
      body.style.setProperty("--bg-size", width + "px");
      body.style.setProperty("--bg-pattern-width", width + "px");
      body.style.setProperty("--bg-pattern-height", height + "px");

      const speed = prefs.bgScrollSpeed ?? 10;
      if (speed > 0 && pageIsFocused()) {
        body.classList.remove("paused");
        body.style.setProperty("--bg-animate-duration", width / speed + "s");
      } else {
        body.classList.add("paused");
        body.style.removeProperty("--bg-animate-duration");
      }
      start();
    } catch (error) {
      console.error("Failed to apply Halloween background pattern:", error);
    }
  }

  window.HalloweenManager = { applySeasonalBackground };

  window.addEventListener("blur", pause);
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else if (pageIsFocused()) resume();
  });
  window.addEventListener("resize", scheduleRestart);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
