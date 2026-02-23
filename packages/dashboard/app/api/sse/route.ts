import { NextRequest } from "next/server";
import { listProjects, listEndpoints, listCheckRuns } from "@barkapi/core";
import { getDashboardDb } from "../../lib/db";

/**
 * Server-Sent Events endpoint.
 * Streams updated project/endpoint data every 3 seconds.
 * Clients subscribe with: new EventSource('/api/sse?projectId=1')
 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const poll = () => {
        try {
          getDashboardDb();

          if (projectId) {
            const id = parseInt(projectId);
            const endpoints = listEndpoints(id);
            const checkRuns = listCheckRuns(id, 10);
            send("endpoints", endpoints);
            send("checkRuns", checkRuns);
          } else {
            const projects = listProjects();
            send("projects", projects);
          }
        } catch {
          // DB may not exist yet — silently skip
        }
      };

      // Initial send
      poll();
      const timer = setInterval(poll, 3000);

      // Cleanup when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
