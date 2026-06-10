import { ChatIcon, ClockIcon, ShieldCheckIcon, TruckIcon } from "@/components/icons";

const ITEMS = [
  { Icon: ShieldCheckIcon, label: "ოფიციალური დისტრიბუტორი" },
  { Icon: TruckIcon, label: "მიწოდება მთელ საქართველოში" },
  { Icon: ClockIcon, label: "მარაგი ადგილზე — სწრაფი გაცემა" },
  { Icon: ChatIcon, label: "კონსულტაცია პროფესიონალისგან" },
];

export function TrustBand() {
  return (
    <section className="trust" aria-label="რატომ მულტიკოლორი">
      {ITEMS.map(({ Icon, label }) => (
        <div key={label}>
          <Icon />
          {label}
        </div>
      ))}
    </section>
  );
}
