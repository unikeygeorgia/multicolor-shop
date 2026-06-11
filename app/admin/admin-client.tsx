"use client";

import { useEffect, useState, useRef, useMemo, useCallback, createContext, useContext } from "react";
import Link from "next/link";

import { fmt, minPrice, prodImg, salePrice } from "@/lib/utils";
import { slugify } from "@/lib/slug";
import { brandLogoSrc } from "@/lib/brand-logos";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/components/store-provider";
import { useAuth } from "@/components/auth-provider";
import type {
  AppSettings,
  Brand,
  Category,
  HeroSlide,
  MulticolorData,
  Order,
  Product,
  Promotion,
} from "@/lib/types";

/* ---------- shared maps / helpers ---------- */
const STATUS: Record<string, [string, string]> = {
  new: ["ახალი", "blue"],
  processing: ["მუშავდება", "gray"],
  done: ["შესრულდა", "green"],
  cancelled: ["გაუქმდა", "red"],
};
const TYPE: Record<string, [string, string]> = {
  order: ["შეკვეთა", "green"],
  quote: ["ბითუმად", "blue"],
  inquiry: ["კითხვა", "gray"],
};

function Pill({ map, k }: { map: Record<string, [string, string]>; k: string }) {
  const x = map[k] || [k, "gray"];
  return <span className={`pill ${x[1]}`}>{x[0]}</span>;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return (
    dt.toLocaleDateString("ka-GE", { day: "numeric", month: "short" }) +
    " · " +
    dt.toTimeString().slice(0, 5)
  );
}

function uid(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 7);
}

/** Flatten categories into tree order with a depth for each node. */
function flatCatTree(cats: Category[]): { c: Category; depth: number }[] {
  const kids = new Map<string, Category[]>();
  cats.forEach((c) => {
    const k = c.parentId || "";
    if (!kids.has(k)) kids.set(k, []);
    kids.get(k)!.push(c);
  });
  kids.forEach((arr) => arr.sort((a, b) => a.order - b.order));
  const out: { c: Category; depth: number }[] = [];
  const walk = (parent: string, depth: number) => {
    (kids.get(parent) || []).forEach((c) => {
      out.push({ c, depth });
      walk(c.id, depth + 1);
    });
  };
  walk("", 0);
  return out;
}

/* ---------- icons ---------- */
const si = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IDash = () => (<svg viewBox="0 0 24 24" {...si}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>);
const IBox = () => (<svg viewBox="0 0 24 24" {...si}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></svg>);
const IBag = () => (<svg viewBox="0 0 24 24" {...si}><path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>);
const IUsers = () => (<svg viewBox="0 0 24 24" {...si}><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5M19 20a6 6 0 0 0-3-5" /></svg>);
const ICal = () => (<svg viewBox="0 0 24 24" {...si}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>);
const ILayers = () => (<svg viewBox="0 0 24 24" {...si}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>);
const ITagI = () => (<svg viewBox="0 0 24 24" {...si}><path d="M20 12l-8 8-9-9V3h8l9 9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>);
const IGear = () => (<svg viewBox="0 0 24 24" {...si}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M19.1 4.9l-2.1 2.1M7 16.9l-2.1 2.1" /></svg>);
const IStore = () => (<svg viewBox="0 0 24 24" {...si}><path d="M4 9h16l-1-4H5L4 9z" /><path d="M5 9v11h14V9" /></svg>);
const IRefresh = () => (<svg viewBox="0 0 24 24" {...si}><path d="M20 11a8 8 0 1 0-2 5" /><path d="M20 4v6h-6" /></svg>);
const IOut = () => (<svg viewBox="0 0 24 24" {...si}><path d="M15 12H4M9 7l-5 5 5 5" /><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></svg>);
const ISearch = () => (<svg width="15" height="15" viewBox="0 0 24 24" {...si}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>);
const IGridV = () => (<svg width="15" height="15" viewBox="0 0 24 24" {...si}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
const IListV = () => (<svg width="15" height="15" viewBox="0 0 24 24" {...si}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>);
const IDownload = () => (<svg width="15" height="15" viewBox="0 0 24 24" {...si}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>);
const IBell = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...si}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>);
const IMail = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...si}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);

/* ---------- category-board icons (sized via prop) ---------- */
const Ico2 = ({ s = 16, sw = 1.8, children }: { s?: number; sw?: number; children: React.ReactNode }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconChevR = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M9 6l6 6-6 6" /></Ico2>);
const IconPlusV = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M12 5v14M5 12h14" /></Ico2>);
const IconPencilV = ({ s = 15 }: { s?: number }) => (<Ico2 s={s}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></Ico2>);
const IconTrashV = ({ s = 15 }: { s?: number }) => (<Ico2 s={s}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></Ico2>);
const IconCheckV = ({ s = 15 }: { s?: number }) => (<Ico2 s={s}><path d="M20 6L9 17l-5-5" /></Ico2>);
const IconXV = ({ s = 15 }: { s?: number }) => (<Ico2 s={s}><path d="M18 6L6 18M6 6l12 12" /></Ico2>);
const IconSearchV = ({ s = 17 }: { s?: number }) => (<Ico2 s={s}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Ico2>);
const IconGripV = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></svg>);
const IconCornerAddV = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M4 4v9a4 4 0 0 0 4 4h6" /><path d="M14 13.5v7M10.5 17h7" /></Ico2>);
const IconExpandV = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></Ico2>);
const IconCollapseV = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" /></Ico2>);
const IconSliders = ({ s = 18 }: { s?: number }) => (<Ico2 s={s}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></Ico2>);

/* gradient brand mark for the admin sidebar */
function AdminLogo() {
  return (
    <div className="brand">
      <span className="brandMark">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <defs>
            <linearGradient id="mcadmin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff5d73" /><stop offset="0.35" stopColor="#ffb84d" />
              <stop offset="0.6" stopColor="#3ec98a" /><stop offset="1" stopColor="#5b8def" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="20" height="20" rx="6" fill="url(#mcadmin)" />
          <circle cx="11" cy="11" r="4.4" fill="#fff" fillOpacity="0.92" />
        </svg>
      </span>
      <span className="brandText"><strong>multicolor</strong><small>ადმინი</small></span>
    </div>
  );
}

/* hue palette for color-coded branches */
const HUE_PALETTE = [28, 250, 190, 300, 75, 150, 12, 220, 330, 110];

interface Tweaks { dark: boolean; accent: string; density: "compact" | "comfy"; colorCoding: boolean; rails: boolean; }
const TWEAK_DEFAULTS: Tweaks = { dark: false, accent: "#5b6cff", density: "comfy", colorCoding: true, rails: true };
const ACCENTS = ["#5b6cff", "#7a5af5", "#e0457b", "#0ea5a3", "#f0820a"];

function TweaksPopover({ tw, patch, onClose }: { tw: Tweaks; patch: (p: Partial<Tweaks>) => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
      <div className="twp">
        <div className="twp-sect">თემა</div>
        <div className="twp-row"><span>მუქი რეჟიმი</span>
          <button className={"twp-toggle" + (tw.dark ? " on" : "")} onClick={() => patch({ dark: !tw.dark })}><i /></button>
        </div>
        <div className="twp-row"><span>აქცენტი</span>
          <div className="twp-swatches">{ACCENTS.map((c) => (<button key={c} className={"twp-sw" + (tw.accent === c ? " on" : "")} style={{ background: c }} onClick={() => patch({ accent: c })} />))}</div>
        </div>
        <div className="twp-sect">განლაგება</div>
        <div className="twp-row"><span>სიმჭიდროვე</span>
          <div className="twp-seg">
            {(["compact", "comfy"] as const).map((d) => (<button key={d} className={tw.density === d ? "on" : ""} onClick={() => patch({ density: d })}>{d === "compact" ? "მჭიდრო" : "თავისუფალი"}</button>))}
          </div>
        </div>
        <div className="twp-row"><span>ფერადი ბრენჩები</span><button className={"twp-toggle" + (tw.colorCoding ? " on" : "")} onClick={() => patch({ colorCoding: !tw.colorCoding })}><i /></button></div>
        <div className="twp-row"><span>დამაკავშირებელი ხაზები</span><button className={"twp-toggle" + (tw.rails ? " on" : "")} onClick={() => patch({ rails: !tw.rails })}><i /></button></div>
      </div>
    </>
  );
}

const VIEW_TITLES: Record<string, string> = {
  dash: "დაფა", products: "პროდუქტები", orders: "შეკვეთები", customers: "მომხმარებლები",
  calendar: "გაყიდვების კალენდარი", brands: "ბრენდები", cats: "კატეგორიები", promos: "აქციები", settings: "პარამეტრები",
};

type View = "dash" | "products" | "brands" | "cats" | "promos" | "orders" | "settings" | "customers" | "calendar";
type Editor =
  | { kind: "order"; id: string }
  | { kind: "product"; id: string | null }
  | { kind: "brand"; id: string | null }
  | { kind: "promo"; id: string | null }
  | { kind: "hero"; index: number }
  | null;

