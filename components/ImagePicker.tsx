"use client";

/* ============================================================
   ImagePicker.tsx — Figma-style image-fill window for the admin.
   Choose Image (click / drag-drop), Resolution, Type, 9-point
   Position, Alt Text, and a fully-functional Crop.

   • Pass `onUpload` to persist files to Supabase Storage (returns a
     public URL). Without it, falls back to a local object URL preview.
   • Crop produces a PNG blob and re-uploads it via `onUpload`.
   ============================================================ */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

const Svg = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p} />;
const IX = ({ s = 18 }: { s?: number }) => <Svg width={s} height={s}><path d="M18 6L6 18M6 6l12 12" /></Svg>;
const ICaret = ({ s = 16 }: { s?: number }) => <Svg width={s} height={s}><path d="M6 9l6 6 6-6" /></Svg>;

const POSITIONS: [string, string][] = [
  ["Top Left", "0% 0%"], ["Top", "50% 0%"], ["Top Right", "100% 0%"],
  ["Left", "0% 50%"], ["Center", "50% 50%"], ["Right", "100% 50%"],
  ["Bottom Left", "0% 100%"], ["Bottom", "50% 100%"], ["Bottom Right", "100% 100%"],
];
const TYPE_FIT: Record<string, React.CSSProperties["objectFit"]> = { Fill: "cover", Fit: "contain", Stretch: "fill", Tile: "cover" };

function Select({ value, options, onChange, muted }: { value: string; options: string[]; onChange: (v: string) => void; muted?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="ipSelWrap" ref={ref}>
      <button type="button" className={"ipSelect" + (muted ? " is-muted" : "")} onClick={() => setOpen((o) => !o)}><span>{value}</span><ICaret s={15} /></button>
      {open && <div className="ipSelMenu">{options.map((o) => <button key={o} type="button" className={"ipSelItem" + (o === value ? " is-on" : "")} onClick={() => { onChange(o); setOpen(false); }}>{o}</button>)}</div>}
    </div>
  );
}

export interface ImagePickerProps {
  value?: string;
  onChange?: (url: string) => void;
  /** Persist a file/blob and return its public URL (e.g. Supabase Storage). */
  onUpload?: (file: Blob) => Promise<string | null>;
  onClose?: () => void;
}

