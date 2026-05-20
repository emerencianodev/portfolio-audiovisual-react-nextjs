"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import LocalIcon from "./LocalIcon";

const MAX_MOSAIC_CLIPS = 7;
const BOARD_ASPECT_RATIO = "16 / 6.2";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeOrientation(value) {
  const orientation = String(value || "horizontal").toLowerCase();

  if (orientation.includes("vertical") || orientation.includes("9:16") || orientation.includes("9x16")) {
    return "vertical";
  }

  if (orientation.includes("square") || orientation.includes("quadrado") || orientation.includes("1:1") || orientation.includes("1x1")) {
    return "square";
  }

  return "horizontal";
}

function getOrderValue(clip, fallbackIndex) {
  const rawOrder = clip?.displayOrder ?? clip?.order ?? clip?.position ?? fallbackIndex + 1;
  const parsedOrder = Number(rawOrder);

  if (Number.isFinite(parsedOrder)) return parsedOrder;
  return fallbackIndex + 1;
}

function sortClipsByOrder(clips) {
  return [...clips].sort((a, b) => {
    const orderA = getOrderValue(a, 0);
    const orderB = getOrderValue(b, 0);

    if (orderA !== orderB) return orderA - orderB;

    const createdA = String(a?.createdAt || a?.id || "");
    const createdB = String(b?.createdAt || b?.id || "");

    return createdA.localeCompare(createdB);
  });
}

function getDefaultMosaicLayout(clip, index) {
  const orientation = normalizeOrientation(clip?.orientation);

  if (index === 0) return { x: 0, y: 0, w: 50, h: 62, z: 1 };

  if (orientation === "vertical") {
    const verticalLayouts = [
      { x: 51, y: 0, w: 13, h: 56, z: 2 },
      { x: 51, y: 58, w: 13, h: 42, z: 3 },
      { x: 87, y: 42, w: 13, h: 58, z: 4 },
      { x: 74, y: 42, w: 13, h: 58, z: 5 },
    ];
    return verticalLayouts[index % verticalLayouts.length];
  }

  if (orientation === "square") {
    const squareLayouts = [
      { x: 65, y: 0, w: 35, h: 40, z: 4 },
      { x: 64, y: 42, w: 22, h: 28, z: 5 },
      { x: 65, y: 72, w: 22, h: 28, z: 6 },
    ];
    return squareLayouts[index % squareLayouts.length];
  }

  const horizontalLayouts = [
    { x: 65, y: 0, w: 35, h: 40, z: 4 },
    { x: 64, y: 42, w: 22, h: 28, z: 5 },
    { x: 65, y: 72, w: 22, h: 28, z: 6 },
    { x: 0, y: 64, w: 50, h: 36, z: 7 },
  ];

  return horizontalLayouts[index % horizontalLayouts.length];
}

function normalizeMosaicLayout(layout, fallback) {
  const source = layout && typeof layout === "object" ? layout : fallback;
  const rawW = Number(source?.w);
  const rawH = Number(source?.h);
  const rawZ = Number(source?.z);
  const w = clamp(Number.isFinite(rawW) ? rawW : fallback.w, 8, 100);
  const h = clamp(Number.isFinite(rawH) ? rawH : fallback.h, 8, 100);
  const maxX = Math.max(0, 100 - w);
  const maxY = Math.max(0, 100 - h);

  return {
    x: clamp(Number(source?.x ?? fallback.x), 0, maxX),
    y: clamp(Number(source?.y ?? fallback.y), 0, maxY),
    w,
    h,
    z: Number.isFinite(rawZ) ? rawZ : fallback.z || 1,
  };
}

function getMosaicLayout(clip, index) {
  return normalizeMosaicLayout(clip?.mosaicLayout, getDefaultMosaicLayout(clip, index));
}

function useHasMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

function MosaicVideoTile({ clip, index, mounted }) {
  const videoRef = useRef(null);
  const layout = getMosaicLayout(clip, index);

  useEffect(() => {
    if (!mounted) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    let retryTimer = null;
    let interval = null;
    let cancelled = false;

    const start = Number(clip.start || 0);
    const end = Number(clip.end || 0);
    const shouldUseRange = end > start && !String(clip.src || "").includes("/generated-clips/");

    function tryPlay() {
      if (cancelled || !video) return;
      video.muted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    function softReload() {
      if (cancelled || !video) return;
      try {
        video.load();
      } catch (error) {
        // mantém o bloco estável mesmo se o Chrome falhar ao ler o cache local
      }
      retryTimer = window.setTimeout(tryPlay, 250);
    }

    function handleLoadedMetadata() {
      if (shouldUseRange && start > 0 && Number.isFinite(start) && start < video.duration) {
        video.currentTime = start;
      }
      tryPlay();
    }

    function handleTimeUpdate() {
      if (shouldUseRange && end <= video.duration && video.currentTime >= end) {
        video.currentTime = start;
        tryPlay();
      }
    }

    function handleEnded() {
      video.currentTime = shouldUseRange && start > 0 ? start : 0;
      tryPlay();
    }

    function handleError() {
      retryTimer = window.setTimeout(softReload, 900);
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Desencontro inicial entre vários vídeos carregando ao mesmo tempo pode deixar um bloco parado.
    // O pequeno atraso por índice evita pedir todos os decodes no mesmo frame.
    retryTimer = window.setTimeout(() => {
      softReload();
    }, 120 + index * 180);

    interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (video.paused || video.ended || video.readyState < 2) {
        tryPlay();
      }
    }, 2600 + index * 180);

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (interval) window.clearInterval(interval);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [clip.start, clip.end, clip.src, index, mounted]);

  return (
    <Box
      sx={{
        position: "absolute",
        left: `${layout.x}%`,
        top: `${layout.y}%`,
        width: `${layout.w}%`,
        height: `${layout.h}%`,
        overflow: "hidden",
        borderRadius: { xs: 1.2, md: 1.6 },
        background: "transparent",
        boxShadow: "0 14px 42px rgba(0,0,0,0.22)",
        zIndex: 10 + Number(layout.z || index + 1),
      }}
    >
      {mounted ? (
        <Box
          ref={videoRef}
          component="video"
          src={clip.src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            background: "transparent",
            filter: "saturate(0.92) contrast(1.03)",
          }}
        />
      ) : null}
    </Box>
  );
}

