import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiSalud FamilIA",
    short_name: "MiSalud IA",
    description: "Bóveda médica familiar inteligente — organiza y comparte documentos de salud con IA.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#f7fafc",
    theme_color: "#002045",
    orientation: "portrait-primary",
    categories: ["health", "medical", "productivity"],
    lang: "es-CO",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Subir documento",
        short_name: "Subir",
        description: "Agregar un documento medico a la boveda",
        url: "/boveda/subir",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Resumen de emergencia",
        short_name: "Emergencia",
        description: "Abrir el resumen medico de emergencia",
        url: "/emergencia",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
