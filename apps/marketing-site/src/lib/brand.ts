import localFont from "next/font/local";
import { Oswald } from "next/font/google";

export const fontOswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontMardoto = localFont({
  src: [
    {
      path: "../../public/fonts/Mardoto-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Mardoto-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-mardoto",
  display: "swap",
});

/** Header / primary brand lockup (horizontal). */
export const LOGO_HORIZONTAL_SRC = "/logo-autopainel-horizontal.png";

/** Footer highlight lockup (stacked + slogan). */
export const LOGO_DESTAQUES_SRC = "/logo-autopainel-destaques.png";

export const FAVICON_SRC = "/favicon-autopainel.png";

export const BRAND_SLOGAN =
  "A operação digital da sua concessionária, no controle.";
