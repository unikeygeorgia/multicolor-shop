import { NextResponse } from "next/server";

import { getAdminClient, isAdminConfigured } from "@/lib/supabase-admin";
import type { CartLine, OrderCustomer } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  type: "order" | "quote" | "inquiry";
  customer: OrderCustomer & { email?: string };
  items: CartLine[];
  password?: string;
  accessToken?: string;
}

function genId() {
  return "MC-" + Math.floor(1000 + Math.random() * 9000);
}
function randomPassword() {
  return "mc_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Server not configured (SUPABASE_SERVICE_ROLE_KEY missing)." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { type, customer, items = [], password, accessToken } = body;
  const email = customer.email?.trim().toLowerCase();

  let userId: string | null = null;
  let accountCreated = false;

  try {
    // 1) logged-in caller → use their id
    if (accessToken) {
      const { data } = await admin.auth.getUser(accessToken);
      if (data.user) userId = data.user.id;
    }

    // 2) otherwise, for orders/quotes with an email → find or create an account
    if (!userId && email && type !== "inquiry") {
      const existing = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
      if (existing.data?.id) {
        userId = existing.data.id as string;
      } else {
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password: password && password.length >= 6 ? password : randomPassword(),
          email_confirm: true,
          user_metadata: { name: customer.name, phone: customer.phone },
        });
        if (!error && created.user) {
          userId = created.user.id;
          accountCreated = true;
        }
        // if creation failed (e.g. already registered without a profile), proceed as guest
      }
    }

    // 3) keep profile fresh
    if (userId) {
      await admin.from("profiles").upsert({
        id: userId,
        name: customer.name || null,
        phone: customer.phone || null,
        email: email || null,
      });
      // best-effort save of the delivery address
      if (type === "order" && customer.address) {
        await admin.from("addresses").insert({
          user_id: userId,
          city: customer.city || null,
          address: customer.address,
          is_default: true,
        });
      }
    }

    // 4) create the order
    const id = genId();
    const { error: orderErr } = await admin.from("orders").insert({
      id,
      type,
      status: "new",
      created_at: new Date().toISOString(),
      customer,
      items,
      user_id: userId,
    });
    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: id, accountCreated, email: email ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
