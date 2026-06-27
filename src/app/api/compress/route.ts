import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const zip = new AdmZip();

    // Process all images sequentially to prevent Out of Memory (OOM) errors
    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        
        const avifBuffer = await sharp(buffer)
          .resize({
            width: 1920,
            height: 1920,
            fit: 'inside',
            withoutEnlargement: true
          })
          .avif({ 
            quality: 60, 
            effort: 4 
          })
          .toBuffer();
          
        zip.addFile(`${fileNameWithoutExt}.avif`, avifBuffer);
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        throw err; // Re-throw to be caught by the outer catch
      }
    }

    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="compressed_images.zip"'
      }
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error.message || String(error)
    }, { status: 500 });
  }
}
