import { defaultPortfolioData } from "../components/defaultPortfolioData";

export const PORTFOLIO_STORAGE_KEY = "luis-otavio-video-portfolio-v3-admin-order";
export const PORTFOLIO_STORAGE_EVENT = "portfolio-data-updated";

function toBoolean(value) {
  return value === true || value === "true";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeMosaicLayout(layout, fallback = null) {
  if (!layout || typeof layout !== "object") return fallback;

  const rawW = Number(layout.w);
  const rawH = Number(layout.h);
  const rawZ = Number(layout.z);
  const w = clamp(Number.isFinite(rawW) ? rawW : 24, 10, 100);
  const h = clamp(Number.isFinite(rawH) ? rawH : 32, 10, 100);
  const maxX = Math.max(0, 100 - w);
  const maxY = Math.max(0, 100 - h);

  return {
    x: clamp(Number(layout.x || 0), 0, maxX),
    y: clamp(Number(layout.y || 0), 0, maxY),
    w,
    h,
    z: Number.isFinite(rawZ) ? rawZ : 0,
  };
}

export function cloneDefaultPortfolioData() {
  return JSON.parse(JSON.stringify(defaultPortfolioData));
}

export function normalizeOrientation(value) {
  const clean = String(value || "horizontal").toLowerCase().trim();
  if (clean.includes("vertical") || clean.includes("9:16") || clean.includes("9x16") || clean.includes("reels") || clean.includes("shorts")) return "vertical";
  if (clean.includes("square") || clean.includes("quadrado") || clean.includes("1:1") || clean.includes("1x1")) return "square";
  return "horizontal";
}

export function normalizeOrder(value, fallback = 999) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeVideo(video, index = 0) {
  const fallback = cloneDefaultPortfolioData().videos[index] || {};
  const source = video && typeof video === "object" ? video : fallback;

  return {
    ...fallback,
    ...source,
    orientation: normalizeOrientation(source.orientation),
    displayOrder: normalizeOrder(source.displayOrder, index + 1),
    isPinned: toBoolean(source.isPinned),
    isHidden: toBoolean(source.isHidden),
    thumbnailSrc: source.thumbnailSrc || "",
    tools: Array.isArray(source.tools) ? source.tools.filter(Boolean) : [],
  };
}

export function normalizeClip(clip, index = 0) {
  const source = clip && typeof clip === "object" ? clip : {};
  return {
    ...source,
    orientation: normalizeOrientation(source.orientation),
    displayOrder: normalizeOrder(source.displayOrder, index + 1),
    isHidden: toBoolean(source.isHidden),
    mosaicLayout: normalizeMosaicLayout(source.mosaicLayout, null),
  };
}

export function sortByPortfolioOrder(items = []) {
  return [...items].sort((a, b) => {
    const pinnedDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
    if (pinnedDiff) return pinnedDiff;
    const orderDiff = normalizeOrder(a.displayOrder) - normalizeOrder(b.displayOrder);
    if (orderDiff) return orderDiff;
    return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
  });
}

export function sortClipsByOrder(items = []) {
  return [...items].sort((a, b) => {
    const orderDiff = normalizeOrder(a.displayOrder) - normalizeOrder(b.displayOrder);
    if (orderDiff) return orderDiff;
    return String(a.title || "").localeCompare(String(b.title || ""), "pt-BR");
  });
}

export function normalizePortfolioData(data) {
  const fallback = cloneDefaultPortfolioData();

  if (!data || typeof data !== "object") return fallback;

  const videos = Array.isArray(data.videos) ? data.videos.map(normalizeVideo) : fallback.videos.map(normalizeVideo);
  const bannerClips = Array.isArray(data.bannerClips) ? data.bannerClips.map(normalizeClip) : fallback.bannerClips.map(normalizeClip);

  return {
    profile: {
      ...fallback.profile,
      ...(data.profile || {}),
    },
    videos,
    bannerClips,
  };
}

export function loadPortfolioData() {
  if (typeof window === "undefined") return cloneDefaultPortfolioData();

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return cloneDefaultPortfolioData();
    return normalizePortfolioData(JSON.parse(raw));
  } catch (error) {
    console.warn("Não foi possível carregar os dados do portfólio.", error);
    return cloneDefaultPortfolioData();
  }
}

export function savePortfolioData(data) {
  if (typeof window === "undefined") return;

  const normalized = normalizePortfolioData(data);
  window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(PORTFOLIO_STORAGE_EVENT, { detail: normalized }));
}

export function resetPortfolioData() {
  if (typeof window === "undefined") return cloneDefaultPortfolioData();

  window.localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  const data = cloneDefaultPortfolioData();
  window.dispatchEvent(new CustomEvent(PORTFOLIO_STORAGE_EVENT, { detail: data }));
  return data;
}

export function subscribePortfolioData(callback) {
  if (typeof window === "undefined") return () => {};

  function handleStorage(event) {
    if (event.key === PORTFOLIO_STORAGE_KEY) callback(loadPortfolioData());
  }

  function handleCustom(event) {
    callback(normalizePortfolioData(event.detail));
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PORTFOLIO_STORAGE_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PORTFOLIO_STORAGE_EVENT, handleCustom);
  };
}

export function createId(prefix = "item") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getYouTubeId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }

    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    const embedIndex = parts.indexOf("embed");
    const shortsIndex = parts.indexOf("shorts");

    if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
    if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];

    return null;
  } catch (error) {
    return null;
  }
}
