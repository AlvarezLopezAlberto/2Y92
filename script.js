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
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function renderCard({ step, title, body }) {
  return `
    <article class="timeline-card">
      <span class="timeline-card__step type-reveal">${step}</span>
      <h3 class="type-reveal">${title}</h3>
      <p class="type-reveal">${body}</p>
    </article>
  `;
}

function renderTechCard({ tag, title, body }) {
  return `
    <article class="tech-card">
      <span class="tech-card__tag type-reveal">${tag}</span>
      <h3 class="type-reveal">${title}</h3>
      <p class="type-reveal">${body}</p>
    </article>
  `;
}

timelineContainer.innerHTML = timelineData.map(renderCard).join("");
techGrid.innerHTML = techCards.map(renderTechCard).join("");

const typeRevealNodes = [...document.querySelectorAll(".type-reveal")];

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

function setupTypeReveal() {
  typeRevealNodes.forEach((node) => {
    node.dataset.fullText = node.textContent.replace(/\s+/g, " ").trim();
    node.textContent = "";
  });

  if (reducedMotionQuery.matches) {
    typeRevealNodes.forEach((node) => {
      node.textContent = node.dataset.fullText;
    });
    return;
  }

  let ticking = false;

  // Todo el texto obedece a una única línea apuntadora fija del viewport. Lo que queda
  // arriba del apuntador se consolida completo, lo que lo cruza se revela progresivamente
  // y lo que sigue abajo permanece vacío.
  const updateTyping = () => {
    const viewportHeight = window.innerHeight;
    const pointerY = viewportHeight * 0.38;
    const scrollBottom = window.scrollY + window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight;
    const reachedEnd = maxScroll - scrollBottom < 6;

    if (reachedEnd) {
      typeRevealNodes.forEach((node) => {
        node.textContent = node.dataset.fullText || "";
      });
      ticking = false;
      return;
    }

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

        if (reachedEnd || rect.bottom < pointerY) {
          node.textContent = fullText;
        } else if (rect.top > pointerY) {
          node.textContent = "";
        }
      });

      ticking = false;
      return;
    }

    typeRevealNodes.forEach((node, index) => {
      const fullText = node.dataset.fullText || "";
      const rect = node.getBoundingClientRect();

      if (index < activeIndex) {
        node.textContent = fullText;
        return;
      }

      if (index > activeIndex) {
        node.textContent = "";
        return;
      }

      const progress = (pointerY - rect.top) / Math.max(rect.height, 1);
      const clamped = Math.max(0, Math.min(progress, 1));
      const visibleChars = Math.max(0, Math.round(fullText.length * clamped));
      const nextText = fullText.slice(0, visibleChars);

      if (node.textContent !== nextText) {
        node.textContent = nextText;
      }
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

setupThemeToggle();
setupTypeReveal();
