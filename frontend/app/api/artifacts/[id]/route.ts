import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(`${AGENT_API_URL}/api/artifacts/${id}`, {
      headers: {
        "X-User-Email": session.user.email,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorDetail = "Artifact not found";
      try {
        if (response && typeof response.json === "function") {
          const error = await response.json();
          errorDetail = error.detail || errorDetail;
        }
      } catch (_) {
        // ignore parsing error
      }
      return NextResponse.json(
        { error: errorDetail },
        { status: response.status || 500 }
      );
    }

    // Forward stream and headers
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");
    
    if (contentType) headers.set("content-type", contentType);
    if (contentDisposition) headers.set("content-disposition", contentDisposition);
    
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("Artifact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const response = await fetch(`${AGENT_API_URL}/api/artifacts/${id}`, {
      method: "DELETE",
      headers: { "X-User-Email": session.user.email },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to delete" }, { status: response.status });
    }

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("Delete artifact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

