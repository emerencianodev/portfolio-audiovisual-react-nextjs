import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

function sanitizeName(value) {
  return (
    String(value || "video")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 70) || "video"
  );
}

function getExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext && ext.length <= 8 ? ext : ".mp4";
}

function getScaleFilter(orientation) {
  if (orientation === "vertical") {
    return "scale='min(720,iw)':-2";
  }

  if (orientation === "square") {
    return "scale='min(1080,iw)':-2";
  }

  return "scale='min(1280,iw)':-2";
}

async function tryCompressWithFfmpeg({
  ffmpegPath,
  tempInputPath,
  outputPath,
  orientation,
}) {
  await execFileAsync(ffmpegPath, [
    "-y",
    "-i",
    tempInputPath,
    "-vf",
    getScaleFilter(orientation),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "27",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

export async function POST(request) {
  let tempInputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "video");
    const orientation = String(formData.get("orientation") || "horizontal");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Arquivo de vídeo não enviado." },
        { status: 400 },
      );
    }

    if (!String(file.type || "").startsWith("video/")) {
      return NextResponse.json(
        { error: "O arquivo enviado não parece ser um vídeo." },
        { status: 400 },
      );
    }

    const tempDir = path.join(os.tmpdir(), "portfolio-full-videos");
    const outputDir = path.join(process.cwd(), "public", "uploaded-videos");

    await mkdir(tempDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const sourceExtension = getExtension(file.name);
    const tempId = randomUUID();
    tempInputPath = path.join(tempDir, `${tempId}${sourceExtension}`);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(tempInputPath, bytes);

    const safeTitle = sanitizeName(title || file.name);
    const now = Date.now();

    const compressedFileName = `${safeTitle}-${now}.mp4`;
    const compressedOutputPath = path.join(outputDir, compressedFileName);

    const fallbackFileName = `${safeTitle}-${now}${sourceExtension}`;
    const fallbackOutputPath = path.join(outputDir, fallbackFileName);

    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    let finalFileName = compressedFileName;
    let finalOutputPath = compressedOutputPath;
    let compressed = true;
    let ffmpegError = "";

    try {
      await tryCompressWithFfmpeg({
        ffmpegPath,
        tempInputPath,
        outputPath: compressedOutputPath,
        orientation,
      });
    } catch (error) {
      compressed = false;
      ffmpegError = error.message;

      finalFileName = fallbackFileName;
      finalOutputPath = fallbackOutputPath;

      await writeFile(fallbackOutputPath, bytes);
    }

    const outputStats = await stat(finalOutputPath).catch(() => null);

    return NextResponse.json({
      ok: true,
      compressed,
      ffmpegError,
      src: `/uploaded-videos/${finalFileName}`,
      fileName: finalFileName,
      sizeBytes: outputStats?.size || 0,
      message: compressed
        ? "Vídeo enviado e comprimido com FFmpeg."
        : "Vídeo enviado sem compressão porque o FFmpeg falhou ou não foi encontrado.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao subir o vídeo.",
        detail: error.message,
      },
      { status: 500 },
    );
  } finally {
    if (tempInputPath) {
      await rm(tempInputPath, { force: true }).catch(() => {});
    }
  }
}
