"use client";

import { useEffect, useState } from "react";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (d > 0 ? `${d}d ` : "") + `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function Countdown({ endAt }: { endAt: string }) {
  const target = new Date(endAt).getTime();
  const [left, setLeft] = useState<number>(target - Date.now());

  useEffect(() => {
    const t = setInterval(() => setLeft(target - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (left <= 0) return <span className="text-red-400">Ended</span>;
  return <span className={left < 3600_000 ? "text-red-400" : "text-fire"}>{fmt(left)}</span>;
}
