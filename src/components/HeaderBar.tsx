import { Sparkles } from "lucide-react";

interface HeaderBarProps {
  subtitle?: string;
}

export function HeaderBar({ subtitle }: HeaderBarProps) {
  return (
    <header
      className="panel"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Sparkles size={24} color="#c084fc" />
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 600 }}>CherryStudio Local</div>
          <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>
            {subtitle || "Tauri 驱动的多模型工作台"}
          </div>
        </div>
      </div>
      <span className="status-chip idle">离线·安全</span>
    </header>
  );
}

