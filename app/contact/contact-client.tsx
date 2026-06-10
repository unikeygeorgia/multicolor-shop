"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { ph } from "@/lib/utils";
import { useStore } from "@/components/store-provider";

export function ContactClient() {
  const { prodById } = useStore();
  const params = useSearchParams();

  const [type, setType] = useState<"general" | "bulk">(
    params.get("type") === "bulk" ? "bulk" : "general"
  );
  const prefillProduct = params.get("p") ? prodById(params.get("p")!) : undefined;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [msg, setMsg] = useState(
    prefillProduct ? `მაინტერესებს ბითუმად ფასი: ${prefillProduct.name}\nმოცულობა: ` : ""
  );
  const [sentName, setSentName] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: type === "bulk" ? "quote" : "inquiry",
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            city: "",
            company: company.trim() || undefined,
            note: msg.trim(),
          },
          items: [],
        }),
      });
    } catch {
      /* best-effort; still acknowledge */
    }
    setSentName(name.trim());
  };

  return (
    <main className="wrap" data-screen-label="კონტაქტი">
      <section className="page-hero">
        <span className="spectrum-tick" />
        <h1 style={{ marginTop: 14 }}>დაგვიკავშირდი</h1>
        <p className="lead">
          კითხვა მასალაზე, ბითუმად შეთავაზება თუ თანამშრომლობა — მოგვწერე და 24
          საათში გიპასუხებთ.
        </p>
      </section>

      <div className="contact-grid">
        {sentName ? (
          <div className="cform">
            <div className="sent">
              <div className="tickbig">✓</div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>მივიღეთ, {sentName}!</h2>
              <p style={{ color: "var(--muted)", marginTop: 8 }}>
                ჩვენი მენეჯერი 24 საათში დაგიკავშირდებათ მითითებულ ნომერზე.
              </p>
              <Link className="btn-line" href="/shop" style={{ marginTop: 20 }}>
                კატალოგში დაბრუნება
              </Link>
            </div>
          </div>
        ) : (
          <form className="cform" onSubmit={submit}>
            <div className="type-toggle">
              <button type="button" className={type === "general" ? "on" : ""} onClick={() => setType("general")}>
                ზოგადი კითხვა
              </button>
              <button type="button" className={type === "bulk" ? "on" : ""} onClick={() => setType("bulk")}>
                ბითუმად შეთავაზება
              </button>
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="cf-name">სახელი *</label>
                <input id="cf-name" required placeholder="თქვენი სახელი" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cf-phone">ტელეფონი *</label>
                <input id="cf-phone" required placeholder="+995 5__ __ __ __" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            {type === "bulk" && (
              <div className="field">
                <label htmlFor="cf-company">კომპანია / ობიექტი</label>
                <input id="cf-company" placeholder="შპს …" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label htmlFor="cf-msg">შეტყობინება *</label>
              <textarea id="cf-msg" required placeholder="რა მასალა გჭირდებათ, რა მოცულობით…" value={msg} onChange={(e) => setMsg(e.target.value)} />
            </div>
            <button className="btn lg" type="submit">გაგზავნა</button>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              ბითუმად მოთხოვნაზე პასუხობს გაყიდვების მენეჯერი — როგორც წესი, 24 საათში.
            </p>
          </form>
        )}

        <div className="cinfo">
          <div className="card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c1 .3 2 .5 3 .6a2 2 0 0 1 1.6 2z" />
            </svg>
            <div><b>ტელეფონი</b><p>+995 32 2 05 50 00<br />+995 599 05 50 00 (გაყიდვები)</p></div>
          </div>
          <div className="card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div><b>მისამართი</b><p>თბილისი, დ. აღმაშენებლის ხეივანი მე-12 კმ<br />შოურუმი + საწყობი</p></div>
          </div>
          <div className="card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <div><b>სამუშაო საათები</b><p>ორშაბათი–შაბათი · 09:00–19:00<br />კვირა · დაკეტილია</p></div>
          </div>
          <div className="map">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ph("რუკა · Google Maps ჩასმა", "#46698c", 700, 420)} alt="მდებარეობა რუკაზე" />
          </div>
        </div>
      </div>
    </main>
  );
}
