import re

with open('app/page.tsx', 'r') as f:
    code = f.read()

# 1. Update Imports
code = code.replace(
    'import { Sparkles, Medal, ChevronRight, Terminal, Activity } from "lucide-react";',
    'import { Sparkles, Medal, ChevronRight, Terminal, Activity, ArrowUp, MoreHorizontal, User } from "lucide-react";'
)

# 2. Update parseInline
parseInline_old = """function parseInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: "var(--text-main)", textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}"""

parseInline_new = """function parseInline(text: string, highlightColor?: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: highlightColor || "var(--text-main)" }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}"""
code = code.replace(parseInline_old, parseInline_new)

# 3. Update FormattedBotMessage calls to parseInline
code = code.replace('parseInline(block.replace(\'### \', \'\'))', 'parseInline(block.replace(\'### \', \'\'), color)')
code = code.replace('parseInline(cleanLine)', 'parseInline(cleanLine, color)')
code = code.replace('parseInline(cleanText)', 'parseInline(cleanText, color)')
code = code.replace('parseInline(block)', 'parseInline(block, color)')

# 4. Update the bullet point styling
bullet_old = """                return (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginLeft: isIndented ? 24 : 0 }}>
                    <ChevronRight className="w-3.5 h-3.5 mt-1 shrink-0" style={{ color }} />
                    <span style={{ flex: 1 }}>{parseInline(cleanLine, color)}</span>
                  </li>
                );"""
bullet_new = """                return (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginLeft: isIndented ? 24 : 0, marginBottom: 4 }}>
                    <div style={{ background: `${color}25`, borderRadius: "50%", padding: 3, marginTop: 4 }}>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    </div>
                    <span style={{ flex: 1, lineHeight: 1.65 }}>{parseInline(cleanLine, color)}</span>
                  </li>
                );"""
code = code.replace(bullet_old, bullet_new)

# 5. Update Chat UI
chat_old = """          {/* Chat */}
          {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: "var(--bg-card)", border: "1px solid #1E293B", borderRadius: 16, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Terminal className="w-5 h-5" style={{ color: result.archetype.color }} />
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>Ask the Oracle</h3>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 20 }}>Powered by Gemini Function Calling · Queries the live 271k row Olympic database</p>

            <div ref={chatContainerRef} style={{ minHeight: 120, maxHeight: 500, overflowY: "auto", marginBottom: 16, paddingRight: 8, display: "flex", flexDirection: "column", gap: 16 }}>
              {chat.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  key={i}
                  style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                >
                  <div style={{
                    maxWidth: "85%", padding: "14px 18px", borderRadius: 16, fontSize: 14, lineHeight: 1.6,
                    background: m.role === "user" ? `linear-gradient(135deg, ${result.archetype.color}DD, ${result.archetype.color}99)` : "var(--bg-main)",
                    border: m.role === "user" ? "none" : "1px solid #1E293B",
                    color: m.role === "user" ? "var(--bg-main)" : "var(--text-muted)",
                    borderBottomRightRadius: m.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: m.role === "user" ? 16 : 4,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}>
                    {m.role === "user" ? (
                      <span style={{ fontWeight: 600 }}>{m.text}</span>
                    ) : (
                      <FormattedBotMessage text={m.text} color={result.archetype.color} />
                    )}
                  </div>
                </motion.div>
              ))}
              {chatLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 8, alignItems: "center", color: result.archetype.color, padding: "12px 16px", background: "var(--bg-main)", borderRadius: 12, width: "fit-content", border: "1px solid #1E293B" }}>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Consulting the historical data...</span>
                </motion.div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, position: "relative" }}>
              <input id="chat-input" value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doChat()}
                placeholder="e.g. Which athlete got the most gold medals from 2008 to 2016?"
                style={{ flex: 1, background: "var(--bg-main)", border: "1px solid #1E293B", borderRadius: 12, padding: "14px 16px", color: "var(--text-main)", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = result.archetype.color}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
              />
              <button id="chat-send" onClick={doChat} disabled={chatLoading || !msg.trim()}
                style={{ padding: "0 24px", borderRadius: 12, background: result.archetype.color, border: "none", color: "var(--bg-main)", fontWeight: 800, cursor: chatLoading ? "not-allowed" : "pointer", fontSize: 14, opacity: chatLoading ? 0.6 : 1, transition: "transform 0.1s", display: "flex", alignItems: "center", gap: 6 }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Send <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
          )}"""

