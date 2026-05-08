"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Database, Activity, Map, Medal } from "lucide-react";

export default function ApiDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const endpoints = [
    {
      id: "games",
      method: "GET",
      path: "/api/v1/public/games",
      title: "List Games History",
      description: "Retrieve a historical timeline of all Team USA Games appearances (1896-2016), including host cities, total athletes, and participating nations.",
      icon: <Map className="w-6 h-6" style={{ color: "#C9A227" }} />,
      code: `curl -X GET "https://api.teamusa.app/api/v1/public/games"`,
      response: `{
  "data": [
    {
      "year": 2016,
      "season": "Summer",
      "city": "Rio de Janeiro",
      "total_athletes": 13688,
      "total_nations": 207
    },
    // ...
  ]
}`
    },
    {
      id: "nations",
      method: "GET",
      path: "/api/v1/public/nations",
      title: "List Nations (NOCs)",
      description: "Get a complete leaderboard of all National Olympic Committees, their total athletes, and their historical gold, silver, and bronze medal counts.",
      icon: <Database className="w-6 h-6" style={{ color: "#C9A227" }} />,
      code: `curl -X GET "https://api.teamusa.app/api/v1/public/nations"`,
      response: `{
  "data": [
    {
      "noc": "USA",
      "team_name": "United States",
      "total_athletes": 12891,
      "gold_medals": 2638,
      "silver_medals": 1641,
      "bronze_medals": 1358,
      "total_medals": 5637
    }
  ]
}`
    },
    {
      id: "sports",
      method: "GET",
      path: "/api/v1/public/sports",
      title: "List Sports",
      description: "Retrieve a list of all historical and current Team USA sports, including their first and latest appearance years and total unique events.",
      icon: <Activity className="w-6 h-6" style={{ color: "#C9A227" }} />,
      code: `curl -X GET "https://api.teamusa.app/api/v1/public/sports"`,
      response: `{
  "data": [
    {
      "sport": "Basketball",
      "first_appearance": 1936,
      "latest_appearance": 2016,
      "total_events": 2
    }
  ]
}`
    },
    {
      id: "athletes",
      method: "GET",
      path: "/api/v1/public/athletes",
      title: "Search Athletes (Aggregate)",
      description: "Query aggregate biometric statistics across 135,000+ historical Olympic athlete records (1896–2016 public dataset). Filter by sport or sex to retrieve demographic averages. This endpoint returns statistical summaries, not individual profiles.",
      icon: <Activity className="w-6 h-6" style={{ color: "#C9A227" }} />,
      params: [
        { name: "sport", type: "string", desc: "Filter by sport name (e.g., 'Swimming', 'Athletics')" },
        { name: "sex", type: "string", desc: "'M' or 'F'" },
        { name: "noc", type: "string", desc: "3-letter country code (e.g., 'USA')" },
        { name: "page", type: "integer", desc: "Page number (default: 1)" },
        { name: "limit", type: "integer", desc: "Results per page (max: 100)" }
      ],
      code: `curl -X GET "https://api.teamusa.app/api/v1/public/athletes?sport=Swimming&noc=USA&limit=5"`,
      response: `{
  "data": [
    {
      "sport": "Swimming",
      "noc": "USA",
      "sex": "M",
      "avg_height_cm": 187.4,
      "avg_weight_kg": 79.2,
      "total_athletes": 412
    }
  ],
  "meta": { "total_count": 1, "page": 1, "limit": 5, "has_more": false }
}`
    },
    {
      id: "athlete-details",
      method: "GET",
      path: "/api/v1/public/sports/{sport}/history",
      title: "Sport History & Medal Trends",
      description: "Get a chronological medal trend for a specific sport across all Games in our dataset (1896–2016). Returns year-by-year aggregate medal counts per nation — no individual athlete data.",
      icon: <Terminal className="w-6 h-6" style={{ color: "#C9A227" }} />,
      code: `curl -X GET "https://api.teamusa.app/api/v1/public/sports/Swimming/history"`,
      response: `{
  "sport": "Swimming",
  "history": [
    {
      "year": 2016,
      "city": "Rio de Janeiro",
      "noc": "USA",
      "gold_medals": 16,
      "total_medals": 33
    }
  ]
}`
    },
    {
      id: "results",
      method: "GET",
      path: "/api/v1/public/results",
      title: "Medal Aggregate Matrix",
      description: "Query aggregate medal counts by nation, year, and sport across 271,000+ historical records (1896–2016 public dataset). Returns statistical summaries, not individual athlete profiles.",
      icon: <Medal className="w-6 h-6" style={{ color: "#C9A227" }} />,
      params: [
        { name: "noc", type: "string", desc: "3-letter country code (e.g., 'USA')" },
        { name: "year", type: "integer", desc: "Olympic year (1896–2016)" },
        { name: "medal", type: "string", desc: "'Gold', 'Silver', or 'Bronze'" },
        { name: "sport", type: "string", desc: "Sport name (e.g., 'Swimming')" }
      ],
      code: `curl -X GET "https://api.teamusa.app/api/v1/public/results?noc=USA&medal=Gold&year=2016"`,
      response: `{
  "summary": {
    "noc": "USA",
    "year": 2016,
    "gold_medals": 46,
    "silver_medals": 37,
    "bronze_medals": 38,
    "top_sport": "Swimming"
  },
  "by_sport": [
    { "sport": "Swimming", "gold_medals": 16 },
    { "sport": "Athletics", "gold_medals": 13 }
  ],
  "meta": { "total_count": 139, "page": 1, "limit": 50, "has_more": true }
}`
    }
  ];

  return (
    <main style={{ background: "#050D1F", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", padding: "80px 24px 64px", textAlign: "center",
        background: "radial-gradient(ellipse 90% 60% at 50% -5%, #C9A22718, transparent)",
        borderBottom: "1px solid #C9A22720",
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#C9A22718", border: "1px solid #C9A22740", borderRadius: 99, padding: "6px 16px", marginBottom: 20 }}>
          <Database className="w-4 h-4 text-[#C9A227]" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", color: "#C9A227" }}>PUBLIC REST API v1.0</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 900, lineHeight: 1.08, marginBottom: 16, letterSpacing: "-1px" }}>
          TeamUSA<br />
          <span style={{ color: "#C9A227" }}>Open Data</span>
        </h1>
        <p style={{ fontSize: 18, color: "#94A3B8", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          Programmatic access to 120 years of Team USA sports history. Designed for researchers, journalists, and sports fans to query 271,000+ historical records.
        </p>
      </section>

      {/* ── API DOCUMENTATION ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        
        {/* Core Concepts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 64 }}>
          <div style={{ background: "#0A1628", border: "1px solid #1E293B", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#C9A227" }}>🔓</span> Authentication
            </h3>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>
              This API is fully public. No API keys or authentication tokens are required. You are subject to standard IP-based rate limits to ensure stability.
            </p>
          </div>
          <div style={{ background: "#0A1628", border: "1px solid #1E293B", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#C9A227" }}>📄</span> Pagination
            </h3>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>
              List endpoints support <code style={{ color: "#C9A227", background: "#C9A22718", padding: "2px 6px", borderRadius: 4 }}>page</code> and <code style={{ color: "#C9A227", background: "#C9A22718", padding: "2px 6px", borderRadius: 4 }}>limit</code> query parameters. Responses include a <code style={{ color: "#C9A227", background: "#C9A22718", padding: "2px 6px", borderRadius: 4 }}>meta</code> object indicating total counts.
            </p>
          </div>
        </div>

        {/* Endpoints */}
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {endpoints.map((ep) => (
            <div key={ep.id} style={{ background: "#0A1628", border: "1px solid #1E293B", borderRadius: 20, padding: 32 }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                {ep.icon}
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{ep.title}</h2>
              </div>
              <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.6, marginBottom: 24 }}>
                {ep.description}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#050D1F", border: "1px solid #1E293B", borderRadius: 10, padding: "12px 16px", marginBottom: 32 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#C9A227", letterSpacing: "0.05em" }}>{ep.method}</span>
                <span style={{ fontSize: 14, fontFamily: "monospace", color: "#E2E8F0" }}>{ep.path}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 32 }}>
                
                {/* Parameters */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em", marginBottom: 12 }}>QUERY PARAMETERS</h4>
                  {ep.params ? (
                    <div style={{ background: "#050D1F", border: "1px solid #1E293B", borderRadius: 12, overflow: "hidden" }}>
                      {ep.params.map((p, i) => (
                        <div key={p.name} style={{ display: "flex", borderBottom: i !== ep.params!.length - 1 ? "1px solid #1E293B" : "none", padding: "12px 16px" }}>
                          <div style={{ width: 100, fontSize: 13, fontFamily: "monospace", color: "#C9A227", fontWeight: 600 }}>{p.name}</div>
                          <div style={{ flex: 1, fontSize: 13, color: "#94A3B8" }}>{p.desc}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#64748B", fontStyle: "italic" }}>No query parameters required.</div>
                  )}
                </div>

                {/* Code Examples */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#050D1F", border: "1px solid #1E293B", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #1E293B", background: "#0A1628" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>REQUEST</span>
                      <button onClick={() => handleCopy(ep.code, `req-${ep.id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                        {copiedId === `req-${ep.id}` ? <Check className="w-3.5 h-3.5 text-[#C9A227]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <pre style={{ margin: 0, padding: 16, fontSize: 13, fontFamily: "monospace", color: "#E2E8F0", overflowX: "auto" }}>
                      {ep.code}
                    </pre>
                  </div>

                  <div style={{ background: "#050D1F", border: "1px solid #1E293B", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #1E293B", background: "#0A1628" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>RESPONSE</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A227" }}>200 OK</span>
                    </div>
                    <pre style={{ margin: 0, padding: 16, fontSize: 13, fontFamily: "monospace", color: "#94A3B8", overflowX: "auto" }}>
                      {ep.response}
                    </pre>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #1E293B", padding: "32px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7 }}>
          Built for the{" "}
          <a href="https://vibecodeforgoldwithgoogle.devpost.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A227", fontWeight: 700, textDecoration: "none" }}>
            Vibe Code for Gold with Google
          </a>{" "}
          hackathon.
        </p>
        <p style={{ fontSize: 11, color: "#64748B", marginTop: 6, lineHeight: 1.7, maxWidth: 620, margin: "6px auto 0" }}>
          This project uses the{" "}
          <a href="https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results/data" target="_blank" rel="noopener noreferrer" style={{ color: "#64748B", textDecoration: "underline" }}>
            CC0 Kaggle 120 Years of Olympic History dataset
          </a>
          , filtered to Team USA records from 1896–2016. All user-facing insights are aggregate, anonymized, and conditional.
        </p>
        <p style={{ fontSize: 11, color: "#1E293B", marginTop: 8 }}>
          Powered by Google Cloud · FastAPI · PostgreSQL
        </p>
      </footer>
    </main>
  );
}