export function ImagePicker({ value = "", onChange, onUpload, onClose }: ImagePickerProps) {
  const [image, setImage] = useState(value);
  const [res, setRes] = useState("Auto");
  const [type, setType] = useState("Fill");
  const [pos, setPos] = useState(4);
  const [alt, setAlt] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [posOpen, setPosOpen] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const inp = useRef<HTMLInputElement>(null), posRef = useRef<HTMLDivElement>(null), wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { ImagePickerStyles(); }, []);
  useEffect(() => { onChange?.(image); }, [image]); // eslint-disable-line
  useEffect(() => {
    if (!posOpen) return;
    const h = (e: MouseEvent) => { if (posRef.current && !posRef.current.contains(e.target as Node)) setPosOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [posOpen]);

  const setFromBlob = async (blob: Blob) => {
    if (onUpload) { setBusy(true); const url = await onUpload(blob); setBusy(false); if (url) setImage(url); }
    else setImage(URL.createObjectURL(blob));
  };
  const take = (file?: File | null) => { if (file) setFromBlob(file); };

  const beginCrop = () => { setCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); setCropping(true); };
  const cropDrag = (mode: string) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const rect = wrapRef.current!.getBoundingClientRect();
    const start = { ...crop }; const px = e.clientX, py = e.clientY; const min = 0.08;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - px) / rect.width, dy = (ev.clientY - py) / rect.height;
      let { x, y, w, h } = start;
      if (mode === "move") { x = clamp(x + dx, 0, 1 - w); y = clamp(y + dy, 0, 1 - h); }
      else {
        if (mode.includes("w")) { const nx = clamp(x + dx, 0, x + w - min); w = w + (x - nx); x = nx; }
        if (mode.includes("e")) { w = clamp(w + dx, min, 1 - x); }
        if (mode.includes("n")) { const ny = clamp(y + dy, 0, y + h - min); h = h + (y - ny); y = ny; }
        if (mode.includes("s")) { h = clamp(h + dy, min, 1 - y); }
      }
      setCrop({ x, y, w, h });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };
  const applyCrop = () => {
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => {
      const nw = im.naturalWidth, nh = im.naturalHeight;
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(crop.w * nw)); cv.height = Math.max(1, Math.round(crop.h * nh));
      cv.getContext("2d")!.drawImage(im, crop.x * nw, crop.y * nh, crop.w * nw, crop.h * nh, 0, 0, cv.width, cv.height);
      cv.toBlob((blob) => { if (blob) setFromBlob(blob); setCropping(false); }, "image/png");
    };
    im.onerror = () => setCropping(false);
    im.src = image;
  };

  return (
    <div className="ipPanel" onClick={(e) => e.stopPropagation()}>
      <div className="ipHead"><span className="ipTitle">სურათი</span>{onClose && <button className="ipIco" onClick={onClose}><IX /></button>}</div>

      {cropping && image ? (
        <div className="ipDrop ipDrop--crop">
          <div className="ipCropWrap" ref={wrapRef}>
            <img className="ipCropImg" src={image} alt="" draggable={false} />
            <div className="ipCropBox" style={{ left: crop.x * 100 + "%", top: crop.y * 100 + "%", width: crop.w * 100 + "%", height: crop.h * 100 + "%" }} onPointerDown={cropDrag("move")}>
              <span className="ipCH ipCH-nw" onPointerDown={cropDrag("nw")} />
              <span className="ipCH ipCH-ne" onPointerDown={cropDrag("ne")} />
              <span className="ipCH ipCH-sw" onPointerDown={cropDrag("sw")} />
              <span className="ipCH ipCH-se" onPointerDown={cropDrag("se")} />
            </div>
          </div>
        </div>
      ) : (
        <div className={"ipDrop" + (over ? " is-over" : "") + (image ? " has-img" : "")}
          onClick={() => inp.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}>
          <input ref={inp} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files?.[0])} />
          {image ? (
            <>
              <img className="ipImg" src={image} alt="" style={{ objectFit: TYPE_FIT[type], objectPosition: POSITIONS[pos][1] }} />
              <button type="button" className="ipReplace" onClick={(e) => { e.stopPropagation(); inp.current?.click(); }}>{busy ? "იტვირთება…" : "Choose Image…"}</button>
            </>
          ) : (
            <button type="button" className="ipChoose" onClick={(e) => { e.stopPropagation(); inp.current?.click(); }}>{busy ? "იტვირთება…" : "Choose Image…"}</button>
          )}
        </div>
      )}

      <div className="ipFields">
        <div className="ipRow"><span className="ipLabel">Resolution</span><Select value={res} muted options={["Auto", "High", "Standard", "Low"]} onChange={setRes} /></div>
        <div className="ipRow"><span className="ipLabel">Type</span><Select value={type} options={["Fill", "Fit", "Stretch", "Tile"]} onChange={setType} /></div>
        <div className="ipRow"><span className="ipLabel">Position</span>
          <div className="ipPosField" ref={posRef}>
            <button type="button" className="ipPosBtn" onClick={() => setPosOpen((o) => !o)}>
              <span className="ipPosGrid">{POSITIONS.map((_, i) => <span key={i} className={"ipPosCell" + (i === pos ? " is-on" : "")} />)}</span>
              <span className={"ipPosLabel" + (pos === 4 ? " is-muted" : "")}>{POSITIONS[pos][0]}</span><ICaret s={15} />
            </button>
            {posOpen && <div className="ipPosPop">{POSITIONS.map((p, i) => <button key={i} type="button" className={"ipPosOpt" + (i === pos ? " is-on" : "")} title={p[0]} onClick={() => { setPos(i); setPosOpen(false); }}><span /></button>)}</div>}
          </div>
        </div>
        <div className="ipRow"><span className="ipLabel">Alt Text</span><input className="ipAlt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe Image..." /></div>
      </div>

      <div className="ipDivider" />
      {cropping ? (
        <div className="ipCropActions">
          <button className="ipBtnGhost" onClick={() => setCropping(false)}>გაუქმება</button>
          <button className="ipBtnPrimary" onClick={applyCrop}>დაჭრა</button>
        </div>
      ) : (
        <button className={"ipCrop" + (image ? "" : " is-disabled")} disabled={!image} onClick={beginCrop}>Crop</button>
      )}
    </div>
  );
}

