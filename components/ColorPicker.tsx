"use client";

/* ============================================================
   ColorPicker.tsx — Figma-style colour picker + saved-colour library.
   Drop-in for multicolor-shop admin (replaces <input type="color">).

   • Saved colours are backed by the Supabase `color_library` table
     (falls back to localStorage when Supabase isn't configured).
   • Exposes <ColorField value onChange /> (a swatch button that opens
     the picker as a popover) and the raw <ColorPicker /> panel.

   Requires the `id` PK migration in color_library_migration.sql.
   ============================================================ */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ---------------- colour math ---------------- */
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, max ? d / max : 0, max];
}
const h2 = (n: number) => n.toString(16).padStart(2, "0");
const rgbToHex = (r: number, g: number, b: number) => (h2(r) + h2(g) + h2(b)).toUpperCase();
function hexToRgb(hex: string): [number, number, number] | null {
  hex = (hex || "").replace(/[^0-9a-fA-F]/g, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const normHex = (h: string) => (h || "").replace(/[^0-9a-fA-F]/g, "").toUpperCase().slice(0, 6);

/* ---------------- RAL Classic (curated subset) ---------------- */
const RAL_DATA: { code: string; name: string; hex: string }[] = [
  { code: "RAL 1000", name: "Green beige", hex: "BEBD7F" }, { code: "RAL 1003", name: "Signal yellow", hex: "F9A800" },
  { code: "RAL 1018", name: "Zinc yellow", hex: "F3E03B" }, { code: "RAL 1021", name: "Rape yellow", hex: "F3BE00" },
  { code: "RAL 1023", name: "Traffic yellow", hex: "FAC400" }, { code: "RAL 2004", name: "Pure orange", hex: "E25303" },
  { code: "RAL 2008", name: "Bright red orange", hex: "F37C20" }, { code: "RAL 3000", name: "Flame red", hex: "A72920" },
  { code: "RAL 3001", name: "Signal red", hex: "9B2423" }, { code: "RAL 3005", name: "Wine red", hex: "5E2028" },
  { code: "RAL 3015", name: "Light pink", hex: "D8A0A6" }, { code: "RAL 3017", name: "Rose", hex: "D15B66" },
  { code: "RAL 3020", name: "Traffic red", hex: "BB1F11" }, { code: "RAL 4003", name: "Heather violet", hex: "C63678" },
  { code: "RAL 4006", name: "Traffic purple", hex: "912F77" }, { code: "RAL 4008", name: "Signal violet", hex: "924E7D" },
  { code: "RAL 4010", name: "Telemagenta", hex: "CF3476" }, { code: "RAL 5002", name: "Ultramarine blue", hex: "20214F" },
  { code: "RAL 5005", name: "Signal blue", hex: "005387" }, { code: "RAL 5012", name: "Light blue", hex: "3481B8" },
  { code: "RAL 5015", name: "Sky blue", hex: "2874B2" }, { code: "RAL 5017", name: "Traffic blue", hex: "063971" },
  { code: "RAL 6005", name: "Moss green", hex: "114232" }, { code: "RAL 6011", name: "Reseda green", hex: "6C7C59" },
  { code: "RAL 6018", name: "Yellow green", hex: "61993B" }, { code: "RAL 6024", name: "Traffic green", hex: "308446" },
  { code: "RAL 6029", name: "Mint green", hex: "006F3D" }, { code: "RAL 7001", name: "Silver grey", hex: "8F999F" },
  { code: "RAL 7016", name: "Anthracite grey", hex: "383E42" }, { code: "RAL 7035", name: "Light grey", hex: "C5C7C4" },
  { code: "RAL 7040", name: "Window grey", hex: "9DA3A6" }, { code: "RAL 8001", name: "Ochre brown", hex: "9C6B30" },
  { code: "RAL 8011", name: "Nut brown", hex: "5A3A29" }, { code: "RAL 8016", name: "Mahogany", hex: "4C2F26" },
  { code: "RAL 9001", name: "Cream", hex: "E9E0D2" }, { code: "RAL 9003", name: "Signal white", hex: "ECECE7" },
  { code: "RAL 9005", name: "Jet black", hex: "0A0A0A" }, { code: "RAL 9010", name: "Pure white", hex: "F1ECE1" },
  { code: "RAL 9016", name: "Traffic white", hex: "F1F1EA" }, { code: "RAL 9017", name: "Traffic black", hex: "1E1E1E" },
];
function nearestRal(r: number, g: number, b: number) {
  let best = RAL_DATA[0], bd = 1e9;
  for (const c of RAL_DATA) { const rgb = hexToRgb(c.hex)!; const d = (rgb[0] - r) ** 2 + (rgb[1] - g) ** 2 + (rgb[2] - b) ** 2; if (d < bd) { bd = d; best = c; } }
  return best;
}

/* ---------------- saved-colour library (Supabase + localStorage fallback) ---------------- */
export interface SavedColor { id: string; hex: string; name: string }
const LS_KEY = "mc_color_library_v1";
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "c" + Date.now() + Math.random().toString(36).slice(2, 7));

function useLibrary() {
  const [items, setItems] = useState<SavedColor[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (supabase) {
        const { data } = await supabase.from("color_library").select("id,hex,name").order("created_at");
        if (alive && data) setItems((data as any[]).map((r) => ({ id: r.id, hex: normHex(r.hex), name: r.name || "" })));
      } else {
        try { const raw = localStorage.getItem(LS_KEY); if (raw && alive) setItems(JSON.parse(raw)); } catch {}
      }
    })();
    return () => { alive = false; };
  }, []);
  const persistLocal = (next: SavedColor[]) => { if (!supabase) try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {} };

  const add = async (hex: string, name: string) => {
    const row: SavedColor = { id: uid(), hex: normHex(hex), name };
    setItems((l) => { const n = [...l, row]; persistLocal(n); return n; });
    if (supabase) await supabase.from("color_library").insert({ id: row.id, hex: row.hex, name: row.name });
    return row;
  };
  const rename = async (id: string, name: string) => {
    setItems((l) => { const n = l.map((x) => (x.id === id ? { ...x, name } : x)); persistLocal(n); return n; });
    if (supabase) await supabase.from("color_library").update({ name }).eq("id", id);
  };
  const duplicate = async (c: SavedColor) => {
    const row: SavedColor = { id: uid(), hex: c.hex, name: c.name + " copy" };
    setItems((l) => { const i = l.findIndex((x) => x.id === c.id); const n = [...l]; n.splice(i + 1, 0, row); persistLocal(n); return n; });
    if (supabase) await supabase.from("color_library").insert({ id: row.id, hex: row.hex, name: row.name });
  };
  const remove = async (id: string) => {
    setItems((l) => { const n = l.filter((x) => x.id !== id); persistLocal(n); return n; });
    if (supabase) await supabase.from("color_library").delete().eq("id", id);
  };
  return { items, add, rename, duplicate, remove };
}

