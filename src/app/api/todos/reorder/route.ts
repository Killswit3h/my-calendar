export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { handleTodoReorderRequest } from "./handler";

export async function PATCH(req: NextRequest) {
  return handleTodoReorderRequest(req);
}

