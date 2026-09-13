export function AppBypassPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        fontFamily: "system-ui, sans-serif",
        background: "#fff",
        color: "#111",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600 }}>app-bypass</div>
      <div style={{ fontSize: 13, color: "#666" }}>
        JS bundle loaded, no providers mounted, no network calls made.
      </div>
      <div style={{ fontSize: 12, color: "#999" }}>
        rendered at {new Date().toISOString()}
      </div>
    </div>
  );
}
