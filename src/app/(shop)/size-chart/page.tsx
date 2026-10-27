import type { Metadata } from "next";
import { InfoPageShell } from "@/components/shop/info-page-shell";
import { SizeChartViewer } from "@/components/shop/size-chart-viewer";
import { getSizeChartUrl } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Size Chart",
  description: "View the Suit Society size chart for accurate fit guidance.",
};

export default async function SizeChartPage() {
  const imageUrl = await getSizeChartUrl();

  return (
    <InfoPageShell
      title="Size Chart"
      subtitle="Find your perfect fit with our detailed size guide."
    >
      <SizeChartViewer imageUrl={imageUrl} />
    </InfoPageShell>
  );
}
