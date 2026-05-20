import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Geração de thumbnail desativada na versão publicada. Use o painel local para preparar os arquivos e exportar o JSON."
    },
    { status: 501 }
  );
}
