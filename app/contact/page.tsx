import { Suspense } from "react";
import { ContactClient } from "./contact-client";

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ minHeight: "60vh" }} />}>
      <ContactClient />
    </Suspense>
  );
}
