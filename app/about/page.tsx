"use client";

import Link from "next/link";

import { ph } from "@/lib/utils";
import { useStore } from "@/components/store-provider";

export default function AboutPage() {
  const { db } = useStore();

  return (
    <main className="wrap" data-screen-label="ჩვენ შესახებ">
      <section className="page-hero">
        <span className="spectrum-tick" />
        <h1 style={{ marginTop: 14 }}>
          შერჩეული მასალები. <br />ოფიციალური იმპორტი.
        </h1>
        <p className="lead">
          მულტიკოლორი სარემონტო და სამშენებლო მასალების დისტრიბუტორია — ვირჩევთ
          ცოტას, მაგრამ საუკეთესოს.
        </p>
      </section>

      <div className="about-grid">
        <div className="copy">
          <p>
            ბაზარზე ათასობით დასახელების მასალაა — ჩვენ სხვა გზა ავირჩიეთ.
            მულტიკოლორის კატალოგში მხოლოდ ის პროდუქტები ხვდება, რომლებსაც თავად
            ვიცნობთ, ვტესტავთ და რომლის მარაგსაც სტაბილურად ვინახავთ საწყობში.
          </p>
          <p>
            ვართ 8 იმპორტირებული ბრენდის ოფიციალური დისტრიბუტორი საქართველოში. ეს
            ნიშნავს ქარხნულ წარმოშობას, სწორ შენახვას და რეალურ გარანტიას — და არა
            შემთხვევით პარტიებს ბაზრობიდან.
          </p>
          <p>
            ვემსახურებით ორივეს: ოჯახს, რომელიც ერთ ოთახს აკეთებს, და სამშენებლო
            კომპანიას, რომელსაც ობიექტზე ასეული ერთეული მასალა სჭირდება — ბითუმად
            ფასით, პირადი მენეჯერით და ობიექტზე მიწოდებით.
          </p>
        </div>
        <div className="about-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ph("ფოტო · შოურუმი/საწყობი", "#2f4bc7", 760, 560)} alt="მულტიკოლორის შოურუმი" />
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>8</b><span>იმპორტირებული ბრენდი</span></div>
        <div className="stat"><b>300+</b><span>შერჩეული პროდუქტი</span></div>
        <div className="stat"><b>12</b><span>წელი ბაზარზე</span></div>
        <div className="stat"><b>2 500მ²</b><span>საწყობი თბილისში</span></div>
      </div>

      <section className="section">
        <div className="sec-head">
          <div>
            <span className="kicker">პარტნიორები</span>
            <h2>ბრენდები, რომლებსაც წარმოვადგენთ</h2>
          </div>
        </div>
        <div className="partner-row">
          {db.brands.map((b) => (
            <Link key={b.id} className="partner" href={`/brand?b=${b.id}`}>
              <span className="mk" style={{ background: b.tint }}>{b.name[0]}</span>
              <span>
                <b>{b.name}</b>
                <span>{b.tagline}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="pro-band"
        style={{ marginTop: 72 }}
      >
        <div>
          <h2>გაქვს კითხვები ასორტიმენტზე?</h2>
          <p>
            დაგვირეკე ან მოგვწერე — გირჩევთ ზუსტად იმ მასალას, რომელიც შენს
            სამუშაოს სჭირდება.
          </p>
        </div>
        <Link className="btn lg" href="/contact">დაგვიკავშირდი</Link>
      </section>
    </main>
  );
}
