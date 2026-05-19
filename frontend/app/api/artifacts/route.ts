import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Forward relevant query params
    const backendParams = new URLSearchParams();
    ['job_id', 'mission_id', 'type'].forEach(param => {
      const val = searchParams.get(param);
      if (val) backendParams.append(param, val);
    });
    
    const queryString = backendParams.toString();
    const url = queryString 
      ? `${AGENT_API_URL}/api/artifacts?${queryString}`
      : `${AGENT_API_URL}/api/artifacts`;

    const response = await fetch(url, {
      headers: {
        "X-User-Email": session.user.email,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorDetail = "Failed to fetch artifacts";
      try {
        if (response && typeof response.json === "function") {
          const error = await response.json();
          errorDetail = error.detail || errorDetail;
        }
      } catch (_) {
        // ignore
      }
      return NextResponse.json(
        { error: errorDetail },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Artifacts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
