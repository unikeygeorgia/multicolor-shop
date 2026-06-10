import Link from "next/link";

export function ProBand() {
  return (
    <section className="pro-band" aria-label="პროფესიონალებისთვის">
      <div>
        <h2>აშენებ ობიექტს? იმუშავე პირდაპირ დისტრიბუტორთან.</h2>
        <p>
          ბითუმად ფასები, პირადი მენეჯერი და მიწოდება ობიექტზე — გამოგვიგზავნე
          საჭირო მასალების სია და 24 საათში მიიღებ შეთავაზებას.
        </p>
      </div>
      <Link className="btn lg" href="/contact?type=bulk">
        მოითხოვე შეთავაზება
      </Link>
    </section>
  );
}
