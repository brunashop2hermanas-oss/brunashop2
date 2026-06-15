import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file received" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.name.split(".").pop();
    const filename = `img-${uniqueSuffix}.${ext}`;

    // Save to public/uploads
    const path = join(process.cwd(), "public", "uploads", filename);
    await writeFile(path, buffer);

    // Return the URL
    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
