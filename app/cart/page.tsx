"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fmt, prodImg, salePrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/components/store-provider";
import { useAuth } from "@/components/auth-provider";

const FREE_SHIP = 150;
const SHIP = 10;
const CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "სხვა"];

export default function CartPage() {
  const { cart, brandById, prodById, updateCartQty, removeCartLine, clearCart } = useStore();
  const { user, session, signInPassword } = useAuth();

  const [mode, setMode] = useState<"order" | "quote">("order");
  const [submitted, setSubmitted] = useState<{ id: string; type: string; accountCreated: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", city: CITIES[0], address: "", company: "", note: "", password: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  /* prefill for logged-in users */
  useEffect(() => {
    if (!user || !supabase) return;
    (async () => {
      setForm((f) => ({ ...f, email: user.email || f.email }));
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (prof) setForm((f) => ({ ...f, name: (prof.name as string) || f.name, phone: (prof.phone as string) || f.phone }));
      const { data: addr } = await supabase
        .from("addresses").select("*").eq("user_id", user.id).eq("is_default", true).maybeSingle();
      if (addr) setForm((f) => ({ ...f, city: (addr.city as string) || f.city, address: (addr.address as string) || f.address }));
    })();
  }, [user]);

  const lines = cart
    .map((i) => {
      const p = prodById(i.pid);
      if (!p) return null;
      const sz = p.sizes.find((s) => s.l === i.size) || p.sizes[0];
      const unit = salePrice(p, sz.p);
      return { ...i, p, sz, unit, sum: unit * i.qty };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const subtotal = lines.reduce((a, l) => a + l.sum, 0);
  const ship = subtotal >= FREE_SHIP ? 0 : SHIP;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const payload = {
      type: mode === "quote" ? "quote" : "order",
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city,
        address: mode === "order" ? form.address.trim() || undefined : undefined,
        company: mode === "quote" ? form.company.trim() || undefined : undefined,
        note: form.note.trim() || undefined,
      },
      items: cart,
      password: !user && form.password ? form.password : undefined,
      accessToken: session?.access_token,
    };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "შეცდომა — სცადეთ თავიდან.");
        setBusy(false);
        return;
      }
      if (data.accountCreated && !user && form.password) {
        await signInPassword(form.email.trim(), form.password);
      }
      clearCart();
      setSubmitted({ id: data.orderId, type: payload.type, accountCreated: !!data.accountCreated && !user });
      window.scrollTo({ top: 0 });
    } catch {
      setErr("ქსელის შეცდომა — სცადეთ თავიდან.");
    }
    setBusy(false);
  };

  if (submitted) {
    return (
      <main className="wrap" data-screen-label="კალათა და შეკვეთა">
        <nav className="crumbs" aria-label="ნავიგაცია">
          <Link href="/">მთავარი</Link>
          <span className="sep">/</span>
          <span className="here">კალათა</span>
        </nav>
        <div className="sent-box">
          <div className="tickbig">✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>
            {submitted.type === "quote" ? "მოთხოვნა გაგზავნილია" : "შეკვეთა მიღებულია"} — № {submitted.id}
          </h2>
          <p style={{ color: "var(--muted)", marginTop: 10, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            {submitted.type === "quote"
              ? "გაყიდვების მენეჯერი 24 საათში დაგიკავშირდებათ."
              : "ოპერატორი მალე დაგიკავშირდებათ შეკვეთის დასადასტურებლად. გადახდა — ადგილზე ან გადარიცხვით."}
          </p>
          {submitted.accountCreated && (
            <p className="auth-ok" style={{ maxWidth: 440, margin: "16px auto 0" }}>
              შენთვის შეიქმნა ანგარიში — შეკვეთების სანახავად{" "}
              <Link href="/account" style={{ fontWeight: 700, textDecoration: "underline" }}>ჩემი ანგარიში</Link>.
              {form.password ? "" : " პაროლის დასაყენებლად იხილეთ ელფოსტა."}
            </p>
          )}
          <Link className="btn" href="/shop" style={{ marginTop: 22 }}>კატალოგში დაბრუნება</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap" data-screen-label="კალათა და შეკვეთა">
      <nav className="crumbs" aria-label="ნავიგაცია">
        <Link href="/">მთავარი</Link>
        <span className="sep">/</span>
        <span className="here">კალათა</span>
      </nav>

      {lines.length === 0 ? (
        <div className="empty">
          <div className="glyph">◌</div>
          <h3>კალათა ცარიელია</h3>
          <p>დაათვალიერე კატალოგი — რამე ნამდვილად დაგჭირდება.</p>
          <Link className="btn" href="/shop" style={{ marginTop: 16 }}>კატალოგზე გადასვლა</Link>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 18 }}>
            კალათა{" "}
            <span style={{ color: "var(--muted)", fontSize: 15, fontWeight: 600 }}>({lines.length} პოზიცია)</span>
          </h1>
          <div className="cart-layout">
            <div>
              <div className="cart-items">
                {lines.map((l, idx) => {
                  const colorObj = (l.p.colors || []).find((x) => x.n === l.color);
                  return (
                    <div className="citem" key={`${l.pid}-${l.size}-${l.color}-${idx}`}>
                      <Link href={`/product?id=${l.p.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={prodImg(l.p, brandById(l.p.brand), 200, 200)} alt={l.p.name} />
                      </Link>
                      <div>
                        <Link className="nm" href={`/product?id=${l.p.id}`}>{l.p.name}</Link>
                        <div className="variant">
                          <span className="size-pill">{l.size}</span>
                          {l.color && (
                            <>
                              <span className="dot" style={{ background: colorObj ? colorObj.h : "#ccc" }} /> {l.color}
                            </>
                          )}
                          {" · "}{fmt(l.unit)} / ც
                        </div>
                        <div className="qty" style={{ marginTop: 10 }}>
                          <button aria-label="კლება" onClick={() => updateCartQty(idx, -1)}>−</button>
                          <span className="num">{l.qty}</span>
                          <button aria-label="მატება" onClick={() => updateCartQty(idx, 1)}>+</button>
                        </div>
                      </div>
                      <div className="right">
                        <span className="lineprice">{fmt(l.sum)}</span>
                        <button className="rm" onClick={() => removeCartLine(idx)}>წაშლა</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="checkout" id="checkout">
                <h3>გაფორმება</h3>
                <p className="sub">
                  {user
                    ? "შეავსე მიწოდების დეტალები."
                    : "შეავსე ფორმა — ანგარიში ავტომატურად შეიქმნება, შემდეგ შეძლებ შეკვეთების ნახვას."}
                </p>
                <div className="mode-toggle">
                  <button type="button" className={mode === "order" ? "on" : ""} onClick={() => setMode("order")}>შეკვეთა მიწოდებით</button>
                  <button type="button" className={mode === "quote" ? "on" : ""} onClick={() => setMode("quote")}>ბითუმად შეთავაზება</button>
                </div>
                {err && <div className="auth-err" style={{ marginBottom: 14 }}>{err}</div>}
                <form onSubmit={submit}>
                  <div className="fgrid">
                    <div className="field">
                      <label htmlFor="co-name">სახელი *</label>
                      <input id="co-name" required placeholder="სახელი, გვარი" value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="co-email">ელფოსტა *</label>
                      <input id="co-email" type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={!!user} />
                    </div>
                    <div className="field">
                      <label htmlFor="co-phone">ტელეფონი *</label>
                      <input id="co-phone" required placeholder="+995 5__ __ __ __" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="co-city">ქალაქი *</label>
                      <select id="co-city" value={form.city} onChange={(e) => set("city", e.target.value)}>
                        {CITIES.map((ci) => <option key={ci}>{ci}</option>)}
                      </select>
                    </div>
                    {mode === "order" && (
                      <div className="field wide">
                        <label htmlFor="co-addr">მისამართი *</label>
                        <input id="co-addr" placeholder="ქუჩა, ნომერი" value={form.address} onChange={(e) => set("address", e.target.value)} />
                      </div>
                    )}
                    {mode === "quote" && (
                      <div className="field wide">
                        <label htmlFor="co-company">კომპანია / ობიექტი</label>
                        <input id="co-company" placeholder="შპს …" value={form.company} onChange={(e) => set("company", e.target.value)} />
                      </div>
                    )}
                    {!user && (
                      <div className="field wide">
                        <label htmlFor="co-pass">პაროლი <span style={{ color: "var(--muted)", fontWeight: 400 }}>— ანგარიშის შესაქმნელად (სურვილისამებრ)</span></label>
                        <input id="co-pass" type="password" minLength={6} placeholder="მინ. 6 სიმბოლო" value={form.password} onChange={(e) => set("password", e.target.value)} />
                      </div>
                    )}
                    <div className="field wide">
                      <label htmlFor="co-note">კომენტარი</label>
                      <textarea id="co-note" style={{ minHeight: 70 }} placeholder="სურვილისამებრ" value={form.note} onChange={(e) => set("note", e.target.value)} />
                    </div>
                  </div>
                  <button className="btn lg" type="submit" disabled={busy} style={{ marginTop: 18, width: "100%" }}>
                    {busy ? "..." : mode === "quote" ? "შეთავაზების მოთხოვნა" : "შეკვეთის გაგზავნა"}
                  </button>
                </form>
              </div>
            </div>

            <aside className="summary">
              <h3>ჯამი</h3>
              <div className="srow"><span>პროდუქტები</span><span className="num">{fmt(subtotal)}</span></div>
              <div className="srow"><span>მიწოდება</span><span className="num">{ship === 0 ? "უფასო" : fmt(ship)}</span></div>
              {ship > 0 && (
                <div className="srow" style={{ fontSize: 12, color: "var(--muted)" }}>
                  <span>უფასო მიწოდება {fmt(FREE_SHIP)}-დან</span><span />
                </div>
              )}
              <div className="srow total"><span>სულ</span><span className="num">{fmt(subtotal + ship)}</span></div>
              <a className="btn" href="#checkout">გაფორმებაზე გადასვლა</a>
              <p className="hint">გადახდა — ადგილზე ან გადარიცხვით. ონლაინ გადახდა არ სჭირდება.</p>
              {!user && (
                <p className="hint">
                  უკვე გაქვს ანგარიში? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 700 }}>შესვლა</Link>
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
