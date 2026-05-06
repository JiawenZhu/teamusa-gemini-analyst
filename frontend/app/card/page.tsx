import { Metadata } from "next";
import { Suspense } from "react";
import CardClient from "./CardClient";

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const arch = searchParams.arch ?? "Olympic Archetype";
  const icon = searchParams.icon ?? "🏅";
  const color = searchParams.color ?? "#C9A227";
  const bmi = searchParams.bmi ?? "21.0";
  const sports = searchParams.sports ?? "Athletics, Swimming";
  const matches = searchParams.matches ?? "0";

  // Construct the OG image URL
  const ogUrl = new URL("/api/og", "https://teamusa-8b1ba.web.app");
  if (typeof arch === 'string') ogUrl.searchParams.set("arch", arch);
  if (typeof icon === 'string') ogUrl.searchParams.set("icon", icon);
  if (typeof color === 'string') ogUrl.searchParams.set("color", color);
  if (typeof bmi === 'string') ogUrl.searchParams.set("bmi", bmi);
  if (typeof sports === 'string') ogUrl.searchParams.set("sports", sports);
  if (typeof matches === 'string') ogUrl.searchParams.set("matches", matches);

  return {
    title: `My TeamUSA Archetype: ${arch}`,
    description: `My biometric profile aligns with the ${arch} archetype across 120 years of Team USA history. Find yours!`,
    openGraph: {
      title: `TeamUSA Archetype Profile: ${arch}`,
      description: `Matched with ${arch} based on 120 years of Team USA history.`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `TeamUSA Archetype Profile: ${arch}`,
      description: `My biometric profile aligns with the ${arch} archetype in the TeamUSA Gemini Analyst.`,
      images: [ogUrl.toString()],
    },
  };
}

export default function CardPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--navy)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading card...</div>}>
      <CardClient />
    </Suspense>
  );
}
