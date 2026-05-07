import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract parameters from URL
    const id = searchParams.get("id") ?? "aerobic_engine";
    const arch = searchParams.get("arch") ?? "Olympic Archetype";
    const color = searchParams.get("color") ?? "#3B82F6";
    const bmi = searchParams.get("bmi") ?? "22.4";
    const sports = searchParams.get("sports") ?? "Athletics, Swimming, Gymnastics";
    const matches = searchParams.get("matches") ?? "847";

    const origin = req.nextUrl.origin;
    const imageUrl = `${origin}/archetypes/${id}.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            background: `linear-gradient(165deg, ${color}, ${color}DD, #0F172A)`,
            padding: "80px",
            color: "white",
            fontFamily: "Inter, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background Decorative Accents */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              right: "-10%",
              width: "800px",
              height: "800px",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)`,
              opacity: 0.5,
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "60px",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#EF4444" }} />
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "white" }} />
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3B82F6" }} />
                <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "5px", marginLeft: "10px", color: "white" }}>
                  TEAM USA ORACLE
                </span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: "8px", letterSpacing: "1px" }}>
                GOOGLE CLOUD HACKATHON 2026
              </span>
            </div>
            <div style={{ 
              background: "rgba(255,255,255,0.1)", 
              padding: "10px 24px", 
              borderRadius: "100px", 
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "14px", 
              fontWeight: 800, 
              color: "#FFFFFF",
              letterSpacing: "2px"
            }}>
              AUTHENTICATED DNA PROFILE
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "60px", marginBottom: "60px", position: "relative", zIndex: 10 }}>
            <div
              style={{
                background: "white",
                borderRadius: "50px",
                width: "240px",
                height: "240px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid rgba(255,255,255,0.3)",
                boxShadow: "0 40px 80px -20px rgba(0,0,0,0.4)",
                overflow: "hidden",
              }}
            >
              <img 
                src={imageUrl} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "4px", color: "rgba(255,255,255,0.7)", marginBottom: "12px", textTransform: "uppercase" }}>
                Genetic Archetype Identified
              </span>
              <span style={{ fontSize: "84px", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-2px", color: "white" }}>
                {arch}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: "24px", width: "100%", position: "relative", zIndex: 10 }}>
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                borderRadius: "32px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", marginBottom: "10px", textTransform: "uppercase" }}>
                Profile BMI
              </span>
              <span style={{ fontSize: "52px", fontWeight: 900, color: "white" }}>{bmi}</span>
            </div>
            
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                borderRadius: "32px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", marginBottom: "10px", textTransform: "uppercase" }}>
                Historical Matches
              </span>
              <span style={{ fontSize: "52px", fontWeight: 900, color: "white" }}>{matches}</span>
            </div>

            <div
              style={{
                flex: 2,
                background: "rgba(255,255,255,0.03)",
                borderRadius: "32px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "2px", marginBottom: "10px", textTransform: "uppercase" }}>
                Primary Sport Alignments
              </span>
              <span style={{ fontSize: "28px", fontWeight: 800, color: "white", lineHeight: 1.2 }}>
                {sports}
              </span>
              <div style={{ position: "absolute", bottom: "32px", right: "32px", fontSize: "24px" }}>🥇</div>
            </div>
          </div>

          {/* Footer Bar */}
          <div style={{ 
            marginTop: "auto", 
            width: "100%", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            paddingTop: "40px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            position: "relative",
            zIndex: 10,
          }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>
              VIBE CODE FOR GOLD WITH GOOGLE
            </span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#6366F1" }}>
              teamusa-oracle.app
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
