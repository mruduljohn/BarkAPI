import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@barkapi/core";
import { getDashboardDb } from "../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const project = getProject(parseInt(params.id));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const body = await req.json();
  const project = updateProject(parseInt(params.id), body);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  deleteProject(parseInt(params.id));
  return NextResponse.json({ ok: true });
}
