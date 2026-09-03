// Banderas dibujadas como SVG en vez de emoji: los emoji de bandera son dos
// letras "regional indicator" unidas por el sistema operativo — en varios
// navegadores de Windows no se dibuja la bandera y se ve el texto plano
// ("CR", "US", "CA") en su lugar. Un SVG propio se ve igual en cualquier
// sistema.
import type { ReactNode } from "react";

function FlagFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 14"
      className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function CostaRicaFlag() {
  return (
    <FlagFrame>
      <rect width="20" height="14" fill="#002B7F" />
      <rect y="2.33" width="20" height="9.33" fill="#fff" />
      <rect y="4.67" width="20" height="4.67" fill="#CE1126" />
    </FlagFrame>
  );
}

export function UnitedStatesFlag() {
  return (
    <FlagFrame>
      <rect width="20" height="14" fill="#B31942" />
      {[1, 3, 5, 7, 9, 11].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#fff" />
      ))}
      <rect width="8" height="7.54" fill="#0A3161" />
    </FlagFrame>
  );
}

export function CanadaFlag() {
  return (
    <FlagFrame>
      <rect width="20" height="14" fill="#fff" />
      <rect width="5" height="14" fill="#D80621" />
      <rect x="15" width="5" height="14" fill="#D80621" />
      <path
        d="M10 3.2 10.9 5l1.9-.4-.8 1.7 1.5 1.2-1.8.4.2 1.4-1.3-.6-.6 1.3-.6-1.3-1.3.6.2-1.4-1.8-.4 1.5-1.2-.8-1.7 1.9.4Z"
        fill="#D80621"
      />
      <rect x="9.5" y="9.6" width="1" height="1.8" fill="#D80621" />
    </FlagFrame>
  );
}

export function FlagIcon({ locale }: { locale: "es" | "en" | "fr" }) {
  if (locale === "en") return <UnitedStatesFlag />;
  if (locale === "fr") return <CanadaFlag />;
  return <CostaRicaFlag />;
}
