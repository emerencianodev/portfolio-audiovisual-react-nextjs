import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const FIXED_CLIP_DURATION = 10;

function sanitizeName(value) {
  return String(value || "clip")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) || "clip";
}

function getExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext && ext.length <= 8 ? ext : ".mp4";
}

export async function POST(request) {
  let tempInputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const start = Number(formData.get("start"));
    const title = String(formData.get("title") || "clip");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Arquivo de vídeo não enviado." }, { status: 400 });
    }

    if (!Number.isFinite(start) || start < 0) {
      return NextResponse.json({ error: "Início do trecho inválido." }, { status: 400 });
    }

    const tempDir = path.join(os.tmpdir(), "portfolio-video-clips");
    const outputDir = path.join(process.cwd(), "public", "generated-clips");
    await mkdir(tempDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const sourceExtension = getExtension(file.name);
    const tempId = randomUUID();
    tempInputPath = path.join(tempDir, `${tempId}${sourceExtension}`);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(tempInputPath, bytes);

    const safeTitle = sanitizeName(title);
    const outputFileName = `${safeTitle}-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    await execFileAsync(ffmpegPath, [
      "-y",
      "-ss",
      String(start),
      "-i",
      tempInputPath,
      "-t",
      String(FIXED_CLIP_DURATION),
      "-an",
      "-vf",
      "scale='if(gt(iw,ih),min(1280,iw),min(720,iw))':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    return NextResponse.json({ ok: true, src: `/generated-clips/${outputFileName}`, duration: FIXED_CLIP_DURATION });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao gerar o MP4 curto. Verifique se o FFmpeg está instalado e se o caminho dele está em FFMPEG_PATH ou no PATH do sistema.",
        detail: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (tempInputPath) {
      await rm(tempInputPath, { force: true }).catch(() => {});
    }
  }
}