export function ImageField({ value, onChange, onUpload }: { value?: string; onChange?: (url: string) => void; onUpload?: (file: Blob) => Promise<string | null> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ImageFieldStyles(); }, []);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const PW = 268, PH = 470;
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect(); if (!r) return;
    let left = r.left - PW - 10; if (left < 8) left = Math.min(window.innerWidth - PW - 8, r.right + 10);
    const top = Math.max(8, Math.min(r.top, window.innerHeight - PH - 8));
    setPos({ top, left });
  };
  useEffect(() => {
    if (!open) return;
    const onResize = () => place();
    window.addEventListener("resize", onResize); window.addEventListener("scroll", onResize, true);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true); };
  }, [open]);
  return (
    <div className="ifWrap" ref={ref}>
      <button ref={btnRef} type="button" className={"ifTrigger" + (value ? " has" : "")} onClick={() => { if (open) { setOpen(false); } else { place(); setOpen(true); } }}>
        {value ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" />) : <span className="ifPlus">+ ფოტოს დამატება</span>}
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 2999 }} onMouseDown={() => setOpen(false)} />
          <div style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 3000 }}>
            <ImagePicker value={value} onChange={onChange} onUpload={onUpload} onClose={() => setOpen(false)} />
          </div>
        </>, document.body)}
    </div>
  );
}

function ImageFieldStyles() {
  if (typeof document === "undefined" || document.getElementById("ifield-styles")) return;
  const st = document.createElement("style");
  st.id = "ifield-styles";
  st.textContent = `
  .ifWrap{ position:relative; display:inline-block; }
  .ifTrigger{ width:104px; height:104px; border-radius:12px; border:1px dashed #d4d4d8; background:#f3f3f4; cursor:pointer; display:grid; place-items:center; padding:0; overflow:hidden; color:#7a7a82; font-size:12.5px; font-weight:600; font-family:inherit; text-align:center; }
  .ifTrigger:hover{ border-color:#2f4bc7; color:#2f4bc7; }
  .ifTrigger.has{ border-style:solid; border-color:#e2e2e6; }
  .ifTrigger img{ width:100%; height:100%; object-fit:cover; }
  .ifPlus{ padding:0 8px; }
  .ifPop{ position:absolute; top:0; right:calc(100% + 10px); z-index:200; }
  @media (max-width:640px){ .ifPop{ right:auto; left:0; top:calc(100% + 8px); } }
  `;
  document.head.appendChild(st);
}

export default ImagePicker;

/* ---------------- styles (injected once) ---------------- */
function ImagePickerStyles() {
  if (typeof document === "undefined" || document.getElementById("ip-styles")) return;
  const st = document.createElement("style");
  st.id = "ip-styles";
  st.textContent = IP_CSS;
  document.head.appendChild(st);
}

