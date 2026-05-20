"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalIcon from "../LocalIcon";
import IconSelector from "../IconSelector";
import AdminClipSelector from "../AdminClipSelector";
import { categories, orientations } from "../videoData";
import {
  createId,
  loadPortfolioData,
  normalizeOrder,
  normalizePortfolioData,
  normalizeVideo,
  resetPortfolioData,
  savePortfolioData,
  sortByPortfolioOrder,
  sortClipsByOrder,
  subscribePortfolioData,
} from "../../lib/portfolioStorage";

const PINNED_LIMIT = 6;

const inputSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 52,
    alignItems: "center",
    borderRadius: 1.4,
    background: "rgba(255, 255, 255, 0.035)",
  },
  "& .MuiOutlinedInput-input": {
    py: 1.55,
  },
  "& .MuiSelect-select": {
    minHeight: "26px !important",
    display: "flex",
    alignItems: "center",
    py: "12.5px !important",
  },
  "& .MuiFormHelperText-root": {
    color: "#8F9AAB",
  },
};

const initialVideoForm = {
  title: "",
  client: "",
  category: "Institucional",
  year: new Date().getFullYear().toString(),
  orientation: "horizontal",
  role: "",
  description: "",
  videoSrc: "",
  videoOriginalName: "",
  externalUrl: "",
  thumbnailSrc: "",
  displayOrder: "1",
  isPinned: false,
  isHidden: false,
  tools: ["Premiere", "Edição", "Horizontal 16:9"],
};

function FieldLabel({ children }) {
  return (
    <Typography sx={{ color: "#F2C14E", fontSize: 12.5, fontWeight: 720, lineHeight: 1.1 }}>
      {children}
    </Typography>
  );
}

