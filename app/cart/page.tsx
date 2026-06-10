"use client";

import { useState } from "react";
import Link from "next/link";

import { fmt, prodImg, salePrice } from "@/lib/utils";
import { useStore } from "@/components/store-provider";
import type { Order } from "@/lib/types";

const FREE_SHIP = 150;
const SHIP = 10;
const CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "სხვა"];

export default function CartPage() {
  const { cart, db, brandById, prodById, updateCartQty, removeCartLine, clearCart, pushOrder } =
    useStore();

  const [mode, setMode] = useState<"order" | "quote">("order");
  const [submitted, setSubmitted] = useState<{ id: string; type: string } | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", city: CITIES[0], address: "", company: "", note: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const order: Order = {
      id: "MC-" + Math.floor(1000 + Math.random() * 9000),
      type: mode === "quote" ? "quote" : "order",
      status: "new",
      date: new Date().toISOString(),
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city,
        address: form.address.trim() || undefined,
        company: form.company.trim() || undefined,
        note: form.note.trim() || undefined,
      },
      items: cart,
    };
    pushOrder(order);
    clearCart();
    setSubmitted({ id: order.id, type: order.type });
    window.scrollTo({ top: 0 });
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
          <p style={{ color: "var(--muted)", marginTop: 10, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            {submitted.type === "quote"
              ? "გაყიდვების მენეჯერი 24 საათში დაგიკავშირდებათ ბითუმად ფასებითა და მიწოდების პირობებით."
              : "ოპერატორი მალე დაგიკავშირდებათ შეკვეთის დასადასტურებლად. გადახდა — ადგილზე ან გადარიცხვით."}
          </p>
          <Link className="btn" href="/shop" style={{ marginTop: 22 }}>
            კატალოგში დაბრუნება
          </Link>
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
          <Link className="btn" href="/shop" style={{ marginTop: 16 }}>
            კატალოგზე გადასვლა
          </Link>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 18 }}>
            კალათა{" "}
            <span style={{ color: "var(--muted)", fontSize: 15, fontWeight: 600 }}>
              ({lines.length} პოზიცია)
            </span>
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
                  აირჩიე — სწრაფი შეკვეთა მიწოდებით, ან ბითუმად შეთავაზების მოთხოვნა ობიექტისთვის.
                </p>
                <div className="mode-toggle">
                  <button type="button" className={mode === "order" ? "on" : ""} onClick={() => setMode("order")}>
                    შეკვეთა მიწოდებით
                  </button>
                  <button type="button" className={mode === "quote" ? "on" : ""} onClick={() => setMode("quote")}>
                    ბითუმად შეთავაზება
                  </button>
                </div>
                <form onSubmit={submit}>
                  <div className="fgrid">
                    <div className="field">
                      <label htmlFor="co-name">სახელი *</label>
                      <input id="co-name" required placeholder="სახელი, გვარი" value={form.name} onChange={(e) => set("name", e.target.value)} />
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
                      <div className="field">
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
                    <div className="field wide">
                      <label htmlFor="co-note">კომენტარი</label>
                      <textarea id="co-note" style={{ minHeight: 70 }} placeholder="სურვილისამებრ" value={form.note} onChange={(e) => set("note", e.target.value)} />
                    </div>
                  </div>
                  <button className="btn lg" type="submit" style={{ marginTop: 18, width: "100%" }}>
                    {mode === "quote" ? "შეთავაზების მოთხოვნა" : "შეკვეთის გაგზავნა"}
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
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
