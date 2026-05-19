import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = `${AGENT_API_URL}/api/events`;

  try {
    const response = await fetch(backendUrl, {
      headers: {
        "X-User-Email": session.user.email,
        "Accept": "text/event-stream",
      },
    });

    if (!response.ok || !response.body) {
      return new Response("Failed to connect to event stream", { status: 502 });
    }

    // Pipe the SSE stream through to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE proxy error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
