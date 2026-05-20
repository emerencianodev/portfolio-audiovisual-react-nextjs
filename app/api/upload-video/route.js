import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Upload de vídeo pelo admin está desativado na versão publicada. A versão online atual usa os arquivos já enviados no repositório."
    },
    { status: 501 }
  );
}
