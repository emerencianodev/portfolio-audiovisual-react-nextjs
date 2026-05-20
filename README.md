# Portfólio de vídeos — Luís Otávio

Projeto em Next.js + React + MUI, sem TypeScript.

## Rodar localmente

```bash
npm install
npm run dev
```

Página pública:

```txt
http://localhost:3000
```

Painel administrativo:

```txt
http://localhost:3000/admin
```

## FFmpeg

Para gerar trechos de banner e capas por frame, configure o FFmpeg no `.env.local`:

```env
FFMPEG_PATH=C:/Users/luisotavio/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe
```

## Dados

A versão já vem preenchida com o JSON exportado `portfolio-luis-otavio-dados(1).json`.
O admin salva no localStorage do navegador. Use "Exportar JSON" como backup.
