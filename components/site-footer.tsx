import Link from "next/link";

import { MC_DATA } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="spectrum-bar" aria-hidden="true" />
      <div className="wrap">
        <div className="ft-grid">
          <div className="ft-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.svg" alt="მულტიკოლორი" />
            <p>
              სარემონტო და სამშენებლო მასალების ოფიციალური დისტრიბუტორი
              საქართველოში — 8 იმპორტირებული ბრენდი, შერჩეული ასორტიმენტი.
            </p>
          </div>
          <div>
            <h5>კატალოგი</h5>
            <ul>
              <li><Link href="/shop?cat=paints-we">საღებავები</Link></li>
              <li><Link href="/shop?cat=waterproof">ჰიდროიზოლაცია</Link></li>
              <li><Link href="/shop?cat=foam">სამონტაჟო ქაფი</Link></li>
              <li><Link href="/shop?cat=drills">ბურღები</Link></li>
              <li><Link href="/sale">ფასდაკლება</Link></li>
            </ul>
          </div>
          <div>
            <h5>ბრენდები</h5>
            <ul>
              {MC_DATA.brands.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link href={`/brand?b=${b.id}`}>{b.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5>კონტაქტი</h5>
            <ul>
              <li><a href="tel:+995322055000">+995 32 2 05 50 00</a></li>
              <li><a href="mailto:info@multicolor.ge">info@multicolor.ge</a></li>
              <li>თბილისი, აღმაშენებლის ხეივანი მე-12 კმ</li>
              <li>ორშ–შაბ · 09:00–19:00</li>
            </ul>
          </div>
        </div>
        <div className="ft-bottom">
          <span>© 2026 მულტიკოლორი · ყველა უფლება დაცულია</span>
          <Link href="/admin">ადმინისტრირება</Link>
        </div>
      </div>
    </footer>
  );
}
