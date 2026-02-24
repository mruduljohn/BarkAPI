import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getProject, getEndpoint, listDriftsByEndpoint, parseOpenAPISpec } from "barkapi-core";
import { getDashboardDb } from "../../../../../../lib/db";

const emptyResponse = {
  responseSchema: null,
  requestBodySchema: null,
  statusCode: null,
  drifts: [],
  driftsByField: {},
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Spec parse timeout")), ms)
    ),
  ]);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } }
) {
  getDashboardDb();

  const project = getProject(parseInt(params.id));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const endpoint = getEndpoint(parseInt(params.eid));
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  // Resolve spec path
  const resolvedPath = path.resolve(
    process.env.BARKAPI_PROJECT_DIR || process.cwd(),
    project.spec_path
  );

  // Check file exists before attempting parse
  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json(
      { ...emptyResponse, error: "Spec file not found: " + resolvedPath },
      { status: 200 }
    );
  }

  let parsedEndpoints;
  try {
    parsedEndpoints = await withTimeout(parseOpenAPISpec(resolvedPath), 10000);
  } catch (e: any) {
    return NextResponse.json(
      { ...emptyResponse, error: "Failed to parse spec: " + e.message },
      { status: 200 }
    );
  }

  // Match by method + path
  const match = parsedEndpoints.find(
    (ep) => ep.method === endpoint.method && ep.path === endpoint.path
  );

  if (!match) {
    return NextResponse.json(
      { ...emptyResponse, error: "Endpoint not found in spec" },
      { status: 200 }
    );
  }

  // Fetch all drifts for this endpoint
  const allDrifts = listDriftsByEndpoint(parseInt(params.eid), 1000, 0);

  // Deduplicate: keep only the latest drift per (field_path, drift_type) combo
  const seen = new Map<string, typeof allDrifts[0]>();
  for (const drift of allDrifts) {
    const key = `${drift.field_path}::${drift.drift_type}`;
    const existing = seen.get(key);
    if (!existing || new Date(drift.detected_at) > new Date(existing.detected_at)) {
      seen.set(key, drift);
    }
  }
  const drifts = Array.from(seen.values());

  // Group by field_path
  const driftsByField: Record<string, typeof drifts> = {};
  for (const drift of drifts) {
    if (!driftsByField[drift.field_path]) {
      driftsByField[drift.field_path] = [];
    }
    driftsByField[drift.field_path].push(drift);
  }

  const response = NextResponse.json({
    responseSchema: match.responseSchema,
    requestBodySchema: match.requestBodySchema,
    statusCode: match.statusCode,
    drifts,
    driftsByField,
  });

  response.headers.set("Cache-Control", "private, max-age=30");
  return response;
}
