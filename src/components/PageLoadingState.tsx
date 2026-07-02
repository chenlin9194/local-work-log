"use client";

type PageLoadingStateProps = {
  title?: string;
  description?: string;
  rows?: number;
};

export default function PageLoadingState({
  title = "加载中...",
  description,
  rows = 4,
}: PageLoadingStateProps) {
  const rowCount = Math.max(1, Math.min(rows, 6));

  return (
    <div className="card empty-state" style={{ padding: 20 }}>
      <div style={{ display: "grid", gap: 12, width: "100%" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
          {description && (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
              {description}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {Array.from({ length: rowCount }).map((_, index) => {
            const width = `${92 - index * 14}%`;
            return (
              <div
                key={index}
                aria-hidden="true"
                style={{
                  height: 12,
                  width,
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--bg-tertiary) 0%, color-mix(in srgb, var(--bg-tertiary) 78%, var(--text-tertiary)) 50%, var(--bg-tertiary) 100%)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
