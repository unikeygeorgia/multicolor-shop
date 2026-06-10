"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { rowToOrder } from "@/lib/mappers";
import { fmt, salePrice } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/components/store-provider";

const STATUS: Record<string, string> = {
  new: "ახალი",
  processing: "მუშავდება",
  done: "შესრულდა",
  cancelled: "გაუქმდა",
};
const TYPE: Record<string, string> = { order: "შეკვეთა", quote: "ბითუმად", inquiry: "კითხვა" };

interface Address {
  id: string;
  label: string | null;
  city: string | null;
  address: string | null;
  is_default: boolean;
}

type Tab = "orders" | "profile" | "addresses";

export default function AccountPage() {
  const { user, ready, signOut } = useAuth();
  const { prodById, addToCart, toast } = useStore();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

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

  useEffect(() => {
    if (ready && user) load();
  }, [ready, user, load]);

  if (!ready || !user) {
    return <main className="wrap" style={{ minHeight: "60vh" }} />;
  }

  const orderTotal = (o: Order) =>
    o.items.reduce((a, i) => {
      const p = prodById(i.pid);
      if (!p) return a;
      const sz = p.sizes.find((s) => s.l === i.size) || p.sizes[0];
      return a + salePrice(p, sz?.p ?? 0) * i.qty;
    }, 0);

  const reorder = (o: Order) => {
    o.items.forEach((i) => addToCart(i.pid, i.size, i.color ?? null, i.qty));
  };

  const saveProfile = async () => {
    if (!supabase || !user) return;
    await supabase.from("profiles").upsert({ id: user.id, name: name.trim(), phone: phone.trim(), email: user.email });
    toast(<><span className="tick">✓</span> პროფილი განახლდა</>);
  };

  return (
    <main className="wrap" data-screen-label="ჩემი ანგარიში">
      <section className="page-hero">
        <span className="spectrum-tick" />
        <h1 style={{ marginTop: 14 }}>ჩემი ანგარიში</h1>
        <p className="lead">{user.email}</p>
      </section>

      <div className="account-layout">
        <nav className="acct-nav">
          <button className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>შეკვეთები</button>
          <button className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>პროფილი</button>
          <button className={tab === "addresses" ? "on" : ""} onClick={() => setTab("addresses")}>მისამართები</button>
          <button className="signout" onClick={async () => { await signOut(); router.replace("/"); }}>გასვლა</button>
        </nav>

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
                  <div className="order-row" key={o.id}>
                    <div>
                      <span className="oid">{o.id}</span>{" "}
                      <span className="badge soft">{TYPE[o.type] || o.type}</span>
                      <div className="meta">
                        {new Date(o.date).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" })}
                        {o.items.length ? ` · ${o.items.length} პოზიცია` : ""}
                      </div>
                    </div>
                    <div className="right">
                      <span className="badge new">{STATUS[o.status] || o.status}</span>
                      {o.items.length > 0 && (
                        <>
                          <span className="num" style={{ fontWeight: 800 }}>{fmt(orderTotal(o))}</span>
                          <button className="btn-line sm" onClick={() => reorder(o)}>გამეორება</button>
                        </>
                      )}
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
            <AddressManager
              addresses={addresses}
              userId={user.id}
              onChange={load}
            />
          )}
        </section>
      </div>
    </main>
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
      user_id: userId,
      label: label.trim() || null,
      city,
      address: address.trim(),
      is_default: addresses.length === 0,
    });
    setLabel(""); setAddress("");
    setBusy(false);
    onChange();
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
          {["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "სხვა"].map((c) => (
            <option key={c}>{c}</option>
          ))}
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
