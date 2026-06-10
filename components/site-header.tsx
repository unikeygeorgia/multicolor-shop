"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MC_DATA } from "@/lib/data";
import { useCart } from "@/components/cart-provider";
import {
  BurgerIcon,
  CartIcon,
  ChevronDownIcon,
  SearchIcon,
} from "@/components/icons";

function MegaColumns() {
  return (
    <>
      {MC_DATA.catGroups.map((g) => {
        const cats = MC_DATA.categories
          .filter((c) => c.group === g.id)
          .sort((a, b) => a.order - b.order);
        return (
          <div key={g.id}>
            <h5>{g.name}</h5>
            <ul>
              {cats.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?cat=${c.id}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const sortedCats = [...MC_DATA.categories].sort((a, b) => a.order - b.order);

  return (
    <header className="site-header">
      <div className="spectrum-bar" aria-hidden="true" />
      <div className="wrap hdr-row">
        <button
          className="hdr-burger"
          aria-label="მენიუ"
          onClick={() => setDrawerOpen(true)}
        >
          <BurgerIcon />
        </button>

        <Link className="logo" href="/" aria-label="მულტიკოლორი — მთავარი">
          <b>მულტიკოლორი</b>
          <span className="spectrum-tick" />
        </Link>

        <nav className="hdr-nav" aria-label="მთავარი ნავიგაცია">
          <div className="has-mega">
            <Link href="/shop" aria-current={isActive("/shop") ? "page" : undefined}>
              კატალოგი
              <ChevronDownIcon />
            </Link>
            <div className="mega">
              <MegaColumns />
              <div className="mega-brands">
                <h5>ბრენდები</h5>
                <ul>
                  {MC_DATA.brands.map((b) => (
                    <li key={b.id}>
                      <Link href={`/brand?b=${b.id}`}>{b.name}</Link>
                    </li>
                  ))}
                </ul>
                <Link className="mega-all" href="/shop">
                  სრული კატალოგი →
                </Link>
              </div>
            </div>
          </div>
          <Link
            href="/sale"
            className="is-sale"
            aria-current={isActive("/sale") ? "page" : undefined}
          >
            ფასდაკლება
          </Link>
          <Link href="/about" aria-current={isActive("/about") ? "page" : undefined}>
            ჩვენ შესახებ
          </Link>
          <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined}>
            კონტაქტი
          </Link>
        </nav>

        <form className="hdr-search" action="/shop" role="search">
          <SearchIcon />
          <input
            type="search"
            name="q"
            placeholder="ძიება — საღებავი, ლაქი, ბურღი…"
            aria-label="ძიება კატალოგში"
          />
        </form>

        <Link className="hdr-cart" href="/cart" aria-label="კალათა">
          <CartIcon />
          <span className="cart-count">{count > 0 ? count : ""}</span>
        </Link>
      </div>

      <div className={`mob-drawer${drawerOpen ? " open" : ""}`} id="mob-drawer">
        <div className="scrim" onClick={() => setDrawerOpen(false)} />
        <div className="panel">
          <Link className="logo" href="/" onClick={() => setDrawerOpen(false)}>
            <b>მულტიკოლორი</b>
            <span className="spectrum-tick" />
          </Link>
          <nav>
            <Link href="/shop" onClick={() => setDrawerOpen(false)}>
              სრული კატალოგი
            </Link>
            <Link
              href="/sale"
              style={{ color: "var(--sale)" }}
              onClick={() => setDrawerOpen(false)}
            >
              ფასდაკლება
            </Link>
            <h5>კატეგორიები</h5>
            {sortedCats.map((c) => (
              <Link
                key={c.id}
                className="sub"
                href={`/shop?cat=${c.id}`}
                onClick={() => setDrawerOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <h5>ბრენდები</h5>
            {MC_DATA.brands.map((b) => (
              <Link
                key={b.id}
                className="sub"
                href={`/brand?b=${b.id}`}
                onClick={() => setDrawerOpen(false)}
              >
                {b.name}
              </Link>
            ))}
            <h5>ინფორმაცია</h5>
            <Link className="sub" href="/about" onClick={() => setDrawerOpen(false)}>
              ჩვენ შესახებ
            </Link>
            <Link className="sub" href="/contact" onClick={() => setDrawerOpen(false)}>
              კონტაქტი
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