chat_new = """          {/* Chat */}
          {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 24, padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ background: `linear-gradient(135deg, ${result.archetype.color}, ${result.archetype.color}AA)`, borderRadius: 10, padding: 8, boxShadow: `0 4px 12px ${result.archetype.color}40` }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>Ask the Oracle</h3>
                <p style={{ fontSize: 12, color: "var(--text-sub)", fontWeight: 500 }}>Powered by Gemini Function Calling · Queries the live 271k row Olympic database</p>
              </div>
            </div>

            <div ref={chatContainerRef} style={{ minHeight: 180, maxHeight: 500, overflowY: "auto", margin: "24px 0", paddingRight: 8, display: "flex", flexDirection: "column", gap: 24 }}>
              {chat.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  key={i}
                  style={{ display: "flex", gap: 12, alignItems: "flex-end", alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}
                >
                  {m.role !== "user" && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${result.archetype.color}, #0A1628)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 10px ${result.archetype.color}40` }}>
                      <Sparkles className="w-4 h-4" style={{ color: "#FFF" }} />
                    </div>
                  )}
                  <div style={{
                    padding: "16px 20px", fontSize: 14.5, lineHeight: 1.6,
                    background: m.role === "user" ? `linear-gradient(135deg, ${result.archetype.color}, ${result.archetype.color}DD)` : "var(--bg-main)",
                    border: m.role === "user" ? "none" : "1px solid var(--border-color)",
                    color: m.role === "user" ? "#FFF" : "var(--text-main)",
                    borderRadius: 20,
                    borderBottomRightRadius: m.role === "user" ? 4 : 20,
                    borderBottomLeftRadius: m.role === "user" ? 20 : 4,
                    boxShadow: m.role === "user" ? `0 8px 24px ${result.archetype.color}40` : "0 8px 24px rgba(0,0,0,0.04)",
                  }}>
                    {m.role === "user" ? (
                      <span style={{ fontWeight: 600 }}>{m.text}</span>
                    ) : (
                      <FormattedBotMessage text={m.text} color={result.archetype.color} />
                    )}
                  </div>
                  {m.role === "user" && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {chatLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", gap: 12, alignItems: "flex-end", alignSelf: "flex-start" }}>
                   <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${result.archetype.color}, #0A1628)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 10px ${result.archetype.color}40` }}>
                     <Sparkles className="w-4 h-4" style={{ color: "#FFF" }} />
                   </div>
                   <div style={{ padding: "16px 20px", background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 20, borderBottomLeftRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
                     <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: 6, height: 6, borderRadius: "50%", background: result.archetype.color }} />
                     <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} style={{ width: 6, height: 6, borderRadius: "50%", background: result.archetype.color }} />
                     <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} style={{ width: 6, height: 6, borderRadius: "50%", background: result.archetype.color }} />
                   </div>
                </motion.div>
              )}
            </div>

            <div style={{ 
              display: "flex", alignItems: "center", gap: 12, position: "relative",
              background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: 99, 
              padding: "6px 6px 6px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              transition: "border-color 0.2s, box-shadow 0.2s"
            }}
              onFocus={(e) => { e.currentTarget.style.borderColor = result.archetype.color; e.currentTarget.style.boxShadow = `0 8px 32px ${result.archetype.color}20`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.05)"; }}
            >
              <input id="chat-input" value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doChat()}
                placeholder="Ask the Oracle about Olympic history..."
                style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-main)", fontSize: 15, outline: "none" }}
              />
              <button id="chat-send" onClick={doChat} disabled={chatLoading || !msg.trim()}
                style={{ 
                  width: 44, height: 44, borderRadius: "50%", 
                  background: msg.trim() ? `linear-gradient(135deg, ${result.archetype.color}, ${result.archetype.color}DD)` : "var(--border-color)", 
                  border: "none", color: "#FFF", 
                  cursor: chatLoading || !msg.trim() ? "not-allowed" : "pointer", 
                  opacity: chatLoading ? 0.5 : 1, transition: "all 0.2s", 
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: msg.trim() ? `0 4px 12px ${result.archetype.color}50` : "none"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
          )}"""
code = code.replace(chat_old, chat_new)

with open('app/page.tsx', 'w') as f:
    f.write(code)