const IP_CSS = `
.ipPanel{ width:268px; max-height:calc(100vh - 24px); overflow-y:auto; background:#fff; border-radius:14px; padding:14px; box-shadow:0 12px 40px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.04); font-family:inherit; color:#1e1e1e; box-sizing:border-box; }
.ipPanel *{ box-sizing:border-box; }
.ipHead{ display:flex; align-items:center; margin-bottom:14px; }
.ipTitle{ font-size:13.5px; font-weight:700; margin-right:auto; }
.ipIco{ border:0; background:none; color:#8a8a8a; cursor:pointer; display:grid; place-items:center; width:28px; height:28px; border-radius:8px; }
.ipIco:hover{ background:#f2f2f3; color:#1e1e1e; }
.ipDrop{ position:relative; width:100%; min-height:150px; background:#f1f1f3; border-radius:12px; display:grid; place-items:center; cursor:pointer; overflow:hidden; margin-bottom:16px; transition:.14s; }
.ipDrop.is-over{ box-shadow:inset 0 0 0 2px #2f4bc7; background:#eef1fb; }
.ipDrop.has-img{ cursor:default; }
.ipChoose,.ipReplace{ background:#6b6b6b; color:#fff; border:0; border-radius:10px; padding:13px 22px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; }
.ipChoose:hover,.ipReplace:hover{ background:#5a5a5a; }
.ipImg{ position:absolute; inset:0; width:100%; height:100%; }
.ipReplace{ position:relative; z-index:1; opacity:0; transition:.14s; }
.ipDrop.has-img:hover .ipReplace{ opacity:1; }
.ipDrop.has-img:hover::after{ content:""; position:absolute; inset:0; background:rgba(0,0,0,.28); }
.ipDrop.has-img .ipReplace{ box-shadow:0 2px 10px rgba(0,0,0,.3); }
.ipDrop--crop{ cursor:default; padding:0; background:#1c1c1c; }
.ipCropWrap{ position:relative; width:100%; line-height:0; }
.ipCropImg{ width:100%; display:block; user-select:none; -webkit-user-drag:none; }
.ipCropBox{ position:absolute; border:1.5px solid #fff; box-shadow:0 0 0 9999px rgba(0,0,0,.55); cursor:move; touch-action:none; }
.ipCH{ position:absolute; width:14px; height:14px; background:#fff; border-radius:3px; box-shadow:0 1px 4px rgba(0,0,0,.5); touch-action:none; }
.ipCH-nw{ left:-7px; top:-7px; cursor:nwse-resize; } .ipCH-ne{ right:-7px; top:-7px; cursor:nesw-resize; }
.ipCH-sw{ left:-7px; bottom:-7px; cursor:nesw-resize; } .ipCH-se{ right:-7px; bottom:-7px; cursor:nwse-resize; }
.ipFields{ display:flex; flex-direction:column; gap:11px; }
.ipRow{ display:grid; grid-template-columns:96px 1fr; align-items:center; gap:10px; }
.ipLabel{ font-size:13.5px; font-weight:600; color:#1e1e1e; }
.ipSelWrap,.ipPosField{ position:relative; }
.ipSelect{ width:100%; background:#f3f3f4; border:0; border-radius:11px; height:40px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; font-size:13.5px; font-weight:500; color:#1e1e1e; cursor:pointer; font-family:inherit; }
.ipSelect.is-muted{ color:#9a9a9a; } .ipSelect svg{ color:#9a9a9a; }
.ipSelect:hover,.ipPosBtn:hover{ background:#ececee; }
.ipSelMenu,.ipPosPop{ position:absolute; top:calc(100% + 6px); left:0; right:0; background:#fff; border-radius:11px; box-shadow:0 10px 30px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05); padding:6px; z-index:50; }
.ipSelItem{ display:block; width:100%; border:0; background:none; text-align:left; padding:10px 12px; font-size:13px; font-weight:600; color:#1e1e1e; cursor:pointer; border-radius:8px; font-family:inherit; }
.ipSelItem:hover{ background:#f2f2f3; } .ipSelItem.is-on{ color:#2f4bc7; }
.ipPosBtn{ width:100%; background:#f3f3f4; border:0; border-radius:11px; height:40px; display:flex; align-items:center; gap:10px; padding:0 14px; cursor:pointer; font-family:inherit; }
.ipPosGrid{ display:grid; grid-template-columns:repeat(3,3px); grid-template-rows:repeat(3,3px); gap:3px; }
.ipPosCell{ width:3px; height:3px; border-radius:50%; background:#b6b6bc; } .ipPosCell.is-on{ background:#2f4bc7; }
.ipPosLabel{ flex:1; text-align:left; font-size:13.5px; font-weight:500; color:#1e1e1e; } .ipPosLabel.is-muted{ color:#9a9a9a; }
.ipPosBtn svg{ color:#9a9a9a; }
.ipPosPop{ display:grid; grid-template-columns:repeat(3,1fr); gap:6px; padding:10px; }
.ipPosOpt{ aspect-ratio:1; border:0; background:#f1f1f3; border-radius:8px; cursor:pointer; display:grid; place-items:center; }
.ipPosOpt span{ width:8px; height:8px; border-radius:50%; background:#b6b6bc; }
.ipPosOpt:hover{ background:#e6e6ea; } .ipPosOpt.is-on{ background:#eef1fb; } .ipPosOpt.is-on span{ background:#2f4bc7; }
.ipAlt{ width:100%; background:#f3f3f4; border:0; border-radius:11px; height:40px; padding:0 14px; font-size:13.5px; color:#1e1e1e; outline:none; font-family:inherit; }
.ipAlt::placeholder{ color:#a8a8a8; }
.ipDivider{ height:1px; background:#ececec; margin:16px 0; }
.ipCrop{ width:100%; background:#f3f3f4; border:0; border-radius:12px; padding:15px; font-size:13.5px; font-weight:600; color:#1e1e1e; cursor:pointer; font-family:inherit; }
.ipCrop:hover{ background:#ececee; } .ipCrop.is-disabled{ color:#b0b0b0; cursor:default; }
.ipCropActions{ display:flex; gap:10px; }
.ipBtnGhost{ flex:1; background:#f3f3f4; border:0; border-radius:12px; padding:15px; font-size:13.5px; font-weight:600; color:#1e1e1e; cursor:pointer; font-family:inherit; }
.ipBtnGhost:hover{ background:#ececee; }
.ipBtnPrimary{ flex:1; background:#2f4bc7; border:0; border-radius:12px; padding:15px; font-size:13.5px; font-weight:700; color:#fff; cursor:pointer; font-family:inherit; }
.ipBtnPrimary:hover{ filter:brightness(1.05); }
`;
