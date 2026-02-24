import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "barkapi-core";
import { getDashboardDb } from "../../lib/db";

export async function GET() {
  getDashboardDb();
  const projects = listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  getDashboardDb();
  const body = await req.json();
  const project = createProject(body.name, body.spec_path, body.base_url);
  return NextResponse.json(project, { status: 201 });
}
