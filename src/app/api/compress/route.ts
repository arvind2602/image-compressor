import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];
    const quality = parseInt(formData.get("quality") as string) || 85;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const zip = new AdmZip();

    // Process files sequentially to prevent memory/CPU exhaustion with 100MB+ files
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileNameWithoutExt =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      const safeName = fileNameWithoutExt.replace(/[^\x20-\x7E]/g, "_");

      // WebP effort:0 is ~10-50x faster than AVIF effort:4 with comparable quality
      const webpBuffer = await sharp(buffer)
        .webp({ quality, effort: 0 })
        .toBuffer();

      zip.addFile(`${safeName}.webp`, webpBuffer);
    }

    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="compressed_images.zip"',
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
