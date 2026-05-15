"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DigestActions({
  markdown,
  filename,
}: {
  markdown: string;
  filename: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (older browsers, no HTTPS) — silently no-op.
    }
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="gap-1.5"
      >
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "Copied" : "Copy Markdown"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        className="gap-1.5"
      >
        <Download className="size-4" aria-hidden />
        Download .md
      </Button>
    </div>
  );
}
