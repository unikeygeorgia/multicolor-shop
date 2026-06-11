"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useStore } from "@/components/store-provider";
import { useAuth } from "@/components/auth-provider";
import { CategoryIcon } from "@/components/category-icons";
import type { MulticolorData } from "@/lib/types";
import {
  BurgerIcon,
  CartIcon,
  ChevronDownIcon,
  GridIcon,
  PinIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";

function MegaColumns({ db }: { db: MulticolorData }) {
  const tops = db.categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);
  return (
    <>
      {tops.map((top) => {
        const children = db.categories
          .filter((c) => c.parentId === top.id)
          .sort((a, b) => a.order - b.order);
        return (
          <div key={top.id}>
            <h5 className="mega-cat-h">
              <span className="mega-ci"><CategoryIcon id={top.id} /></span>
              <Link href={`/shop?cat=${top.id}`}>{top.name}</Link>
            </h5>
            <ul>
              {children.map((c) => (
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
  const { db, count, settings } = useStore();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const sortedCats = [...db.categories].sort((a, b) => a.order - b.order);

  return (
    <header className="site-header">
      <div className="spectrum-bar" aria-hidden="true" />

      {/* ---- row 1 ---- */}
      <div className="wrap hdr-row">
        <button className="hdr-burger" aria-label="მენიუ" onClick={() => setDrawerOpen(true)}>
          <BurgerIcon />
        </button>

        <Link className="logo" href="/" aria-label="მულტიკოლორი — მთავარი">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="მულტიკოლორი" />
        </Link>

        <Link className="hdr-loc" href="/shop" aria-label="მიწოდება">
          <span className="pin"><PinIcon /></span>
          <span>მიწოდება მთელ საქართველოში</span>
        </Link>

        <form className="hdr-search" action="/shop" role="search">
          <SearchIcon />
          <input
            type="search"
            name="q"
            placeholder="მოძებნე — საღებავი, ლაქი, ბურღი…"
            aria-label="ძიება კატალოგში"
          />
        </form>

        {settings.commerceEnabled && (
          <div className="hdr-actions">
            {user ? (
              <Link className="hdr-cart" href="/account" aria-label="ჩემი ანგარიში" title="ჩემი ანგარიში">
                <UserIcon />
              </Link>
            ) : (
              <Link className="hdr-login" href="/login">
                <UserIcon />
                <span>შესვლა</span>
              </Link>
            )}
            <Link className="hdr-cart" href="/cart" aria-label="კალათა">
              <CartIcon />
              <span className="cart-count">{count > 0 ? count : ""}</span>
            </Link>
          </div>
        )}
      </div>

      {/* ---- row 2: category bar ---- */}
      <div className="wrap hdr-cats">
        <div className="has-mega">
          <button className="cats-pill">
            <GridIcon /> კატეგორიები
            <ChevronDownIcon />
          </button>
          <div className="mega">
            <MegaColumns db={db} />
            <div className="mega-brands">
              <h5>ბრენდები</h5>
              <ul>
                {db.brands.map((b) => (
                  <li key={b.id}>
                    <Link href={`/brand?b=${b.id}`}>{b.name}</Link>
                  </li>
                ))}
              </ul>
              <Link className="mega-all" href="/shop">სრული კატალოგი →</Link>
            </div>
          </div>
        </div>

        <Link href="/shop" aria-current={isActive("/shop") ? "page" : undefined}>სრული კატალოგი</Link>
        <Link href="/about" aria-current={isActive("/about") ? "page" : undefined}>ჩვენ შესახებ</Link>
        <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined}>კონტაქტი</Link>

        <div className="cats-right">
          {!settings.pricesHidden && (
            <Link href="/sale" className="is-sale">ფასდაკლება</Link>
          )}
        </div>
      </div>

      {/* ---- mobile drawer ---- */}
      <div className={`mob-drawer${drawerOpen ? " open" : ""}`} id="mob-drawer">
        <div className="scrim" onClick={() => setDrawerOpen(false)} />
        <div className="panel">
          <Link className="logo" href="/" onClick={() => setDrawerOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="მულტიკოლორი" />
          </Link>
          <nav>
            <Link href="/shop" onClick={() => setDrawerOpen(false)}>სრული კატალოგი</Link>
            {!settings.pricesHidden && (
              <Link href="/sale" style={{ color: "var(--sale)" }} onClick={() => setDrawerOpen(false)}>ფასდაკლება</Link>
            )}
            {settings.commerceEnabled && (
              <Link href={user ? "/account" : "/login"} onClick={() => setDrawerOpen(false)}>
                {user ? "ჩემი ანგარიში" : "შესვლა"}
              </Link>
            )}
            <h5>კატეგორიები</h5>
            {sortedCats.map((c) => (
              <Link key={c.id} className="sub" href={`/shop?cat=${c.id}`} onClick={() => setDrawerOpen(false)}>
                {c.name}
              </Link>
            ))}
            <h5>ბრენდები</h5>
            {db.brands.map((b) => (
              <Link key={b.id} className="sub" href={`/brand?b=${b.id}`} onClick={() => setDrawerOpen(false)}>
                {b.name}
              </Link>
            ))}
            <h5>ინფორმაცია</h5>
            <Link className="sub" href="/about" onClick={() => setDrawerOpen(false)}>ჩვენ შესახებ</Link>
            <Link className="sub" href="/contact" onClick={() => setDrawerOpen(false)}>კონტაქტი</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
