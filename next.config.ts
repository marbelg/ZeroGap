import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de comprobante/odómetro van en el mismo envío del
      // formulario (Server Action). El límite por defecto de Next es 1 MB,
      // insuficiente para una foto de cámara de celular — kilometraje puede
      // mandar 2 fotos en un solo envío, por eso el margen amplio.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
