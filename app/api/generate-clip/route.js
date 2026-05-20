import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Geração de clipes desativada na versão publicada. Use o painel local com FFmpeg para gerar os vídeos curtos antes do deploy."
    },
    { status: 501 }
  );
}
