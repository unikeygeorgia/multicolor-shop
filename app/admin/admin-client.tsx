"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fmt, minPrice, prodImg, salePrice } from "@/lib/utils";
import { slugify } from "@/lib/slug";
import { brandLogo } from "@/lib/brand-logos";
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
    db, orders, prodById, brandById, catById, setOrderStatus,
    upsertProduct, deleteProduct, upsertBrand, deleteBrand, updateCategory,
    savePromotion, deletePromotion, togglePromotion, updateHero, reload,
  } = store;
  const [view, setView] = useState<View>("dash");
  const [editor, setEditor] = useState<Editor>(null);
  const [query, setQuery] = useState("");

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

  // sold units + earning per product, from orders
  const soldMap = new Map<string, number>();
  const earnMap = new Map<string, number>();
  orders.forEach((o) =>
    o.items.forEach((i) => {
      const p = prodById(i.pid);
      if (!p) return;
      const sz = p.sizes.find((s) => s.l === i.size) || p.sizes[0];
      soldMap.set(i.pid, (soldMap.get(i.pid) || 0) + i.qty);
      earnMap.set(i.pid, (earnMap.get(i.pid) || 0) + salePrice(p, sz?.p ?? 0) * i.qty);
    })
  );

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

  return (
    <div className="admin-root">
      <div className="adm-layout" data-screen-label="ადმინ პანელი">
        <aside className="adm-side">
          <Link className="logo" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="მულტიკოლორი" />
            <span className="sub">ადმინი</span>
          </Link>
          <div className="adm-search">
            <ISearch />
            <input
              placeholder="ძებნა პროდუქტებში…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setView("products"); }}
            />
            <span className="kbd">⌘K</span>
          </div>
          <nav className="adm-nav">
            {sections.map((sec) => (
              <div key={sec.label}>
                <div className="nav-label">{sec.label}</div>
                {sec.items.map((n) => (
                  <button key={n.v} className={view === n.v ? "on" : ""} onClick={() => setView(n.v)}>
                    {n.icon}{n.label}
                    {n.cnt !== undefined && n.cnt !== "" && <span className="cnt">{n.cnt}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="foot">
            <button className={view === "settings" ? "on" : ""} onClick={() => setView("settings")}><IGear /> პარამეტრები</button>
            <a href="https://multicolor-ge.vercel.app"><IStore /> მაღაზიის ნახვა</a>
            <button onClick={() => reload()}><IRefresh /> განახლება</button>
            <button onClick={async () => { await signOut(); }}><IOut /> გასვლა</button>
          </div>
        </aside>

        <main className="adm-main">
          <header className="adm-topbar">
            <h1>{VIEW_TITLES[view]}</h1>
            <button className="tb-btn" aria-label="ფოსტა"><IMail /></button>
            <button className="tb-btn" aria-label="შეტყობინებები"><IBell /></button>
            <div className="tb-user"><span className="av">{initials}</span>{user?.email}</div>
          </header>

          <div className="adm-body">
            {view === "dash" && (
              <Dashboard
                db={db}
                orders={orders}
                orderTotal={orderTotal}
                prodById={prodById}
                onOrder={(id) => setEditor({ kind: "order", id })}
                onEditProduct={(id) => setEditor({ kind: "product", id })}
              />
            )}
            {view === "orders" && (
              <OrdersView
                orders={orders}
                orderTotal={orderTotal}
                setOrderStatus={setOrderStatus}
                onOrder={(id) => setEditor({ kind: "order", id })}
              />
            )}
            {view === "products" && (
              <ProductsView
                db={db}
                brandById={brandById}
                catById={catById}
                soldMap={soldMap}
                earnMap={earnMap}
                query={query}
                setQuery={setQuery}
                onEdit={(id) => setEditor({ kind: "product", id })}
              />
            )}
            {view === "customers" && <CustomersView orders={orders} orderTotal={orderTotal} />}
            {view === "calendar" && <SalesCalendarView orders={orders} orderTotal={orderTotal} />}
            {view === "brands" && (
              <BrandsView db={db} onEdit={(id) => setEditor({ kind: "brand", id })} />
            )}
            {view === "cats" && <CatsView db={db} updateCategory={updateCategory} toast={store.toast} />}
            {view === "promos" && (
              <PromosView
                db={db}
                prodById={prodById}
                togglePromotion={togglePromotion}
                onPromo={(id) => setEditor({ kind: "promo", id })}
                onHero={(i) => setEditor({ kind: "hero", index: i })}
              />
            )}
            {view === "settings" && (
              <SettingsView
                settings={store.settings}
                updateSetting={store.updateSetting}
              />
            )}
          </div>
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
  updateSetting: (key: "prices_hidden" | "commerce_enabled", value: boolean) => void;
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
   Products
   ============================================================ */
function ProductsView({
  db, brandById, catById, soldMap, earnMap, query, setQuery, onEdit,
}: {
  db: MulticolorData;
  brandById: (id: string) => Brand | undefined;
  catById: (id: string) => { name: string } | undefined;
  soldMap: Map<string, number>;
  earnMap: Map<string, number>;
  query: string;
  setQuery: (v: string) => void;
  onEdit: (id: string | null) => void;
}) {
  const priceMax = Math.ceil(Math.max(10, ...db.products.map((p) => minPrice(p))) / 10) * 10;
  const [mode, setMode] = useState<"list" | "grid">("list");
  const [cats, setCats] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [pmax, setPmax] = useState(priceMax);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const list = db.products.filter((p) => {
    if (cats.length && !cats.includes(p.cat)) return false;
    if (brands.length && !brands.includes(p.brand)) return false;
    if (minPrice(p) > pmax) return false;
    if (query) {
      const hay = (p.name + " " + (brandById(p.brand)?.name || "")).toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const catCount = (id: string) => db.products.filter((p) => p.cat === id).length;
  const brandCount = (id: string) => db.products.filter((p) => p.brand === id).length;

  const allSelected = list.length > 0 && list.every((p) => sel.has(p.id));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(list.map((p) => p.id)));
  const toggleOne = (id: string) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSel(n);
  };

  const exportCsv = () => {
    const rows = sel.size ? list.filter((p) => sel.has(p.id)) : list;
    const head = ["id", "სახელი", "ბრენდი", "კატეგორია", "ფასი", "გაყიდული", "შემოსავალი"];
    const data = rows.map((p) => [
      p.id, p.name, brandById(p.brand)?.name || "", catById(p.cat)?.name || "",
      minPrice(p), soldMap.get(p.id) || 0, (earnMap.get(p.id) || 0).toFixed(2),
    ]);
    const csv = [head, ...data].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "products.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => { setCats([]); setBrands([]); setPmax(priceMax); };
  const sorted = [...db.categories].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="adm-toolbar2">
        <div className="view-toggle">
          <button className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}><IListV /> სია</button>
          <button className={mode === "grid" ? "on" : ""} onClick={() => setMode("grid")}><IGridV /> ბადე</button>
        </div>
        <div className="toolbar-right">
          <button className="mini-btn" onClick={exportCsv}><IDownload /> Export</button>
          <button className="btn sm" onClick={() => onEdit(null)}>+ ახალი პროდუქტი</button>
        </div>
      </div>

      <div className="prod-layout">
        <aside className="fpanel">
          <div className="fpanel-head">
            <b>ფილტრები</b>
            <button className="clear" onClick={clearAll}>გასუფთავება ✕</button>
          </div>
          <div className="fsec">
            <div className="fsec-h">კატეგორია</div>
            {sorted.map((c) => (
              <label className="fopt" key={c.id}>
                <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggle(cats, setCats, c.id)} />
                {c.name}<span className="cnt">{catCount(c.id)}</span>
              </label>
            ))}
          </div>
          <div className="fsec">
            <div className="fsec-h">ფასი (₾)</div>
            <div className="price-vals num"><span>0</span><span>{pmax} ₾</span></div>
            <input type="range" min={0} max={priceMax} step={5} value={pmax} onChange={(e) => setPmax(+e.target.value)} style={{ width: "100%", accentColor: "var(--accent)" }} />
          </div>
          <div className="fsec">
            <div className="fsec-h">ბრენდი</div>
            {db.brands.map((b) => (
              <label className="fopt" key={b.id}>
                <input type="checkbox" checked={brands.includes(b.id)} onChange={() => toggle(brands, setBrands, b.id)} />
                {b.name}<span className="cnt">{brandCount(b.id)}</span>
              </label>
            ))}
          </div>
        </aside>

        <div className="acard2">
          <div className="acard2-head">
            <h3>პროდუქტები <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13 }}>({list.length})</span></h3>
            <div className="right">
              <button className="mini-btn" onClick={exportCsv}><IDownload /> Export</button>
            </div>
          </div>

          {sel.size > 0 && (
            <div className="bulkbar">
              {sel.size} მონიშნული
              <button className="mini-btn" onClick={exportCsv}>მონიშნულის Export</button>
              <button className="mini-btn" onClick={() => setSel(new Set())}>გასუფთავება</button>
            </div>
          )}

          {mode === "list" ? (
            <table className="ptable">
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                  <th>პროდუქტი</th>
                  <th>ფასი</th>
                  <th>გაყიდული</th>
                  <th>სტატუსი</th>
                  <th>შემოსავალი</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const stock = p.sizes.reduce((a, s) => a + s.s, 0);
                  const b = brandById(p.brand);
                  return (
                    <tr className="rowlink" key={p.id} onClick={() => onEdit(p.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggleOne(p.id)} />
                      </td>
                      <td>
                        <div className="pinfo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={prodImg(p, b, 80, 80)} alt="" />
                          <div>
                            <div className="nm">{p.name}</div>
                            <div className="br">{b ? b.name : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num">{fmt(salePrice(p, minPrice(p)))}{p.sizes.length > 1 ? "+" : ""}</td>
                      <td className="num">{soldMap.get(p.id) || 0} ც</td>
                      <td><span className={`stockpill ${stock > 0 ? "in" : "out"}`}>{stock > 0 ? "მარაგშია" : "ამოწურულია"}</span></td>
                      <td className="num">{fmt(earnMap.get(p.id) || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="pgrid-adm">
              {list.map((p) => {
                const b = brandById(p.brand);
                return (
                  <div className="pcard-adm" key={p.id} onClick={() => onEdit(p.id)}>
                    <div className="ph">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prodImg(p, b, 300, 300)} alt="" />
                    </div>
                    <div className="b">
                      <div className="nm">{p.name}</div>
                      <div className="meta">
                        <span className="price">{fmt(salePrice(p, minPrice(p)))}</span>
                        <span>{soldMap.get(p.id) || 0} გაყ.</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
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

interface SizeRow { l: string; p: string }
interface ColorRow { h: string; n: string; ral: string }

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
      id: uid("p"), name: "", brand: db.brands[0].id, cat: db.categories[0].id,
      desc: "", sizes: [{ l: "", p: 0, s: 0 }], colors: [], specs: {}, tags: [], featured: false,
    };

  const [name, setName] = useState(base.name);
  const [slug, setSlug] = useState(base.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!base.slug);
  const [brand, setBrand] = useState(base.brand);
  const [cat, setCat] = useState(base.cat);
  const [desc, setDesc] = useState(base.desc || "");
  const [usage, setUsage] = useState(base.usage || "");
  const [aiInfo, setAiInfo] = useState(base.aiInfo || "");
  const [sizes, setSizes] = useState<SizeRow[]>(
    base.sizes.map((s) => ({ l: s.l, p: String(s.p) }))
  );
  const [colors, setColors] = useState<ColorRow[]>(
    (base.colors || []).map((c) => ({ h: c.h, n: c.n, ral: c.ral || "" }))
  );
  const [surfaces, setSurfaces] = useState<string[]>(base.specs.surface || []);
  const [coverage, setCoverage] = useState(base.specs.coverage || "");
  const [drying, setDrying] = useState(base.specs.drying || "");
  const [baseSpec, setBaseSpec] = useState(base.specs.base || "");
  const [isNewTag, setIsNewTag] = useState(base.tags.includes("new"));
  const [featured, setFeatured] = useState(!!base.featured);
  const [salePct, setSalePct] = useState(base.salePct ? String(base.salePct) : "");

  const toggleSurface = (id: string) =>
    setSurfaces((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = () => {
    const next: Product = {
      ...base,
      name: name.trim() || base.name || "უსახელო პროდუქტი",
      slug: (slug.trim() ? slugify(slug) : slugify(name.trim())) || base.slug,
      brand, cat, desc: desc.trim(),
      usage: usage.trim() || undefined,
      aiInfo: aiInfo.trim() || undefined,
      sizes: sizes
        .map((r) => ({ l: r.l.trim(), p: parseFloat(r.p) || 0, s: 0 }))
        .filter((s) => s.l),
      colors: colors
        .map((r) => {
          const c: { n: string; h: string; ral?: string } = { n: r.n.trim(), h: r.h };
          if (r.ral.trim()) c.ral = r.ral.trim();
          return c;
        })
        .filter((c) => c.n),
      specs: {},
      featured,
      tags: [],
    };
    if (!next.sizes.length) next.sizes = [{ l: "—", p: 0, s: 0 }];
    if (surfaces.length) next.specs.surface = surfaces;
    if (coverage.trim()) next.specs.coverage = coverage.trim();
    if (drying.trim()) next.specs.drying = drying.trim();
    if (baseSpec.trim()) next.specs.base = baseSpec.trim();
    const pct = parseInt(salePct) || 0;
    next.salePct = pct > 0 ? pct : undefined;
    if (isNewTag) next.tags.push("new");
    if (next.salePct) next.tags.push("sale");

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
        <div className="field"><label>დასახელება (ka) *</label><input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} placeholder="მაგ. ინტერიერის საღებავი" /></div>
        <div className="field">
          <label>ლინკი (slug) — ავტომატური ლათინურად</label>
          <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="latin-slug" />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>მისამართი: /product?slug={slug || "…"}</span>
        </div>
        <div className="frow2">
          <div className="field"><label>ბრენდი</label>
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              {db.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="field"><label>კატეგორია</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {[...db.categories].sort((a, b) => a.order - b.order).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>ინფორმაცია პროდუქტის შესახებ (აღწერა)</label><textarea style={{ minHeight: 70 }} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="field"><label>გამოყენების წესი</label><textarea style={{ minHeight: 70 }} value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="როგორ გამოიყენება პროდუქტი…" /></div>

        <div className="fset">
          <div className="fset-h"><b>ზომები / წონები (ფასი თითო ვარიანტზე)</b></div>
          {sizes.map((r, i) => (
            <div className="vrow" key={i} style={{ gridTemplateColumns: "1fr 120px 30px" }}>
              <input placeholder="ზომა/წონა (მაგ. 5კგ)" value={r.l} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, l: e.target.value } : x))} />
              <input type="number" step="0.1" min="0" placeholder="ფასი ₾" value={r.p} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} />
              <button className="del" type="button" title="წაშლა" onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="addrow" type="button" onClick={() => setSizes((s) => [...s, { l: "", p: "" }])}>+ ვარიანტის დამატება</button>
        </div>

        <div className="fset">
          <div className="fset-h"><b>ფერის ვარიანტები (სვოჩი + RAL)</b></div>
          {colors.map((r, i) => (
            <div className="vrow color-row" key={i}>
              <input type="color" value={r.h} onChange={(e) => setColors((s) => s.map((x, j) => j === i ? { ...x, h: e.target.value } : x))} />
              <input placeholder="ფერის სახელი" value={r.n} onChange={(e) => setColors((s) => s.map((x, j) => j === i ? { ...x, n: e.target.value } : x))} />
              <input placeholder="RAL" value={r.ral} onChange={(e) => setColors((s) => s.map((x, j) => j === i ? { ...x, ral: e.target.value } : x))} />
              <button className="del" type="button" title="წაშლა" onClick={() => setColors((s) => s.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="addrow" type="button" onClick={() => setColors((s) => [...s, { h: "#cccccc", n: "", ral: "" }])}>+ ფერის დამატება</button>
        </div>

        <div className="fset">
          <div className="fset-h"><b>მახასიათებლები</b></div>
          <div className="field" style={{ marginBottom: 10 }}><label>ზედაპირი / დანიშნულება</label>
            <div className="checks">
              {db.surfaces.map((s) => (
                <label key={s.id}><input type="checkbox" checked={surfaces.includes(s.id)} onChange={() => toggleSurface(s.id)} />{s.name}</label>
              ))}
            </div>
          </div>
          <div className="frow2">
            <div className="field"><label>ხარჯი</label><input value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="1კგ — 5მ²" /></div>
            <div className="field"><label>შრობის დრო</label><input value={drying} onChange={(e) => setDrying(e.target.value)} placeholder="2–4 სთ" /></div>
          </div>
          <div className="field" style={{ marginTop: 10 }}><label>ფუძე / შემადგენლობა</label><input value={baseSpec} onChange={(e) => setBaseSpec(e.target.value)} /></div>
        </div>

        <div className="fset">
          <div className="fset-h"><b>სტატუსი და მერჩენდაიზინგი</b></div>
          <div className="checks">
            <label><input type="checkbox" checked={isNewTag} onChange={(e) => setIsNewTag(e.target.checked)} />ახალი</label>
            <label><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />მთავარ გვერდზე</label>
          </div>
          <div className="frow2" style={{ marginTop: 12 }}>
            <div className="field"><label>ფასდაკლება %</label><input type="number" min="0" max="90" value={salePct} onChange={(e) => setSalePct(e.target.value)} placeholder="0 = არ არის" /></div>
          </div>
        </div>

        <div className="fset">
          <div className="fset-h"><b>AI ბოტის ინფორმაცია</b></div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            დამატებითი ინფო unichat.ge-ს AI ბოტისთვის — საიტზე არ ჩანს, მხოლოდ ბოტი იყენებს კლიენტის კითხვებზე პასუხისთვის.
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
              {brandLogo(b.id) ? (
                <span className="mk logo-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogo(b.id)} alt={b.name} />
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
  const [tint, setTint] = useState(base.tint);

  const save = () => {
    const next: Brand = { ...base, name: name.trim() || base.name || "ბრენდი", country: country.trim(), tagline: tagline.trim(), story: story.trim(), tint };
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
        <div className="field"><label>ბრენდის ფერი (ლოგო-მარკა და ბანერი)</label>
          <input type="color" value={tint} onChange={(e) => setTint(e.target.value)} style={{ height: 44, padding: 3, border: "1px solid var(--line)", borderRadius: 10, width: 90, cursor: "pointer" }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>ლოგო და ბანერი: რეალურ იმპლემენტაციაში აქ აიტვირთება ფაილები; დემოში მარკა გენერირდება ფერიდან.</p>
      </div>
      <div className="dr-foot">
        {!isNew && <button className="btn-line" style={{ color: "var(--sale)", borderColor: "var(--sale)" }} onClick={remove}>წაშლა</button>}
        <button className="btn" onClick={save}>{isNew ? "დამატება" : "შენახვა"}</button>
      </div>
    </>
  );
}

/* ============================================================
   Categories & facets
   ============================================================ */
const FACETS: [string, string][] = [["size", "ზომა"], ["color", "ფერი"], ["surface", "ზედაპირი"]];

function CatsView({
  db, updateCategory, toast,
}: {
  db: MulticolorData;
  updateCategory: (c: Category) => void;
  toast: (n: React.ReactNode) => void;
}) {
  const sorted = [...db.categories].sort((a, b) => a.order - b.order);

  const toggleFacet = (cid: string, f: string, on: boolean) => {
    const c = db.categories.find((x) => x.id === cid);
    if (!c) return;
    const facets = on
      ? (c.facets.includes(f) ? c.facets : [...c.facets, f])
      : c.facets.filter((x) => x !== f);
    updateCategory({ ...c, facets });
    toast(<><span className="tick">✓</span> ფილტრები განახლდა</>);
  };
  const move = (id: string, dir: number) => {
    const s = [...db.categories].sort((a, b) => a.order - b.order);
    const i = s.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    updateCategory({ ...s[i], order: s[j].order });
    updateCategory({ ...s[j], order: s[i].order });
  };

  return (
    <>
      <div className="adm-head">
        <h1>კატეგორიები და ფილტრები</h1>
        <p className="sub">მონიშნე, რომელი ფილტრები (ფასეტები) ეხება თითო კატეგორიას — მაღაზიის ფილტრის ზოლი ავტომატურად აეწყობა. ბრენდი, ფასი და სტატუსი ყველგან ჩანს.</p>
      </div>
      <div className="acard">
        {sorted.map((c, i) => {
          const n = db.products.filter((p) => p.cat === c.id).length;
          const g = db.catGroups.find((x) => x.id === c.group);
          return (
            <div className="cat-row" key={c.id}>
              <div className="ord">
                <button disabled={i === 0} title="ზემოთ" onClick={() => move(c.id, -1)}>▲</button>
                <button disabled={i === sorted.length - 1} title="ქვემოთ" onClick={() => move(c.id, 1)}>▼</button>
              </div>
              <div className="cnm">{c.name}<br /><span className="dim">{g ? g.name : ""} · {n} პროდუქტი</span></div>
              <div className="facets">
                {FACETS.map(([f, l]) => (
                  <label className="checks" style={{ display: "inline-flex" }} key={f}>
                    <label>
                      <input type="checkbox" checked={c.facets.includes(f)} onChange={(e) => toggleFacet(c.id, f, e.target.checked)} />{l}
                    </label>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
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