function Field({ label, children }) {
  return (
    <Stack spacing={0.65} sx={{ minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Stack>
  );
}

function getVideoSrcFromVideo(video) {
  if (video.videoSrc) return video.videoSrc;
  if (video.src) return video.src;
  return "";
}

function getExternalUrlFromVideo(video) {
  if (video.externalUrl) return video.externalUrl;
  if (video.youtubeUrl) return video.youtubeUrl;
  if (video.youtubeId) return `https://www.youtube.com/watch?v=${video.youtubeId}`;
  return "";
}

function getMaxOrder(items = []) {
  return items.reduce((max, item, index) => Math.max(max, normalizeOrder(item.displayOrder, index + 1)), 0);
}

const MAX_MOSAIC_CLIPS = 7;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeClipOrientation(value) {
  const orientation = String(value || "horizontal").toLowerCase();

  if (orientation.includes("vertical") || orientation.includes("9:16") || orientation.includes("9x16")) {
    return "vertical";
  }

  if (orientation.includes("square") || orientation.includes("quadrado") || orientation.includes("1:1") || orientation.includes("1x1")) {
    return "square";
  }

  return "horizontal";
}

function getDefaultMosaicLayout(clip, index) {
  const orientation = normalizeClipOrientation(clip?.orientation);

  if (index === 0) return { x: 0, y: 0, w: 50, h: 42 };

  if (orientation === "vertical") {
    const verticalLayouts = [
      { x: 52, y: 0, w: 16, h: 62 },
      { x: 0, y: 44, w: 17, h: 52 },
      { x: 82, y: 30, w: 16, h: 64 },
      { x: 18, y: 44, w: 17, h: 52 },
    ];
    return verticalLayouts[index % verticalLayouts.length];
  }

  if (orientation === "square") {
    const squareLayouts = [
      { x: 69, y: 0, w: 29, h: 34 },
      { x: 19, y: 45, w: 23, h: 34 },
      { x: 44, y: 60, w: 25, h: 34 },
    ];
    return squareLayouts[index % squareLayouts.length];
  }

  const horizontalLayouts = [
    { x: 69, y: 0, w: 29, h: 34 },
    { x: 38, y: 64, w: 31, h: 30 },
    { x: 70, y: 36, w: 28, h: 26 },
    { x: 45, y: 43, w: 32, h: 29 },
    { x: 0, y: 58, w: 38, h: 36 },
  ];

  return horizontalLayouts[index % horizontalLayouts.length];
}

function normalizeMosaicLayout(layout, fallback) {
  const source = layout && typeof layout === "object" ? layout : fallback;
  const rawW = Number(source?.w);
  const rawH = Number(source?.h);
  const rawZ = Number(source?.z ?? source?.layer ?? fallback?.z ?? 1);
  const w = clamp(Number.isFinite(rawW) ? rawW : fallback.w, 10, 100);
  const h = clamp(Number.isFinite(rawH) ? rawH : fallback.h, 10, 100);
  const maxX = Math.max(0, 100 - w);
  const maxY = Math.max(0, 100 - h);

  return {
    x: clamp(Number(source?.x ?? fallback.x), 0, maxX),
    y: clamp(Number(source?.y ?? fallback.y), 0, maxY),
    w,
    h,
    z: Number.isFinite(rawZ) ? clamp(rawZ, 0, 999) : 1,
  };
}

function getClipLayout(clip, index) {
  return normalizeMosaicLayout(clip?.mosaicLayout, { ...getDefaultMosaicLayout(clip, index), z: index + 1 });
}

function getClipSizeLabel(clip) {
  const orientation = normalizeClipOrientation(clip?.orientation);
  if (orientation === "vertical") return "Vertical";
  if (orientation === "square") return "Quadrado";
  return "Horizontal";
}

function MosaicLayoutEditor({ clips = [], onUpdateClipLayout, onResetMosaicLayouts, onUpdateClipLayer }) {
  const containerRef = useRef(null);
  const [draftLayouts, setDraftLayouts] = useState({});
  const [interactionState, setInteractionState] = useState(null);
  const [activeGuides, setActiveGuides] = useState({ vertical: [], horizontal: [] });

  const visibleClips = useMemo(
    () => sortClipsByOrder((clips || []).filter((clip) => clip?.src && !clip?.isHidden)).slice(0, MAX_MOSAIC_CLIPS),
    [clips]
  );

  function readLayout(clip, index) {
    return draftLayouts[clip.id] || getClipLayout(clip, index);
  }

  function getOtherLayouts(activeClipId) {
    return visibleClips
      .map((clip, index) => ({ clip, layout: readLayout(clip, index) }))
      .filter((item) => item.clip?.id !== activeClipId);
  }

  function getSnapGuides(activeClipId) {
    const others = getOtherLayouts(activeClipId);
    const vertical = [0, 50, 100];
    const horizontal = [0, 50, 100];

    others.forEach(({ layout }) => {
      vertical.push(layout.x, layout.x + layout.w / 2, layout.x + layout.w);
      horizontal.push(layout.y, layout.y + layout.h / 2, layout.y + layout.h);
    });

    return {
      vertical: [...new Set(vertical.map((value) => Number(value.toFixed(2))))],
      horizontal: [...new Set(horizontal.map((value) => Number(value.toFixed(2))))],
    };
  }

  function findClosestGuide(value, guides, threshold = 2.15) {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    guides.forEach((guide) => {
      const distance = Math.abs(value - guide);
      if (distance <= threshold && distance < closestDistance) {
        closest = guide;
        closestDistance = distance;
      }
    });

    return closest;
  }

  function applySnap(rawLayout, state) {
    const guideSource = getSnapGuides(state.clipId);
    const next = { ...rawLayout };
    const activeGuides = { vertical: [], horizontal: [] };
    const thresholdX = Math.max(1.45, (12 / Math.max(state.rect?.width || 1, 1)) * 100);
    const thresholdY = Math.max(1.45, (12 / Math.max(state.rect?.height || 1, 1)) * 100);

    function addVerticalGuide(guide) {
      activeGuides.vertical.push(Number(guide.toFixed(2)));
    }

    function addHorizontalGuide(guide) {
      activeGuides.horizontal.push(Number(guide.toFixed(2)));
    }

    if (state.mode === "resize") {
      const minW = 10;
      const minH = 10;
      const right = next.x + next.w;
      const bottom = next.y + next.h;

      if (state.handle.includes("w")) {
        const guide = findClosestGuide(next.x, guideSource.vertical, thresholdX);
        if (guide !== null) {
          next.w = clamp(right - guide, minW, 100);
          next.x = clamp(guide, 0, 100 - next.w);
          addVerticalGuide(guide);
        }
      }

      if (state.handle.includes("e")) {
        const guide = findClosestGuide(next.x + next.w, guideSource.vertical, thresholdX);
        if (guide !== null) {
          next.w = clamp(guide - next.x, minW, 100 - next.x);
          addVerticalGuide(guide);
        }
      }

      if (state.handle.includes("n")) {
        const guide = findClosestGuide(next.y, guideSource.horizontal, thresholdY);
        if (guide !== null) {
          next.h = clamp(bottom - guide, minH, 100);
          next.y = clamp(guide, 0, 100 - next.h);
          addHorizontalGuide(guide);
        }
      }

      if (state.handle.includes("s")) {
        const guide = findClosestGuide(next.y + next.h, guideSource.horizontal, thresholdY);
        if (guide !== null) {
          next.h = clamp(guide - next.y, minH, 100 - next.y);
          addHorizontalGuide(guide);
        }
      }
    } else {
      const xCandidates = [
        { value: next.x, apply: (guide) => { next.x = guide; } },
        { value: next.x + next.w / 2, apply: (guide) => { next.x = guide - next.w / 2; } },
        { value: next.x + next.w, apply: (guide) => { next.x = guide - next.w; } },
      ];

      const yCandidates = [
        { value: next.y, apply: (guide) => { next.y = guide; } },
        { value: next.y + next.h / 2, apply: (guide) => { next.y = guide - next.h / 2; } },
        { value: next.y + next.h, apply: (guide) => { next.y = guide - next.h; } },
      ];

      for (const candidate of xCandidates) {
        const guide = findClosestGuide(candidate.value, guideSource.vertical, thresholdX);
        if (guide !== null) {
          candidate.apply(guide);
          addVerticalGuide(guide);
          break;
        }
      }

      for (const candidate of yCandidates) {
        const guide = findClosestGuide(candidate.value, guideSource.horizontal, thresholdY);
        if (guide !== null) {
          candidate.apply(guide);
          addHorizontalGuide(guide);
          break;
        }
      }
    }

    next.w = clamp(next.w, 10, 100);
    next.h = clamp(next.h, 10, 100);
    next.x = clamp(next.x, 0, 100 - next.w);
    next.y = clamp(next.y, 0, 100 - next.h);

    return {
      layout: {
        x: Number(next.x.toFixed(2)),
        y: Number(next.y.toFixed(2)),
        w: Number(next.w.toFixed(2)),
        h: Number(next.h.toFixed(2)),
        z: Number.isFinite(Number(next.z)) ? Number(next.z) : Number(state.initialLayout?.z || 1),
      },
      guides: {
        vertical: [...new Set(activeGuides.vertical)],
        horizontal: [...new Set(activeGuides.horizontal)],
      },
    };
  }

  function calculateRawNextLayout(event, state = interactionState) {
    if (!state) return null;

    const deltaX = ((event.clientX - state.startX) / state.rect.width) * 100;
    const deltaY = ((event.clientY - state.startY) / state.rect.height) * 100;
    const initial = state.initialLayout;

    if (state.mode === "resize") {
      const minW = 10;
      const minH = 10;
      let nextX = initial.x;
      let nextY = initial.y;
      let nextW = initial.w;
      let nextH = initial.h;

      if (state.handle.includes("e")) {
        nextW = clamp(initial.w + deltaX, minW, 100 - initial.x);
      }

      if (state.handle.includes("s")) {
        nextH = clamp(initial.h + deltaY, minH, 100 - initial.y);
      }

      if (state.handle.includes("w")) {
        const maxDelta = initial.w - minW;
        const clampedDelta = clamp(deltaX, -initial.x, maxDelta);
        nextX = initial.x + clampedDelta;
        nextW = initial.w - clampedDelta;
      }

      if (state.handle.includes("n")) {
        const maxDelta = initial.h - minH;
        const clampedDelta = clamp(deltaY, -initial.y, maxDelta);
        nextY = initial.y + clampedDelta;
        nextH = initial.h - clampedDelta;
      }

      if (event.shiftKey) {
        const ratio = initial.w / Math.max(initial.h, 1);
        const widthChanged = state.handle.includes("e") || state.handle.includes("w");
        const heightChanged = state.handle.includes("n") || state.handle.includes("s");

        if (widthChanged && !heightChanged) {
          const proportionalH = clamp(nextW / ratio, minH, 100);
          const centerY = initial.y + initial.h / 2;
          nextH = proportionalH;
          nextY = clamp(centerY - nextH / 2, 0, 100 - nextH);
        } else if (heightChanged && !widthChanged) {
          const proportionalW = clamp(nextH * ratio, minW, 100);
          const centerX = initial.x + initial.w / 2;
          nextW = proportionalW;
          nextX = clamp(centerX - nextW / 2, 0, 100 - nextW);
        } else if (widthChanged && heightChanged) {
          const widthDrivenH = nextW / ratio;
          const heightDrivenW = nextH * ratio;
          const useWidth = Math.abs(nextW - initial.w) >= Math.abs(nextH - initial.h);

          if (useWidth) {
            nextH = clamp(widthDrivenH, minH, 100);
          } else {
            nextW = clamp(heightDrivenW, minW, 100);
          }

          if (state.handle.includes("w")) nextX = initial.x + initial.w - nextW;
          if (state.handle.includes("n")) nextY = initial.y + initial.h - nextH;
        }
      }

      nextW = clamp(nextW, minW, 100);
      nextH = clamp(nextH, minH, 100);
      nextX = clamp(nextX, 0, 100 - nextW);
      nextY = clamp(nextY, 0, 100 - nextH);

      return {
        x: Number(nextX.toFixed(2)),
        y: Number(nextY.toFixed(2)),
        w: Number(nextW.toFixed(2)),
        h: Number(nextH.toFixed(2)),
        z: Number.isFinite(Number(initial.z)) ? Number(initial.z) : 1,
      };
    }

    const nextX = clamp(initial.x + deltaX, 0, 100 - initial.w);
    const nextY = clamp(initial.y + deltaY, 0, 100 - initial.h);

    return {
      ...initial,
      x: Number(nextX.toFixed(2)),
      y: Number(nextY.toFixed(2)),
    };
  }

  function calculateNextLayout(event, state = interactionState) {
    const rawLayout = calculateRawNextLayout(event, state);
    if (!rawLayout || !state) return null;

    if (event.altKey) {
      return { layout: rawLayout, guides: { vertical: [], horizontal: [] } };
    }

    return applySnap(rawLayout, state);
  }

  function beginInteraction(event, clip, index, mode = "move", handle = "") {
    if (event.button !== 0) return;

    const container = containerRef.current;
    if (!container) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = container.getBoundingClientRect();
    const initialLayout = readLayout(clip, index);
    container.setPointerCapture?.(event.pointerId);

    setInteractionState({
      mode,
      handle,
      clipId: clip.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect,
      initialLayout,
    });
  }

  function handlePointerMove(event) {
    if (!interactionState) return;

    const result = calculateNextLayout(event);
    if (!result) return;

    setDraftLayouts((current) => ({
      ...current,
      [interactionState.clipId]: result.layout,
    }));
    setActiveGuides(result.guides);
  }

  function finishInteraction(event) {
    if (!interactionState) return;

    const result = calculateNextLayout(event);
    if (result?.layout) onUpdateClipLayout?.(interactionState.clipId, result.layout);

    containerRef.current?.releasePointerCapture?.(interactionState.pointerId);
    setDraftLayouts((current) => {
      const next = { ...current };
      delete next[interactionState.clipId];
      return next;
    });
    setInteractionState(null);
    setActiveGuides({ vertical: [], horizontal: [] });
  }

  function resizeHandleSx(handle) {
    const base = {
      position: "absolute",
      zIndex: 6,
      border: "1px solid rgba(8,10,15,0.72)",
      background: "#F2C14E",
      boxShadow: "0 0 0 1px rgba(242,193,78,0.34), 0 8px 22px rgba(0,0,0,0.34)",
      "&:hover": {
        background: "#FFD45A",
      },
    };

    const size = 14;
    const offset = -7;

    const positions = {
      n: { top: offset, left: "50%", width: 34, height: 10, transform: "translateX(-50%)", cursor: "ns-resize", borderRadius: 999 },
      s: { bottom: offset, left: "50%", width: 34, height: 10, transform: "translateX(-50%)", cursor: "ns-resize", borderRadius: 999 },
      e: { right: offset, top: "50%", width: 10, height: 34, transform: "translateY(-50%)", cursor: "ew-resize", borderRadius: 999 },
      w: { left: offset, top: "50%", width: 10, height: 34, transform: "translateY(-50%)", cursor: "ew-resize", borderRadius: 999 },
      ne: { top: offset, right: offset, width: size, height: size, cursor: "nesw-resize", borderRadius: 0.8 },
      nw: { top: offset, left: offset, width: size, height: size, cursor: "nwse-resize", borderRadius: 0.8 },
      se: { bottom: offset, right: offset, width: size, height: size, cursor: "nwse-resize", borderRadius: 0.8 },
      sw: { bottom: offset, left: offset, width: size, height: size, cursor: "nesw-resize", borderRadius: 0.8 },
    };

    return { ...base, ...positions[handle] };
  }

  if (!visibleClips.length) {
    return (
      <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)" }}>
        <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>Organizar mosaico do banner</Typography>
        <Typography sx={{ mt: 0.7, color: "#8F9AAB", lineHeight: 1.55, fontSize: 13.5 }}>
          Gere pelo menos um trecho do banner para organizar os blocos aqui.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)" }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
          <Box>
            <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>Organizar mosaico do banner</Typography>
            <Typography sx={{ mt: 0.45, color: "#8F9AAB", lineHeight: 1.55, fontSize: 13.5 }}>
Arraste os blocos para reposicionar. Use os pontos amarelos para ajustar largura e altura. Guias aparecem quando o bloco alinha com outro; segure Shift para redimensionar preservando proporção e Alt para mover/redimensionar sem encaixe.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={onResetMosaicLayouts} sx={{ color: "#F2C14E", flexShrink: 0 }}>
            Restaurar layout automático
          </Button>
        </Stack>

        <Box
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={finishInteraction}
          onPointerCancel={finishInteraction}
          sx={{
            position: "relative",
            height: { xs: 440, md: 560 },
            overflow: "hidden",
            borderRadius: 2,
            border: "1px dashed rgba(242,193,78,0.28)",
            background:
              "linear-gradient(135deg, rgba(8,10,15,0.94), rgba(17,20,28,0.94)), repeating-linear-gradient(90deg, rgba(255,255,255,0.045) 0 1px, transparent 1px 8.33%), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 10%)",
            touchAction: "none",
            userSelect: "none",
          }}
        >
          {activeGuides.vertical.map((guide) => (
            <Box
              key={`vertical-guide-${guide}`}
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${guide}%`,
                width: 0,
                borderLeft: "2px solid rgba(56,189,248,0.98)",
                boxShadow: "0 0 0 1px rgba(56,189,248,0.18)",
                pointerEvents: "none",
                zIndex: 2000,
              }}
            />
          ))}

          {activeGuides.horizontal.map((guide) => (
            <Box
              key={`horizontal-guide-${guide}`}
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${guide}%`,
                height: 0,
                borderTop: "2px solid rgba(56,189,248,0.98)",
                boxShadow: "0 0 0 1px rgba(56,189,248,0.18)",
                pointerEvents: "none",
                zIndex: 2000,
              }}
            />
          ))}

          {visibleClips.map((clip, index) => {
            const layout = readLayout(clip, index);
            const isActive = interactionState?.clipId === clip.id;

            return (
              <Box
                key={clip.id || clip.src}
                onPointerDown={(event) => beginInteraction(event, clip, index, "move")}
                sx={{
                  position: "absolute",
                  left: `${layout.x}%`,
                  top: `${layout.y}%`,
                  width: `${layout.w}%`,
                  height: `${layout.h}%`,
                  overflow: "visible",
                  borderRadius: 1.4,
                  border: isActive ? "2px solid #F2C14E" : "1px solid rgba(242,193,78,0.28)",
                  background: "#05070B",
                  boxShadow: isActive ? "0 20px 70px rgba(0,0,0,0.52)" : "0 10px 36px rgba(0,0,0,0.28)",
                  cursor: isActive && interactionState?.mode === "move" ? "grabbing" : "grab",
                  zIndex: isActive ? 1000 : 10 + Number(layout.z ?? index + 1),
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    borderRadius: 1.25,
                    background: "#05070B",
                  }}
                >
                  <Box
                    component="video"
                    src={clip.src}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: 0.82,
                      pointerEvents: "none",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.42))",
                      pointerEvents: "none",
                    }}
                  />
                  <Stack
                    spacing={0.35}
                    sx={{
                      position: "absolute",
                      left: 10,
                      right: 10,
                      bottom: 8,
                      pointerEvents: "none",
                    }}
                  >
                    <Typography sx={{ color: "#F5F7FA", fontWeight: 780, fontSize: 12, lineHeight: 1.15 }} noWrap>
                      {clip.title || "Trecho do banner"}
                    </Typography>
                    <Typography sx={{ color: "#F2C14E", fontWeight: 760, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {getClipSizeLabel(clip)} • Ordem {clip.displayOrder || index + 1} • {Math.round(layout.w)}×{Math.round(layout.h)}%
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={0.45}
                    onPointerDown={(event) => event.stopPropagation()}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 12,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      maxWidth: "calc(100% - 16px)",
                    }}
                  >
                    {[
                      ["back", "Trás"],
                      ["down", "−"],
                      ["up", "+"],
                      ["front", "Frente"],
                    ].map(([action, label]) => (
                      <Button
                        key={action}
                        size="small"
                        variant="contained"
                        onClick={(event) => {
                          event.stopPropagation();
                          onUpdateClipLayer?.(clip.id, action);
                        }}
                        sx={{
                          minWidth: 0,
                          px: 0.8,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: "#080A0F",
                          background: "rgba(242,193,78,0.92)",
                          "&:hover": { background: "#FFD45A" },
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                {["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((handle) => (
                  <Box
                    key={handle}
                    aria-label={`Redimensionar ${clip.title || "trecho"}`}
                    role="button"
                    tabIndex={-1}
                    onPointerDown={(event) => beginInteraction(event, clip, index, "resize", handle)}
                    sx={resizeHandleSx(handle)}
                  />
                ))}
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function AdminDashboard({ embedded = false }) {
  const videoPreviewRef = useRef(null);
  const videoFormSectionRef = useRef(null);
  const clipFormSectionRef = useRef(null);
  const [data, setData] = useState(() => loadPortfolioData());
  const [videoForm, setVideoForm] = useState(() => ({ ...initialVideoForm }));
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [message, setMessage] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [editingClipId, setEditingClipId] = useState(null);

  useEffect(() => {
    setData(loadPortfolioData());
    return subscribePortfolioData((nextData) => setData(nextData));
  }, []);

  const sortedVideos = useMemo(() => sortByPortfolioOrder(data.videos || []), [data.videos]);
  const sortedClips = useMemo(() => sortClipsByOrder(data.bannerClips || []), [data.bannerClips]);
  const nextVideoOrder = useMemo(() => getMaxOrder(data.videos || []) + 1, [data.videos]);
  const nextClipOrder = useMemo(() => getMaxOrder(data.bannerClips || []) + 1, [data.bannerClips]);
  const pinnedCount = useMemo(() => (data.videos || []).filter((video) => video.isPinned).length, [data.videos]);
  const editingClip = useMemo(() => sortedClips.find((clip) => clip.id === editingClipId) || null, [editingClipId, sortedClips]);

  useEffect(() => {
    if (!editingVideoId) {
      setVideoForm((current) => ({ ...current, displayOrder: String(nextVideoOrder) }));
    }
  }, [editingVideoId, nextVideoOrder]);

  function scrollToSection(ref) {
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function updateData(nextData, successMessage) {
    const normalized = normalizePortfolioData(nextData);
    setData(normalized);
    savePortfolioData(normalized);
    if (successMessage) setMessage(successMessage);
  }

  function updateProfileField(field, value) {
    updateData(
      {
        ...data,
        profile: {
          ...data.profile,
          [field]: value,
        },
      },
      "Apresentação atualizada."
    );
  }

  function updateHighlightPills(value) {
    updateData(
      {
        ...data,
        profile: {
          ...data.profile,
          highlightPills: value,
        },
      },
      "Destaques atualizados."
    );
  }

  function handleVideoField(field, value) {
    setVideoForm((current) => ({ ...current, [field]: value }));
  }

  function resetVideoForm() {
    setVideoForm({ ...initialVideoForm, displayOrder: String(nextVideoOrder) });
    setEditingVideoId(null);
  }

  async function handleUploadVideo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMessage("Escolha um arquivo de vídeo.");
      return;
    }

    setIsUploadingVideo(true);
    setMessage("Enviando e comprimindo o vídeo completo com FFmpeg. Aguarde...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", videoForm.title || file.name);
      formData.append("orientation", videoForm.orientation || "horizontal");

      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível subir o vídeo.");
      }

      setVideoForm((current) => ({
        ...current,
        videoSrc: result.src,
        videoOriginalName: file.name,
        thumbnailSrc: "",
      }));
      setMessage(`Vídeo enviado e salvo em ${result.src}.`);
    } catch (error) {
      setMessage(`Não consegui subir/comprimir esse vídeo. Detalhe: ${error.message}`);
    } finally {
      setIsUploadingVideo(false);
    }
  }

  async function handleGenerateThumbnail() {
    if (!videoForm.videoSrc) {
      setMessage("Suba um MP4 antes de selecionar um frame de capa.");
      return;
    }

    const time = Number(videoPreviewRef.current?.currentTime || 0);
    setIsGeneratingThumbnail(true);
    setMessage(`Gerando capa a partir do frame em ${time.toFixed(1)}s...`);

    try {
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSrc: videoForm.videoSrc,
          title: videoForm.title || videoForm.videoOriginalName || "capa",
          time,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Não foi possível gerar a capa.");

      setVideoForm((current) => ({ ...current, thumbnailSrc: result.src }));
      setMessage(`Capa gerada e definida para este card: ${result.src}`);
    } catch (error) {
      setMessage(`Não consegui gerar a capa. Detalhe: ${error.message}`);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  }

  function canPinVideo(nextPinnedValue) {
    if (!nextPinnedValue) return true;
    const alreadyPinned = editingVideoId
      ? (data.videos || []).some((video) => video.id === editingVideoId && video.isPinned)
      : false;
    return alreadyPinned || pinnedCount < PINNED_LIMIT;
  }

  function handleSubmitVideo(event) {
    event.preventDefault();

    if (!videoForm.videoSrc.trim()) {
      setMessage("Suba um MP4 do projeto antes de salvar o vídeo na lista de projetos.");
      return;
    }

    if (!canPinVideo(Boolean(videoForm.isPinned))) {
      setMessage(`Você só pode fixar até ${PINNED_LIMIT} projetos na seleção inicial.`);
      return;
    }

    const tools = Array.isArray(videoForm.tools) ? videoForm.tools.filter(Boolean) : [];
    const videoToSave = normalizeVideo({
      id: editingVideoId || createId("video"),
      title: videoForm.title.trim() || "Novo projeto audiovisual",
      client: videoForm.client.trim() || "Projeto audiovisual",
      category: videoForm.category || "Outro",
      year: videoForm.year.trim() || new Date().getFullYear().toString(),
      orientation: videoForm.orientation || "horizontal",
      role: videoForm.role.trim() || "Função a definir",
      description:
        videoForm.description.trim() ||
        "Descrição curta do projeto, destacando objetivo, contexto e sua participação na produção.",
      videoSrc: videoForm.videoSrc.trim(),
      videoOriginalName: videoForm.videoOriginalName || "",
      externalUrl: videoForm.externalUrl.trim(),
      thumbnailSrc: videoForm.thumbnailSrc || "",
      displayOrder: normalizeOrder(videoForm.displayOrder, nextVideoOrder),
      isPinned: Boolean(videoForm.isPinned),
      isHidden: Boolean(videoForm.isHidden),
      tools: tools.length ? tools : ["Premiere", "Edição"],
    });

    const nextVideos = editingVideoId
      ? (data.videos || []).map((video) => (video.id === editingVideoId ? videoToSave : video))
      : [videoToSave, ...(data.videos || [])];

    updateData({ ...data, videos: nextVideos }, editingVideoId ? "Projeto atualizado." : "Projeto adicionado.");
    resetVideoForm();
  }

  function handleEditVideo(video) {
    setEditingVideoId(video.id);
    setVideoForm({
      title: video.title || "",
      client: video.client || "",
      category: video.category || "Outro",
      year: video.year || "",
      orientation: video.orientation || "horizontal",
      role: video.role || "",
      description: video.description || "",
      videoSrc: getVideoSrcFromVideo(video),
      videoOriginalName: video.videoOriginalName || "",
      externalUrl: getExternalUrlFromVideo(video),
      thumbnailSrc: video.thumbnailSrc || "",
      displayOrder: String(video.displayOrder || ""),
      isPinned: Boolean(video.isPinned),
      isHidden: Boolean(video.isHidden),
      tools: Array.isArray(video.tools) ? video.tools : [],
    });
    setMessage("Editando projeto selecionado.");
    scrollToSection(videoFormSectionRef);
  }

  function handleDeleteVideo(videoId) {
    const nextVideos = (data.videos || []).filter((video) => video.id !== videoId);
    updateData({ ...data, videos: nextVideos }, "Projeto removido.");

    if (editingVideoId === videoId) resetVideoForm();
  }

  function handleToggleVideoHidden(videoId) {
    const nextVideos = (data.videos || []).map((video) =>
      video.id === videoId ? { ...video, isHidden: !video.isHidden } : video
    );
    updateData({ ...data, videos: nextVideos }, "Visibilidade do projeto atualizada.");
  }

  function handleUpdateVideoOrder(videoId, value) {
    const nextVideos = (data.videos || []).map((video) =>
      video.id === videoId ? { ...video, displayOrder: normalizeOrder(value, video.displayOrder) } : video
    );
    updateData({ ...data, videos: nextVideos }, "Ordem do projeto atualizada.");
  }

  function handleToggleVideoPinned(videoId) {
    const target = (data.videos || []).find((video) => video.id === videoId);
    if (!target) return;
    const nextPinned = !target.isPinned;

    if (nextPinned && pinnedCount >= PINNED_LIMIT) {
      setMessage(`Você só pode fixar até ${PINNED_LIMIT} projetos na seleção inicial.`);
      return;
    }

    const nextVideos = (data.videos || []).map((video) =>
      video.id === videoId ? { ...video, isPinned: nextPinned } : video
    );
    updateData({ ...data, videos: nextVideos }, nextPinned ? "Projeto fixado na seleção inicial." : "Projeto removido dos fixos.");
  }

  function handleAddBannerClip(clip) {
    const nextClips = [clip, ...(data.bannerClips || [])];
    updateData({ ...data, bannerClips: nextClips }, "Trecho adicionado ao banner mosaico.");
  }

  function handleEditBannerClip(clipId) {
    setEditingClipId(clipId);
    setMessage("Editando trecho do banner mosaico.");
    scrollToSection(clipFormSectionRef);
  }

  function handleCancelEditBannerClip() {
    setEditingClipId(null);
    setMessage("Edição do trecho cancelada.");
  }

  function handleUpdateBannerClip(clipId, nextClip) {
    const nextClips = (data.bannerClips || []).map((clip) =>
      clip.id === clipId ? { ...clip, ...nextClip, id: clipId } : clip
    );
    updateData({ ...data, bannerClips: nextClips }, "Trecho do banner atualizado.");
    setEditingClipId(null);
  }

  function handleDeleteBannerClip(clipId) {
    const nextClips = (data.bannerClips || []).filter((clip) => clip.id !== clipId);
    updateData({ ...data, bannerClips: nextClips }, "Trecho removido do banner.");
    if (editingClipId === clipId) setEditingClipId(null);
  }

  function handleToggleClipHidden(clipId) {
    const nextClips = (data.bannerClips || []).map((clip) =>
      clip.id === clipId ? { ...clip, isHidden: !clip.isHidden } : clip
    );
    updateData({ ...data, bannerClips: nextClips }, "Visibilidade do trecho atualizada.");
  }

  function handleUpdateClipOrder(clipId, value) {
    const nextClips = (data.bannerClips || []).map((clip) =>
      clip.id === clipId ? { ...clip, displayOrder: normalizeOrder(value, clip.displayOrder) } : clip
    );
    updateData({ ...data, bannerClips: nextClips }, "Ordem do trecho atualizada.");
  }

  function handleUpdateClipLayout(clipId, mosaicLayout) {
    const nextClips = (data.bannerClips || []).map((clip) =>
      clip.id === clipId ? { ...clip, mosaicLayout } : clip
    );
    updateData({ ...data, bannerClips: nextClips }, "Posição do trecho no mosaico atualizada.");
  }

  function handleUpdateClipLayer(clipId, action) {
    const clips = data.bannerClips || [];
    const currentIndex = clips.findIndex((clip) => clip.id === clipId);
    if (currentIndex < 0) return;

    const layeredClips = clips
      .map((clip, index) => {
        const layout = getClipLayout(clip, index);
        const rawLayer = Number(layout.z ?? index + 1);

        return {
          clip,
          index,
          layout,
          layer: Number.isFinite(rawLayer) ? rawLayer : index + 1,
        };
      })
      .sort((a, b) => {
        if (a.layer !== b.layer) return a.layer - b.layer;
        return a.index - b.index;
      });

    const selectedPosition = layeredClips.findIndex((item) => item.clip.id === clipId);
    if (selectedPosition < 0) return;

    const [selectedItem] = layeredClips.splice(selectedPosition, 1);

    if (action === "back") {
      layeredClips.unshift(selectedItem);
    } else if (action === "front") {
      layeredClips.push(selectedItem);
    } else if (action === "down") {
      const nextPosition = Math.max(0, selectedPosition - 1);
      layeredClips.splice(nextPosition, 0, selectedItem);
    } else if (action === "up") {
      const nextPosition = Math.min(layeredClips.length, selectedPosition + 1);
      layeredClips.splice(nextPosition, 0, selectedItem);
    } else {
      layeredClips.splice(selectedPosition, 0, selectedItem);
    }

    const nextLayerById = new Map(
      layeredClips.map((item, layerIndex) => [item.clip.id, layerIndex + 1])
    );

    const nextClips = clips.map((clip, index) => {
      const layout = getClipLayout(clip, index);
      const nextLayer = nextLayerById.get(clip.id) ?? Number(layout.z ?? index + 1);

      return {
        ...clip,
        mosaicLayout: {
          ...layout,
          z: nextLayer,
        },
      };
    });

    updateData({ ...data, bannerClips: nextClips }, "Camada do trecho no mosaico atualizada.");
  }

  function handleResetMosaicLayouts() {
    const nextClips = (data.bannerClips || []).map((clip) => {
      const { mosaicLayout, ...rest } = clip;
      return rest;
    });
    updateData({ ...data, bannerClips: nextClips }, "Layout automático do mosaico restaurado.");
  }

  function handleExportJson() {
    const json = JSON.stringify(data, null, 2);
    setJsonText(json);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio-luis-otavio-dados.json";
    link.click();
    URL.revokeObjectURL(url);

    setMessage("JSON exportado. Guarde esse arquivo como backup dos seus dados.");
  }

  function handleImportJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const normalized = normalizePortfolioData(parsed);
        updateData(normalized, "JSON importado com sucesso.");
      } catch (error) {
        setMessage("Não consegui importar esse JSON. Confere se o arquivo está correto.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleResetData() {
    const nextData = resetPortfolioData();
    setData(nextData);
    setMessage("Dados restaurados para o exemplo inicial.");
  }

  return (
    <Box id="editar" sx={{ scrollMarginTop: 24 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 2.8 },
          borderRadius: 2,
          background: embedded ? "rgba(17, 20, 28, 0.76)" : "rgba(17, 20, 28, 0.86)",
          border: "1px dashed rgba(217, 229, 244, 0.24)",
        }}
      >
        <Stack spacing={2.6}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
          >
            <Stack spacing={0.8}>
              <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 24 }}>
                Painel administrativo
              </Typography>
              <Typography sx={{ color: "#8F9AAB", lineHeight: 1.65, fontSize: 14, maxWidth: 900 }}>
                Use este painel para montar seus projetos, definir ordem de aparecimento, ocultar itens, fixar até seis projetos na seleção inicial e gerar trechos de 10 segundos para o banner.
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {!embedded ? (
                <Button variant="outlined" href="/" sx={{ color: "#F2C14E" }}>
                  Ver portfólio
                </Button>
              ) : null}
              <Button variant="outlined" startIcon={<LocalIcon glyph="↓" />} onClick={handleExportJson} sx={{ color: "#F2C14E" }}>
                Exportar JSON
              </Button>
              <Button variant="outlined" component="label" startIcon={<LocalIcon glyph="↑" />} sx={{ color: "#F2C14E" }}>
                Importar JSON
                <input hidden type="file" accept="application/json" onChange={handleImportJson} />
              </Button>
            </Stack>
          </Stack>

          {message ? <Alert severity="info" sx={{ borderRadius: 1.4 }}>{message}</Alert> : null}

          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)" }}>
            <Stack spacing={1.8}>
              <Stack spacing={0.45}>
                <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>Apresentação pública</Typography>
                <Typography sx={{ color: "#8F9AAB", lineHeight: 1.55, fontSize: 13.5 }}>Esses textos aparecem na seção com a sua foto.</Typography>
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.45 }}>
                <Field label="Nome"><TextField value={data.profile.name || ""} onChange={(event) => updateProfileField("name", event.target.value)} fullWidth sx={inputSx} /></Field>
                <Field label="Linha abaixo do nome"><TextField value={data.profile.headline || ""} onChange={(event) => updateProfileField("headline", event.target.value)} fullWidth sx={inputSx} /></Field>
                <Field label="E-mail de contato"><TextField value={data.profile.email || ""} onChange={(event) => updateProfileField("email", event.target.value)} fullWidth sx={inputSx} /></Field>
                <Field label="Link do LinkedIn"><TextField value={data.profile.linkedin || ""} onChange={(event) => updateProfileField("linkedin", event.target.value)} fullWidth sx={inputSx} /></Field>
                <Field label="Título da apresentação"><TextField value={data.profile.introTitle || ""} onChange={(event) => updateProfileField("introTitle", event.target.value)} fullWidth sx={inputSx} /></Field>
                <Field label="Foto pública"><TextField value={data.profile.photoSrc || ""} onChange={(event) => updateProfileField("photoSrc", event.target.value)} helperText="Para trocar a imagem, substitua o arquivo em public/images/luis-otavio-profile.png ou use outro caminho público." fullWidth sx={inputSx} /></Field>
              </Box>

              <Field label="Texto de apresentação">
                <TextField value={data.profile.bio || ""} onChange={(event) => updateProfileField("bio", event.target.value)} multiline minRows={4} fullWidth sx={inputSx} />
              </Field>

              <IconSelector label="Ícones de destaque da apresentação" value={data.profile.highlightPills || []} onChange={updateHighlightPills} />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "0.92fr 1.08fr" }, gap: 2.4, alignItems: "start" }}>
            <Box ref={clipFormSectionRef} sx={{ scrollMarginTop: { xs: 18, md: 28 } }}>
              <AdminClipSelector
                onAddClip={handleAddBannerClip}
                onUpdateClip={handleUpdateBannerClip}
                onCancelEdit={handleCancelEditBannerClip}
                editingClip={editingClip}
                nextOrder={nextClipOrder}
              />
            </Box>

            <Paper ref={videoFormSectionRef} elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)", scrollMarginTop: { xs: 18, md: 28 } }}>
              <Box component="form" onSubmit={handleSubmitVideo}>
                <Stack spacing={1.8}>
                  <Stack spacing={0.45}>
                    <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>
                      {editingVideoId ? "Editar projeto" : "Adicionar projeto por MP4"}
                    </Typography>
                    <Typography sx={{ color: "#8F9AAB", lineHeight: 1.55, fontSize: 13.5 }}>
                      Suba o arquivo do projeto direto pelo painel. Você também pode escolher um frame como capa do card.
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={isUploadingVideo}
                      startIcon={<LocalIcon glyph="↑" />}
                      sx={{
                        width: "fit-content",
                        color: "#F2C14E",
                        borderColor: "rgba(242,193,78,0.42)",
                        background: "rgba(242,193,78,0.045)",
                        "&:hover": { color: "#080A0F", background: "#F2C14E", borderColor: "rgba(255,211,90,0.92)" },
                      }}
                    >
                      {isUploadingVideo ? "Enviando..." : "Subir MP4 do projeto"}
                      <input hidden type="file" accept="video/*" onChange={handleUploadVideo} />
                    </Button>

                    <Typography sx={{ color: videoForm.videoSrc ? "#A7F3D0" : "#8F9AAB", fontSize: 13.5, overflowWrap: "anywhere" }}>
                      {videoForm.videoSrc ? `Vídeo atual: ${videoForm.videoSrc}` : "Nenhum vídeo enviado neste card."}
                    </Typography>
                  </Stack>

                  {videoForm.videoSrc ? (
                    <Stack spacing={1.1}>
                      <Box
                        component="video"
                        ref={videoPreviewRef}
                        src={videoForm.videoSrc}
                        poster={videoForm.thumbnailSrc || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        sx={{
                          width: "100%",
                          maxHeight: 280,
                          objectFit: "contain",
                          background: "#000",
                          borderRadius: 1.4,
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                        <Button variant="outlined" startIcon={<LocalIcon glyph="▣" />} onClick={handleGenerateThumbnail} disabled={isGeneratingThumbnail} sx={{ color: "#F2C14E" }}>
                          {isGeneratingThumbnail ? "Gerando capa..." : "Usar frame atual como capa"}
                        </Button>
                        <Typography sx={{ color: videoForm.thumbnailSrc ? "#A7F3D0" : "#8F9AAB", fontSize: 13.3, overflowWrap: "anywhere" }}>
                          {videoForm.thumbnailSrc ? `Capa atual: ${videoForm.thumbnailSrc}` : "Sem capa definida. O card usa o primeiro frame do vídeo."}
                        </Typography>
                      </Stack>
                    </Stack>
                  ) : null}

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, columnGap: 1.45, rowGap: 1.55, alignItems: "start" }}>
                    <Field label="Título do projeto"><TextField placeholder="Ex.: Cobertura de evento institucional" value={videoForm.title} onChange={(event) => handleVideoField("title", event.target.value)} fullWidth sx={inputSx} /></Field>
                    <Field label="Cliente / contexto"><TextField placeholder="Ex.: Comunicação institucional" value={videoForm.client} onChange={(event) => handleVideoField("client", event.target.value)} fullWidth sx={inputSx} /></Field>
                    <Field label="Categoria"><TextField select value={videoForm.category} onChange={(event) => handleVideoField("category", event.target.value)} fullWidth sx={inputSx}>{categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Field>
                    <Field label="Formato"><TextField select value={videoForm.orientation} onChange={(event) => handleVideoField("orientation", event.target.value)} fullWidth sx={inputSx}>{orientations.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField></Field>
                    <Field label="Ano"><TextField value={videoForm.year} onChange={(event) => handleVideoField("year", event.target.value)} fullWidth sx={inputSx} /></Field>
                    <Field label="Ordem de aparecimento"><TextField type="number" value={videoForm.displayOrder} onChange={(event) => handleVideoField("displayOrder", event.target.value)} helperText="Números menores aparecem primeiro." fullWidth sx={inputSx} /></Field>
                    <Field label="Link externo opcional"><TextField placeholder="Behance, Vimeo, YouTube ou outro link de apoio" value={videoForm.externalUrl} onChange={(event) => handleVideoField("externalUrl", event.target.value)} fullWidth sx={inputSx} /></Field>
                    <Field label="Caminho da capa"><TextField value={videoForm.thumbnailSrc} onChange={(event) => handleVideoField("thumbnailSrc", event.target.value)} helperText="Você pode preencher manualmente ou usar o botão de frame acima." fullWidth sx={inputSx} /></Field>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                    <FormControlLabel
                      control={<Checkbox checked={Boolean(videoForm.isPinned)} onChange={(event) => handleVideoField("isPinned", event.target.checked)} sx={{ color: "#F2C14E", "&.Mui-checked": { color: "#F2C14E" } }} />}
                      label={`Fixar na seleção inicial (máx. ${PINNED_LIMIT})`}
                      sx={{ color: "#D9E5F4" }}
                    />
                    <FormControlLabel
                      control={<Checkbox checked={Boolean(videoForm.isHidden)} onChange={(event) => handleVideoField("isHidden", event.target.checked)} sx={{ color: "#F2C14E", "&.Mui-checked": { color: "#F2C14E" } }} />}
                      label="Ocultar da página pública"
                      sx={{ color: "#D9E5F4" }}
                    />
                  </Box>

                  <Field label="Sua função no projeto"><TextField placeholder="Ex.: Captação, edição e finalização" value={videoForm.role} onChange={(event) => handleVideoField("role", event.target.value)} fullWidth sx={inputSx} /></Field>
                  <Field label="Descrição curta do projeto"><TextField value={videoForm.description} onChange={(event) => handleVideoField("description", event.target.value)} multiline minRows={3} fullWidth sx={inputSx} /></Field>

                  <IconSelector label="Selecionar ícones/ferramentas do card" value={videoForm.tools} onChange={(nextTools) => handleVideoField("tools", nextTools)} />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
                    <Button type="submit" variant="contained" size="large" startIcon={editingVideoId ? <LocalIcon glyph="✓" /> : <LocalIcon glyph="+" />}>
                      {editingVideoId ? "Salvar alterações" : "Adicionar projeto"}
                    </Button>
                    <Button variant="outlined" onClick={resetVideoForm} sx={{ color: "#F2C14E" }}>
                      Limpar formulário
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Paper>
          </Box>

          <MosaicLayoutEditor
            clips={sortedClips}
            onUpdateClipLayout={handleUpdateClipLayout}
            onUpdateClipLayer={handleUpdateClipLayer}
            onResetMosaicLayouts={handleResetMosaicLayouts}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.4 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)" }}>
              <Stack spacing={1.6}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>Projetos cadastrados</Typography>
                  <Typography sx={{ color: "#8F9AAB", fontSize: 13 }}>Fixos: {pinnedCount}/{PINNED_LIMIT}</Typography>
                </Stack>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                {sortedVideos.map((video) => (
                  <Stack key={video.id} direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ py: 1, borderBottom: "1px solid rgba(255,255,255,0.06)", justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 740, color: video.isHidden ? "#8F9AAB" : "#F5F7FA" }}>{video.title}</Typography>
                      <Typography sx={{ color: "#8F9AAB", fontSize: 13 }}>{video.category} • {video.orientation === "vertical" ? "Vertical 9:16" : video.orientation === "square" ? "Quadrado 1:1" : "Horizontal 16:9"} • Ordem {video.displayOrder || "—"}{video.isPinned ? " • Fixo" : ""}{video.isHidden ? " • Oculto" : ""}</Typography>
                      <Typography sx={{ color: "#6F7B8D", fontSize: 12.2, overflowWrap: "anywhere" }}>{getVideoSrcFromVideo(video) || "Sem arquivo MP4"}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ flexShrink: 0, justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
                      <TextField size="small" type="number" value={video.displayOrder || ""} onChange={(event) => handleUpdateVideoOrder(video.id, event.target.value)} sx={{ width: 82, ...inputSx }} />
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph="★" />} onClick={() => handleToggleVideoPinned(video.id)} sx={{ color: "#F2C14E" }}>{video.isPinned ? "Desfixar" : "Fixar"}</Button>
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph={video.isHidden ? "◉" : "◌"} />} onClick={() => handleToggleVideoHidden(video.id)} sx={{ color: "#F2C14E" }}>{video.isHidden ? "Mostrar" : "Ocultar"}</Button>
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph="✎" />} onClick={() => handleEditVideo(video)} sx={{ color: "#F2C14E" }}>Editar</Button>
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph="×" />} onClick={() => handleDeleteVideo(video.id)} sx={{ color: "#F2C14E" }}>Excluir</Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)" }}>
              <Stack spacing={1.6}>
                <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>Trechos do banner mosaico</Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                {sortedClips.map((clip) => (
                  <Stack key={clip.id} direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ py: 1, borderBottom: "1px solid rgba(255,255,255,0.06)", justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 740, color: clip.isHidden ? "#8F9AAB" : "#F5F7FA" }}>{clip.title}</Typography>
                      <Typography sx={{ color: "#8F9AAB", fontSize: 13 }}>{clip.orientation || "horizontal"} • Ordem {clip.displayOrder || "—"} • Camada {clip.mosaicLayout?.z ?? "auto"}{clip.isHidden ? " • Oculto" : ""} • {clip.src}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ flexShrink: 0 }}>
                      <TextField size="small" type="number" value={clip.displayOrder || ""} onChange={(event) => handleUpdateClipOrder(clip.id, event.target.value)} sx={{ width: 82, ...inputSx }} />
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph="✎" />} onClick={() => handleEditBannerClip(clip.id)} sx={{ color: "#F2C14E" }}>Editar</Button>
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph={clip.isHidden ? "◉" : "◌"} />} onClick={() => handleToggleClipHidden(clip.id)} sx={{ color: "#F2C14E" }}>{clip.isHidden ? "Mostrar" : "Ocultar"}</Button>
                      <Button size="small" variant="outlined" startIcon={<LocalIcon glyph="×" />} onClick={() => handleDeleteBannerClip(clip.id)} sx={{ color: "#F2C14E", flexShrink: 0 }}>Excluir</Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 2, background: "rgba(12, 17, 24, 0.72)", border: "1px solid rgba(242,193,78,0.16)" }}>
            <Stack spacing={1.4}>
              <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>Backup e observação importante</Typography>
              <Typography sx={{ color: "#8F9AAB", lineHeight: 1.65, fontSize: 14 }}>
                Neste momento, o painel salva os dados no navegador e grava os MP4s na pasta pública do projeto durante o desenvolvimento local. Para publicar para outras pessoas com upload real, a próxima etapa é trocar esse salvamento local por storage/backend permanente.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button variant="outlined" startIcon={<LocalIcon glyph="↺" />} onClick={handleResetData} sx={{ color: "#F2C14E" }}>Restaurar exemplo inicial</Button>
                <Button variant="outlined" startIcon={<LocalIcon glyph="↓" />} onClick={handleExportJson} sx={{ color: "#F2C14E" }}>Baixar backup JSON</Button>
              </Stack>
              {jsonText ? <TextField value={jsonText} multiline minRows={5} fullWidth sx={inputSx} /> : null}
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Box>
  );
}
