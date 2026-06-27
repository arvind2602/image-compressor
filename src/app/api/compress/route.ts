import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
const archiver = require("archiver");
import { PassThrough } from "stream";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression for the zip itself
    });
    
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Convert PassThrough to a Web ReadableStream for Next.js Response
    const stream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk) => controller.enqueue(chunk));
        passThrough.on('end', () => controller.close());
        passThrough.on('error', (err) => controller.error(err));
      }
    });

    // Process all images concurrently
    Promise.all(files.map(async (file) => {
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
          
        archive.append(avifBuffer, { name: `${fileNameWithoutExt}.avif` });
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
      }
    })).then(() => {
      // Finalize the archive once all images are appended
      archive.finalize();
    }).catch(err => {
      console.error("Archive error:", err);
      archive.abort();
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="compressed_images.zip"'
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
