const loadingScreen = document.querySelector("#loadingScreen");

const loadingVideo = document.querySelector(".loading-video");

const heroVideo = document.querySelector(".hero-video");

const siteContent = document.querySelector("#siteContent");

const timelineSection = document.querySelector(".timeline-section");

const sanctitySection = document.querySelector(".sanctity-section");

const timelineTrack = document.querySelector(".timeline-track");

const timelineBgImages = document.querySelectorAll(".timeline-bg-image");

const timelineProgressFill = document.querySelector(".timeline-progress-fill");

const timelineProgressPoints = document.querySelector(".timeline-progress-points");

const timelinePrevButton = document.querySelector(".timeline-prev");
const timelineNextButton = document.querySelector(".timeline-next");

const minimumLoadingTime = 1200;

const loadingStartedAt = Date.now();

let loadingHideRequested = false;

let canLoadHeroVideo = false;

let timelineData = [];

let timelinePanels = [];

let timelineVideos = [];

let activeTimelineIndex = 0;

let isTimelineVisible = false;

let activeBgBuffer = 0;

let timelineWheelLocked = false;

let timelineResizeTimeout;

function hideLoadingScreen() {
  if (loadingHideRequested) {
    return;
  }

  loadingHideRequested = true;

  const elapsedTime = Date.now() - loadingStartedAt;

  const remainingTime = Math.max(minimumLoadingTime - elapsedTime, 0);

  window.setTimeout(() => {
    siteContent?.removeAttribute("aria-hidden");

    loadingScreen?.classList.add("is-hidden");

    releaseVideoResources(loadingVideo);

    canLoadHeroVideo = true;
    playVideo(heroVideo);
  }, remainingTime);
}

function loadDeferredVideo(video) {
  if (!video) {
    return;
  }

  video.querySelectorAll("source[data-src]").forEach((source) => {
    if (!source.getAttribute("src")) {
      source.setAttribute("src", source.dataset.src);
    }
  });

  if (!video.currentSrc && video.querySelector("source[src]")) {
    video.load();
  }
}

function releaseVideoResources(video) {
  if (!video) {
    return;
  }

  video.pause();

  video.removeAttribute("src");
  video.querySelectorAll("source").forEach((source) => {
    source.removeAttribute("src");
  });

  video.load();
}

function playVideo(video) {
  if (!video) {
    return;
  }

  if (video === heroVideo && !canLoadHeroVideo) {
    return;
  }

  loadDeferredVideo(video);

  video.play().catch(() => {});
}

function pauseTimelineVideos() {
  timelineVideos.forEach((video) => {
    video.pause();
  });
}

function createOrnateTitle(text, headingLevel = "h3") {
  const title = document.createElement(headingLevel);

  title.className = "ornate-title";

  text.split(" ").forEach((word) => {
    if (!word) {
      return;
    }

    const wordElement = document.createElement("span");

    const initial = document.createElement("span");
    initial.className = "title-initial";
    initial.textContent = word.charAt(0).toUpperCase();

    wordElement.append(initial, word.slice(1).toUpperCase());

    title.append(wordElement);
  });

  return title;
}

function normalizeTimelineIndex(index) {
  if (!timelineData.length) {
    return 0;
  }

  return (index + timelineData.length) % timelineData.length;
}

function ensureTimelineViewport() {
  if (!timelineTrack || timelineTrack.parentElement?.classList.contains("timeline-viewport")) {
    return;
  }

  const viewport = document.createElement("div");
  viewport.className = "timeline-viewport";

  timelineTrack.parentNode.insertBefore(viewport, timelineTrack);

  viewport.append(timelineTrack);
}

function getVideoType(src) {
  if (src.toLowerCase().endsWith(".webm")) {
    return "video/webm";
  }

  return "video/mp4";
}

function loadTimelineVideo(panel) {
  const video = panel.querySelector(".timeline-media");
  const source = video?.querySelector("source");

  if (!video || !source || panel.dataset.videoLoaded === "true") {
    return;
  }

  source.src = panel.dataset.videoSrc;

  source.type = getVideoType(panel.dataset.videoSrc);

  panel.dataset.videoLoaded = "true";

  video.load();
}

function unloadTimelineVideo(panel) {
  const video = panel.querySelector(".timeline-media");
  const source = video?.querySelector("source");

  if (!video || !source || panel.dataset.videoLoaded !== "true") {
    return;
  }

  video.pause();

  source.removeAttribute("src");

  panel.dataset.videoLoaded = "false";

  video.load();
}

