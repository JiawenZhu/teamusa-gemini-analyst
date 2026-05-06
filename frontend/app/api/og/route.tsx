import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract parameters from URL
    const arch = searchParams.get("arch") ?? "Olympic Archetype";
    const icon = searchParams.get("icon") ?? "🏅";
    const color = searchParams.get("color") ?? "#C9A227";
    const bmi = searchParams.get("bmi") ?? "21.0";
    const sports = searchParams.get("sports") ?? "Athletics, Swimming";
    const matches = searchParams.get("matches") ?? "0";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${color}, #0A1628)`,
            padding: "60px",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "4px", color: "rgba(255,255,255,0.8)" }}>
                TEAMUSA ORACLE
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                GOOGLE CLOUD × TEAMUSA HACKATHON
              </span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              🏅 ARCHETYPE PROFILE CARD
            </div>
          </div>

          {/* Main Content */}
          <div style={{ display: "flex", alignItems: "center", gap: "40px", marginBottom: "50px" }}>
            <div
              style={{
                fontSize: "130px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "30px",
                width: "200px",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {icon}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.7)", marginBottom: "8px" }}>
                YOUR MATCHED ARCHETYPE
              </span>
              <span style={{ fontSize: "72px", fontWeight: 900, lineHeight: 1.1 }}>
                {arch}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: "30px", marginBottom: "50px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "20px",
                padding: "24px 36px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span style={{ fontSize: "48px", fontWeight: 900 }}>{bmi}</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "1px" }}>
                YOUR BMI
              </span>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "20px",
                padding: "24px 36px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span style={{ fontSize: "48px", fontWeight: 900 }}>{matches}</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "1px" }}>
                DATABASE MATCHES
              </span>
            </div>
          </div>

          {/* Sports Alignments */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "2px", marginBottom: "12px" }}>
              TOP SPORT ALIGNMENTS
            </span>
            <span style={{ fontSize: "32px", fontWeight: 700 }}>
              {sports}
            </span>
          </div>

          {/* Footer Link */}
          <div style={{ position: "absolute", bottom: "60px", right: "60px", fontSize: "18px", opacity: 0.6 }}>
            teamusa-8b1ba.web.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.log(`${(e as Error).message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
