import JSZip from "jszip";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadReceiptPhoto, getReceiptSignedUrl } from "@/lib/supabase/storage";
import { EXPENSE_TYPE_LABEL } from "@/lib/expense-meta";
import {
  CONTROL_VIATICOS_ROLE_BLOCKS,
  CONTROL_VIATICOS_ROLE_LABEL,
  getLastWeekApprovedExpenses,
  getPhotosByExpense,
  requireAdminUser,
} from "@/lib/control-viaticos";
import type { ExpensePhoto, PhotoType } from "@/types/database";

// Las fotos se sirven directo desde Supabase Storage (link firmado) en vez
// de viajar dentro de la respuesta de esta función — Vercel/Lambda corta la
// respuesta de una función serverless a ~6 MB, y varias fotos de celular
// juntas superan eso fácil.
export const maxDuration = 60;

const PHOTO_TYPE_LABEL: Record<PhotoType, string> = {
  COMPROBANTE: "Comprobante",
  ODOMETRO_INICIAL: "Odometro inicial",
  ODOMETRO_FINAL: "Odometro final",
};

function safeSegment(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim() || "sin-nombre";
}

function extensionOf(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
}

interface PhotoJob {
  photo: ExpensePhoto;
  folder: string;
  baseLabel: string;
  photoLabel: string;
}

export async function GET() {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { from, to, expenses, profileList, expensesByUser } =
    await getLastWeekApprovedExpenses(supabase);
  const photosByExpense = await getPhotosByExpense(supabase, expenses);

  const jobs: PhotoJob[] = [];
  for (const role of CONTROL_VIATICOS_ROLE_BLOCKS) {
    const people = profileList.filter(
      (p) => p.role === role && (expensesByUser.get(p.id) ?? []).length > 0,
    );

    for (const person of people) {
      const name =
        role === "HOTEL" ? person.first_name : `${person.first_name} ${person.last_name}`.trim();
      const personExpenses = expensesByUser.get(person.id) ?? [];

      for (const expense of personExpenses) {
        const expensePhotos = photosByExpense.get(expense.id) ?? [];
        if (expensePhotos.length === 0) continue;

        const folder = `${safeSegment(CONTROL_VIATICOS_ROLE_LABEL[role])}/${safeSegment(name)}/${expense.date}`;
        const baseLabel = safeSegment(EXPENSE_TYPE_LABEL[expense.type]);

        for (const photo of expensePhotos) {
          const photoLabel =
            photo.photo_type === "COMPROBANTE" ? "" : `_${safeSegment(PHOTO_TYPE_LABEL[photo.photo_type])}`;
          jobs.push({ photo, folder, baseLabel, photoLabel });
        }
      }
    }
  }

  if (jobs.length === 0) {
    return NextResponse.json(
      { error: "No hay comprobantes con foto en la semana pasada." },
      { status: 404 },
    );
  }

  const buffers = new Map<string, Buffer>();
  await Promise.all(
    jobs.map(async (job) => {
      const buffer = await downloadReceiptPhoto(supabase, job.photo.file_url);
      if (buffer) buffers.set(job.photo.id, buffer);
    }),
  );

  const zip = new JSZip();
  const usedPaths = new Set<string>();
  for (const job of jobs) {
    const buffer = buffers.get(job.photo.id);
    if (!buffer) continue;

    const ext = extensionOf(job.photo.file_url);
    let fileName = `${job.baseLabel}${job.photoLabel}.${ext}`;
    let fullPath = `${job.folder}/${fileName}`;
    let counter = 2;
    while (usedPaths.has(fullPath)) {
      fileName = `${job.baseLabel}${job.photoLabel} (${counter}).${ext}`;
      fullPath = `${job.folder}/${fileName}`;
      counter++;
    }
    usedPaths.add(fullPath);
    zip.file(fullPath, buffer);
  }

  if (usedPaths.size === 0) {
    return NextResponse.json(
      { error: "No se pudo descargar ninguna foto desde el almacenamiento." },
      { status: 500 },
    );
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const path = `reports/control-viaticos-fotos_${from}_${to}.zip`;
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, zipBuffer, { upsert: true, contentType: "application/zip" });

  if (uploadError) {
    return NextResponse.json({ error: "No se pudo generar el archivo." }, { status: 500 });
  }

  const signedUrl = await getReceiptSignedUrl(supabase, path, 300);
  if (!signedUrl) {
    return NextResponse.json({ error: "No se pudo generar el link de descarga." }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl);
}
