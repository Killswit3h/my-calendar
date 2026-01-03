// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import EstimateQBForm from '@/app/(components)/estimates/EstimateQBForm'

export default function NewEstimatePage() {
  return <EstimateQBForm />
}
