// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import InventoryShelf from '@/components/InventoryShelf'

export default function InventoryIndex() {
  return <InventoryShelf />
}
