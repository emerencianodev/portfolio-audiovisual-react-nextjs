"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalIcon from "./LocalIcon";
import MosaicBanner from "./MosaicBanner";
import VideoCard from "./VideoCard";
import IconPill from "./IconPill";
import { filters } from "./videoData";
import {
  cloneDefaultPortfolioData,
  loadPortfolioData,
  normalizeOrientation,
  sortByPortfolioOrder,
  sortClipsByOrder,
  subscribePortfolioData,
} from "../lib/portfolioStorage";

const PUBLIC_PROJECT_LIMIT = 6;

function createMailtoHref(email) {
  const cleanEmail = String(email || "luisemerenciano@gmail.com").trim();
  const subject = encodeURIComponent("Contato pelo portfólio audiovisual");
  return `mailto:${cleanEmail}?subject=${subject}`;
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 640);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <Button
      variant="contained"
      size="small"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      startIcon={<LocalIcon glyph="↑" />}
      sx={{
        position: "fixed",
        right: { xs: 16, md: 24 },
        bottom: { xs: 18, md: 24 },
        zIndex: 1200,
        minHeight: 42,
        px: { xs: 1.6, md: 2 },
        borderRadius: 999,
        boxShadow: "0 16px 44px rgba(0,0,0,0.35)",
      }}
    >
      Topo
    </Button>
  );
}

