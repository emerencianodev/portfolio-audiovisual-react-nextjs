import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

function sanitizeName(value) {
  return String(value || "thumb")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) || "thumb";
}

function publicPathToDiskPath(publicPath) {
  const clean = String(publicPath || "").split("?")[0];
  if (!clean.startsWith("/uploaded-videos/") && !clean.startsWith("/banner-clips/") && !clean.startsWith("/generated-clips/")) {
    return null;
  }
  return path.join(process.cwd(), "public", clean.replace(/^\//, ""));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const videoSrc = String(body.videoSrc || "");
    const title = String(body.title || "thumb");
    const time = Number(body.time || 0);

    const inputPath = publicPathToDiskPath(videoSrc);
    if (!inputPath) {
      return NextResponse.json({ error: "Caminho do vídeo inválido para gerar capa." }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), "public", "generated-thumbnails");
    await mkdir(outputDir, { recursive: true });

    const outputFileName = `${sanitizeName(title)}-${randomUUID()}.jpg`;
    const outputPath = path.join(outputDir, outputFileName);
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    await execFileAsync(ffmpegPath, [
      "-y",
      "-ss",
      String(Math.max(0, time)),
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      outputPath,
    ]);

    return NextResponse.json({ ok: true, src: `/generated-thumbnails/${outputFileName}` });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao gerar a capa do vídeo.", detail: error.message },
      { status: 500 }
    );
  }
}
