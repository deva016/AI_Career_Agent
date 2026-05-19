import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new NextResponse("Missing URL parameter", { status: 400 });
    }

    // Proxy the fetch through our server to attach the Vercel Blob token if needed
    // This allows the client-side <PDFViewer> to bypass CORS or Private Bucket 403s
    let headers: HeadersInit = {};
    if (url.includes("vercel-storage.com") && process.env.BLOB_READ_WRITE_TOKEN) {
      headers = {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      };
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch PDF: ${response.statusText}`, { status: response.status });
    }

    const blob = await response.blob();
    
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        // Force inline display rather than download, allowing React-PDF to buffer it
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error) {
    console.error("PDF Proxy API error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
