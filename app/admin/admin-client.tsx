"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fmt, minPrice, prodImg, salePrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/components/store-provider";
import { useAuth } from "@/components/auth-provider";
import type {
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

type View = "dash" | "products" | "brands" | "cats" | "promos" | "orders";
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

  const navItems: { v: View; label: string; cnt?: string | number }[] = [
    { v: "dash", label: "დაფა" },
    { v: "products", label: "პროდუქტები", cnt: db.products.length },
    { v: "brands", label: "ბრენდები", cnt: db.brands.length },
    { v: "cats", label: "კატეგორიები და ფილტრები" },
    { v: "promos", label: "აქციები" },
    { v: "orders", label: "შეკვეთები", cnt: newCount || "" },
  ];

  return (
    <div className="admin-root">
      <div className="adm-layout" data-screen-label="ადმინ პანელი">
        <aside className="adm-side">
          <Link className="logo" href="/">
            <b>მულტიკოლორი</b>
            <span className="sub">ადმინისტრირება</span>
            <span className="spectrum-tick" />
          </Link>
          <nav className="adm-nav">
            {navItems.map((n) => (
              <button
                key={n.v}
                className={view === n.v ? "on" : ""}
                onClick={() => setView(n.v)}
              >
                {n.label}
                {n.cnt !== undefined && n.cnt !== "" && <span className="cnt">{n.cnt}</span>}
              </button>
            ))}
          </nav>
          <div className="foot">
            <a href="https://multicolor.ge">← მაღაზიის ნახვა</a>
            <button onClick={() => reload()}>მონაცემების განახლება</button>
            <button onClick={async () => { await signOut(); }}>გასვლა</button>
          </div>
        </aside>

        <main className="adm-main">
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
              onEdit={(id) => setEditor({ kind: "product", id })}
            />
          )}
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
   Access gate (login / denied)
   ============================================================ */
function AdminGate({ status }: { status: "checking" | "anon" | "denied" }) {
  const { signInPassword, signUpPassword, signOut } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setOk(null);
    if (mode === "in") {
      const { error } = await signInPassword(email.trim(), password);
      if (error) setErr(error);
    } else {
      const { error, needsConfirm } = await signUpPassword(email.trim(), password);
      if (error) setErr(error);
      else if (needsConfirm) setOk("ანგარიში შეიქმნა — დაადასტურეთ ელფოსტა, შემდეგ შედით.");
    }
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
              <div className="auth-tabs">
                <button className={mode === "in" ? "on" : ""} onClick={() => { setMode("in"); setErr(null); }}>შესვლა</button>
                <button className={mode === "up" ? "on" : ""} onClick={() => { setMode("up"); setErr(null); }}>ანგარიშის შექმნა</button>
              </div>
              {err && <div className="auth-err" style={{ marginBottom: 14 }}>{err}</div>}
              {ok && <div className="auth-ok" style={{ marginBottom: 14 }}>{ok}</div>}
              <form className="auth-form" onSubmit={submit}>
                <div className="field">
                  <label htmlFor="ag-email">ელფოსტა</label>
                  <input id="ag-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ag-pass">პაროლი</label>
                  <input id="ag-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="btn lg" type="submit" disabled={busy}>
                  {busy ? "..." : mode === "in" ? "შესვლა" : "შექმნა"}
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
  db, brandById, catById, onEdit,
}: {
  db: MulticolorData;
  brandById: (id: string) => Brand | undefined;
  catById: (id: string) => { name: string } | undefined;
  onEdit: (id: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const list = db.products.filter((p) => {
    if (cat !== "all" && p.cat !== cat) return false;
    if (q) {
      const hay = (p.name + " " + (brandById(p.brand)?.name || "")).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <>
      <div className="adm-head">
        <h1>პროდუქტები</h1>
        <button className="btn sm" onClick={() => onEdit(null)}>+ ახალი პროდუქტი</button>
      </div>
      <div className="adm-toolbar">
        <input type="search" placeholder="ძიება სახელით ან ბრენდით…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">ყველა კატეგორია</option>
          {[...db.categories].sort((a, b) => a.order - b.order).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="spacer" />
        <span style={{ fontSize: 13, color: "var(--muted)", alignSelf: "center" }}>
          <b className="num">{list.length}</b> პროდუქტი
        </span>
      </div>
      <div className="acard">
        <table className="atable">
          <thead>
            <tr>
              <th></th><th>პროდუქტი</th><th className="hide-m">კატეგორია</th>
              <th>ვარიანტები</th><th style={{ textAlign: "right" }}>ფასი</th>
              <th className="hide-m">მარაგი</th><th>სტატუსი</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const stock = p.sizes.reduce((a, s) => a + s.s, 0);
              const b = brandById(p.brand);
              return (
                <tr className="rowlink" key={p.id} onClick={() => onEdit(p.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <td><img className="thumb" src={prodImg(p, b, 80, 80)} alt="" /></td>
                  <td><span className="nm">{p.name}</span><br /><span className="dim">{b ? b.name : ""}</span></td>
                  <td className="hide-m dim">{catById(p.cat)?.name || ""}</td>
                  <td className="dim">{p.sizes.length} ზომა{p.colors && p.colors.length ? ` · ${p.colors.length} ფერი` : ""}</td>
                  <td className="num" style={{ textAlign: "right" }}>{fmt(salePrice(p, minPrice(p)))}{p.sizes.length > 1 ? "+" : ""}</td>
                  <td className="hide-m">{stock <= 10 ? <span className="pill red">{stock} ც</span> : <span className="num dim">{stock} ც</span>}</td>
                  <td style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: "none" }}>
                    {p.featured && <span className="pill blue">მთავარზე</span>}
                    {p.tags.includes("new") && <span className="pill green">ახალი</span>}
                    {p.salePct ? <span className="pill red">−{p.salePct}%</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface SizeRow { l: string; p: string; s: string }
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
  const [brand, setBrand] = useState(base.brand);
  const [cat, setCat] = useState(base.cat);
  const [desc, setDesc] = useState(base.desc || "");
  const [sizes, setSizes] = useState<SizeRow[]>(
    base.sizes.map((s) => ({ l: s.l, p: String(s.p), s: String(s.s) }))
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
      brand, cat, desc: desc.trim(),
      sizes: sizes
        .map((r) => ({ l: r.l.trim(), p: parseFloat(r.p) || 0, s: parseInt(r.s) || 0 }))
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
        <div className="field"><label>დასახელება (ka) *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="მაგ. ინტერიერის საღებავი" /></div>
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
        <div className="field"><label>აღწერა</label><textarea style={{ minHeight: 70 }} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>

        <div className="fset">
          <div className="fset-h"><b>ზომის ვარიანტები (ფასი თითო ზომაზე)</b></div>
          {sizes.map((r, i) => (
            <div className="vrow" key={i}>
              <input placeholder="ზომა (მაგ. 5კგ)" value={r.l} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, l: e.target.value } : x))} />
              <input type="number" step="0.1" min="0" placeholder="ფასი ₾" value={r.p} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} />
              <input type="number" step="1" min="0" placeholder="ც" value={r.s} onChange={(e) => setSizes((s) => s.map((x, j) => j === i ? { ...x, s: e.target.value } : x))} />
              <button className="del" type="button" title="წაშლა" onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="addrow" type="button" onClick={() => setSizes((s) => [...s, { l: "", p: "", s: "" }])}>+ ზომის დამატება</button>
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
              <span className="mk" style={{ background: b.tint }}>{b.name[0]}</span>
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
