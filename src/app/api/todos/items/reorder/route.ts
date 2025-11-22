// src/app/api/todos/items/reorder/route.ts
export { runtime, dynamic, revalidate } from "../../reorder/route";

import { NextRequest } from "next/server";
import { handleTodoReorderRequest } from "../../reorder/handler";

export async function POST(req: NextRequest) {
  return handleTodoReorderRequest(req);
}
