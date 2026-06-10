"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ph } from "@/lib/utils";
import { useStore } from "@/components/store-provider";

const VISUALS: Record<string, string> = {
  paint: "ჰერო ფოტო · ინტერიერი/საღებავი",
  color: "ჰერო ფოტო · ფერთა პალიტრა",
  pro: "ჰერო ფოტო · ობიექტი/ხელოსანი",
};

export function Hero() {
  const { db } = useStore();
  const slides = db.hero;
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
        {slides.length > 1 && (
          <>
            <button
              className="hero-arrow prev"
              aria-label="წინა"
              onClick={() => go((cur - 1 + slides.length) % slides.length)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button
              className="hero-arrow next"
              aria-label="შემდეგი"
              onClick={() => go((cur + 1) % slides.length)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
        <div className="spectrum-bar" />
      </div>
    </section>
  );
}
