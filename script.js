const timelineData = [
  {
    step: "[01]",
    title: "Meses de Dolor",
    body:
      "Hubo momentos en los que no sabía si iba a volver a caminar. Meses de dolor constante. De estar tirado. De depender. De no reconocerme."
  },
  {
    step: "[02]",
    title: "Me Cerré",
    body:
      "No sabía cómo procesarlo y, en lugar de pedir ayuda, hice lo contrario. No quería que nadie me viera débil. Levanté una pared."
  },
  {
    step: "[03]",
    title: "Lo Que Rompí",
    body:
      "Lastimé a personas que estaban ahí para mí. Me volví alguien difícil, amargado, cerrado. Las consecuencias no desaparecen solo porque tengas una razón."
  },
  {
    step: "[04]",
    title: "El Refugio",
    body:
      "Mientras todo lo demás se caía, el trabajo se mantenía firme. Fue enfoque, disciplina y necesidad. Ahí me refugié cuando todo lo demás no alcanzaba."
  }
];

const techCards = [
  {
    tag: "[FONDO]",
    title: "Tocar Fondo",
    body: "Hubo momentos donde pensé que ya no se podía caer más bajo. Siempre se podía. Y eso se repitió más de una vez."
  },
  {
    tag: "[DECISION]",
    title: "Construir Otra Versión",
    body: "No fue un momento épico ni una revelación. Fue una decisión: dejar de aferrarme a una versión de mí que ya no existía."
  },
  {
    tag: "[REGRESO]",
    title: "Volví",
    body: "Hoy puedo decir algo que parecía imposible: volví a caminar, volví a correr, volví a jugar fútbol. No igual. No como antes. Pero volví."
  }
];

const timelineContainer = document.querySelector("#timeline-items");
const techGrid = document.querySelector("#tech-grid");
const themeToggle = document.querySelector(".theme-toggle");
const themeState = document.querySelector(".theme-toggle__state");
const root = document.body;
const glitchNode = document.querySelector(".glitch-text");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function renderCard({ step, title, body }) {
  return `
    <article class="timeline-card reveal" data-scale-zone>
      <span class="timeline-card__step line-reveal">${step}</span>
      <h3 class="line-reveal glitch-reveal" data-glitch="${title}">${title}</h3>
      <p class="type-reveal">${body}</p>
    </article>
  `;
}

function renderTechCard({ tag, title, body }) {
  return `
    <article class="tech-card reveal">
      <span class="tech-card__tag line-reveal">${tag}</span>
      <h3 class="line-reveal glitch-reveal" data-glitch="${title}">${title}</h3>
      <p class="type-reveal">${body}</p>
    </article>
  `;
}

timelineContainer.innerHTML = timelineData.map(renderCard).join("");
techGrid.innerHTML = techCards.map(renderTechCard).join("");

const dynamicRevealNodes = [...document.querySelectorAll(".reveal")];
const dynamicScaleZones = [...document.querySelectorAll("[data-scale-zone]")];
const typeRevealNodes = [...document.querySelectorAll(".type-reveal")];
const lineRevealNodes = [...document.querySelectorAll(".line-reveal")];
const glitchRevealNodes = [...document.querySelectorAll(".glitch-reveal")];

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "light"));
  themeState.textContent = theme.toUpperCase();
  localStorage.setItem("narrative-os-theme", theme);
}

function setupThemeToggle() {
  const storedTheme = localStorage.getItem("narrative-os-theme");
  const preferredTheme =
    storedTheme ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  applyTheme(preferredTheme);

  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
}

