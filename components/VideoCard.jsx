import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import LocalIcon from "./LocalIcon";
import IconPill from "./IconPill";
import { normalizeOrientation } from "../lib/portfolioStorage";

function getExternalUrl(video) {
  if (video.externalUrl) return video.externalUrl;
  if (video.youtubeUrl) return video.youtubeUrl;
  if (video.youtubeId)
    return `https://www.youtube.com/watch?v=${video.youtubeId}`;
  return undefined;
}

function VideoPlayer({ video, orientation }) {
  const isVertical = orientation === "vertical";
  const isSquare = orientation === "square";
  const externalUrl = getExternalUrl(video);

  if (video.videoSrc) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            isVertical || isSquare
              ? "radial-gradient(circle at 50% 16%, rgba(242,193,78,0.14), transparent 34%), #05070B"
              : "#000",
        }}
      >
        <Box
          component="video"
          src={video.videoSrc}
          poster={video.thumbnailSrc || undefined}
          controls
          playsInline
          preload="metadata"
          sx={{
            width: isVertical ? "auto" : "100%",
            height: isVertical ? "100%" : "100%",
            maxWidth: "100%",
            objectFit: "contain",
            display: "block",
            background: "#000",
          }}
        />
      </Box>
    );
  }

  return (
    <Stack
      spacing={1.2}
      alignItems="center"
      justifyContent="center"
      sx={{ height: "100%", px: 3, textAlign: "center" }}
    >
      <LocalIcon glyph="▶" sx={{ fontSize: 28, color: "#F2C14E" }} />
      <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>
        {externalUrl
          ? "Vídeo disponível em link externo."
          : "Arquivo de vídeo ainda não cadastrado."}
      </Typography>
    </Stack>
  );
}

export default function VideoCard({ video }) {
  const orientation = normalizeOrientation(video.orientation);
  const isVertical = orientation === "vertical";
  const isSquare = orientation === "square";
  const externalUrl = getExternalUrl(video);

  return (
    <Card
      sx={{
        height: "100%",
        minHeight: isVertical ? { xs: 640, md: 720 } : "auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.09)",
        background: "rgba(17, 20, 28, 0.82)",
        boxShadow: "0 18px 56px rgba(0,0,0,0.22)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: isVertical ? "9 / 16" : isSquare ? "1 / 1" : "16 / 9",
          height: isVertical
            ? { xs: 440, md: 520 }
            : isSquare
              ? { xs: 320, md: 360 }
              : "auto",
          maxHeight: isVertical ? { xs: 520, md: 560 } : "none",
          background: "#05070B",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <VideoPlayer video={video} orientation={orientation} />
      </Box>

      <CardContent
        sx={{
          p: { xs: 2, md: 2.25 },
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          gap: 1.15,
        }}
      >
        <Stack spacing={0.7}>
          <Typography
            sx={{
              color: "#F2C14E",
              fontSize: 12.2,
              fontWeight: 760,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {video.category} • {video.year}
          </Typography>

          <Typography
            component="h3"
            sx={{
              color: "#F5F7FA",
              fontWeight: 780,
              fontSize: { xs: 20, md: 22 },
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
            }}
          >
            {video.title}
          </Typography>

          <Typography
            sx={{ color: "#8F9AAB", fontSize: 13.5, fontWeight: 680 }}
          >
            {video.client}
          </Typography>
        </Stack>

        <Typography sx={{ color: "#AEB7C5", lineHeight: 1.64, fontSize: 14.2 }}>
          {video.description}
        </Typography>

        <Typography sx={{ color: "#D9E5F4", fontSize: 13.4, lineHeight: 1.5 }}>
          <Box component="span" sx={{ color: "#F2C14E", fontWeight: 760 }}>
            Função:{" "}
          </Box>
          {video.role}
        </Typography>

        {video.tools?.length ? (
          <Box
            sx={{
              mt: 0.25,
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              maxWidth: "100%",
              overflow: "visible",
            }}
          >
            {video.tools.map((tool) => (
              <IconPill key={`${video.id}-${tool}`} label={tool} dense />
            ))}
          </Box>
        ) : null}

        <Box sx={{ flexGrow: 1 }} />

        {externalUrl ? (
          <Button
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            endIcon={<LocalIcon glyph="↗" />}
            sx={{
              alignSelf: "flex-start",
              color: "#F2C14E",
              borderColor: "rgba(242,193,78,0.38)",
            }}
          >
            Abrir link externo
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
