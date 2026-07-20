import { NextResponse } from "next/server";
import { deleteAlert, updateAlert } from "@/lib/database";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { active?: unknown; owner?: unknown };
  if (typeof body.owner !== "string") return NextResponse.json({ error: "Owner is required" }, { status: 400 });
  if (typeof body.active !== "boolean") return NextResponse.json({ error: "active must be boolean" }, { status: 400 });
  if (!updateAlert(body.owner, id, body.active)) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workspace = new URL(request.url).searchParams.get("owner");
  if (!workspace) return NextResponse.json({ error: "Owner is required" }, { status: 400 });
  if (!deleteAlert(workspace, id)) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
