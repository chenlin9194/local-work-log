"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  successLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function CopyButton({
  text,
  label = "复制 Markdown",
  successLabel = "已复制",
  variant = "secondary",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCopy = async () => {
    if (busy) return;

    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("复制失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-secondary"} ${className}`.trim()}
      style={{ fontSize: 13 }}
      disabled={busy}
    >
      {busy ? "复制中..." : copied ? successLabel : label}
    </button>
  );
}
