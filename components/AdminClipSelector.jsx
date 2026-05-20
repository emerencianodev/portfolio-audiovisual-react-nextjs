"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, MenuItem, Paper, Slider, Stack, TextField, Typography } from "@mui/material";
import LocalIcon from "./LocalIcon";
import { createId } from "../lib/portfolioStorage";
import { orientations } from "./videoData";

const FIXED_CLIP_DURATION = 10;

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
};

function FieldLabel({ children }) {
  return <Typography sx={{ color: "#F2C14E", fontSize: 12.5, fontWeight: 720 }}>{children}</Typography>;
}

export default function AdminClipSelector({
  onAddClip,
  onUpdateClip,
  onCancelEdit,
  editingClip = null,
  nextOrder = 1,
}) {
  const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(FIXED_CLIP_DURATION);
  const [start, setStart] = useState(0);
  const [clipTitle, setClipTitle] = useState("Trecho selecionado");
  const [orientation, setOrientation] = useState("horizontal");
  const [displayOrder, setDisplayOrder] = useState(String(nextOrder));
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const isEditing = Boolean(editingClip?.id);
  const maxStart = useMemo(() => Math.max(0, duration - FIXED_CLIP_DURATION), [duration]);
  const end = Math.min(duration, start + FIXED_CLIP_DURATION);

  useEffect(() => {
    if (isEditing) return;
    setDisplayOrder(String(nextOrder));
  }, [isEditing, nextOrder]);

  useEffect(() => {
    if (!editingClip) return;

    if (fileUrl && fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);

    setFile(null);
    setFileUrl(editingClip.src || "");
    setFileName(editingClip.sourceName || editingClip.src || "");
    setClipTitle(editingClip.title || "Trecho selecionado");
    setOrientation(editingClip.orientation || "horizontal");
    setDisplayOrder(String(editingClip.displayOrder || nextOrder));
    setStart(0);
    setMessage("Editando este trecho. Altere nome, formato ou ordem e clique em salvar; para trocar o corte, suba o MP4 novamente e gere outro trecho.");
  }, [editingClip, nextOrder]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    function handleTimeUpdate() {
      if (video.currentTime >= end) {
        video.currentTime = start;
        video.play().catch(() => {});
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [start, end]);

  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  function handleFile(event) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    if (!nextFile.type.startsWith("video/")) {
      setMessage("Escolha um arquivo de vídeo.");
      return;
    }

    if (fileUrl && fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);

    const nextUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setFileUrl(nextUrl);
    setFileName(nextFile.name);
    setClipTitle(nextFile.name.replace(/\.[^/.]+$/, ""));
    setStart(0);
    setMessage("Arquivo carregado. Agora mova a janela fixa de 10 segundos pelo vídeo.");
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;

    const nextDuration = Number(video.duration || FIXED_CLIP_DURATION);
    setDuration(nextDuration);
    setStart(0);

    if (nextDuration < FIXED_CLIP_DURATION) {
      setMessage("Este vídeo tem menos de 10 segundos. Use um arquivo maior para gerar o trecho do banner.");
    }
  }

  function handleStartChange(_, value) {
    const nextStart = Number(value || 0);
    setStart(nextStart);

    const video = videoRef.current;
    if (video) video.currentTime = nextStart;
  }

  function handlePreview() {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = start;
    video.play().catch(() => {});
  }

  function handleSaveMetadata() {
    if (!isEditing || !editingClip) return;

    onUpdateClip?.(editingClip.id, {
      ...editingClip,
      title: clipTitle.trim() || editingClip.title || "Trecho selecionado",
      orientation,
      displayOrder: Number(displayOrder) || editingClip.displayOrder || nextOrder,
    });

    setMessage("Dados do trecho atualizados.");
  }

  async function handleGenerateClip() {
    if (!file) {
      setMessage("Suba um vídeo antes de gerar o trecho. Ao editar um trecho existente, você precisa subir novamente o MP4 original se quiser trocar o corte.");
      return;
    }

    if (duration < FIXED_CLIP_DURATION) {
      setMessage("O vídeo precisa ter pelo menos 10 segundos para gerar o trecho do banner.");
      return;
    }

    setIsGenerating(true);
    setMessage("Gerando MP4 curto de 10 segundos com FFmpeg. Aguarde alguns segundos...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("start", String(start));
      formData.append("end", String(start + FIXED_CLIP_DURATION));
      formData.append("title", clipTitle.trim() || "Trecho selecionado");
      formData.append("orientation", orientation);

      const response = await fetch("/api/generate-clip", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível gerar o trecho.");
      }

      const nextClip = {
        id: editingClip?.id || createId("clip"),
        title: clipTitle.trim() || "Trecho selecionado",
        src: result.src,
        start: 0,
        end: FIXED_CLIP_DURATION,
        duration: FIXED_CLIP_DURATION,
        orientation,
        sourceName: fileName,
        displayOrder: Number(displayOrder) || nextOrder,
        isHidden: Boolean(editingClip?.isHidden),
        mosaicLayout: editingClip?.mosaicLayout || null,
      };

      if (isEditing && onUpdateClip) {
        onUpdateClip(editingClip.id, nextClip);
        setMessage("MP4 curto de 10 segundos gerado e atualizado no banner mosaico.");
      } else {
        onAddClip(nextClip);
        setMessage("MP4 curto de 10 segundos gerado e adicionado ao banner mosaico.");
      }
    } catch (error) {
      setMessage(`Não consegui gerar o MP4 curto. Verifique se o FFmpeg está instalado e acessível. Detalhe: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.4 },
        borderRadius: 2,
        background: "rgba(12, 17, 24, 0.72)",
        border: "1px solid rgba(242,193,78,0.16)",
      }}
    >
      <Stack spacing={1.6}>
        <Stack spacing={0.4}>
          <Typography sx={{ color: "#F5F7FA", fontWeight: 760, fontSize: 18 }}>
            {isEditing ? "Editar trecho do banner" : "Gerar trecho curto para o banner"}
          </Typography>
          <Typography sx={{ color: "#8F9AAB", lineHeight: 1.55, fontSize: 13.5 }}>
            {isEditing
              ? "Ajuste nome, formato e ordem. Para trocar o corte, suba novamente o MP4 original e gere outro trecho de 10 segundos."
              : "Suba um MP4 e mova uma janela fixa de 10 segundos pelo vídeo. O fim é calculado automaticamente."}
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
          <Button
            variant="outlined"
            component="label"
            sx={{
              width: "fit-content",
              color: "#F2C14E",
              borderColor: "rgba(242,193,78,0.42)",
              background: "rgba(242,193,78,0.045)",
              "&:hover": { color: "#080A0F", background: "#F2C14E", borderColor: "rgba(255,211,90,0.92)" },
            }}
          >
            Subir MP4
            <input hidden type="file" accept="video/*" onChange={handleFile} />
          </Button>

          {isEditing ? (
            <Button variant="outlined" onClick={onCancelEdit} sx={{ color: "#F2C14E" }}>
              Cancelar edição
            </Button>
          ) : null}

          {fileName ? <Typography sx={{ color: "#8F9AAB", fontSize: 13.5, overflowWrap: "anywhere" }}>{fileName}</Typography> : null}
        </Stack>

        {fileUrl ? (
          <Stack spacing={1.4}>
            <Box
              component="video"
              ref={videoRef}
              src={fileUrl}
              controls
              muted
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              sx={{
                width: "100%",
                maxHeight: 320,
                objectFit: "contain",
                background: "#000",
                borderRadius: 1.4,
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />

            <Stack spacing={0.65}>
              <FieldLabel>Nome do trecho</FieldLabel>
              <TextField value={clipTitle} onChange={(event) => setClipTitle(event.target.value)} fullWidth sx={inputSx} />
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 180px" }, gap: 1.2 }}>
              <Stack spacing={0.65}>
                <FieldLabel>Formato do bloco no mosaico</FieldLabel>
                <TextField select value={orientation} onChange={(event) => setOrientation(event.target.value)} fullWidth sx={inputSx}>
                  {orientations.map((item) => (
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack spacing={0.65}>
                <FieldLabel>Ordem de aparecimento</FieldLabel>
                <TextField type="number" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} fullWidth sx={inputSx} />
              </Stack>
            </Box>

            <Box sx={{ px: 1 }}>
              <Slider
                value={start}
                min={0}
                max={maxStart}
                step={0.1}
                onChange={handleStartChange}
                valueLabelDisplay="auto"
              />
            </Box>

            <Typography sx={{ color: "#AEB7C5", fontSize: 13.5 }}>
              Janela fixa: {start.toFixed(1)}s até {end.toFixed(1)}s • Duração: 10.0s
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="outlined" startIcon={<LocalIcon glyph="▶" />} onClick={handlePreview} sx={{ color: "#F2C14E" }}>
                Testar trecho
              </Button>
              {isEditing ? (
                <Button variant="outlined" startIcon={<LocalIcon glyph="✓" />} onClick={handleSaveMetadata} sx={{ color: "#F2C14E" }}>
                  Salvar dados
                </Button>
              ) : null}
              <Button variant="contained" startIcon={<LocalIcon glyph="✂" />} onClick={handleGenerateClip} disabled={isGenerating}>
                {isGenerating ? "Gerando..." : isEditing ? "Gerar novo MP4 curto" : "Gerar MP4 curto"}
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {message ? <Typography sx={{ color: "#8F9AAB", fontSize: 13.5 }}>{message}</Typography> : null}
      </Stack>
    </Paper>
  );
}