export default function MosaicBanner({ clips = [], contactEmail = "luisemerenciano@gmail.com" }) {
  const mounted = useHasMounted();
  const visibleClips = useMemo(() => {
    const cleanClips = clips.filter((clip) => clip?.src && !clip?.isHidden);
    return sortClipsByOrder(cleanClips).slice(0, MAX_MOSAIC_CLIPS);
  }, [clips]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2.2,
        border: "1px solid rgba(242,193,78,0.14)",
        background:
          "linear-gradient(135deg, rgba(17,20,28,0.96), rgba(8,10,15,0.96)), radial-gradient(circle at 15% 15%, rgba(242,193,78,0.10), transparent 30%)",
        p: { xs: 1.1, md: 1.5 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: BOARD_ASPECT_RATIO,
          minHeight: { xs: 0, md: 420 },
          overflow: "hidden",
          borderRadius: 1.8,
        }}
      >
        {visibleClips.map((clip, index) => (
          <MosaicVideoTile key={clip.id || clip.src} clip={clip} index={index} mounted={mounted} />
        ))}

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: {
              xs: "linear-gradient(180deg, rgba(8,10,15,0.06), rgba(8,10,15,0.16))",
              md: "linear-gradient(90deg, rgba(8,10,15,0.78), rgba(8,10,15,0.16) 58%, rgba(8,10,15,0.04))",
            },
            zIndex: 80,
            pointerEvents: "none",
          }}
        />

        <Stack
          spacing={2}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "absolute",
            zIndex: 90,
            left: { md: 32 },
            bottom: { md: 32 },
            maxWidth: { md: 620 },
            pointerEvents: "auto",
          }}
        >
          <Typography
            sx={{
              color: "#F2C14E",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 760,
              fontSize: 12,
            }}
          >
            Portfólio audiovisual
          </Typography>

          <Typography
            component="h1"
            sx={{
              maxWidth: 620,
              color: "#F5F7FA",
              fontSize: { md: 50, lg: 58 },
              lineHeight: 1.02,
              fontWeight: 780,
              letterSpacing: "-0.055em",
              textShadow: "0 4px 26px rgba(0,0,0,0.36)",
            }}
          >
            Vídeos para comunicar com clareza, ritmo e acabamento.
          </Typography>

          <Stack direction="row" spacing={1.2}>
            <Button variant="contained" href="#projetos" startIcon={<LocalIcon glyph="▶" />}>
              Ver projetos
            </Button>
            <Button
              variant="outlined"
              href={`mailto:${contactEmail}`}
              sx={{
                color: "#F2C14E",
                borderColor: "rgba(242,193,78,0.58)",
                background: "rgba(8,10,15,0.38)",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  color: "#080A0F",
                  borderColor: "rgba(255,211,90,0.92)",
                  background: "#F2C14E",
                },
              }}
            >
              Contato
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Stack
        spacing={1.6}
        sx={{
          display: { xs: "flex", md: "none" },
          pt: 2.1,
          px: { xs: 1.5, sm: 2 },
          pb: { xs: 1.4, sm: 1.8 },
          background: "transparent",
        }}
      >
        <Typography
          sx={{
            color: "#F2C14E",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontWeight: 760,
            fontSize: 11.5,
          }}
        >
          Portfólio audiovisual
        </Typography>

        <Typography
          component="h1"
          sx={{
            color: "#F5F7FA",
            fontSize: { xs: 34, sm: 38 },
            lineHeight: 1.04,
            fontWeight: 780,
            letterSpacing: "-0.055em",
            textShadow: "0 4px 26px rgba(0,0,0,0.28)",
          }}
        >
          Vídeos para comunicar com clareza, ritmo e acabamento.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.1}>
          <Button variant="contained" href="#projetos" startIcon={<LocalIcon glyph="▶" />} fullWidth>
            Ver projetos
          </Button>
          <Button
            variant="outlined"
            href={`mailto:${contactEmail}`}
            fullWidth
            sx={{
              color: "#F2C14E",
              borderColor: "rgba(242,193,78,0.58)",
              background: "rgba(8,10,15,0.20)",
              "&:hover": {
                color: "#080A0F",
                borderColor: "rgba(255,211,90,0.92)",
                background: "#F2C14E",
              },
            }}
          >
            Contato
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
