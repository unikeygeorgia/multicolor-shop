"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { MC_DATA } from "@/lib/data";
import { ph } from "@/lib/utils";

const VISUALS: Record<string, string> = {
  paint: "ჰერო ფოტო · ინტერიერი/საღებავი",
  color: "ჰერო ფოტო · ფერთა პალიტრა",
  pro: "ჰერო ფოტო · ობიექტი/ხელოსანი",
};

export function Hero() {
  const slides = MC_DATA.hero;
  const [cur, setCur] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAuto = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setCur((c) => (c + 1) % slides.length),
      6000
    );
  }, [slides.length]);

  useEffect(() => {
    startAuto();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startAuto]);

  const go = (i: number) => {
    setCur(i % slides.length);
    startAuto();
  };

  return (
    <section className="hero" aria-label="აქციები">
      <div className="hero-frame" id="hero-frame">
        {slides.map((h, i) => (
          <div
            key={h.id}
            className={`hero-slide${i === cur ? " on" : ""}`}
            data-i={i}
          >
            <div className="hero-copy">
              <span className="kicker">{h.kicker}</span>
              <h1>{h.title}</h1>
              <p>{h.sub}</p>
              <Link className="btn lg" href={h.link}>
                {h.cta}
              </Link>
            </div>
            <div className="hero-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ph(VISUALS[h.tint] || "ჰერო ფოტო", "#2f4bc7", 900, 700)}
                alt={h.title}
              />
            </div>
          </div>
        ))}

        <div className="hero-dots" role="tablist">
          {slides.map((h, i) => (
            <button
              key={h.id}
              role="tab"
              aria-label={`სლაიდი ${i + 1}`}
              aria-selected={i === cur}
              className={i === cur ? "on" : ""}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <div className="spectrum-bar" />
      </div>
    </section>
  );
}