function createTimelinePanel(item, index) {
  const panel = document.createElement("article");
  panel.className = "timeline-panel";
  panel.dataset.index = String(index);
  panel.dataset.videoSrc = item.assets.video_card;
  panel.dataset.videoLoaded = "false";

  const poster = document.createElement("img");
  poster.className = "timeline-poster";
  poster.src = item.assets.bg_image || item.assets.video_poster;
  poster.alt = "";

  const video = document.createElement("video");
  video.className = "timeline-media";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";

  const source = document.createElement("source");
  video.append(source);

  const vignette = document.createElement("div");
  vignette.className = "memory-vignette";
  vignette.setAttribute("aria-hidden", "true");

  const event = document.createElement("div");
  event.className = "timeline-event";

  const content = document.createElement("div");
  content.className = "timeline-content";

  const phase = document.createElement("span");
  phase.textContent = item.fase;

  const title = createOrnateTitle(item.titulo, "h3");

  const description = document.createElement("p");
  description.textContent = item.descricao;

  content.append(phase, title, description);

  event.append(content);

  panel.append(poster, video, vignette, event);

  return panel;
}

function renderTimelineProgressPoints() {
  if (!timelineProgressPoints) {
    return;
  }

  timelineProgressPoints.replaceChildren();

  timelineData.forEach((_, index) => {
    const point = document.createElement("span");
    point.className = "timeline-progress-point";
    point.dataset.index = String(index);

    timelineProgressPoints.append(point);
  });
}

function updateTimelineTokens(item) {
  if (!item?.design_tokens) {
    return;
  }

  document.documentElement.style.setProperty("--cor-tema-ativa", item.design_tokens.cor_tema);

  document.documentElement.style.setProperty("--cor-sotaque-ativa", item.design_tokens.cor_sotaque);

  document.documentElement.style.setProperty("--ambient-glow-ativo", item.design_tokens.ambient_glow);
}

function updateTimelineBackground(item) {
  if (!item?.assets?.bg_image || timelineBgImages.length < 2) {
    return;
  }

  const nextBgBuffer = activeBgBuffer === 0 ? 1 : 0;
  const nextImage = timelineBgImages[nextBgBuffer];
  const currentImage = timelineBgImages[activeBgBuffer];

  if (currentImage.getAttribute("src") === item.assets.bg_image) {
    return;
  }

  const activateNextImage = () => {
    nextImage.classList.add("is-active");
    currentImage.classList.remove("is-active");
    activeBgBuffer = nextBgBuffer;
  };

  nextImage.onload = activateNextImage;
  nextImage.src = item.assets.bg_image;

  if (nextImage.complete) {
    activateNextImage();
  }
}

function centerTimelinePanel(panel, animated = true) {
  if (!panel || !timelineTrack) {
    return;
  }

  const viewportWidth = timelineTrack.parentElement?.clientWidth || window.innerWidth;

  const panelCenter = panel.offsetLeft + panel.offsetWidth / 2;

  const translateX = viewportWidth / 2 - panelCenter;

  timelineTrack.style.transition = animated ? "" : "none";

  timelineTrack.style.transform = `translateX(${translateX}px)`;

  if (!animated) {
    window.requestAnimationFrame(() => {
      timelineTrack.style.transition = "";
    });
  }
}

function setActiveTimelineIndex(index, animated = true) {
  if (!timelineData.length || !timelinePanels.length) {
    return;
  }

  activeTimelineIndex = normalizeTimelineIndex(index);

  const activeItem = timelineData[activeTimelineIndex];

  updateTimelineTokens(activeItem);

  updateTimelineBackground(activeItem);

  timelinePanels.forEach((panel, panelIndex) => {
    const directDistance = Math.abs(panelIndex - activeTimelineIndex);
    const loopDistance = timelineData.length - directDistance;
    const distanceFromActive = Math.min(directDistance, loopDistance);

    panel.classList.toggle("is-active", panelIndex === activeTimelineIndex);

    panel.classList.toggle("is-neighbor", distanceFromActive === 1);

    panel.setAttribute("aria-hidden", distanceFromActive > 1 ? "true" : "false");

    if (panelIndex === activeTimelineIndex && isTimelineVisible) {
      loadTimelineVideo(panel);
    } else {
      unloadTimelineVideo(panel);
    }

    const video = panel.querySelector(".timeline-media");
    if (panelIndex !== activeTimelineIndex) {
      video?.pause();
    }
  });

  centerTimelinePanel(timelinePanels[activeTimelineIndex], animated);

  if (timelineProgressFill) {
    const denominator = Math.max(timelineData.length - 1, 1);
    const progress = (activeTimelineIndex / denominator) * 100;
    timelineProgressFill.style.width = `${progress}%`;
  }

  timelineProgressPoints?.querySelectorAll(".timeline-progress-point").forEach((point, pointIndex) => {
    point.classList.toggle("is-active", pointIndex === activeTimelineIndex);
  });

  playActiveTimelineVideo();
}

