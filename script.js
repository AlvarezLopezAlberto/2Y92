const themeToggle = document.querySelector(".theme-toggle");
const themeState = document.querySelector(".theme-toggle__state");
const root = document.body;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

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
