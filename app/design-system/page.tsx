import { notFound } from "next/navigation";
import { DesignSystemGallery } from "./gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Design system", robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignSystemGallery />;
}