/* ---------------- icons ---------------- */
const Svg = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p} />;
const ISearch = ({ s = 18 }: { s?: number }) => <Svg width={s} height={s}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>;
const IX = ({ s = 18 }: { s?: number }) => <Svg width={s} height={s}><path d="M18 6L6 18M6 6l12 12" /></Svg>;
const ICaret = ({ s = 16 }: { s?: number }) => <Svg width={s} height={s}><path d="M6 9l6 6 6-6" /></Svg>;
const IBack = ({ s = 20 }: { s?: number }) => <Svg width={s} height={s}><path d="M15 18l-6-6 6-6" /></Svg>;
const IDropper = ({ s = 18 }: { s?: number }) => <Svg width={s} height={s}><path d="m2 22 1-1h3l9-9" /><path d="M3 21v-3l9-9" /><path d="m15 6 3.4-3.4a2.12 2.12 0 1 1 3 3L18 9l.4.4a2.12 2.12 0 1 1-3 3l-3.8-3.8a2.12 2.12 0 1 1 3-3l.4.4Z" /></Svg>;

/* ---------------- picker engine (SV + sliders + value/format) ---------------- */
function PickerCore({ h, s, v, a, set }: { h: number; s: number; v: number; a: number; set: (p: Partial<{ h: number; s: number; v: number; a: number }>) => void }) {
  const svRef = useRef<HTMLDivElement>(null), hueRef = useRef<HTMLDivElement>(null), aRef = useRef<HTMLDivElement>(null);
  const drag = (ref: React.RefObject<HTMLDivElement>, fn: (r: DOMRect, ev: PointerEvent | Touch) => void) => (e: React.PointerEvent) => {
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect();
    const move = (ev: PointerEvent) => fn(r, ev);
    move(e.nativeEvent);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const onSV = drag(svRef, (r, ev) => set({ s: clamp((ev.clientX - r.left) / r.width, 0, 1), v: 1 - clamp((ev.clientY - r.top) / r.height, 0, 1) }));
  const onHue = drag(hueRef, (r, ev) => set({ h: clamp((ev.clientX - r.left) / r.width, 0, 1) * 360 }));
  const onA = drag(aRef, (r, ev) => set({ a: clamp((ev.clientX - r.left) / r.width, 0, 1) }));
  const [rr, gg, bb] = hsvToRgb(h, s, v);
  const hex = rgbToHex(rr, gg, bb);
  const ral = nearestRal(rr, gg, bb);
  const setHex = (txt: string) => { const rgb = hexToRgb(txt); if (rgb) { const [nh, ns, nv] = rgbToHsv(...rgb); set({ h: nh, s: ns, v: nv }); } };
  const setRgb = (txt: string) => { const m = txt.match(/\d+/g); if (m && m.length >= 3) { const [nh, ns, nv] = rgbToHsv(clamp(+m[0], 0, 255), clamp(+m[1], 0, 255), clamp(+m[2], 0, 255)); set({ h: nh, s: ns, v: nv }); } };
  const pick = async () => { const EyeDropper = (window as any).EyeDropper; if (EyeDropper) { try { const res = await new EyeDropper().open(); setHex(res.sRGBHex); } catch {} } };
  const [fmt, setFmt] = useState<"HEX" | "RGB" | "RAL">("HEX");
  const [fmtOpen, setFmtOpen] = useState(false);
  const fmtRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fmtOpen) return;
    const close = (e: MouseEvent) => { if (fmtRef.current && !fmtRef.current.contains(e.target as Node)) setFmtOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [fmtOpen]);

  return (
    <>
      <div className="cpSV" ref={svRef} onPointerDown={onSV} style={{ background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${h},100%,50%))` }}>
        <span className="cpSVthumb" style={{ left: s * 100 + "%", top: (1 - v) * 100 + "%", background: "#" + hex }} />
      </div>
      <div className="cpHue" ref={hueRef} onPointerDown={onHue}><span className="cpThumb" style={{ left: (h / 360) * 100 + "%" }} /></div>
      <div className="cpAlpha" ref={aRef} onPointerDown={onA}>
        <div className="cpAlphaFill" style={{ background: `linear-gradient(to right, transparent, #${hex})` }} />
        <span className="cpThumb" style={{ left: a * 100 + "%" }} />
      </div>
      <div className="cpRow2">
        <div className="cpInput">
          {fmt === "HEX" && <input value={hex} onChange={(e) => setHex(e.target.value)} spellCheck={false} />}
          {fmt === "RGB" && <input value={`${rr}, ${gg}, ${bb}`} onChange={(e) => setRgb(e.target.value)} spellCheck={false} />}
          {fmt === "RAL" && <input value={ral.code} readOnly title={ral.name} />}
        </div>
        <div className="cpInput cpInput--pct">
          <input value={Math.round(a * 100)} onChange={(e) => set({ a: clamp((parseInt(e.target.value, 10) || 0) / 100, 0, 1) })} />
          <span className="cpPctSign">%</span>
        </div>
      </div>
      <div className="cpRow2">
        <div className="cpFmt" ref={fmtRef}>
          <button className="cpSelect" type="button" onClick={() => setFmtOpen((o) => !o)}>{fmt} <ICaret s={15} /></button>
          {fmtOpen && (
            <div className="cpFmtMenu">
              {(["HEX", "RGB", "RAL"] as const).map((f) => (
                <button key={f} type="button" className={"cpFmtItem" + (f === fmt ? " is-on" : "")} onClick={() => { setFmt(f); setFmtOpen(false); }}>{f}</button>
              ))}
            </div>
          )}
        </div>
        <button className="cpDropper" type="button" onClick={pick} title="ეკრანიდან არჩევა"><IDropper s={18} /></button>
      </div>
    </>
  );
}

/* ---------------- full panel ---------------- */
export function ColorPicker({ hex = "FF0AA5", onChange, onClose }: { hex?: string; onChange?: (hex: string) => void; onClose?: () => void }) {
  const init = useMemo(() => { const rgb = hexToRgb(hex) || [255, 10, 165]; return rgbToHsv(...(rgb as [number, number, number])); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [h, setH] = useState(init[0]); const [s, setS] = useState(init[1]); const [v, setV] = useState(init[2]); const [a, setA] = useState(1);
  const [view, setView] = useState<"main" | "create">("main");
  const [q, setQ] = useState(""); const [selId, setSelId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const lib = useLibrary();

  const set = (p: Partial<{ h: number; s: number; v: number; a: number }>) => { if (p.h != null) setH(p.h); if (p.s != null) setS(p.s); if (p.v != null) setV(p.v); if (p.a != null) setA(p.a); };
  const curHex = rgbToHex(...hsvToRgb(h, s, v));
  useEffect(() => { onChange?.(curHex); }, [h, s, v]); // eslint-disable-line react-hooks/exhaustive-deps

  const applySaved = (c: SavedColor) => { const rgb = hexToRgb(c.hex); if (rgb) { const [nh, ns, nv] = rgbToHsv(...rgb); set({ h: nh, s: ns, v: nv }); setSelId(c.id); } };
  const filtered = lib.items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.hex.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { if (!menu) return; const close = () => setMenu(null); window.addEventListener("click", close); return () => window.removeEventListener("click", close); }, [menu]);

  const doMenu = (action: string, c: SavedColor) => {
    setMenu(null);
    if (action === "find") setQ(c.name);
    if (action === "rename") setEditId(c.id);
    if (action === "duplicate") lib.duplicate(c);
    if (action === "delete") lib.remove(c.id);
  };

  if (view === "create") {
    const create = async () => { if (!newName.trim()) return; const row = await lib.add(curHex, newName.trim()); setSelId(row.id); setNewName(""); setView("main"); };
    return (
      <div className="cpPanel" onClick={(e) => e.stopPropagation()}>
        <div className="cpHead cpHead--center">
          <button className="cpIcoBtn" onClick={() => setView("main")}><IBack /></button>
          <span className="cpTitle">ახალი ფერი</span>
          <button className="cpIcoBtn" onClick={onClose}><IX /></button>
        </div>
        <input className="cpNameField" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="დასახელება" onKeyDown={(e) => { if (e.key === "Enter") create(); }} />
        <PickerCore h={h} s={s} v={v} a={a} set={set} />
        <div className="cpDivider" />
        <button className={"cpCreate" + (newName.trim() ? "" : " is-disabled")} onClick={create}>შენახვა</button>
      </div>
    );
  }

  return (
    <div className="cpPanel" onClick={(e) => e.stopPropagation()}>
      <div className="cpHead"><span className="cpTitle">ფერი</span><button className="cpIcoBtn" onClick={onClose}><IX /></button></div>
      <PickerCore h={h} s={s} v={v} a={a} set={set} />
      <div className="cpDivider" />
      <div className="cpSearch"><ISearch s={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძებნა..." /></div>
      <div className="cpDivider" />
      <div className="cpList">
        {filtered.length === 0 && <div className="cpEmpty">შენახული ფერი არ არის</div>}
        {filtered.map((c) => (
          <div key={c.id} className={"cpItem" + (selId === c.id ? " is-sel" : "")}
            onClick={() => editId !== c.id && applySaved(c)}
            onContextMenu={(e) => { e.preventDefault(); setMenu({ id: c.id, x: e.clientX, y: e.clientY }); }}>
            <span className="cpDot" style={{ background: "#" + c.hex }} />
            {editId === c.id ? (
              <input className="cpRename" autoFocus defaultValue={c.name} onClick={(e) => e.stopPropagation()}
                onBlur={(e) => { const val = e.target.value.trim(); if (val) lib.rename(c.id, val); setEditId(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditId(null); }} />
            ) : <span className="cpItemName">{c.name}</span>}
            <button className="cpItemMenu" onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ id: c.id, x: r.right, y: r.bottom }); }}>⋯</button>
          </div>
        ))}
      </div>
      <button className="cpNewStyle" onClick={() => { setNewName(""); setView("create"); }}>+ ახალი ფერის შენახვა</button>

      {menu && (() => { const c = lib.items.find((x) => x.id === menu.id); if (!c) return null; return (
        <div className="cpMenu" style={{ left: Math.min(menu.x, 220), top: menu.y }} onClick={(e) => e.stopPropagation()}>
          {[["find", "ძებნა"], ["rename", "გადარქმევა"], ["duplicate", "დუბლირება"], ["delete", "წაშლა"]].map(([k, l]) => (
            <button key={k} className={"cpMenuItem" + (k === "delete" ? " cpMenuItem--del" : "")} onClick={() => doMenu(k, c)}>{l}</button>
          ))}
        </div>
      ); })()}
    </div>
  );
}

/* ---------------- swatch field (use this in the product editor) ---------------- */
export function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const hex = normHex(value) || "CCCCCC";
  return (
    <div className="cfWrap" ref={ref}>
      <button type="button" className="cfSwatch" style={{ background: "#" + hex }} onClick={() => setOpen((o) => !o)} />
      {open && <div className="cfPop"><ColorPicker hex={hex} onChange={(hx) => onChange("#" + hx)} onClose={() => setOpen(false)} /></div>}
      <ColorPickerStyles />
    </div>
  );
}

