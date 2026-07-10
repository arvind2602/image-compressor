import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const left = parseInt(formData.get("left") as string);
    const top = parseInt(formData.get("top") as string);
    const width = parseInt(formData.get("width") as string);
    const height = parseInt(formData.get("height") as string);
    const quality = parseInt(formData.get("quality") as string) || 85;

    if (!image) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileNameWithoutExt =
      image.name.substring(0, image.name.lastIndexOf(".")) || image.name;
    const safeName = fileNameWithoutExt.replace(/[^\x20-\x7E]/g, "_");

    // Use WebP with effort 0 for speed. AVIF effort 4 was the main bottleneck.
    const outputBuffer = await sharp(buffer)
      .extract({ left, top, width, height })
      .webp({ quality, effort: 0 })
      .toBuffer();

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": `attachment; filename="${safeName}_cropped.webp"`,
      },
    });
  } catch (error: any) {
    console.error("Crop error:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