export function AdminClient() {
  const store = useStore();
  const {
    db, orders, prodById, brandById, setOrderStatus,
    upsertProduct, deleteProduct, upsertBrand, deleteBrand, updateCategory,
    upsertCategory, deleteCategory,
    savePromotion, deletePromotion, togglePromotion, updateHero, reload,
  } = store;
  const [view, setView] = useState<View>("dash");
  const [editor, setEditor] = useState<Editor>(null);
  const [query, setQuery] = useState("");
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tw, setTw] = useState<Tweaks>(TWEAK_DEFAULTS);

  // load/persist tweaks
  useEffect(() => {
    try { const raw = localStorage.getItem("mc_admin_tweaks"); if (raw) setTw({ ...TWEAK_DEFAULTS, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  const patchTw = useCallback((patch: Partial<Tweaks>) => {
    setTw((prev) => { const next = { ...prev, ...patch }; try { localStorage.setItem("mc_admin_tweaks", JSON.stringify(next)); } catch { /* ignore */ } return next; });
  }, []);

  useEffect(() => {
    document.body.classList.add("admin");
    return () => document.body.classList.remove("admin");
  }, []);

  /* ---------- access gate ---------- */
  const { user, ready, signOut } = useAuth();
  const [access, setAccess] = useState<"checking" | "anon" | "denied" | "ok">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!ready) { setAccess("checking"); return; }
      if (!user) { setAccess("anon"); return; }
      if (!supabase) { setAccess("denied"); return; }
      const { data } = await supabase.rpc("is_admin");
      if (cancelled) return;
      if (data === true) {
        setAccess("ok");
        reload();
      } else {
        setAccess("denied");
      }
    })();
    return () => { cancelled = true; };
  }, [ready, user, reload]);

  if (access !== "ok") return <AdminGate status={access} />;

  const orderTotal = (o: Order) =>
    o.items.reduce((a, i) => {
      const p = prodById(i.pid);
      if (!p) return a;
      const sz = p.sizes.find((s) => s.l === i.size) || p.sizes[0];
      return a + salePrice(p, sz.p) * i.qty;
    }, 0);

  const newCount = orders.filter((o) => o.status === "new").length;


  const initials = (user?.email || "ა").slice(0, 1);

  const sections: { label: string; items: { v: View; label: string; icon: React.ReactNode; cnt?: string | number }[] }[] = [
    {
      label: "მთავარი",
      items: [
        { v: "dash", label: "დაფა", icon: <IDash /> },
        { v: "products", label: "პროდუქტები", icon: <IBox />, cnt: db.products.length },
        { v: "orders", label: "შეკვეთები", icon: <IBag />, cnt: newCount || "" },
        { v: "customers", label: "მომხმარებლები", icon: <IUsers /> },
        { v: "calendar", label: "კალენდარი", icon: <ICal /> },
      ],
    },
    {
      label: "კატალოგი",
      items: [
        { v: "brands", label: "ბრენდები", icon: <ITagI />, cnt: db.brands.length },
        { v: "cats", label: "კატეგორიები", icon: <ILayers /> },
        { v: "promos", label: "აქციები", icon: <ITagI /> },
      ],
    },
  ];

  const crumbSection = sections.find((sec) => sec.items.some((i) => i.v === view))?.label || "სისტემა";

  return (
    <div
      className={"mcx-app" + (tw.dark ? " is-dark" : "")}
      data-density={tw.density}
      data-coding={tw.colorCoding ? "on" : "off"}
      data-rails={tw.rails ? "on" : "off"}
      style={{ "--accent": tw.accent } as React.CSSProperties}
      data-screen-label="ადმინ პანელი"
    >
      <aside className="sidebar">
        <div className="sidebarTop"><AdminLogo /></div>
        <nav className="nav">
          {sections.map((sec) => (
            <div className="navGroup" key={sec.label}>
              <div className="navHead">{sec.label}</div>
              {sec.items.map((n) => (
                <button key={n.v} className={"navItem" + (view === n.v ? " is-active" : "")} onClick={() => setView(n.v)}>
                  {n.icon}<span>{n.label}</span>
                  {n.cnt !== undefined && n.cnt !== "" && <span className="navBadge">{n.cnt}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebarFoot">
          <button className={"navItem" + (view === "settings" ? " is-active" : "")} onClick={() => setView("settings")}><IGear /><span>პარამეტრები</span></button>
          <a className="navItem" href="https://multicolorge.vercel.app"><IStore /><span>მაღაზიის ნახვა</span></a>
          <button className="navItem" onClick={() => reload()}><IRefresh /><span>განახლება</span></button>
          <button className="navItem" onClick={async () => { await signOut(); }}><IOut /><span>გასვლა</span></button>
        </div>
      </aside>

      <div className="mcxmain">
        <header className="topbar">
          <div className="mcxcrumbs"><span>{crumbSection}</span><IconChevR s={14} /><strong>{VIEW_TITLES[view]}</strong></div>
          <div className="topSearch">
            <IconSearchV s={16} />
            <input placeholder="ძებნა პროდუქტებში…" value={query} onChange={(e) => { setQuery(e.target.value); setView("products"); }} />
            <kbd>⌘K</kbd>
          </div>
          <div className="topActions">
            <button className={"topIcon" + (tweaksOpen ? " is-on" : "")} title="გაფორმება" onClick={() => setTweaksOpen((o) => !o)}><IconSliders /></button>
            <button className="topIcon" title="ფოსტა"><IMail /></button>
            <button className="topIcon" title="შეტყობინებები"><IBell /><span className="dotBadge" /></button>
            <button className="profile">
              <span className="avatar">{initials}</span>
              <span className="profileMeta"><strong>{user?.email || "multicolor.ge"}</strong><small>ადმინისტრატორი</small></span>
            </button>
          </div>
          {tweaksOpen && <TweaksPopover tw={tw} patch={patchTw} onClose={() => setTweaksOpen(false)} />}
        </header>

        <main className="scroll">
          {view === "cats" ? (
            <CatsView db={db} updateCategory={updateCategory} upsertCategory={upsertCategory} deleteCategory={deleteCategory} toast={store.toast} />
          ) : (
            <div className="page">
              {view === "dash" && (
                <Dashboard db={db} orders={orders} orderTotal={orderTotal} prodById={prodById} onOrder={(id) => setEditor({ kind: "order", id })} onEditProduct={(id) => setEditor({ kind: "product", id })} />
              )}
              {view === "orders" && (
                <OrdersView orders={orders} orderTotal={orderTotal} setOrderStatus={setOrderStatus} onOrder={(id) => setEditor({ kind: "order", id })} />
              )}
              {view === "products" && (
                <ProductsView db={db} brandById={brandById} query={query} onEdit={(id) => setEditor({ kind: "product", id })} upsertProduct={upsertProduct} deleteProduct={deleteProduct} toast={store.toast} pricesHidden={store.settings.pricesHidden} stockEnabled={store.settings.stockEnabled} />
              )}
              {view === "customers" && <CustomersView orders={orders} orderTotal={orderTotal} />}
              {view === "calendar" && <SalesCalendarView orders={orders} orderTotal={orderTotal} />}
              {view === "brands" && <BrandsView db={db} onEdit={(id) => setEditor({ kind: "brand", id })} />}
              {view === "promos" && (
                <PromosView db={db} prodById={prodById} togglePromotion={togglePromotion} onPromo={(id) => setEditor({ kind: "promo", id })} onHero={(i) => setEditor({ kind: "hero", index: i })} />
              )}
              {view === "settings" && <SettingsView settings={store.settings} updateSetting={store.updateSetting} />}
            </div>
          )}
        </main>
      </div>

      {/* ---------- drawer ---------- */}
      {editor && (
        <Drawer onClose={() => setEditor(null)}>
          {editor.kind === "order" && (
            <OrderDetail
              order={orders.find((o) => o.id === editor.id)!}
              orderTotal={orderTotal}
              prodById={prodById}
              setOrderStatus={setOrderStatus}
              onClose={() => setEditor(null)}
            />
          )}
          {editor.kind === "product" && (
            <ProductEditor
              db={db}
              product={editor.id ? db.products.find((p) => p.id === editor.id)! : null}
              upsertProduct={upsertProduct}
              deleteProduct={deleteProduct}
              toast={store.toast}
              onClose={() => setEditor(null)}
            />
          )}
          {editor.kind === "brand" && (
            <BrandEditor
              db={db}
              brand={editor.id ? db.brands.find((b) => b.id === editor.id)! : null}
              upsertBrand={upsertBrand}
              deleteBrand={deleteBrand}
              onClose={() => setEditor(null)}
            />
          )}
          {editor.kind === "promo" && (
            <PromoEditor
              db={db}
              promo={editor.id ? db.promotions.find((p) => p.id === editor.id)! : null}
              savePromotion={savePromotion}
              deletePromotion={deletePromotion}
              toast={store.toast}
              onClose={() => setEditor(null)}
            />
          )}
          {editor.kind === "hero" && (
            <HeroEditor
              db={db}
              index={editor.index}
              updateHero={updateHero}
              toast={store.toast}
              onClose={() => setEditor(null)}
            />
          )}
        </Drawer>
      )}
    </div>
  );
}

/* ============================================================
   Settings
   ============================================================ */
function SettingsView({
  settings, updateSetting,
}: {
  settings: AppSettings;
  updateSetting: (key: "prices_hidden" | "commerce_enabled" | "stock_enabled", value: boolean) => void;
}) {
  return (
    <>
      <div className="adm-head">
        <h1>პარამეტრები</h1>
        <p className="sub">საიტის გლობალური გადამრთველები — ცვლილება მაშინვე აისახება საიტზე.</p>
      </div>
      <div className="acard pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <b style={{ fontSize: 14 }}>ფასების ჩვენება საიტზე</b>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
              გამორთულია → ფასები საიტზე არ ჩანს (ადმინში და ფორმაში რჩება).
            </p>
          </div>
          <label className="tgl">
            <input
              type="checkbox"
              checked={!settings.pricesHidden}
              onChange={(e) => updateSetting("prices_hidden", !e.target.checked)}
            />
            <span />
          </label>
        </div>
        <div style={{ borderTop: "1px solid var(--line)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <b style={{ fontSize: 14 }}>ვაჭრობა ჩართულია (კალათა / შეკვეთა / ანგარიში)</b>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
              გამორთულია → საიტი მხოლოდ კატალოგია; კალათა, შეკვეთა და რეგისტრაცია დამალულია.
            </p>
          </div>
          <label className="tgl">
            <input
              type="checkbox"
              checked={settings.commerceEnabled}
              onChange={(e) => updateSetting("commerce_enabled", e.target.checked)}
            />
            <span />
          </label>
        </div>
        <div style={{ borderTop: "1px solid var(--line)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <b style={{ fontSize: 14 }}>მარაგის ჩვენება (ადმინში)</b>
            <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
              დროებითი — სანამ FINA ჩაერთვება. ჩართულია → პროდუქტებში ჩანს მარაგის სვეტი/სტატუსი და პროდუქტის ფორმაში მარაგის ველი.
            </p>
          </div>
          <label className="tgl">
            <input
              type="checkbox"
              checked={settings.stockEnabled}
              onChange={(e) => updateSetting("stock_enabled", e.target.checked)}
            />
            <span />
          </label>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Access gate (login / denied)
   ============================================================ */
function AdminGate({ status }: { status: "checking" | "anon" | "denied" }) {
  const { signInPassword, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await signInPassword(email.trim(), password);
    if (error) setErr(error);
    setBusy(false);
  };

  if (status === "checking") {
    return <div className="admin-root" style={{ minHeight: "100vh" }} />;
  }

  return (
    <div className="admin-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div className="auth-wrap" style={{ marginTop: 0 }}>
        <div className="auth-card">
          <h1>ადმინისტრირება</h1>
          {status === "denied" ? (
            <>
              <p className="lead">ამ ანგარიშს არ აქვს ადმინ წვდომა.</p>
              <div className="auth-err" style={{ marginBottom: 14 }}>
                წვდომა შეზღუდულია — დაუკავშირდით ანგარიშის მფლობელს.
              </div>
              <button className="btn-line" style={{ width: "100%" }} onClick={() => signOut()}>
                სხვა ანგარიშით შესვლა
              </button>
            </>
          ) : (
            <>
              <p className="lead">შედით ადმინ ანგარიშით.</p>
              {err && <div className="auth-err" style={{ marginBottom: 14 }}>{err}</div>}
              <form className="auth-form" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="ag-email">ელფოსტა</label>
                  <input id="ag-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ag-pass">პაროლი</label>
                  <input id="ag-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="btn lg" type="submit" disabled={busy}>
                  {busy ? "..." : "შესვლა"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Drawer shell
   ============================================================ */
function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="adm-drawer open">
      <div className="scrim" onClick={onClose} />
      <div className="panel">{children}</div>
    </div>
  );
}

function DrawerHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="dr-head">
      <b>{title}</b>
      <button className="dr-close" aria-label="დახურვა" onClick={onClose}>×</button>
    </div>
  );
}

/* ============================================================
   Dashboard
   ============================================================ */
function Dashboard({
  db, orders, orderTotal, prodById, onOrder, onEditProduct,
}: {
  db: MulticolorData;
  orders: Order[];
  orderTotal: (o: Order) => number;
  prodById: (id: string) => Product | undefined;
  onOrder: (id: string) => void;
  onEditProduct: (id: string) => void;
}) {
  const revenue = orders
    .filter((o) => o.type === "order" && o.status !== "cancelled")
    .reduce((a, o) => a + orderTotal(o), 0);
  const newCount = orders.filter((o) => o.status === "new").length;
  const lowStock: { p: Product; s: { l: string; s: number } }[] = [];
  db.products.forEach((p) => p.sizes.forEach((s) => { if (s.s > 0 && s.s <= 10) lowStock.push({ p, s }); }));
  const activePromos = db.promotions.filter((x) => x.active);

  const qty = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((i) => qty.set(i.pid, (qty.get(i.pid) || 0) + i.qty)));
  const top = [...qty.entries()]
    .map(([pid, q]) => ({ p: prodById(pid), q }))
    .filter((x): x is { p: Product; q: number } => Boolean(x.p))
    .sort((a, b) => b.q - a.q)
    .slice(0, 6);
  const maxQ = top.length ? top[0].q : 1;
  const today = new Date().toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="adm-head">
        <h1>დაფა</h1>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{today}</span>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="lbl">შემოსავალი (შეკვეთები)</div><div className="val">{fmt(revenue)}</div><div className="delta" style={{ color: "var(--ok)" }}>↑ აქტიური კვირა</div></div>
        <div className="stat-card"><div className="lbl">ახალი შეკვეთა / მოთხოვნა</div><div className="val">{newCount}</div><div className="delta" style={{ color: "var(--accent)" }}>საჭიროებს პასუხს</div></div>
        <div className="stat-card"><div className="lbl">პროდუქტი კატალოგში</div><div className="val">{db.products.length}</div><div className="delta" style={{ color: "var(--muted)" }}>{db.brands.length} ბრენდი · {db.categories.length} კატეგორია</div></div>
        <div className="stat-card"><div className="lbl">მცირე მარაგი</div><div className="val" style={{ color: lowStock.length ? "var(--sale)" : "inherit" }}>{lowStock.length}</div><div className="delta" style={{ color: "var(--muted)" }}>პოზიცია ≤ 10 ც</div></div>
      </div>
      <div className="dash-cols">
        <div>
          <div className="acard" style={{ paddingBottom: 14 }}>
            <h3 className="cardh">ტოპ პროდუქტები (გაყიდული რაოდენობით)</h3>
            <div style={{ marginTop: 10 }}>
              {top.map((t) => (
                <div className="bar-row" key={t.p.id}>
                  <div>
                    <div className="meta"><span>{t.p.name}</span><b className="num">{t.q} ც</b></div>
                    <div className="bar" style={{ width: `${Math.max(8, (t.q / maxQ) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="acard" style={{ marginTop: 14, paddingBottom: 8 }}>
            <h3 className="cardh">ბოლო შეკვეთები და მოთხოვნები</h3>
            <table className="atable" style={{ marginTop: 8 }}>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr className="rowlink" key={o.id} onClick={() => onOrder(o.id)}>
                    <td className="nm">{o.id}</td>
                    <td><Pill map={TYPE} k={o.type} /></td>
                    <td>{o.customer.name}</td>
                    <td className="dim hide-m">{fmtDate(o.date)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{o.items.length ? fmt(orderTotal(o)) : "—"}</td>
                    <td><Pill map={STATUS} k={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="acard" style={{ paddingBottom: 8 }}>
            <h3 className="cardh">მცირე მარაგი</h3>
            <table className="atable" style={{ marginTop: 8 }}>
              <tbody>
                {lowStock.length ? (
                  lowStock.slice(0, 8).map((x, i) => (
                    <tr className="rowlink" key={`${x.p.id}-${i}`} onClick={() => onEditProduct(x.p.id)}>
                      <td><span className="nm">{x.p.name}</span><br /><span className="dim">{x.s.l}</span></td>
                      <td style={{ textAlign: "right" }}><span className="pill red">{x.s.s} ც</span></td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="dim">ყველა მარაგი საკმარისია ✓</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="acard pad" style={{ marginTop: 14 }}>
            <b style={{ fontSize: 14 }}>აქტიური აქციები — {activePromos.length}</b>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {activePromos.map((x) => (
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                  <span>{x.name}</span>
                  <span className="pill red">−{x.value}{x.type === "pct" ? "%" : "₾"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Orders
   ============================================================ */
function OrdersView({
  orders, orderTotal, setOrderStatus, onOrder,
}: {
  orders: Order[];
  orderTotal: (o: Order) => number;
  setOrderStatus: (id: string, s: Order["status"]) => void;
  onOrder: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const list = orders.filter((o) => filter === "all" || o.type === filter);
  const tabs = [["all", "ყველა"], ["order", "შეკვეთები"], ["quote", "ბითუმად"], ["inquiry", "კითხვები"]];
  return (
    <>
      <div className="adm-head"><h1>შეკვეთები და მოთხოვნები</h1></div>
      <div className="adm-toolbar">
        {tabs.map(([v, l]) => (
          <button key={v} className={`chip${filter === v ? " active" : ""}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      <div className="acard">
        <table className="atable">
          <thead>
            <tr>
              <th>№</th><th>ტიპი</th><th>კლიენტი</th>
              <th className="hide-m">ქალაქი</th><th className="hide-m">თარიღი</th>
              <th style={{ textAlign: "right" }}>ჯამი</th><th>სტატუსი</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr className="rowlink" key={o.id} onClick={() => onOrder(o.id)}>
                <td className="nm">{o.id}</td>
                <td><Pill map={TYPE} k={o.type} /></td>
                <td>{o.customer.name}<br /><span className="dim">{o.customer.phone || ""}</span></td>
                <td className="hide-m">{o.customer.city || "—"}</td>
                <td className="dim hide-m">{fmtDate(o.date)}</td>
                <td className="num" style={{ textAlign: "right" }}>{o.items.length ? fmt(orderTotal(o)) : "—"}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className="status-sel"
                    value={o.status}
                    onChange={(e) => setOrderStatus(o.id, e.target.value as Order["status"])}
                  >
                    {Object.keys(STATUS).map((s) => (
                      <option key={s} value={s}>{STATUS[s][0]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrderDetail({
  order: o, orderTotal, prodById, setOrderStatus, onClose,
}: {
  order: Order;
  orderTotal: (o: Order) => number;
  prodById: (id: string) => Product | undefined;
  setOrderStatus: (id: string, s: Order["status"]) => void;
  onClose: () => void;
}) {
  const c = o.customer;
  return (
    <>
      <DrawerHead title={`${o.id} — ${TYPE[o.type] ? TYPE[o.type][0] : o.type}`} onClose={onClose} />
      <div className="dr-body">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill map={TYPE} k={o.type} /> <Pill map={STATUS} k={o.status} />
          <span className="dim" style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(o.date)}</span>
        </div>
        <dl className="od-cust">
          <dt>კლიენტი</dt><dd>{c.name}</dd>
          <dt>ტელეფონი</dt><dd>{c.phone || "—"}</dd>
          {c.company && (<><dt>კომპანია</dt><dd>{c.company}</dd></>)}
          {c.city && (<><dt>ქალაქი</dt><dd>{c.city}</dd></>)}
          {c.address && (<><dt>მისამართი</dt><dd>{c.address}</dd></>)}
          {c.note && (<><dt>კომენტარი</dt><dd>{c.note}</dd></>)}
        </dl>
        {o.items.length ? (
          <div>
            <b style={{ fontSize: 13 }}>პოზიციები</b>
            <div className="od-items" style={{ marginTop: 8 }}>
              {o.items.map((i, idx) => {
                const p = prodById(i.pid);
                if (!p) return null;
                const sz = p.sizes.find((s) => s.l === i.size) || p.sizes[0];
                const unit = salePrice(p, sz.p);
                return (
                  <div className="oi" key={idx}>
                    <div><b>{p.name}</b><br /><span className="dim">{i.size}{i.color ? " · " + i.color : ""} · {fmt(unit)} / ც</span></div>
                    <div style={{ textAlign: "right" }}><b className="num">×{i.qty}</b><br /><span className="dim num">{fmt(unit * i.qty)}</span></div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: "right", marginTop: 10, fontWeight: 800 }}>ჯამი: <span className="num">{fmt(orderTotal(o))}</span></div>
          </div>
        ) : (
          <p className="dim" style={{ color: "var(--muted)" }}>პოზიციების გარეშე — ტექსტური მოთხოვნა.</p>
        )}
      </div>
      <div className="dr-foot">
        <button className="btn-line" onClick={onClose}>დახურვა</button>
        <button
          className="btn"
          onClick={() => { setOrderStatus(o.id, o.status === "new" ? "processing" : "done"); onClose(); }}
        >
          {o.status === "new" ? "მუშავდებაში გადატანა" : "შესრულებულად მონიშვნა"}
        </button>
      </div>
    </>
  );
}

/* ============================================================
   Products board (Claude Design handoff) — real Supabase data
   ============================================================ */
const IconLayersV = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5" /></Ico2>);
const IconBoxV = ({ s = 16 }: { s?: number }) => (<Ico2 s={s}><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" /></Ico2>);
const IconFolderV = ({ s = 15 }: { s?: number }) => (<Ico2 s={s}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Ico2>);
const fmtP = (n: number) => n.toLocaleString("en-US");

function PSwitch({ on, onChange, title }: { on: boolean; onChange: (v: boolean) => void; title?: string }) {
  return (
    <button className={"switch" + (on ? " is-on" : "")} role="switch" aria-checked={on} title={title}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}><span className="switchKnob" /></button>
  );
}
function PThumb({ name, hue, big }: { name: string; hue: number; big?: boolean }) {
  return <span className={"pthumb" + (big ? " pthumb--big" : "")} style={{ "--hue": hue } as React.CSSProperties}><span className="thumbInit">{(name || "?").trim().charAt(0)}</span></span>;
}
function PStockPill({ stock }: { stock: number }) {
  const cls = stock === 0 ? "stock--out" : stock <= 10 ? "stock--low" : "stock--ok";
  const txt = stock === 0 ? "ამოწურული" : stock <= 10 ? "ცოტაა · " + stock : stock + " ცალი";
  return <span className={"stockPill " + cls}>{txt}</span>;
}

function ProductsView({
  db, brandById, query, onEdit, upsertProduct, deleteProduct, toast, pricesHidden, stockEnabled,
}: {
  db: MulticolorData;
  brandById: (id: string) => Brand | undefined;
  query: string;
  onEdit: (id: string | null) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toast: (n: React.ReactNode) => void;
  pricesHidden: boolean;
  stockEnabled: boolean;
}) {
  void pricesHidden;
  /* category hue + helpers from real data */
  const topLevel = useMemo(() => db.categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order), [db.categories]);
  const hueByTop = useMemo(() => { const m = new Map<string, number>(); topLevel.forEach((c, i) => m.set(c.id, HUE_PALETTE[i % HUE_PALETTE.length])); return m; }, [topLevel]);
  const rootOf = useCallback((id: string) => { let cur: string | null | undefined = id, g = 0; while (cur && g++ < 40) { const c = db.categories.find((x) => x.id === cur); if (!c) break; if (!c.parentId) return c.id; cur = c.parentId; } return id; }, [db.categories]);
  const hueOf = useCallback((id: string) => hueByTop.get(rootOf(id)) ?? 250, [hueByTop, rootOf]);
  const nameOf = useCallback((id: string) => db.categories.find((c) => c.id === id)?.name || id, [db.categories]);
  const stockOf = (p: Product) => p.sizes.reduce((a, sz) => a + (sz.s || 0), 0);
  const isUnder = useCallback((catId: string, sel: Set<string>) => { let cur: string | null | undefined = catId, g = 0; while (cur && g++ < 40) { if (sel.has(cur)) return true; cur = db.categories.find((x) => x.id === cur)?.parentId; } return false; }, [db.categories]);

  const [q, setQ] = useState(query || "");
  const [view, setView] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(true);
  const [sort, setSort] = useState<{ key: "name" | "price" | "stock"; dir: number }>({ key: "name", dir: 1 });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [f, setF] = useState<{ cats: Set<string>; brands: Set<string>; status: Set<string> }>({ cats: new Set(), brands: new Set(), status: new Set() });
  const [brandQ, setBrandQ] = useState("");
  const [fExpanded, setFExpanded] = useState<Set<string>>(new Set());

  const onToggle = (p: Product, key: "live" | "ai", val: boolean) =>
    upsertProduct(key === "live" ? { ...p, visible: val } : { ...p, inAi: val });
  const onSelectRow = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const duplicate = (p: Product) => {
    const copy: Product = { ...p, id: uid("p"), name: p.name + " (ასლი)", slug: ((p.slug || p.id) + "-copy-" + Math.random().toString(36).slice(2, 5)), visible: false };
    upsertProduct(copy);
    toast(<><span className="tick">✓</span> დუბლირდა (დამალული)</>);
  };
  const removeOne = (p: Product) => { if (confirm("წაიშალოს „" + p.name + "“?")) { deleteProduct(p.id); toast(<><span className="tick">✓</span> წაიშალა</>); } };

  const counts = useMemo(() => {
    const cat: Record<string, number> = {}, brand: Record<string, number> = {};
    db.products.forEach((p) => { cat[p.cat] = (cat[p.cat] || 0) + 1; brand[p.brand] = (brand[p.brand] || 0) + 1; });
    return { cat, brand };
  }, [db.products]);
  // total products under a category (incl. descendants)
  const catTotal = useCallback((id: string): number => {
    let n = counts.cat[id] || 0;
    db.categories.filter((c) => c.parentId === id).forEach((c) => { n += catTotal(c.id); });
    return n;
  }, [counts, db.categories]);

  const filtered = useMemo(() => {
    let list = db.products.filter((p) => {
      if (q.trim()) { const hay = (p.name + " " + (p.subtitle || p.desc || "") + " " + (brandById(p.brand)?.name || "")).toLowerCase(); if (!hay.includes(q.trim().toLowerCase())) return false; }
      if (f.cats.size && !isUnder(p.cat, f.cats)) return false;
      if (f.brands.size && !f.brands.has(p.brand)) return false;
      if (f.status.size) { const tags = new Set([p.visible !== false ? "live" : "hidden"]); if (stockEnabled && stockOf(p) === 0) tags.add("out"); if (![...f.status].some((s2) => tags.has(s2))) return false; }
      return true;
    });
    const dir = sort.dir;
    list = [...list].sort((a, b) => {
      if (sort.key === "price") return (minPrice(a) - minPrice(b)) * dir;
      if (sort.key === "stock") return (stockOf(a) - stockOf(b)) * dir;
      return a.name.localeCompare(b.name, "ka") * dir;
    });
    return list;
  }, [db.products, q, f, sort, brandById, isUnder, stockEnabled]);

  const setSortKey = (key: "name" | "price" | "stock") => setSort((s) => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 });
  const allSel = filtered.length > 0 && filtered.every((p) => sel.has(p.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(filtered.map((p) => p.id)));

  const stats = useMemo(() => ({
    total: db.products.length,
    live: db.products.filter((p) => p.visible !== false).length,
    hidden: db.products.filter((p) => p.visible === false).length,
    out: db.products.filter((p) => stockOf(p) === 0).length,
  }), [db.products]);

  const STATUS_LABELS: Record<string, string> = { live: "საიტზე", hidden: "დამალული", out: "ამოწურული" };
  const activeChips = [
    ...[...f.cats].map((c) => ({ type: "cat" as const, val: c, label: nameOf(c) })),
    ...[...f.brands].map((b) => ({ type: "brand" as const, val: b, label: brandById(b)?.name || b })),
    ...[...f.status].map((st) => ({ type: "status" as const, val: st, label: STATUS_LABELS[st] })),
  ];
  const clearFilters = () => setF({ cats: new Set(), brands: new Set(), status: new Set() });
  const removeChip = (c: { type: "cat" | "brand" | "status"; val: string }) => setF((x) => {
    const keyMap = { cat: "cats", brand: "brands", status: "status" } as const;
    const k = keyMap[c.type]; const n = new Set(x[k]); n.delete(c.val); return { ...x, [k]: n };
  });

  const toggleExp = (id: string) => setFExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleCat = (id: string) => setF((x) => { const n = new Set(x.cats); n.has(id) ? n.delete(id) : n.add(id); return { ...x, cats: n }; });
  const toggleBrand = (id: string) => setF((x) => { const n = new Set(x.brands); n.has(id) ? n.delete(id) : n.add(id); return { ...x, brands: n }; });
  const toggleStatus = (st: string) => setF((x) => { const n = new Set(x.status); n.has(st) ? n.delete(st) : n.add(st); return { ...x, status: n }; });

  const bulkSet = (visible: boolean) => { db.products.filter((p) => sel.has(p.id)).forEach((p) => upsertProduct({ ...p, visible })); };
  const bulkDelete = () => { if (!confirm(sel.size + " პროდუქტი წაიშალოს?")) return; [...sel].forEach((id) => deleteProduct(id)); setSel(new Set()); };

  const exportCsv = () => {
    const rows = sel.size ? filtered.filter((p) => sel.has(p.id)) : filtered;
    const head = ["id", "სახელი", "ქვესათაური", "ბრენდი", "კატეგორია", "ფასი", "მარაგი", "საიტზე", "AI", "ლინკი"];
    const data = rows.map((p) => [p.id, p.name, p.subtitle || "", brandById(p.brand)?.name || "", nameOf(p.cat), minPrice(p), stockOf(p), p.visible !== false ? "კი" : "არა", p.inAi !== false ? "კი" : "არა", `https://multicolorge.vercel.app/product?slug=${p.slug || p.id}`]);
    const csv = [head, ...data].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "products.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const SortHead = ({ k, children, align }: { k: "name" | "price" | "stock"; children: React.ReactNode; align?: string }) => (
    <button className={"sortHead" + (sort.key === k ? " is-active" : "") + (align ? " sh--" + align : "")} onClick={() => setSortKey(k)}>
      {children}<span className={"sortArrow" + (sort.key === k && sort.dir < 0 ? " down" : "")}><IconChevR s={12} /></span>
    </button>
  );

  /* filter category tree node */
  const FilterTreeNode = ({ id, depth, hue }: { id: string; depth: number; hue: number }) => {
    const kids = db.categories.filter((c) => c.parentId === id).sort((a, b) => a.order - b.order);
    const hasKids = kids.length > 0;
    const open = fExpanded.has(id);
    const checked = f.cats.has(id);
    const h = depth === 0 ? hueByTop.get(id) ?? hue : hue;
    return (
      <div>
        <div className="ftRow" style={{ "--hue": h, paddingLeft: 6 + depth * 16 } as React.CSSProperties}>
          <button className={"ftCheck" + (checked ? " is-checked" : "")} onClick={() => toggleCat(id)}>{checked && <IconCheckV s={12} />}</button>
          {hasKids ? <button className={"ftDisc" + (open ? " is-open" : "")} onClick={() => toggleExp(id)}><IconChevR s={13} /></button> : <span className="ftDot" />}
          <button className="ftName" onClick={() => toggleCat(id)}>{nameOf(id)}</button>
          <span className="ftCount">{catTotal(id)}</span>
        </div>
        {open && hasKids && <div>{kids.map((c) => <FilterTreeNode key={c.id} id={c.id} depth={depth + 1} hue={h} />)}</div>}
      </div>
    );
  };

  const brandsShown = db.brands.filter((b) => b.name.toLowerCase().includes(brandQ.toLowerCase()));
  const activeFilters = f.cats.size + f.brands.size + f.status.size;
  const statusKeys: [string, string][] = stockEnabled ? [["live", "საიტზე"], ["hidden", "დამალული"], ["out", "ამოწურული"]] : [["live", "საიტზე"], ["hidden", "დამალული"]];

  return (
    <div className="page page--wide">
      <header className="pageHead">
        <div>
          <h1 className="pageTitle">პროდუქტები</h1>
          <p className="pageSub">მართეთ კატალოგი — გაფილტრეთ კატეგორიითა და ბრენდით, ჩართეთ/გამორთეთ საიტზე და AI, დაასორტირეთ სვეტებით.</p>
        </div>
        <div className="statRow">
          <div className="mcxstat"><span className="statNum">{stats.total}</span><span className="statLbl">პროდუქტი</span></div>
          <div className="statDiv" />
          <div className="mcxstat"><span className="statNum" style={{ color: "var(--ok)" }}>{stats.live}</span><span className="statLbl">საიტზე</span></div>
          <div className="statDiv" />
          <div className="mcxstat"><span className="statNum">{stats.hidden}</span><span className="statLbl">დამალული</span></div>
          {stockEnabled && <><div className="statDiv" /><div className="mcxstat"><span className="statNum" style={{ color: "var(--danger)" }}>{stats.out}</span><span className="statLbl">ამოწურული</span></div></>}
        </div>
      </header>

      <div className="toolbar">
        <button className={"pbtn pbtn--ghost" + (showFilters ? " is-active" : "")} onClick={() => setShowFilters((v) => !v)}>
          <IconLayersV s={16} /> ფილტრები{activeChips.length > 0 && <span className="btnBadge">{activeChips.length}</span>}
        </button>
        <div className="searchBox" style={{ flex: 1 }}>
          <IconSearchV s={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძებნა პროდუქტებში…" />
          {q && <button className="clearBtn" onClick={() => setQ("")}><IconXV s={14} /></button>}
        </div>
        <div className="segment">
          <button className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} title="სია"><IListV /></button>
          <button className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")} title="ბადე"><IGridV /></button>
        </div>
        <button className="pbtn pbtn--ghost" onClick={exportCsv}><IDownload /> Export</button>
        <button className="newCatBtn" onClick={() => onEdit(null)}><IconPlusV s={18} /> ახალი პროდუქტი</button>
      </div>

      {activeChips.length > 0 && (
        <div className="chipBar">
          {activeChips.map((c, i) => (
            <button key={i} className={"activeChip" + (c.type === "cat" ? " activeChip--cat" : "")} style={c.type === "cat" ? { "--hue": hueOf(c.val) } as React.CSSProperties : undefined} onClick={() => removeChip(c)}>
              {c.label}<IconXV s={12} />
            </button>
          ))}
          <button className="clearLink" onClick={clearFilters}>ყველას გასუფთავება</button>
        </div>
      )}

      <div className={"prodLayout" + (showFilters ? "" : " no-filters")}>
        {showFilters && (
          <aside className="filterPanel">
            <div className="filterHead">
              <span>ფილტრები{activeFilters > 0 && <span className="filterCount">{activeFilters}</span>}</span>
              {activeFilters > 0 && <button className="clearLink" onClick={clearFilters}>გასუფთავება</button>}
              <button className="filterClose" onClick={() => setShowFilters(false)} title="დახურვა"><IconXV s={16} /></button>
            </div>
            <div className="filterSection">
              <div className="filterLbl">სტატუსი</div>
              <div className="chipRow">
                {statusKeys.map(([k, l]) => (<button key={k} className={"filterChip" + (f.status.has(k) ? " is-on" : "")} onClick={() => toggleStatus(k)}>{l}</button>))}
              </div>
            </div>
            <div className="filterSection">
              <div className="filterLbl">კატეგორია</div>
              <div className="ftTree">
                {topLevel.map((c) => <FilterTreeNode key={c.id} id={c.id} depth={0} hue={hueByTop.get(c.id) ?? 250} />)}
              </div>
            </div>
            <div className="filterSection">
              <div className="filterLbl">ბრენდი</div>
              <div className="brandSearch"><IconSearchV s={14} /><input value={brandQ} onChange={(e) => setBrandQ(e.target.value)} placeholder="ბრენდის ძებნა…" /></div>
              <div className="brandList">
                {brandsShown.map((b) => (
                  <button key={b.id} className={"brandRow" + (f.brands.has(b.id) ? " is-on" : "")} onClick={() => toggleBrand(b.id)}>
                    <span className={"ftCheck" + (f.brands.has(b.id) ? " is-checked" : "")}>{f.brands.has(b.id) && <IconCheckV s={12} />}</span>
                    <span className="brandName">{b.name}</span>
                    <span className="ftCount">{counts.brand[b.id] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="prodMain">
          {sel.size > 0 && (
            <div className="bulkBar">
              <span className="bulkCount">{sel.size} მონიშნული</span>
              <button className="pbtn pbtn--ghost pbtn--sm" onClick={() => bulkSet(true)}>გამოქვეყნება</button>
              <button className="pbtn pbtn--ghost pbtn--sm" onClick={() => bulkSet(false)}>დამალვა</button>
              <button className="pbtn pbtn--ghost pbtn--sm pbtn--danger" onClick={bulkDelete}><IconTrashV s={14} /> წაშლა</button>
              <button className="clearLink" onClick={() => setSel(new Set())}>გაუქმება</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="treeCard"><div className="emptyState"><IconBoxV s={28} /><p>პროდუქტი ვერ მოიძებნა</p></div></div>
          ) : view === "list" ? (
            <div className={"pbtable" + (stockEnabled ? "" : " no-stock")}>
              <div className="ptHead">
                <button className={"pcheck" + (allSel ? " is-checked" : "")} onClick={toggleAll}>{allSel && <IconCheckV s={13} />}</button>
                <div className="pcell pcell--main"><SortHead k="name">პროდუქტი</SortHead></div>
                <div className="pcell pcell--cat">კატეგორია</div>
                <div className="pcell pcell--price"><SortHead k="price" align="end">ფასი</SortHead></div>
                {stockEnabled && <div className="pcell pcell--stock"><SortHead k="stock">მარაგი</SortHead></div>}
                <div className="pcell pcell--tog">საიტზე</div>
                <div className="pcell pcell--tog">AI</div>
                <div className="pcell pcell--act" />
              </div>
              {filtered.map((p) => {
                const b = brandById(p.brand); const selected = sel.has(p.id); const price = minPrice(p);
                return (
                  <div className={"prow" + (selected ? " is-sel" : "")} key={p.id} onClick={() => onEdit(p.id)}>
                    <button className={"pcheck" + (selected ? " is-checked" : "")} onClick={(e) => { e.stopPropagation(); onSelectRow(p.id); }}>{selected && <IconCheckV s={13} />}</button>
                    <div className="pcell pcell--main">
                      <PThumb name={p.name} hue={hueOf(p.cat)} />
                      <div className="pbinfo">
                        <div className="pname">{p.name}{p.visible === false && <span className="hiddenTag">დამალული</span>}</div>
                        <div className="pdesc">{p.subtitle || p.desc || ""} · <span className="pbrand">{b ? b.name : ""}</span></div>
                      </div>
                    </div>
                    <div className="pcell pcell--cat"><span className="catPill" style={{ "--hue": hueOf(p.cat) } as React.CSSProperties}>{nameOf(p.cat)}</span></div>
                    <div className="pcell pcell--price">
                      {price === 0 ? <span className="noPrice">ფასი არ არის</span> : <span className="pprice">{fmtP(price)} <span className="cur">₾</span>{p.sizes.length > 1 && <span className="fromTag" title="ფასი ვარიანტებიდან">+</span>}</span>}
                    </div>
                    {stockEnabled && <div className="pcell pcell--stock"><PStockPill stock={stockOf(p)} /></div>}
                    <div className="pcell pcell--tog"><PSwitch on={p.visible !== false} onChange={(v) => onToggle(p, "live", v)} title="საიტზე" /></div>
                    <div className="pcell pcell--tog"><PSwitch on={p.inAi !== false} onChange={(v) => onToggle(p, "ai", v)} title="AI" /></div>
                    <div className="pcell pcell--act" onClick={(e) => e.stopPropagation()}>
                      <div className="rowActions rowActions--show">
                        <button className="iconBtn2" title="რედაქტირება" onClick={() => onEdit(p.id)}><IconPencilV s={15} /></button>
                        <button className="iconBtn2" title="დუბლირება" onClick={() => duplicate(p)}><IconFolderV s={15} /></button>
                        <button className="iconBtn2 iconBtn2--del" title="წაშლა" onClick={() => removeOne(p)}><IconTrashV s={15} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pbgrid">
              {filtered.map((p) => {
                const b = brandById(p.brand); const selected = sel.has(p.id); const price = minPrice(p);
                return (
                  <div className={"pbcard" + (selected ? " is-sel" : "")} key={p.id}>
                    <div className="pcardTop" style={{ "--hue": hueOf(p.cat) } as React.CSSProperties}>
                      <button className={"pcheck pcheck--card" + (selected ? " is-checked" : "")} onClick={() => onSelectRow(p.id)}>{selected && <IconCheckV s={13} />}</button>
                      <PThumb name={p.name} hue={hueOf(p.cat)} big />
                      <div className="pcardActions">
                        <button className="iconBtn2" onClick={() => onEdit(p.id)} title="რედაქტირება"><IconPencilV s={14} /></button>
                        <button className="iconBtn2 iconBtn2--del" onClick={() => removeOne(p)} title="წაშლა"><IconTrashV s={14} /></button>
                      </div>
                      {p.visible === false && <span className="hiddenTag hiddenTag--card">დამალული</span>}
                    </div>
                    <div className="pcardBody">
                      <span className="catPill" style={{ "--hue": hueOf(p.cat) } as React.CSSProperties}>{nameOf(p.cat)}</span>
                      <div className="pcardName" onClick={() => onEdit(p.id)} style={{ cursor: "pointer" }}>{p.name}</div>
                      <div className="pcardDesc">{p.subtitle || p.desc || ""}</div>
                      <div className="pcardFoot">
                        <span className="pprice">{price === 0 ? <span className="noPrice">—</span> : <>{fmtP(price)} <span className="cur">₾</span></>}</span>
                        {stockEnabled && <PStockPill stock={stockOf(p)} />}
                      </div>
                      <div className="pcardToggles">
                        <label className="togLbl"><PSwitch on={p.visible !== false} onChange={(v) => onToggle(p, "live", v)} /> საიტზე</label>
                        <label className="togLbl"><PSwitch on={p.inAi !== false} onChange={(v) => onToggle(p, "ai", v)} /> AI</label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Customers (aggregated from orders)
   ============================================================ */
function CustomersView({ orders, orderTotal }: { orders: Order[]; orderTotal: (o: Order) => number }) {
  const map = new Map<string, { name: string; email: string; phone: string; city: string; count: number; total: number; last: string }>();
  orders.forEach((o) => {
    const c = o.customer;
    const key = (c.email || c.phone || c.name || "—").toLowerCase();
    const cur = map.get(key) || { name: c.name || "—", email: c.email || "", phone: c.phone || "", city: c.city || "", count: 0, total: 0, last: o.date };
    cur.count += 1;
    cur.total += orderTotal(o);
    if (o.date > cur.last) cur.last = o.date;
    if (!cur.email && c.email) cur.email = c.email;
    if (!cur.phone && c.phone) cur.phone = c.phone;
    map.set(key, cur);
  });
  const rows = [...map.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="acard2">
      <div className="acard2-head"><h3>მომხმარებლები <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13 }}>({rows.length})</span></h3></div>
      {rows.length === 0 ? (
        <div className="empty" style={{ padding: 40 }}><h3>ჯერ მომხმარებლები არ არის</h3></div>
      ) : (
        <table className="ptable">
          <thead>
            <tr><th>მომხმარებელი</th><th className="hide-m">ქალაქი</th><th>შეკვეთები</th><th>ჯამი</th><th className="hide-m">ბოლო შეკვეთა</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <div className="pinfo">
                    <span className="cust-av">{(r.name || r.email || "?").slice(0, 1)}</span>
                    <div><div className="nm">{r.name}</div><div className="br">{r.email || r.phone}</div></div>
                  </div>
                </td>
                <td className="hide-m">{r.city || "—"}</td>
                <td className="num">{r.count}</td>
                <td className="num">{fmt(r.total)}</td>
                <td className="hide-m" style={{ color: "var(--muted)", fontSize: 12.5 }}>
                  {new Date(r.last).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ============================================================
   Sales Calendar
   ============================================================ */
function SalesCalendarView({ orders, orderTotal }: { orders: Order[]; orderTotal: (o: Order) => number }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7; // Mon-first

  const byDay = new Map<number, { count: number; total: number }>();
  let monthCount = 0, monthTotal = 0;
  orders.forEach((o) => {
    const d = new Date(o.date);
    if (d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
      const day = d.getDate();
      const cur = byDay.get(day) || { count: 0, total: 0 };
      cur.count += 1; cur.total += orderTotal(o);
      byDay.set(day, cur);
      monthCount += 1; monthTotal += orderTotal(o);
    }
  });

  const monthName = first.toLocaleDateString("ka-GE", { month: "long", year: "numeric" });
  const shift = (delta: number) => setCursor((c) => {
    const nm = c.m + delta;
    return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dows = ["ორ", "სა", "ოთ", "ხუ", "პა", "შა", "კვ"];

  return (
    <div>
      <div className="cal-head">
        <h3>{monthName}</h3>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{monthCount} შეკვეთა · {fmt(monthTotal)}</span>
        <div className="cal-nav">
          <button onClick={() => shift(-1)}>‹</button>
          <button onClick={() => setCursor(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })} className="mini-btn" style={{ width: "auto", padding: "0 12px" }}>დღეს</button>
          <button onClick={() => shift(1)}>›</button>
        </div>
      </div>
      <div className="cal-grid">
        {dows.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
        {cells.map((day, i) => day === null ? (
          <div className="cal-cell empty" key={`e${i}`} />
        ) : (
          <div className="cal-cell" key={day}>
            <div className="d">{day}</div>
            {byDay.get(day) && (
              <div className="ev">{byDay.get(day)!.count} შეკვ.<span className="t">{fmt(byDay.get(day)!.total)}</span></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface VolRow { v: string; u: string; p: string }
interface SizeRow { l: string; p: string }
interface ColorRow { h: string; n: string }

const UNITS = ["კგ", "გრ", "ლ", "მლ", "მგ", "ც"];

/** id of the top-most ancestor category (used to detect the tools branch) */
function rootCatId(cats: Category[], id: string): string {
  let cur = id;
  for (let k = 0; k < 20; k++) {
    const c = cats.find((x) => x.id === cur);
    if (!c || !c.parentId) return cur;
    cur = c.parentId;
  }
  return cur;
}

function ProductEditor({
  db, product, upsertProduct, deleteProduct, toast, onClose,
}: {
  db: MulticolorData;
  product: Product | null;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toast: (n: React.ReactNode) => void;
  onClose: () => void;
}) {
  const isNew = !product;
  const base: Product =
    product || {
      id: uid("p"), name: "", brand: db.brands[0]?.id || "", cat: db.categories[0]?.id || "",
      desc: "", sizes: [], colors: [], specs: {}, tags: [], featured: false, visible: true, inAi: true,
    };

  const [visible, setVisible] = useState(base.visible !== false);
  const [inAi, setInAi] = useState(base.inAi !== false);
  const [name, setName] = useState(base.name);
  const [subtitle, setSubtitle] = useState(base.subtitle || "");
  const [slug, setSlug] = useState(base.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!base.slug);
  const [brand, setBrand] = useState(base.brand);
  const [cat, setCat] = useState(base.cat);
  const [desc, setDesc] = useState(base.desc || "");
  const [usage, setUsage] = useState(base.usage || "");
  const [aiInfo, setAiInfo] = useState(base.aiInfo || "");
  const [image, setImage] = useState(base.image || "");
  const [docUrl, setDocUrl] = useState(base.document || "");
  const [busyImg, setBusyImg] = useState(false);
  const [busyDoc, setBusyDoc] = useState(false);

  const isTools = rootCatId(db.categories, cat) === "tools";

  const [vols, setVols] = useState<VolRow[]>(
    (base.sizes || []).filter((x) => x.u).map((x) => ({ v: x.v || x.l, u: x.u || "კგ", p: String(x.p) }))
  );
  const [sizes, setSizes] = useState<SizeRow[]>(
    (base.sizes || []).filter((x) => !x.u).map((x) => ({ l: x.l, p: String(x.p) }))
  );
  const [colors, setColors] = useState<ColorRow[]>(
    (base.colors || []).map((c) => ({ h: c.h, n: c.n }))
  );

  /* shared colour library (favourites) */
  const [lib, setLib] = useState<{ hex: string; name: string }[]>([]);
  useEffect(() => {
    if (supabase)
      supabase.from("color_library").select("*").order("created_at").then(({ data }) => {
        if (data) setLib((data as { hex: string; name: string | null }[]).map((r) => ({ hex: r.hex, name: r.name || "" })));
      });
  }, []);
  const saveToLib = async (hex: string, nm: string) => {
    if (!supabase) return;
    await supabase.from("color_library").upsert({ hex, name: nm || null });
    setLib((l) => [...l.filter((x) => x.hex !== hex), { hex, name: nm || "" }]);
    toast(<><span className="tick">✓</span> ფერი დაემატა ბიბლიოთეკას</>);
  };

  const uploadFile = async (file: File, kind: "photo" | "doc"): Promise<string | null> => {
    if (!supabase) { toast(<>Storage არ არის ხელმისაწვდომი</>); return null; }
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("product-media").upload(path, file, { upsert: false });
    if (error) { toast(<>ატვირთვა ვერ მოხერხდა: {error.message}</>); return null; }
    return supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
  };
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusyImg(true); const url = await uploadFile(f, "photo"); setBusyImg(false);
    if (url) setImage(url);
  };
  const onPickDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusyDoc(true); const url = await uploadFile(f, "doc"); setBusyDoc(false);
    if (url) setDocUrl(url);
  };

  const save = () => {
    const tools = rootCatId(db.categories, cat) === "tools";
    let outSizes: Product["sizes"];
    if (tools) {
      outSizes = sizes.map((r) => ({ l: r.l.trim(), p: parseFloat(r.p) || 0, s: 0 })).filter((x) => x.l);
    } else {
      outSizes = vols
        .filter((r) => r.v.trim())
        .map((r) => ({ l: `${r.v.trim()}${r.u}`, v: r.v.trim(), u: r.u, p: parseFloat(r.p) || 0, s: 0 }));
    }
    if (!outSizes.length) outSizes = [{ l: "—", p: 0, s: 0 }];

    const next: Product = {
      ...base,
      name: name.trim() || "უსახელო პროდუქტი",
      subtitle: subtitle.trim() || undefined,
      slug: (slug.trim() ? slugify(slug) : slugify(name.trim())) || base.slug,
      brand, cat,
      desc: desc.trim(),
      usage: usage.trim() || undefined,
      aiInfo: aiInfo.trim() || undefined,
      image: image || undefined,
      document: docUrl || undefined,
      visible, inAi,
      sizes: outSizes,
      colors: tools ? [] : colors.map((r) => ({ n: r.n.trim() || r.h, h: r.h })).filter((c) => c.h),
      specs: {},
      tags: (base.tags || []).filter((t) => t === "new" || t === "sale"),
      featured: base.featured,
      salePct: base.salePct,
    };
    upsertProduct(next);
    toast(<><span className="tick">✓</span> შენახულია — ცვლილება მაღაზიაზეც აისახა</>);
    onClose();
  };

  const remove = () => {
    if (!product) return;
    if (!confirm("წაიშალოს პროდუქტი „" + product.name + "“?")) return;
    deleteProduct(product.id);
    onClose();
  };

  return (
    <>
      <DrawerHead title={isNew ? "ახალი პროდუქტი" : "პროდუქტის რედაქტირება"} onClose={onClose} />
      <div className="dr-body">
        <div className="pe-toggles">
          <div className="pe-tg">
            <div><b>ჩანდეს საიტზე</b><i>გამორთვისას პროდუქტი დაიმალება მაღაზიაში</i></div>
            <label className="tgl"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /><span /></label>
          </div>
          <div className="pe-tg">
            <div><b>AI ბოტის ცოდნის ბაზაში</b><i>გამორთვისას ბოტი ვერ გამოიყენებს ამ პროდუქტს</i></div>
            <label className="tgl"><input type="checkbox" checked={inAi} onChange={(e) => setInAi(e.target.checked)} /><span /></label>
          </div>
        </div>

        <div className="field"><label>დასახელება *</label><input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} placeholder="მაგ. ცემენტის ჰიდროიზოლაცია" /></div>
        <div className="field"><label>ქვესათაური</label><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="მაგ. აბაზანისა & სამზარეულოს ჰიდროიზოლაცია" /></div>
        <div className="field">
          <label>ლინკი (slug) — ავტომატური ლათინურად</label>
          <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="latin-slug" />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>მისამართი: /product?slug={slug || "…"}</span>
        </div>

        <div className="field"><label>ბრენდი</label>
          <div className="brand-pick">
            {db.brands.map((b) => (
              <button type="button" key={b.id} className={`bpick${brand === b.id ? " on" : ""}`} onClick={() => setBrand(b.id)}>
                {brandLogoSrc(b)
                  ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={brandLogoSrc(b)} alt={b.name} />)
                  : <span className="bp-letter" style={{ background: b.tint }}>{b.name[0]}</span>}
                <span className="bp-nm">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field"><label>კატეგორია</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {flatCatTree(db.categories).map(({ c, depth }) => (
              <option key={c.id} value={c.id}>{`${"  ".repeat(depth)}${depth ? "└ " : ""}${c.name}`}</option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{isTools ? "ინსტრუმენტი → იყენებს „ზომებს“" : "იყენებს „მოცულობას + ფერებს“"}</span>
        </div>

        <div className="frow2">
          <div className="field"><label>ფოტო</label>
            {image && (
              <div className="up-prev">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" />
                <button type="button" className="del" title="მოშორება" onClick={() => setImage("")}>×</button>
              </div>
            )}
            <label className="up-btn">{busyImg ? "იტვირთება…" : image ? "ფოტოს შეცვლა" : "ფოტოს ატვირთვა"}
              <input type="file" accept="image/*" hidden onChange={onPickImage} />
            </label>
          </div>
          <div className="field"><label>დოკუმენტი (PDF / კატალოგი)</label>
            {docUrl && (
              <div className="up-doc">
                <a href={docUrl} target="_blank" rel="noreferrer">📄 ფაილის ნახვა</a>
                <button type="button" className="rm-link" onClick={() => setDocUrl("")}>მოშორება</button>
              </div>
            )}
            <label className="up-btn">{busyDoc ? "იტვირთება…" : docUrl ? "ფაილის შეცვლა" : "დოკუმენტის ატვირთვა"}
              <input type="file" accept=".pdf,application/pdf,.doc,.docx,image/*" hidden onChange={onPickDoc} />
            </label>
          </div>
        </div>

        <div className="field"><label>აღწერა</label><textarea style={{ minHeight: 70 }} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label>გამოყენების წესი</label><textarea style={{ minHeight: 70 }} value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="როგორ გამოიყენება პროდუქტი…" /></div>

        {isTools ? (
          <div className="fset">
            <div className="fset-h"><b>ზომები (ფასი თითო ვარიანტზე)</b></div>
            {sizes.map((r, i) => (
              <div className="vrow" key={i} style={{ gridTemplateColumns: "1fr 120px 30px" }}>
                <input placeholder="ზომა (მაგ. 25მმ)" value={r.l} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, l: e.target.value } : x))} />
                <input type="number" step="0.01" min="0" placeholder="ფასი ₾" value={r.p} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} />
                <button className="del" type="button" title="წაშლა" onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button className="addrow" type="button" onClick={() => setSizes((s) => [...s, { l: "", p: "" }])}>+ ზომის დამატება</button>
          </div>
        ) : (
          <>
            <div className="fset">
              <div className="fset-h"><b>მოცულობა / წონა (ფასი თითო ვარიანტზე)</b></div>
              {vols.map((r, i) => (
                <div className="vrow" key={i} style={{ gridTemplateColumns: "1fr 86px 110px 30px" }}>
                  <input placeholder="რაოდენობა (მაგ. 5)" value={r.v} onChange={(e) => setVols((s) => s.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} />
                  <select value={r.u} onChange={(e) => setVols((s) => s.map((x, j) => j === i ? { ...x, u: e.target.value } : x))}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input type="number" step="0.01" min="0" placeholder="ფასი ₾" value={r.p} onChange={(e) => setVols((s) => s.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} />
                  <button className="del" type="button" title="წაშლა" onClick={() => setVols((s) => s.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button className="addrow" type="button" onClick={() => setVols((s) => [...s, { v: "", u: "კგ", p: "" }])}>+ მოცულობის დამატება</button>
            </div>

            <div className="fset">
              <div className="fset-h"><b>ფერები</b></div>
              {lib.length > 0 && (
                <div className="lib-swatches">
                  <span className="dim">ბიბლიოთეკიდან:</span>
                  {lib.map((c) => (
                    <button type="button" key={c.hex} className="lib-sw" title={c.name || c.hex} style={{ background: c.hex }} onClick={() => setColors((s) => [...s, { h: c.hex, n: c.name }])} />
                  ))}
                </div>
              )}
              {colors.map((r, i) => (
                <div className="vrow color-row" key={i} style={{ gridTemplateColumns: "46px 1fr 34px 30px" }}>
                  <input type="color" value={r.h} onChange={(e) => setColors((s) => s.map((x, j) => j === i ? { ...x, h: e.target.value } : x))} />
                  <input placeholder="ფერის სახელი" value={r.n} onChange={(e) => setColors((s) => s.map((x, j) => j === i ? { ...x, n: e.target.value } : x))} />
                  <button type="button" className="star" title="ბიბლიოთეკაში დამატება" onClick={() => saveToLib(r.h, r.n)}>★</button>
                  <button className="del" type="button" title="წაშლა" onClick={() => setColors((s) => s.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button className="addrow" type="button" onClick={() => setColors((s) => [...s, { h: "#cccccc", n: "" }])}>+ ფერის დამატება</button>
            </div>
          </>
        )}

        <div className="fset">
          <div className="fset-h"><b>AI ბოტის ინსტრუქცია</b></div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            ინფორმაცია მხოლოდ AI ბოტისთვის — საიტზე არ ჩანს, ბოტი იყენებს კლიენტის კითხვებზე პასუხისთვის.
          </p>
          <textarea
            value={aiInfo}
            onChange={(e) => setAiInfo(e.target.value)}
            placeholder="მაგ. ტექნიკური დეტალები, ხშირი კითხვები, რჩევები, შეზღუდვები…"
            style={{ minHeight: 90, width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}
          />
        </div>
      </div>
      <div className="dr-foot">
        {!isNew && <button className="btn-line" style={{ color: "var(--sale)", borderColor: "var(--sale)" }} onClick={remove}>წაშლა</button>}
        <button className="btn" onClick={save}>{isNew ? "პროდუქტის დამატება" : "შენახვა"}</button>
      </div>
    </>
  );
}

/* ============================================================
   Brands
   ============================================================ */
function BrandsView({ db, onEdit }: { db: MulticolorData; onEdit: (id: string | null) => void }) {
  return (
    <>
      <div className="adm-head"><h1>ბრენდები</h1><button className="btn sm" onClick={() => onEdit(null)}>+ ახალი ბრენდი</button></div>
      <div className="brand-grid">
        {db.brands.map((b) => {
          const n = db.products.filter((p) => p.brand === b.id).length;
          return (
            <div className="brand-card rowlink" key={b.id} style={{ cursor: "pointer" }} onClick={() => onEdit(b.id)}>
              {brandLogoSrc(b) ? (
                <span className="mk logo-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogoSrc(b)} alt={b.name} />
                </span>
              ) : (
                <span className="mk" style={{ background: b.tint }}>{b.name[0]}</span>
              )}
              <div className="bd">
                <b className="nm">{b.name}</b> <span className="dim">· {b.country} · {n} პროდუქტი</span>
                <p className="st">{b.story}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BrandEditor({
  db, brand, upsertBrand, deleteBrand, onClose,
}: {
  db: MulticolorData;
  brand: Brand | null;
  upsertBrand: (b: Brand) => void;
  deleteBrand: (id: string) => void;
  onClose: () => void;
}) {
  const isNew = !brand;
  const base: Brand = brand || { id: uid("b"), name: "", country: "", tagline: "", story: "", tint: "#46698c" };
  const [name, setName] = useState(base.name);
  const [country, setCountry] = useState(base.country);
  const [tagline, setTagline] = useState(base.tagline);
  const [story, setStory] = useState(base.story);
  const [logo, setLogo] = useState<string>(brandLogoSrc(base) || "");
  const [busyLogo, setBusyLogo] = useState(false);

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !supabase) return;
    setBusyLogo(true);
    const ext = (f.name.split(".").pop() || "png").toLowerCase();
    const path = `brands/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("product-media").upload(path, f, { upsert: false });
    setBusyLogo(false);
    if (error) { alert("ატვირთვა ვერ მოხერხდა: " + error.message); return; }
    setLogo(supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl);
  };

  const save = () => {
    const next: Brand = { ...base, name: name.trim() || base.name || "ბრენდი", country: country.trim(), tagline: tagline.trim(), story: story.trim(), tint: base.tint || "#46698c", logo: logo || null };
    upsertBrand(next);
    onClose();
  };
  const remove = () => {
    if (!brand) return;
    const n = db.products.filter((p) => p.brand === brand.id).length;
    if (n) { alert("ჯერ გადაიტანეთ ან წაშალეთ ამ ბრენდის " + n + " პროდუქტი."); return; }
    deleteBrand(brand.id);
    onClose();
  };

  return (
    <>
      <DrawerHead title={isNew ? "ახალი ბრენდი" : base.name + " — რედაქტირება"} onClose={onClose} />
      <div className="dr-body">
        <div className="frow2">
          <div className="field"><label>სახელი *</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>ქვეყანა</label><input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
        </div>
        <div className="field"><label>ტეგლაინი</label><input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
        <div className="field"><label>ისტორია (ბრენდის გვერდზე)</label><textarea value={story} onChange={(e) => setStory(e.target.value)} /></div>
        <div className="field"><label>ლოგო</label>
          {logo && (
            <div className="up-prev" style={{ background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="ლოგო" />
              <button type="button" className="del" title="მოშორება" onClick={() => setLogo("")}>×</button>
            </div>
          )}
          <label className="up-btn">{busyLogo ? "იტვირთება…" : logo ? "ლოგოს შეცვლა" : "ლოგოს ატვირთვა"}
            <input type="file" accept="image/*,.svg" hidden onChange={onPickLogo} />
          </label>
        </div>
      </div>
      <div className="dr-foot">
        {!isNew && <button className="btn-line" style={{ color: "var(--sale)", borderColor: "var(--sale)" }} onClick={remove}>წაშლა</button>}
        <button className="btn" onClick={save}>{isNew ? "დამატება" : "შენახვა"}</button>
      </div>
    </>
  );
}

/* ============================================================
   Categories — color-coded tree board (drag / inline / search)
   ============================================================ */
interface CNode { id: string; name: string; children: CNode[] }
type DropPos = "before" | "after" | "inside";

function catIsDesc(cats: Category[], nodeId: string, ancestorId: string): boolean {
  let cur: string | null | undefined = nodeId, g = 0;
  while (cur && g++ < 40) { if (cur === ancestorId) return true; cur = cats.find((c) => c.id === cur)?.parentId; }
  return false;
}
function filterCTree(nodes: CNode[], q: string): { nodes: CNode[]; ids: Set<string> | null } {
  if (!q.trim()) return { nodes, ids: null };
  const needle = q.trim().toLowerCase();
  const ids = new Set<string>();
  const rec = (list: CNode[]): CNode[] => {
    const out: CNode[] = [];
    for (const n of list) {
      const kids = rec(n.children);
      if (n.name.toLowerCase().includes(needle) || kids.length) { out.push({ ...n, children: kids }); ids.add(n.id); }
    }
    return out;
  };
  return { nodes: rec(nodes), ids };
}
function CHighlight({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
  if (i === -1) return <>{text}</>;
  const len = q.trim().length;
  return (<>{text.slice(0, i)}<mark className="hl">{text.slice(i, i + len)}</mark>{text.slice(i + len)}</>);
}

interface BoardApi {
  expanded: Set<string>; toggle: (id: string) => void;
  editing: string | null; setEditing: (id: string | null) => void;
  addingTo: string | null; startAdd: (id: string | null) => void;
  confirming: string | null; setConfirming: (id: string | null) => void;
  commitRename: (id: string, v: string) => void;
  commitAdd: (parentId: string, name: string) => void;
  doDelete: (id: string) => void;
  dragId: string | null; setDragId: (id: string | null) => void;
  dragOver: { id: string; pos: DropPos } | null; setDragOver: (v: { id: string; pos: DropPos } | null) => void;
  endDrag: () => void; handleDrop: (targetId: string) => void;
  countOf: (n: CNode) => number;
}
const BoardCtx = createContext<BoardApi | null>(null);

function InlineAdd({ hue, onCommit, onCancel }: { hue: number; onCommit: (n: string) => void; onCancel: () => void }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const commit = () => { const t = v.trim(); if (t) onCommit(t); else onCancel(); };
  return (
    <div className="row row--add" style={{ "--hue": hue } as React.CSSProperties}>
      <span className="mcxdot" />
      <input ref={ref} className="inlineInput" value={v} placeholder="ქვეკატეგორიის სახელი…"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
        onBlur={commit} />
      <div className="rowActions rowActions--show">
        <button className="iconBtn2 iconBtn2--ok" onMouseDown={(e) => { e.preventDefault(); commit(); }} title="დამატება"><IconCheckV /></button>
        <button className="iconBtn2" onMouseDown={(e) => { e.preventDefault(); onCancel(); }} title="გაუქმება"><IconXV /></button>
      </div>
    </div>
  );
}

function TreeNode({ node, depth, hue, q, expandedFilter }: { node: CNode; depth: number; hue: number; q: string; expandedFilter: Set<string> | null }) {
  const b = useContext(BoardCtx)!;
  const hasKids = node.children.length > 0;
  const expanded = expandedFilter ? expandedFilter.has(node.id) : b.expanded.has(node.id);
  const isEditing = b.editing === node.id;
  const adding = b.addingTo === node.id;
  const confirming = b.confirming === node.id;
  const drop = b.dragOver && b.dragOver.id === node.id ? b.dragOver.pos : null;
  const dragging = b.dragId === node.id;
  const rowRef = useRef<HTMLDivElement>(null);
  const [editVal, setEditVal] = useState(node.name);
  useEffect(() => { if (isEditing) setEditVal(node.name); }, [isEditing, node.name]);

  const total = b.countOf(node);
  const subN = node.children.length;
  const initial = node.name.trim().charAt(0);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!b.dragId || b.dragId === node.id || !rowRef.current) return;
    const r = rowRef.current.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height;
    let pos: DropPos = "inside";
    if (y < 0.28) pos = "before"; else if (y > 0.72) pos = "after";
    b.setDragOver({ id: node.id, pos });
  };

  return (
    <div className={"node" + (dragging ? " node--dragging" : "")}>
      <div ref={rowRef}
        className={"row" + (drop ? " row--drop-" + drop : "") + (confirming ? " row--danger" : "")}
        style={{ "--hue": hue } as React.CSSProperties}
        draggable={!isEditing}
        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; b.setDragId(node.id); }}
        onDragEnd={() => b.endDrag()}
        onDragOver={onDragOver}
        onDrop={(e) => { e.preventDefault(); b.handleDrop(node.id); }}>
        <span className="grip" title="გადაათრიეთ"><IconGripV /></span>
        {hasKids ? (
          <button className={"disclose" + (expanded ? " is-open" : "")} onClick={() => b.toggle(node.id)}><IconChevR /></button>
        ) : (<span className="disclose disclose--leaf" />)}
        <span className={"mcxchip" + (depth === 0 ? " mcxchip--root" : "")}>{initial}</span>
        {isEditing ? (
          <input className="inlineInput" autoFocus value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") b.commitRename(node.id, editVal); if (e.key === "Escape") b.setEditing(null); }}
            onBlur={() => b.commitRename(node.id, editVal)} />
        ) : (
          <button className="name" onDoubleClick={() => b.setEditing(node.id)} title={node.name}><CHighlight text={node.name} q={q} /></button>
        )}
        <span className="mcxmeta">
          {subN > 0 && <span className="mcxpill mcxpill--sub">{subN} ქვეკატეგორია</span>}
          <span className={"mcxpill" + (total === 0 ? " mcxpill--empty" : "")}>{total === 0 ? "ცარიელი" : total + " პროდუქტი"}</span>
        </span>
        <span className="flex1" />
        {confirming ? (
          <div className="rowActions rowActions--show confirm">
            <span className="confirmLbl">წავშალო{subN ? " (+" + subN + ")" : ""}?</span>
            <button className="iconBtn2 iconBtn2--danger" onClick={() => b.doDelete(node.id)} title="წაშლა"><IconCheckV /></button>
            <button className="iconBtn2" onClick={() => b.setConfirming(null)} title="გაუქმება"><IconXV /></button>
          </div>
        ) : (
          <div className="rowActions">
            <button className="iconBtn2" onClick={() => b.startAdd(node.id)} title="ქვეკატეგორიის დამატება"><IconCornerAddV /></button>
            <button className="iconBtn2" onClick={() => b.setEditing(node.id)} title="გადარქმევა"><IconPencilV /></button>
            <button className="iconBtn2 iconBtn2--del" onClick={() => b.setConfirming(node.id)} title="წაშლა"><IconTrashV /></button>
          </div>
        )}
      </div>
      {(expanded && hasKids) || adding ? (
        <div className="kids">
          <span className="mcxrail" style={{ "--hue": hue } as React.CSSProperties} />
          {adding && <InlineAdd hue={hue} onCommit={(name) => b.commitAdd(node.id, name)} onCancel={() => b.startAdd(null)} />}
          {expanded && node.children.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} hue={hue} q={q} expandedFilter={expandedFilter} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NewCategory({ tree, onAdd }: { tree: CNode[]; onAdd: (parentId: string | null, name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);

  const options: { id: string; label: string }[] = [];
  const walk = (list: CNode[], depth: number) => list.forEach((n) => { options.push({ id: n.id, label: "— ".repeat(depth) + n.name }); walk(n.children, depth + 1); });
  walk(tree, 0);

  const submit = () => { const t = name.trim(); if (!t) return; onAdd(parent || null, t); setName(""); setParent(""); };

  if (!open) return <button className="newCatBtn" onClick={() => setOpen(true)}><IconPlusV s={18} /> ახალი კატეგორია</button>;
  return (
    <div className="composer">
      <div className="composerField composerField--grow">
        <label>ახალი კატეგორია</label>
        <input ref={ref} value={name} placeholder="მაგ. სინთეთიკური ლაქი" onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }} />
      </div>
      <div className="composerField">
        <label>ძირითადი კატეგორია</label>
        <div className="selectWrap">
          <select value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">ზედა დონე — parent არ აქვს</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <span className="selectCaret"><IconChevR s={15} /></span>
        </div>
      </div>
      <div className="composerActions">
        <button className="btn2 btn2--primary" onClick={submit}>დამატება</button>
        <button className="btn2 btn2--ghost" onClick={() => { setOpen(false); setName(""); setParent(""); }}>გაუქმება</button>
      </div>
    </div>
  );
}

function CatsView({
  db, updateCategory, upsertCategory, deleteCategory, toast,
}: {
  db: MulticolorData;
  updateCategory: (c: Category) => void;
  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  toast: (n: React.ReactNode) => void;
}) {
  const cats = db.categories;

  const tree = useMemo<CNode[]>(() => {
    const byParent = new Map<string, Category[]>();
    cats.forEach((c) => { const k = c.parentId || ""; if (!byParent.has(k)) byParent.set(k, []); byParent.get(k)!.push(c); });
    byParent.forEach((a) => a.sort((x, y) => x.order - y.order));
    const make = (pid: string): CNode[] => (byParent.get(pid) || []).map((c) => ({ id: c.id, name: c.name, children: make(c.id) }));
    return make("");
  }, [cats]);

  const directCount = useMemo(() => {
    const m = new Map<string, number>();
    db.products.forEach((p) => m.set(p.cat, (m.get(p.cat) || 0) + 1));
    return m;
  }, [db.products]);
  const countOf = useCallback((n: CNode): number => (directCount.get(n.id) || 0) + n.children.reduce((s, c) => s + countOf(c), 0), [directCount]);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(cats.filter((c) => !c.parentId).map((c) => c.id)));
  const [editing, setEditing] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ id: string; pos: DropPos } | null>(null);

  const toggle = useCallback((id: string) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const allIds = useMemo(() => cats.filter((c) => cats.some((x) => x.parentId === c.id)).map((c) => c.id), [cats]);
  const allOpen = expanded.size >= allIds.length && allIds.length > 0;

  const uniqueId = (name: string) => { const base = slugify(name) || "cat"; let id = base, n = 2; while (cats.some((c) => c.id === id)) id = `${base}-${n++}`; return id; };

  const commitRename = (id: string, val: string) => {
    const v = val.trim(); const c = cats.find((x) => x.id === id);
    if (v && c && v !== c.name) updateCategory({ ...c, name: v });
    setEditing(null);
  };
  const startAdd = (id: string | null) => { setAddingTo(id); if (id) setExpanded((s) => new Set(s).add(id)); };
  const commitAdd = (parentId: string, name: string) => {
    const order = Math.max(0, ...cats.map((c) => c.order)) + 1;
    upsertCategory({ id: uniqueId(name), name, parentId: parentId || null, group: null, facets: ["size", "color"], order });
    setExpanded((s) => new Set(s).add(parentId));
    setAddingTo(null);
    toast(<><span className="tick">✓</span> კატეგორია დაემატა</>);
  };
  const addCategory = (parentId: string | null, name: string) => {
    const order = Math.max(0, ...cats.map((c) => c.order)) + 1;
    upsertCategory({ id: uniqueId(name), name, parentId: parentId || null, group: null, facets: ["size", "color"], order });
    if (parentId) setExpanded((s) => new Set(s).add(parentId));
    toast(<><span className="tick">✓</span> კატეგორია დაემატა</>);
  };
  const doDelete = (id: string) => { deleteCategory(id); setConfirming(null); toast(<><span className="tick">✓</span> წაიშალა</>); };

  const endDrag = () => { setDragId(null); setDragOver(null); };
  const handleDrop = (targetId: string) => {
    const src = dragId; const over = dragOver; endDrag();
    if (!src || !over || src === targetId) return;
    if (catIsDesc(cats, targetId, src)) return; // can't drop into own subtree
    const target = cats.find((c) => c.id === targetId); const srcCat = cats.find((c) => c.id === src);
    if (!target || !srcCat) return;
    const newParent = over.pos === "inside" ? target.id : (target.parentId || null);
    let sibs = cats.filter((c) => (c.parentId || null) === (newParent || null) && c.id !== src).sort((a, c) => a.order - c.order).map((c) => c.id);
    if (over.pos === "inside") sibs = [src, ...sibs];
    else { const ti = sibs.indexOf(targetId); sibs.splice(over.pos === "after" ? ti + 1 : ti, 0, src); }
    sibs.forEach((id, idx) => {
      const c = cats.find((x) => x.id === id); if (!c) return;
      if (id === src) updateCategory({ ...c, parentId: newParent, order: idx });
      else if (c.order !== idx) updateCategory({ ...c, order: idx });
    });
    if (over.pos === "inside") setExpanded((s) => new Set(s).add(targetId));
  };

  const filtered = useMemo(() => filterCTree(tree, q), [tree, q]);
  const stats = useMemo(() => {
    let subs = 0; const rec = (l: CNode[], d: number) => l.forEach((n) => { if (d > 0) subs++; rec(n.children, d + 1); });
    rec(tree, 0); return { cats: tree.length, subs };
  }, [tree]);
  const prodTotal = useMemo(() => tree.reduce((s, n) => s + countOf(n), 0), [tree, countOf]);

  const api: BoardApi = {
    expanded, toggle, editing, setEditing, addingTo, startAdd, confirming, setConfirming,
    commitRename, commitAdd, doDelete, dragId, setDragId, dragOver, setDragOver, endDrag, handleDrop, countOf,
  };

  return (
    <BoardCtx.Provider value={api}>
      <div className="page">
        <header className="pageHead">
          <div>
            <h1 className="pageTitle">კატეგორიები</h1>
            <p className="pageSub">გადაათრიეთ რიგის შესაცვლელად, ჩააგდეთ კატეგორიაში მის ქვეშ მოსათავსებლად. დააჭირეთ <span className="inlineGlyph"><IconCornerAddV s={13} /></span> ქვეკატეგორიის დასამატებლად.</p>
          </div>
          <div className="statRow">
            <div className="mcxstat"><span className="statNum">{stats.cats}</span><span className="statLbl">კატეგორია</span></div>
            <div className="statDiv" />
            <div className="mcxstat"><span className="statNum">{stats.subs}</span><span className="statLbl">ქვეკატეგორია</span></div>
            <div className="statDiv" />
            <div className="mcxstat"><span className="statNum">{prodTotal}</span><span className="statLbl">პროდუქტი</span></div>
          </div>
        </header>

        <div className="toolbar">
          <div className="searchBox">
            <IconSearchV />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ძებნა კატეგორიებში…" />
            {q && <button className="clearBtn" onClick={() => setQ("")}><IconXV s={14} /></button>}
          </div>
          <div className="toolbarRight">
            <button className="btn2 btn2--ghost" onClick={() => setExpanded(allOpen ? new Set() : new Set(allIds))}>
              {allOpen ? <IconCollapseV /> : <IconExpandV />}{allOpen ? "ჩაკეცვა" : "გაშლა"}
            </button>
            <NewCategory tree={tree} onAdd={addCategory} />
          </div>
        </div>

        <div className="treeCard" onDragOver={(e) => e.preventDefault()}>
          {filtered.nodes.length === 0 ? (
            <div className="emptyState"><IconSearchV s={28} /><p>„{q}“ — ვერაფერი მოიძებნა</p></div>
          ) : (
            filtered.nodes.map((n, i) => (
              <TreeNode key={n.id} node={n} depth={0} hue={HUE_PALETTE[i % HUE_PALETTE.length]} q={q} expandedFilter={filtered.ids} />
            ))
          )}
        </div>
      </div>
    </BoardCtx.Provider>
  );
}

/* ============================================================
   Promotions + hero
   ============================================================ */
function PromosView({
  db, prodById, togglePromotion, onPromo, onHero,
}: {
  db: MulticolorData;
  prodById: (id: string) => Product | undefined;
  togglePromotion: (id: string, active: boolean) => void;
  onPromo: (id: string | null) => void;
  onHero: (i: number) => void;
}) {
  const toggleActive = (id: string, active: boolean) => togglePromotion(id, active);

  return (
    <>
      <div className="adm-head"><h1>აქციები</h1><button className="btn sm" onClick={() => onPromo(null)}>+ ახალი აქცია</button></div>
      <div className="acard">
        <table className="atable">
          <thead><tr><th>აქცია</th><th>პროდუქტი</th><th>ფასდაკლება</th><th className="hide-m">ვადა</th><th>აქტიური</th></tr></thead>
          <tbody>
            {db.promotions.map((x) => {
              const p = prodById(x.target);
              return (
                <tr key={x.id}>
                  <td className="nm rowlink" onClick={() => onPromo(x.id)}>{x.name}</td>
                  <td className="dim">{p ? p.name : "—"}</td>
                  <td><span className="pill red">−{x.value}{x.type === "pct" ? "%" : " ₾"}</span></td>
                  <td className="dim hide-m">{x.from} — {x.to}</td>
                  <td>
                    <label className="tgl">
                      <input type="checkbox" checked={x.active} onChange={(e) => toggleActive(x.id, e.target.checked)} />
                      <span />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="adm-head" style={{ marginTop: 30 }}>
        <h1 style={{ fontSize: 18 }}>მთავარი გვერდის ჰერო</h1>
        <p className="sub">სამი მბრუნავი სლაიდი — სათაური, ქვეტექსტი და ღილაკი თითოეულზე.</p>
      </div>
      <div className="acard" style={{ display: "flex", flexDirection: "column" }}>
        {db.hero.map((h, i) => (
          <div className="cat-row rowlink" key={h.id} onClick={() => onHero(i)}>
            <span className="pill blue">სლაიდი {i + 1}</span>
            <div className="cnm">{h.title}<br /><span className="dim">{h.sub}</span></div>
            <span className="dim" style={{ marginLeft: "auto", fontSize: 12 }}>CTA: {h.cta}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PromoEditor({
  db, promo, savePromotion, deletePromotion, toast, onClose,
}: {
  db: MulticolorData;
  promo: Promotion | null;
  savePromotion: (x: Promotion, oldTarget?: string) => void;
  deletePromotion: (x: Promotion) => void;
  toast: (n: React.ReactNode) => void;
  onClose: () => void;
}) {
  const isNew = !promo;
  const base: Promotion =
    promo || { id: uid("pr"), name: "", type: "pct", value: 10, target: db.products[0].id, from: "2026-06-09", to: "2026-07-09", active: true };
  const [name, setName] = useState(base.name);
  const [target, setTarget] = useState(base.target);
  const [type, setType] = useState(base.type);
  const [value, setValue] = useState(String(base.value));
  const [from, setFrom] = useState(base.from);
  const [to, setTo] = useState(base.to);
  const [active, setActive] = useState(base.active);

  const save = () => {
    const oldTarget = base.target;
    const next: Promotion = {
      ...base, name: name.trim() || "აქცია", target, type,
      value: parseFloat(value) || 1, from, to, active,
    };
    savePromotion(next, oldTarget);
    toast(<><span className="tick">✓</span> აქცია შენახულია</>);
    onClose();
  };
  const remove = () => {
    if (!promo) return;
    deletePromotion(promo);
    onClose();
  };

  return (
    <>
      <DrawerHead title={isNew ? "ახალი აქცია" : "აქციის რედაქტირება"} onClose={onClose} />
      <div className="dr-body">
        <div className="field"><label>დასახელება *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="მაგ. ზაფხულის ფასდაკლება" /></div>
        <div className="field"><label>პროდუქტი</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="frow2">
          <div className="field"><label>ტიპი</label>
            <select value={type} onChange={(e) => setType(e.target.value as Promotion["type"])}>
              <option value="pct">პროცენტი (%)</option>
              <option value="fix">ფიქსირებული (₾)</option>
            </select>
          </div>
          <div className="field"><label>ოდენობა</label><input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} /></div>
        </div>
        <div className="frow2">
          <div className="field"><label>დაწყება</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label>დასრულება</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div className="checks"><label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />აქტიური — მაშინვე აისახება მაღაზიაზე</label></div>
      </div>
      <div className="dr-foot">
        {!isNew && <button className="btn-line" style={{ color: "var(--sale)", borderColor: "var(--sale)" }} onClick={remove}>წაშლა</button>}
        <button className="btn" onClick={save}>{isNew ? "აქციის შექმნა" : "შენახვა"}</button>
      </div>
    </>
  );
}

function HeroEditor({
  db, index, updateHero, toast, onClose,
}: {
  db: MulticolorData;
  index: number;
  updateHero: (index: number, slide: HeroSlide) => void;
  toast: (n: React.ReactNode) => void;
  onClose: () => void;
}) {
  const h = db.hero[index];
  const [kicker, setKicker] = useState(h.kicker);
  const [title, setTitle] = useState(h.title);
  const [sub, setSub] = useState(h.sub);
  const [cta, setCta] = useState(h.cta);
  const [link, setLink] = useState(h.link);

  const save = () => {
    updateHero(index, {
      ...h,
      kicker: kicker.trim(),
      title: title.trim() || h.title,
      sub: sub.trim(),
      cta: cta.trim(),
      link: link.trim(),
    });
    toast(<><span className="tick">✓</span> ჰერო განახლდა — ნახე მთავარი გვერდი</>);
    onClose();
  };

  return (
    <>
      <DrawerHead title={"ჰერო სლაიდი " + (index + 1)} onClose={onClose} />
      <div className="dr-body">
        <div className="field"><label>ზედა წარწერა (kicker)</label><input value={kicker} onChange={(e) => setKicker(e.target.value)} /></div>
        <div className="field"><label>სათაური *</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>ქვეტექსტი</label><textarea style={{ minHeight: 70 }} value={sub} onChange={(e) => setSub(e.target.value)} /></div>
        <div className="frow2">
          <div className="field"><label>ღილაკის ტექსტი</label><input value={cta} onChange={(e) => setCta(e.target.value)} /></div>
          <div className="field"><label>ბმული</label><input value={link} onChange={(e) => setLink(e.target.value)} /></div>
        </div>
      </div>
      <div className="dr-foot">
        <button className="btn" onClick={save}>შენახვა</button>
      </div>
    </>
  );
}