function setupRevealObserver() {
  if (reducedMotionQuery.matches) {
    dynamicRevealNodes.forEach((node) => node.classList.add("is-visible"));
    lineRevealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  // Scroll logic:
  // We reveal sections only when they are close to the viewport.
  // Intersection Observer avoids running manual visibility checks on every frame.
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const index = dynamicRevealNodes.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(index * 45, 280)}ms`;
        entry.target.classList.add("is-visible");

        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  dynamicRevealNodes.forEach((node) => revealObserver.observe(node));
}

function setupScaleOnScroll() {
  if (reducedMotionQuery.matches) return;

  let ticking = false;

  // Zoom effect:
  // Each reading block measures its distance against a focal point placed in the
  // upper-middle viewport. Closer blocks scale up a little so reading feels assisted,
  // not obvious. requestAnimationFrame keeps scroll updates aligned with painting.
  const updateScale = () => {
    const focusY = window.innerHeight * 0.38;

    dynamicScaleZones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      const zoneCenter = rect.top + rect.height * 0.45;
      const distance = Math.abs(zoneCenter - focusY);
      const influence = Math.max(0, 1 - distance / (window.innerHeight * 0.72));
      const scale = 1 + influence * 0.035;
      zone.style.setProperty("--scale-active", scale.toFixed(3));
    });

    ticking = false;
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScale);
  };

  updateScale();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
}

function setupTypeReveal() {
  typeRevealNodes.forEach((node) => {
    node.dataset.fullText = node.textContent.replace(/\s+/g, " ").trim();
    node.textContent = "";
  });

  if (reducedMotionQuery.matches) {
    typeRevealNodes.forEach((node) => {
      node.textContent = node.dataset.fullText;
    });
    glitchRevealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  let ticking = false;

  // Reveal del texto:
  // Todo obedece a una linea apuntadora fija del viewport. Solo el parrafo que cruza esa
  // linea se escribe; los que quedan arriba se consolidan completos y los de abajo esperan.
  const updateTyping = () => {
    const viewportHeight = window.innerHeight;
    const pointerY = viewportHeight * 0.38;

    let activeIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    typeRevealNodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const nodeCenter = rect.top + rect.height * 0.5;
      const isCandidate = rect.top <= pointerY && rect.bottom >= pointerY;

      if (!isCandidate) return;

      const distance = Math.abs(nodeCenter - pointerY);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    if (activeIndex === -1) {
      typeRevealNodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const fullText = node.dataset.fullText || "";

        if (rect.bottom < pointerY) {
          node.textContent = fullText;
        } else if (rect.top > pointerY) {
          node.textContent = "";
        }

        node.classList.remove("is-typing");
      });

      ticking = false;
      return;
    }

    typeRevealNodes.forEach((node, index) => {
      const fullText = node.dataset.fullText || "";
      const rect = node.getBoundingClientRect();

      if (index < activeIndex) {
        node.textContent = fullText;
        node.classList.remove("is-typing");
        return;
      }

      if (index > activeIndex) {
        node.textContent = "";
        node.classList.remove("is-typing");
        return;
      }

      const progress = (pointerY - rect.top) / Math.max(rect.height, 1);
      const clamped = Math.max(0, Math.min(progress, 1));
      const visibleChars = Math.max(0, Math.round(fullText.length * clamped));
      const nextText = fullText.slice(0, visibleChars);

      if (node.textContent !== nextText) {
        node.textContent = nextText;
      }

      node.classList.toggle("is-typing", clamped > 0 && clamped < 1);
    });

    ticking = false;
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateTyping);
  };

  updateTyping();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
}

function setupPointerLineReveal() {
  if (reducedMotionQuery.matches) {
    lineRevealNodes.forEach((node) => {
      node.classList.add("is-visible");
      node.classList.remove("is-armed");
    });
    return;
  }

  let ticking = false;
  const triggeredTitles = new WeakSet();

  const updateLineReveal = () => {
    const pointerY = window.innerHeight * 0.38;

    lineRevealNodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const crossedPointer = rect.bottom <= pointerY;
      const touchingPointer = rect.top <= pointerY && rect.bottom > pointerY;

      node.classList.toggle("is-visible", crossedPointer);
      node.classList.toggle("is-armed", touchingPointer && !crossedPointer);

      const shouldGlitch =
        crossedPointer &&
        node.classList.contains("glitch-reveal") &&
        !triggeredTitles.has(node);

      if (shouldGlitch) {
        triggeredTitles.add(node);
        node.classList.add("is-glitch-entering");
        window.setTimeout(() => {
          node.classList.remove("is-glitch-entering");
        }, 220);
      }

      if (!crossedPointer && triggeredTitles.has(node)) {
        triggeredTitles.delete(node);
      }
    });

    ticking = false;
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateLineReveal);
  };

  updateLineReveal();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
}

function setupGlitchPulse() {
  if (!glitchNode || reducedMotionQuery.matches) return;

  // Glitch implementation:
  // Instead of a constant effect, we trigger rare short pulses. This keeps the UI readable
  // and avoids extra GPU churn while still suggesting a slightly unstable operating system.
  const pulse = () => {
    glitchNode.classList.add("is-glitching");
    document.querySelectorAll(".highlight, .timeline-card").forEach((node) => {
      if (Math.random() > 0.86) node.classList.add("flicker");
      window.setTimeout(() => node.classList.remove("flicker"), 220);
    });

    window.setTimeout(() => {
      glitchNode.classList.remove("is-glitching");
    }, 160);

    const nextPulse = 2200 + Math.random() * 3400;
    window.setTimeout(pulse, nextPulse);
  };

  window.setTimeout(pulse, 1400);
}

setupThemeToggle();
setupRevealObserver();
setupScaleOnScroll();
setupTypeReveal();
setupPointerLineReveal();
setupGlitchPulse();
