import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZeroGap — Control de Gastos",
    short_name: "ZeroGap",
    description:
      "Reporta y administra gastos de empleados: alimentación, kilometraje y aprobaciones.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7fb",
    theme_color: "#5b4cf0",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