/* ---------------- styles (injected once) ---------------- */
function ColorPickerStyles() {
  useEffect(() => {
    if (document.getElementById("cp-styles")) return;
    const st = document.createElement("style");
    st.id = "cp-styles";
    st.textContent = CP_CSS;
    document.head.appendChild(st);
  }, []);
  return null;
}

const CP_CSS = `
.cpPanel{ width:268px; background:#fff; border-radius:14px; padding:14px; box-shadow:0 12px 40px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.04); font-family:inherit; color:#1e1e1e; position:relative; box-sizing:border-box; }
.cpPanel *{ box-sizing:border-box; }
.cpHead{ display:flex; align-items:center; margin-bottom:14px; }
.cpTitle{ font-size:13.5px; font-weight:700; }
.cpHead .cpTitle{ margin-right:auto; }
.cpHead--center{ position:relative; justify-content:center; }
.cpHead--center .cpIcoBtn:first-child{ position:absolute; left:0; }
.cpHead--center .cpIcoBtn:last-child{ position:absolute; right:0; }
.cpIcoBtn{ border:0; background:none; color:#8a8a8a; cursor:pointer; display:grid; place-items:center; width:28px; height:28px; border-radius:8px; }
.cpIcoBtn:hover{ background:#f2f2f3; color:#1e1e1e; }
.cpSV{ position:relative; width:100%; height:120px; border-radius:9px; cursor:crosshair; margin-bottom:16px; touch-action:none; }
.cpSVthumb{ position:absolute; width:16px; height:16px; border-radius:50%; transform:translate(-50%,-50%); box-shadow:0 0 0 2px #fff,0 0 2px 2px rgba(0,0,0,.3); pointer-events:none; }
.cpHue,.cpAlpha{ position:relative; width:100%; height:12px; border-radius:7px; margin-bottom:12px; cursor:pointer; touch-action:none; }
.cpHue{ background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00); }
.cpAlpha{ background-image:linear-gradient(45deg,#cfcfcf 25%,transparent 25%),linear-gradient(-45deg,#cfcfcf 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cfcfcf 75%),linear-gradient(-45deg,transparent 75%,#cfcfcf 75%); background-size:10px 10px; background-position:0 0,0 5px,5px -5px,-5px 0; }
.cpAlphaFill{ position:absolute; inset:0; border-radius:7px; }
.cpThumb{ position:absolute; top:50%; width:18px; height:18px; border-radius:50%; background:#fff; transform:translate(-50%,-50%); box-shadow:0 1px 4px rgba(0,0,0,.35),inset 0 0 0 1px rgba(0,0,0,.06); pointer-events:none; }
.cpRow2{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
.cpInput{ position:relative; background:#f3f3f4; border-radius:11px; padding:0 14px; height:40px; display:flex; align-items:center; }
.cpInput input{ border:0; background:none; outline:none; width:100%; font-size:13.5px; font-weight:500; color:#1e1e1e; font-family:inherit; }
.cpInput--pct .cpPctSign{ color:#8a8a8a; font-size:13.5px; }
.cpSelect{ background:#f3f3f4; border:0; border-radius:11px; height:40px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; font-size:13px; font-weight:600; color:#1e1e1e; cursor:pointer; font-family:inherit; width:100%; }
.cpSelect svg{ color:#8a8a8a; }
.cpDropper{ background:#f3f3f4; border:0; border-radius:11px; height:40px; display:grid; place-items:center; cursor:pointer; color:#1e1e1e; }
.cpDropper:hover,.cpSelect:hover{ background:#ececee; }
.cpFmt{ position:relative; }
.cpFmtMenu{ position:absolute; bottom:calc(100% + 6px); left:0; right:0; background:#fff; border-radius:11px; box-shadow:0 10px 30px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05); padding:6px; z-index:50; display:flex; flex-direction:column; }
.cpFmtItem{ border:0; background:none; text-align:left; padding:9px 12px; font-size:13px; font-weight:600; color:#1e1e1e; cursor:pointer; border-radius:8px; font-family:inherit; }
.cpFmtItem:hover{ background:#f2f2f3; }
.cpFmtItem.is-on{ color:#2f4bc7; }
.cpDivider{ height:1px; background:#ececec; margin:14px 0; }
.cpSearch{ display:flex; align-items:center; gap:11px; color:#9a9a9a; }
.cpSearch input{ border:0; background:none; outline:none; flex:1; font-size:13.5px; color:#1e1e1e; font-family:inherit; }
.cpSearch input::placeholder{ color:#b3b3b3; }
.cpList{ display:flex; flex-direction:column; gap:2px; max-height:150px; overflow-y:auto; margin-bottom:10px; }
.cpItem{ display:flex; align-items:center; gap:13px; padding:11px 12px; border-radius:11px; cursor:pointer; }
.cpItem:hover{ background:#f5f5f6; }
.cpItem.is-sel{ background:#f1f1f3; }
.cpDot{ width:16px; height:16px; border-radius:50%; flex-shrink:0; box-shadow:inset 0 0 0 1px rgba(0,0,0,.08); }
.cpItemName{ flex:1; font-size:13.5px; color:#5a5a5a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cpItem.is-sel .cpItemName{ color:#1e1e1e; font-weight:600; }
.cpRename{ flex:1; border:1.5px solid #2f4bc7; border-radius:7px; padding:3px 7px; font-size:13px; font-family:inherit; outline:none; }
.cpItemMenu{ border:0; background:none; color:#b0b0b0; cursor:pointer; font-size:18px; line-height:1; padding:2px 4px; border-radius:6px; opacity:0; }
.cpItem:hover .cpItemMenu{ opacity:1; }
.cpItemMenu:hover{ background:#e7e7e9; color:#1e1e1e; }
.cpNewStyle{ width:100%; background:#f3f3f4; border:0; border-radius:12px; padding:15px; font-size:13.5px; font-weight:600; color:#1e1e1e; cursor:pointer; font-family:inherit; }
.cpNewStyle:hover{ background:#ececee; }
.cpNameField{ width:100%; background:#f3f3f4; border:1.5px solid #2f4bc7; border-radius:12px; padding:14px 16px; font-size:13.5px; color:#1e1e1e; outline:none; font-family:inherit; margin-bottom:14px; box-shadow:0 0 0 3px rgba(47,75,199,.18); }
.cpNameField::placeholder{ color:#a8a8a8; }
.cpCreate{ width:100%; background:#2f4bc7; border:0; border-radius:12px; padding:16px; font-size:13px; font-weight:700; color:#fff; cursor:pointer; font-family:inherit; }
.cpCreate.is-disabled{ background:#9fb0e8; cursor:default; }
.cpEmpty{ font-size:14px; color:#a0a0a0; padding:14px 12px; text-align:center; }
.cpMenu{ position:fixed; z-index:9999; background:#fff; border-radius:12px; box-shadow:0 10px 36px rgba(0,0,0,.2),0 0 0 1px rgba(0,0,0,.05); padding:8px; min-width:190px; display:flex; flex-direction:column; }
.cpMenuItem{ border:0; background:none; text-align:left; padding:11px 14px; font-size:13.5px; color:#1e1e1e; cursor:pointer; border-radius:8px; font-family:inherit; }
.cpMenuItem:hover{ background:#f2f2f3; }
.cpMenuItem--del{ color:#e23b3b; }
.cfWrap{ position:relative; display:inline-block; }
.cfSwatch{ width:46px; height:38px; border-radius:8px; border:1px solid rgba(0,0,0,.12); cursor:pointer; padding:0; }
.cfPop{ position:absolute; top:0; right:calc(100% + 10px); z-index:200; }
`;
