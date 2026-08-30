import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const ALLOWED_SIZES = [192, 512] as const;

export function generateStaticParams() {
  return ALLOWED_SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await params;
  const size = Number(sizeParam);

  if (!ALLOWED_SIZES.includes(size as (typeof ALLOWED_SIZES)[number])) {
    return NextResponse.json({ error: "unsupported size" }, { status: 404 });
  }

  // Margen de seguridad (~10%) para que el ícono se vea bien también como
  // maskable icon en Android (el sistema puede recortar el canvas en un
  // círculo o squircle).
  const fontSize = Math.round(size * 0.42);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6d5cf6 0%, #4a3cd6 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: -2,
          }}
        >
          ZG
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