function playActiveTimelineVideo() {
  if (!isTimelineVisible) {
    pauseTimelineVideos();
    return;
  }

  const activePanel = timelinePanels[activeTimelineIndex];

  if (activePanel) {
    loadTimelineVideo(activePanel);
  }

  const activeVideo = activePanel?.querySelector(".timeline-media");

  pauseTimelineVideos();

  playVideo(activeVideo);
}

function renderTimeline(items) {
  if (!timelineTrack || !items.length) {
    return;
  }

  ensureTimelineViewport();

  timelineTrack.replaceChildren();

  timelinePanels = items.map((item, index) => createTimelinePanel(item, index));

  timelineTrack.append(...timelinePanels);

  timelineVideos = timelinePanels.map((panel) => panel.querySelector(".timeline-media")).filter(Boolean);

  renderTimelineProgressPoints();

  setActiveTimelineIndex(0, false);
}

function revealSanctityFromHash() {
  if (window.location.hash !== "#poderes" || !sanctitySection) {
    return;
  }

  [80, 650, 1400, 2400].forEach((delay) => {
    window.setTimeout(() => {
      window.scrollTo({ top: sanctitySection.offsetTop, behavior: "auto" });
      sanctitySection.classList.add("is-visible");
      sanctitySection.classList.add("is-ready");
    }, delay);
  });
}

async function initializeTimeline() {
  if (!timelineTrack) {
    return;
  }

  try {
    const response = await fetch("data/timeline.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`data/timeline.json retornou ${response.status}`);
    }

    timelineData = await response.json();

    renderTimeline(timelineData);
  } catch (error) {
    console.error("Nao foi possivel carregar a timeline:", error);
  }
}

window.addEventListener("load", hideLoadingScreen);

window.setTimeout(hideLoadingScreen, minimumLoadingTime + 1200);

initializeTimeline();

window.addEventListener("load", revealSanctityFromHash);
window.addEventListener("hashchange", revealSanctityFromHash);

timelineSection?.addEventListener(
  "wheel",
  (event) => {
    if (!event.target.closest(".timeline-panel")) {
      return;
    }

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return;
    }

    event.preventDefault();

    if (timelineWheelLocked) {
      return;
    }

    timelineWheelLocked = true;

    const direction = event.deltaY > 0 ? 1 : -1;

    setActiveTimelineIndex(activeTimelineIndex + direction);

    window.setTimeout(() => {
      timelineWheelLocked = false;
    }, 620);
  },
  { passive: false }
);

timelineTrack?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    setActiveTimelineIndex(activeTimelineIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setActiveTimelineIndex(activeTimelineIndex - 1);
  }
});

timelinePrevButton?.addEventListener("click", () => {
  setActiveTimelineIndex(activeTimelineIndex - 1);
});

timelineNextButton?.addEventListener("click", () => {
  setActiveTimelineIndex(activeTimelineIndex + 1);
});

window.addEventListener("resize", () => {
  window.clearTimeout(timelineResizeTimeout);

  timelineResizeTimeout = window.setTimeout(() => {
    centerTimelinePanel(timelinePanels[activeTimelineIndex], false);
  }, 120);
});

if ("IntersectionObserver" in window) {
  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        playVideo(heroVideo);
        return;
      }

      heroVideo?.pause();
    },
    { threshold: 0.2 }
  );

  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    heroObserver.observe(heroSection);
  }

  const timelineObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isTimelineVisible = true;
        playActiveTimelineVideo();
        return;
      }

      isTimelineVisible = false;
      pauseTimelineVideos();
      timelinePanels.forEach(unloadTimelineVideo);
    },
    { threshold: 0.18 }
  );

  if (timelineSection) {
    timelineObserver.observe(timelineSection);
  }

  const sanctityObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        sanctitySection?.classList.add("is-visible");
      }
    },
    { threshold: 0.28 }
  );

  if (sanctitySection) {
    sanctityObserver.observe(sanctitySection);
  }
} else {
  sanctitySection?.classList.add("is-visible");
}
