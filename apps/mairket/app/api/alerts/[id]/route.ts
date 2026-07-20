import { NextResponse } from "next/server";
import { deleteAlert, updateAlert } from "@/lib/database";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as { active?: unknown };
  if (typeof body.active !== "boolean") return NextResponse.json({ error: "active must be boolean" }, { status: 400 });
  if (!updateAlert(id, body.active)) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!deleteAlert(id)) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