function matchesFilter(video, activeFilter) {
  const orientation = normalizeOrientation(video.orientation);
  if (activeFilter === "Todos") return true;
  if (activeFilter === "Vertical") return orientation === "vertical";
  if (activeFilter === "Horizontal") return orientation === "horizontal";
  return video.category === activeFilter;
}

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState(() => cloneDefaultPortfolioData());
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [showAllProjects, setShowAllProjects] = useState(false);

  useEffect(() => {
    setPortfolioData(loadPortfolioData());

    return subscribePortfolioData((nextData) => {
      setPortfolioData(nextData);
    });
  }, []);

  useEffect(() => {
    setShowAllProjects(false);
  }, [activeFilter]);

  const { profile, videos, bannerClips } = portfolioData;
  const contactHref = createMailtoHref(profile.email);
  const visibleClips = useMemo(
    () =>
      sortClipsByOrder((bannerClips || []).filter((clip) => !clip.isHidden)),
    [bannerClips],
  );

  const filteredVideos = useMemo(() => {
    return sortByPortfolioOrder(
      (videos || []).filter(
        (video) => !video.isHidden && matchesFilter(video, activeFilter),
      ),
    );
  }, [activeFilter, videos]);

  const visibleProjects = showAllProjects
    ? filteredVideos
    : filteredVideos.slice(0, PUBLIC_PROJECT_LIMIT);
  const hasMoreProjects = filteredVideos.length > PUBLIC_PROJECT_LIMIT;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: "#F5F7FA",
        background:
          "radial-gradient(circle at 5% -6%, rgba(242, 193, 78, 0.16), transparent 30%), radial-gradient(circle at 95% 12%, rgba(12, 46, 102, 0.26), transparent 28%), linear-gradient(180deg, #070A10 0%, #0B111B 48%, #080A0F 100%)",
        overflowX: "hidden",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2.2, md: 3.6 } }}>
        <Stack spacing={{ xs: 4.5, md: 5.5 }}>
          <Box
            component="header"
            sx={{
              minHeight: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              borderBottom: "1px solid rgba(242, 193, 78, 0.14)",
              pb: 1.8,
            }}
          >
            <Stack spacing={0.2} sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: 760,
                  letterSpacing: "-0.025em",
                  fontSize: { xs: 16.5, md: 18 },
                  overflowWrap: "anywhere",
                }}
              >
                {profile.name}
              </Typography>
              <Typography sx={{ color: "#8F9AAB", fontSize: { xs: 12.3, md: 13 }, lineHeight: 1.35 }}>
                {profile.headline}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <Button
                href="#sobre"
                sx={{ color: "#AEB7C5", "&:hover": { color: "#F2C14E" } }}
              >
                Sobre
              </Button>
              <Button
                href="#projetos"
                sx={{ color: "#AEB7C5", "&:hover": { color: "#F2C14E" } }}
              >
                Projetos
              </Button>
              <Button
                variant="outlined"
                href={contactHref}
                startIcon={<LocalIcon glyph="✉" sx={{ fontSize: 15 }} />}
                sx={{
                  color: "#F2C14E",
                  borderColor: "rgba(242, 193, 78, 0.54)",
                  background: "rgba(242, 193, 78, 0.045)",
                  "&:hover": {
                    color: "#080A0F",
                    borderColor: "rgba(255, 211, 90, 0.92)",
                    background: "#F2C14E",
                  },
                }}
              >
                Contato
              </Button>
            </Stack>

            <Button
              variant="outlined"
              href={contactHref}
              aria-label="Enviar e-mail para contato"
              startIcon={<LocalIcon glyph="✉" sx={{ fontSize: 14 }} />}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                color: "#F2C14E",
                borderColor: "rgba(242, 193, 78, 0.54)",
                background: "rgba(242, 193, 78, 0.045)",
                px: 1.35,
                flexShrink: 0,
                "&:hover": {
                  color: "#080A0F",
                  borderColor: "rgba(255, 211, 90, 0.92)",
                  background: "#F2C14E",
                },
              }}
            >
              Contato
            </Button>
          </Box>

          <MosaicBanner clips={visibleClips} contactEmail={profile.email} />

          <Box
            id="sobre"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
              gap: { xs: 2, md: 2.6 },
              alignItems: "stretch",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.2, md: 3.2 },
                borderRadius: 2,
                background: "rgba(17, 20, 28, 0.82)",
                border: "1px solid rgba(242, 193, 78, 0.13)",
              }}
            >
              <Stack
                spacing={1.8}
                sx={{ height: "100%", justifyContent: "center" }}
              >
                <Typography
                  sx={{
                    color: "#F2C14E",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {profile.introLabel}
                </Typography>

                <Typography
                  component="h2"
                  sx={{
                    maxWidth: 840,
                    fontSize: { xs: 28, md: 38 },
                    lineHeight: 1.08,
                    letterSpacing: "-0.04em",
                    fontWeight: 760,
                  }}
                >
                  {profile.introTitle}
                </Typography>

                <Typography
                  sx={{
                    color: "#B8C2D0",
                    lineHeight: 1.76,
                    fontSize: { xs: 15.5, md: 16.2 },
                    maxWidth: 920,
                    whiteSpace: "pre-line",
                  }}
                >
                  {profile.bio}
                </Typography>

                {profile.highlightPills?.length ? (
                  <Box
                    sx={{
                      pt: 0.4,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.8,
                      maxWidth: "100%",
                      minWidth: 0,
                      overflow: "visible",
                    }}
                  >
                    {profile.highlightPills.map((item) => (
                      <IconPill key={item} label={item} dense />
                    ))}
                  </Box>
                ) : null}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: 2,
                background: "rgba(17, 20, 28, 0.82)",
                border: "1px solid rgba(242, 193, 78, 0.22)",
                boxShadow: "0 18px 60px rgba(0, 0, 0, 0.24)",
                minHeight: { xs: 320, sm: 380, lg: 460 },
              }}
            >
              <Box
                component="img"
                src={profile.photoSrc || "/images/luis-otavio-profile.png"}
                alt={`Foto de ${profile.name}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: { xs: 320, sm: 380, lg: 460 },
                  objectFit: "cover",
                  objectPosition: "center top",
                  display: "block",
                }}
              />
            </Paper>
          </Box>

          <Box id="projetos">
            <Stack spacing={2.4}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{
                  alignItems: { xs: "flex-start", md: "flex-end" },
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    component="h2"
                    sx={{
                      fontSize: { xs: 28, md: 38 },
                      lineHeight: 1.08,
                      fontWeight: 760,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Projetos audiovisuais
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.9,
                      color: "#8F9AAB",
                      maxWidth: 720,
                      lineHeight: 1.6,
                    }}
                  >
                    Uma curadoria de trabalhos audiovisuais criados para
                    fortalecer marcas, comunicar ideias e transformar pautas,
                    eventos e histórias em vídeos claros, bem conduzidos e
                    visualmente consistentes.
                  </Typography>
                </Box>

                <TextField
                  select
                  size="small"
                  label="Filtrar exibição"
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value)}
                  sx={{
                    minWidth: { xs: "100%", sm: 220 },
                    "& .MuiInputLabel-root": { color: "#8F9AAB" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#F2C14E" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.3,
                      color: "#D9E5F4",
                      background: "rgba(255,255,255,0.035)",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(242,193,78,0.18)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(242,193,78,0.38)",
                    },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#F2C14E",
                    },
                    "& .MuiSvgIcon-root": { color: "#F2C14E" },
                  }}
                >
                  {filters.map((filter) => (
                    <MenuItem key={filter} value={filter}>
                      {filter === "Todos" ? "Todos os projetos" : filter}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: { xs: 2, md: 2.4 },
                  alignItems: "stretch",
                }}
              >
                {visibleProjects.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </Box>

              {!filteredVideos.length ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "rgba(17, 20, 28, 0.76)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <Typography>
                    Nenhum projeto encontrado para esse filtro.
                  </Typography>
                </Paper>
              ) : null}

              {hasMoreProjects ? (
                <Box
                  sx={{ display: "flex", justifyContent: "center", pt: 0.4 }}
                >
                  <Button
                    variant="text"
                    onClick={() => setShowAllProjects((current) => !current)}
                    sx={{
                      color: "#F2C14E",
                      textTransform: "none",
                      fontWeight: 760,
                    }}
                  >
                    {showAllProjects
                      ? "Mostrar apenas 6 projetos"
                      : `Exibir todos os projetos (${filteredVideos.length})`}
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.6, md: 3.6 },
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(242, 193, 78, 0.12), rgba(12, 46, 102, 0.16))",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <Stack
              spacing={1.4}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 26, md: 34 },
                  lineHeight: 1.08,
                  fontWeight: 760,
                  letterSpacing: "-0.04em",
                }}
              >
                Vamos conversar sobre o próximo projeto?
              </Typography>
              <Typography
                sx={{ color: "#AEB7C5", maxWidth: 620, lineHeight: 1.65 }}
              >
                Estou disponível para conversar sobre produção audiovisual,
                edição, captação, eventos, redes sociais e comunicação
                institucional.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  variant="contained"
                  href={contactHref}
                  startIcon={<LocalIcon glyph="✉" />}
                >
                  Enviar e-mail
                </Button>
                {profile.linkedin ? (
                  <Button
                    variant="outlined"
                    href={profile.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: "#F2C14E" }}
                  >
                    LinkedIn
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
      <BackToTopButton />
    </Box>
  );
}
