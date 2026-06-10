"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { rowToOrder } from "@/lib/mappers";
import { fmt, prodImg, salePrice } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/components/store-provider";

const STATUS: Record<string, string> = {
  new: "ახალი", processing: "მუშავდება", done: "შესრულდა", cancelled: "გაუქმდა",
};
const TYPE: Record<string, string> = { order: "შეკვეთა", quote: "ბითუმად", inquiry: "კითხვა" };

interface Address {
  id: string;
  label: string | null;
  city: string | null;
  address: string | null;
  is_default: boolean;
}

type Tab = "orders" | "profile" | "addresses" | "password";

/* ---- tiny inline icons ---- */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconOrders = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...ic}><path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>);
const IconProfile = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...ic}><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>);
const IconPin = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...ic}><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>);
const IconLock = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...ic}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
const IconOut = () => (<svg width="18" height="18" viewBox="0 0 24 24" {...ic}><path d="M15 12H4M9 7l-5 5 5 5" /><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></svg>);

export default function AccountPage() {
  const { user, ready, signOut } = useAuth();
  const { prodById, brandById, addToCart, toast, settings, hydrated } = useStore();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hydrated && !settings.commerceEnabled) router.replace("/");
    else if (ready && !user) router.replace("/login");
  }, [hydrated, settings.commerceEnabled, ready, user, router]);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const [ord, addr, prof] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);
    setOrders((ord.data || []).map(rowToOrder));
    setAddresses((addr.data || []) as Address[]);
    setName((prof.data?.name as string) || (user.user_metadata?.name as string) || "");
    setPhone((prof.data?.phone as string) || "");
    setLoading(false);
  }, [user]);

  useEffect(() => { if (ready && user) load(); }, [ready, user, load]);

  if (!hydrated || !settings.commerceEnabled || !ready || !user) {
    return <main className="wrap" style={{ minHeight: "60vh" }} />;
  }

  const display = name || (user.email || "").split("@")[0] || "მომხმარებელი";
  const initials = display.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || "მ";

  const orderTotal = (o: Order) =>
    o.items.reduce((a, i) => {
      const p = prodById(i.pid);
      if (!p) return a;
      const sz = p.sizes.find((s) => s.l === i.size) || p.sizes[0];
      return a + salePrice(p, sz?.p ?? 0) * i.qty;
    }, 0);

  const reorder = (o: Order) => o.items.forEach((i) => addToCart(i.pid, i.size, i.color ?? null, i.qty));

  const saveProfile = async () => {
    if (!supabase || !user) return;
    await supabase.from("profiles").upsert({ id: user.id, name: name.trim(), phone: phone.trim(), email: user.email });
    toast(<><span className="tick">✓</span> პროფილი განახლდა</>);
  };

  const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: "შეკვეთები", icon: <IconOrders /> },
    { id: "profile", label: "პროფილი", icon: <IconProfile /> },
    { id: "addresses", label: "მისამართები", icon: <IconPin /> },
    { id: "password", label: "პაროლის შეცვლა", icon: <IconLock /> },
  ];

  return (
    <main className="wrap" data-screen-label="ჩემი ანგარიში">
      <div className="account-layout">
        <aside className="acct-side">
          <div className="acct-prof">
            <div className="acct-avatar">{initials}</div>
            <div className="acct-name">{display}</div>
            <div className="acct-id">ID — {user.id.slice(0, 8)}</div>
          </div>
          <nav className="acct-nav">
            {NAV.map((n) => (
              <button key={n.id} className={tab === n.id ? "on" : ""} onClick={() => setTab(n.id)}>
                {n.icon}{n.label}
              </button>
            ))}
            <button className="signout" onClick={async () => { await signOut(); router.replace("/"); }}>
              <IconOut />გასვლა
            </button>
          </nav>
        </aside>

        <section>
          {tab === "orders" && (
            <div className="acct-card">
              <h2>შეკვეთები და მოთხოვნები</h2>
              {loading ? (
                <p className="auth-note">იტვირთება…</p>
              ) : orders.length === 0 ? (
                <div className="empty" style={{ padding: "30px 0" }}>
                  <div className="glyph">◌</div>
                  <h3>ჯერ შეკვეთები არ გაქვს</h3>
                  <Link className="btn" href="/shop" style={{ marginTop: 14 }}>კატალოგზე გადასვლა</Link>
                </div>
              ) : (
                orders.map((o) => (
                  <div className="ord-card" key={o.id}>
                    <div className="ord-head">
                      <span className="oid">{o.id} <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>· {TYPE[o.type] || o.type}</span></span>
                      <span className={`statuschip ${o.status}`}>{STATUS[o.status] || o.status}</span>
                    </div>
                    {o.items.length > 0 && (
                      <div className="ord-thumbs">
                        {o.items.map((i, idx) => {
                          const p = prodById(i.pid);
                          if (!p) return null;
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={idx} src={prodImg(p, brandById(p.brand), 120, 120)} alt={p.name} title={p.name} />
                          );
                        })}
                      </div>
                    )}
                    <div className="ord-foot">
                      <span className="dt">
                        {new Date(o.date).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" })}
                        {o.items.length ? ` · ${o.items.length} პოზიცია` : ""}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {o.items.length > 0 && !settings.pricesHidden && <span className="tot">{fmt(orderTotal(o))}</span>}
                        {o.items.length > 0 && <button className="btn-line sm" onClick={() => reorder(o)}>გამეორება</button>}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="acct-card">
              <h2>პროფილი</h2>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>ელფოსტა</label>
                <input value={user.email || ""} disabled />
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="pf-name">სახელი</label>
                <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="სახელი, გვარი" />
              </div>
              <div className="field" style={{ marginBottom: 18 }}>
                <label htmlFor="pf-phone">ტელეფონი</label>
                <input id="pf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+995 5__ __ __ __" />
              </div>
              <button className="btn" onClick={saveProfile}>შენახვა</button>
            </div>
          )}

          {tab === "addresses" && (
            <AddressManager addresses={addresses} userId={user.id} onChange={load} />
          )}

          {tab === "password" && <PasswordSection onDone={() => toast(<><span className="tick">✓</span> პაროლი შეიცვალა</>)} />}
        </section>
      </div>
    </main>
  );
}

function PasswordSection({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr(null);
    if (pw.length < 6) { setErr("პაროლი მინ. 6 სიმბოლო"); return; }
    if (pw !== pw2) { setErr("პაროლები არ ემთხვევა"); return; }
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setErr(error.message);
    else { setPw(""); setPw2(""); onDone(); }
  };

  return (
    <div className="acct-card">
      <h2>პაროლის შეცვლა</h2>
      {err && <div className="auth-err" style={{ marginBottom: 14 }}>{err}</div>}
      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="np">ახალი პაროლი</label>
        <input id="np" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="მინ. 6 სიმბოლო" />
      </div>
      <div className="field" style={{ marginBottom: 18 }}>
        <label htmlFor="np2">გაიმეორე პაროლი</label>
        <input id="np2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      <button className="btn" onClick={save} disabled={busy}>{busy ? "..." : "შენახვა"}</button>
    </div>
  );
}

function AddressManager({
  addresses, userId, onChange,
}: {
  addresses: Address[];
  userId: string;
  onChange: () => void;
}) {
  const [label, setLabel] = useState("");
  const [city, setCity] = useState("თბილისი");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!supabase || !address.trim()) return;
    setBusy(true);
    await supabase.from("addresses").insert({
      user_id: userId, label: label.trim() || null, city, address: address.trim(),
      is_default: addresses.length === 0,
    });
    setLabel(""); setAddress(""); setBusy(false); onChange();
  };
  const remove = async (id: string) => {
    if (!supabase) return;
    await supabase.from("addresses").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="acct-card">
      <h2>შენახული მისამართები</h2>
      {addresses.length === 0 ? (
        <p className="auth-note" style={{ marginBottom: 18 }}>ჯერ მისამართი არ გაქვს შენახული.</p>
      ) : (
        <div style={{ marginBottom: 18 }}>
          {addresses.map((a) => (
            <div className="addr-card" key={a.id}>
              <div className="a-body">
                <b>{a.label || a.city}{a.is_default ? " · ნაგულისხმევი" : ""}</b>
                <p>{a.city}, {a.address}</p>
              </div>
              <button className="btn-ghost" onClick={() => remove(a.id)}>წაშლა</button>
            </div>
          ))}
        </div>
      )}
      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor="ad-label">სახელი (სურვილისამებრ)</label>
        <input id="ad-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="მაგ. სახლი, ოფისი" />
      </div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor="ad-city">ქალაქი</label>
        <select id="ad-city" value={city} onChange={(e) => setCity(e.target.value)}>
          {["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "სხვა"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field" style={{ marginBottom: 16 }}>
        <label htmlFor="ad-addr">მისამართი</label>
        <input id="ad-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ქუჩა, ნომერი" />
      </div>
      <button className="btn" onClick={add} disabled={busy || !address.trim()}>მისამართის დამატება</button>
    </div>
  );
}
