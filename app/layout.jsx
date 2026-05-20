import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Luís Otávio Emerenciano | Portfólio audiovisual",
  description:
    "Portfólio audiovisual de Luís Otávio Emerenciano, videomaker com experiência em captação, edição, direção de fotografia, entrevistas, drone, redes sociais, eventos e comunicação institucional.",
  keywords: [
    "Luís Otávio Emerenciano",
    "videomaker",
    "portfólio audiovisual",
    "portfólio de vídeos",
    "edição de vídeo",
    "captação de vídeo",
    "direção de fotografia",
    "operação de drone",
    "vídeos institucionais",
    "conteúdo para redes sociais",
  ],
  creator: "Luís Otávio Emerenciano",
  openGraph: {
    title: "Luís Otávio Emerenciano | Portfólio audiovisual",
    description:
      "Uma seleção de trabalhos em vídeo, com foco em comunicação institucional, redes sociais, eventos e narrativas visuais.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luís Otávio Emerenciano | Portfólio audiovisual",
    description:
      "Portfólio audiovisual com vídeos selecionados, funções por projeto e ferramentas utilizadas.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
