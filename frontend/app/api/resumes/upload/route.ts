import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("POST /api/resumes/upload session:", !!session);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (process.env.BLOB_READ_WRITE_TOKEN && file && file.name && session?.user?.email) {
      try {
        const { put } = await import('@vercel/blob');
        let blob;
        try {
          blob = await put(`resumes/${session.user.email}/${file.name}`, file, { 
            access: 'public',
            addRandomSuffix: true 
          });
        } catch (e) {
          blob = await put(`resumes/${session.user.email}/${file.name}`, file, { 
            access: 'private',
            addRandomSuffix: true
          });
        }
        formData.append("pdf_url", blob.url);
      } catch (error) {
        console.error("Vercel Blob upload failed:", error);
      }
    }

    const response = await fetch(`${AGENT_API_URL}/api/resumes/upload`, {
      method: "POST",
      headers: {
        "X-User-Email": session.user.email,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      return NextResponse.json(
        { error: error.detail || "Failed to upload resume" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload resume API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
