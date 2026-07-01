import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

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

    const avifBuffer = await sharp(buffer)
      .extract({ left, top, width, height })
      .avif({ quality, effort: 4 })
      .toBuffer();

    return new NextResponse(new Uint8Array(avifBuffer), {
      headers: {
        "Content-Type": "image/avif",
        "Content-Disposition": `attachment; filename="${fileNameWithoutExt}_cropped.avif"`,
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
