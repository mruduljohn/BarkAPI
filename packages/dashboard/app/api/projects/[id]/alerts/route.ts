import { NextRequest, NextResponse } from "next/server";
import {
  listAlertConfigs,
  createAlertConfig,
  updateAlertConfig,
  deleteAlertConfig,
} from "@barkapi/core";
import { getDashboardDb } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const configs = listAlertConfigs(parseInt(params.id));
  return NextResponse.json(configs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const body = await req.json();
  const config = createAlertConfig(
    parseInt(params.id),
    body.type,
    body.config || {},
    body.min_severity || "breaking"
  );
  return NextResponse.json(config, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  getDashboardDb();
  const body = await req.json();
  const config = updateAlertConfig(body.id, body);
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(config);
}

export async function DELETE(req: NextRequest) {
  getDashboardDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteAlertConfig(parseInt(id));
  return NextResponse.json({ ok: true });
}
