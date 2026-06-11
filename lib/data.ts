/* ============================================================
   Multicolor — default data (Georgian).
   Typed port of the handoff's data.js seed catalogue.
   ============================================================ */

import type { MulticolorData } from "./types";

export const MC_DATA: MulticolorData = {
  v: 3,

  /* ---------------- brands ---------------- */
  brands: [
    {
      id: "sobsan",
      name: "Sobsan",
      country: "თურქეთი",
      tint: "#2f4bc7",
      tagline: "საღებავები და ლაქები 1974 წლიდან",
      story:
        "Sobsan-ი თურქეთის ერთ-ერთი უმსხვილესი საღებავების მწარმოებელია. წყალემულსიური და სილიკონის საღებავები, ლაქები და გრუნტები — ევროპული სტანდარტის რეცეპტურით და სტაბილური ხარისხით.",
    },
    {
      id: "premium",
      name: "Premium",
      country: "თურქეთი",
      tint: "#b3541e",
      tagline: "სამონტაჟო ქაფი და ჰერმეტიკები",
      story:
        "Premium-ის ქაფი, სილიკონი და MS-პოლიმერული წებოები პროფესიონალი მემონტაჟეების პირველი არჩევანია — სტაბილური გამოსავალი, ზუსტი დოზირება და მდგრადობა ნებისმიერ სეზონზე.",
    },
    {
      id: "starbond",
      name: "Starbond",
      country: "თურქეთი",
      tint: "#1e7a52",
      tagline: "წებო და ბიტუმის იზოლაცია",
      story:
        "Starbond-ი სპეციალიზებულია სამშენებლო წებოებსა და ბიტუმის ჰიდროიზოლაციაზე. PVA-დან ეპოქსიდამდე — შეკავშირება, რომელსაც ენდობი.",
    },
    {
      id: "bauer",
      name: "Bauer",
      country: "საბერძნეთი",
      tint: "#3a3f8f",
      tagline: "სამშენებლო ქიმია საბერძნეთიდან",
      story:
        "Bauer-ის ცემენტის ჰიდროიზოლაცია, ფუგები და გრუნტები ათწლეულებია გამოიყენება ხმელთაშუა ზღვის რეგიონის რთულ კლიმატში — ტენი, მზე და მარილიანი ჰაერი მისთვის ჩვეული გარემოა.",
    },
    {
      id: "teirani",
      name: "Teirani",
      country: "ირანი",
      tint: "#8f2d3a",
      tagline: "აეროზოლის საღებავები RAL პალიტრით",
      story:
        "Teirani-ის აეროზოლები სრულ RAL პალიტრას ფარავს — სითბომედეგი, ფლუორესცენტული და ანტიკოროზიული სერიებით. თანაბარი დაფარვა პირველივე შესხურებიდან.",
    },
    {
      id: "asmako",
      name: "Asmako",
      country: "თურქეთი",
      tint: "#46698c",
      tagline: "ლენტები, ფუნჯები, ლილვაკები",
      story:
        "Asmako ამზადებს სამღებრო ინსტრუმენტს — ფუნჯებს, ლილვაკებსა და ლენტებს, რომელთა ხარისხსაც ნახატზე ხედავ: თანაბარი კვალი, მინიმალური წვეთვა, სუფთა კიდეები.",
    },
    {
      id: "stargil",
      name: "Stargil",
      country: "თურქეთი",
      tint: "#7a5a2f",
      tagline: "გამხსნელები და 24 ფერის კოლორანტი",
      story:
        "Stargil-ის გამხსნელები და კოლორანტები საღებავის სამუშაოს ქიმიური საფუძველია — სუფთა შემადგენლობა, ზუსტი მარკირება და სტაბილური ფერი პარტიიდან პარტიამდე.",
    },
    {
      id: "proian",
      name: "Projahn",
      country: "გერმანია",
      tint: "#444a52",
      tagline: "ბურღები, თავაკები, ხელსაწყოები",
      story:
        "Projahn-ის საბურღი და საჭრელი ინსტრუმენტი პროფესიონალური კლასისაა — HSS-G ფოლადიდან SDS-MAX-მდე, ქარხნული კალიბრაციით და ხანგრძლივი რესურსით.",
    },
  ],

  /* ---------------- categories ---------------- */
  categories: [
    /* ---- 1. ლაქ-საღებავები ---- */
    { id: "paints", name: "ლაქ-საღებავები", parentId: null, facets: ["size", "color", "surface"], order: 1 },
    { id: "synthetic-lacquer", name: "სინთეთიკური ლაქი", parentId: "paints", facets: ["size", "color", "surface"], order: 2 },
    { id: "cellulose-lacquer", name: "ცელულოზური ლაქი", parentId: "paints", facets: ["size", "color", "surface"], order: 3 },
    { id: "colored-synthetic-lacquer", name: "ფერადი სინთეთიკური ლაქი", parentId: "paints", facets: ["size", "color", "surface"], order: 4 },
    { id: "synthetic-paint", name: "სინთეთიკური საღებავი", parentId: "paints", facets: ["size", "color", "surface"], order: 5 },
    { id: "cellulose-paint", name: "ცელულოზური საღებავი", parentId: "paints", facets: ["size", "color", "surface"], order: 6 },
    { id: "anticorrosion-paint", name: "ანტიკოროზიული საღებავი", parentId: "paints", facets: ["size", "color", "surface"], order: 7 },
    { id: "water-emulsion-paint", name: "წყალემულსიური საღებავი", parentId: "paints", facets: ["size", "color", "surface"], order: 8 },
    { id: "solvent", name: "გამხსნელი", parentId: "paints", facets: ["size", "color"], order: 9 },
    { id: "primer", name: "პრაიმერი", parentId: "paints", facets: ["size", "color", "surface"], order: 10 },

    /* ---- 2. ინსტრუმენტები ---- */
    { id: "tools", name: "ინსტრუმენტები", parentId: null, facets: ["size", "color", "surface"], order: 11 },
    { id: "drills", name: "ბურღები", parentId: "tools", facets: ["size", "color", "surface"], order: 12 },
    { id: "metal-drills", name: "რკინის ბურღები", parentId: "drills", facets: ["size", "color", "surface"], order: 13 },
    { id: "wood-drills", name: "ხის ბურღები", parentId: "drills", facets: ["size", "color", "surface"], order: 14 },
    { id: "concrete-drills", name: "ბეტონის ბურღები", parentId: "drills", facets: ["size", "color", "surface"], order: 15 },
    { id: "drill-bits", name: "თავაკები", parentId: "tools", facets: ["size", "color", "surface"], order: 16 },
    { id: "saws", name: "ხერხები", parentId: "tools", facets: ["size", "color", "surface"], order: 17 },
    { id: "metal-saws", name: "რკინის ხერხები", parentId: "saws", facets: ["size", "color", "surface"], order: 18 },
    { id: "wood-saws", name: "ხის ხერხები", parentId: "saws", facets: ["size", "color", "surface"], order: 19 },
    { id: "threaders", name: "შიდა და გარე ხრახნმჭრელები", parentId: "tools", facets: ["size", "color", "surface"], order: 20 },
    { id: "paint-rollers", name: "სამღებვრო ლილვაკები", parentId: "tools", facets: ["size", "color", "surface"], order: 21 },
    { id: "paint-brushes", name: "სამღებვრო ჩოთქები", parentId: "tools", facets: ["size", "color", "surface"], order: 22 },
    { id: "other-accessories", name: "სხვა აქსესუარები", parentId: "tools", facets: ["size", "color", "surface"], order: 23 },

    /* ---- 3. ჰიდროიზოლაცია ---- */
    { id: "waterproofing", name: "ჰიდროიზოლაცია", parentId: null, facets: ["size", "color", "surface"], order: 24 },

    /* ---- 4. აეროზოლები ---- */
    { id: "aerosols", name: "აეროზოლები", parentId: null, facets: ["size", "color", "surface"], order: 25 },

    /* ---- 5. წებოები & სკოჩები ---- */
    { id: "glues-tapes", name: "წებოები & სკოჩები", parentId: null, facets: ["size", "color", "surface"], order: 26 },

    /* ---- 6. ქაფ-სილიკონები ---- */
    { id: "foam-silicone", name: "ქაფ-სილიკონები", parentId: null, facets: ["size", "color", "surface"], order: 27 },
  ],

  catGroups: [
    { id: "paint", name: "საღებავები და ლაქები" },
    { id: "chem", name: "სამშენებლო ქიმია" },
    { id: "tool", name: "ინსტრუმენტი და აქსესუარები" },
  ],

  surfaces: [
    { id: "interior", name: "ინტერიერი" },
    { id: "facade", name: "ფასადი" },
    { id: "floor", name: "იატაკი" },
    { id: "roof", name: "სახურავი" },
    { id: "bathroom", name: "სააბაზანო" },
    { id: "metal", name: "ლითონი" },
    { id: "wood", name: "ხე" },
    { id: "concrete", name: "ბეტონი" },
  ],

  /* ---------------- products ---------------- */
  products: [],

  /* ---------------- promotions / hero ---------------- */
  hero: [
    {
      id: "h1",
      kicker: "სეზონის შეთავაზება",
      title: "ფასდაკლება საღებავებზე —20%-მდე",
      sub: "Sobsan-ის ინტერიერის სერია და კარ-ფანჯრის ლაქები — მხოლოდ ივნისში.",
      cta: "იხილე შეთავაზებები",
      link: "/sale",
      tint: "paint",
    },
    {
      id: "h2",
      kicker: "ფერი შენთვის",
      title: "შენი ფერი. შენი სივრცე.",
      sub: "24 კოლორანტი და სრული RAL პალიტრა — შეურიეთ ზუსტად ის ტონი, რომელიც გესახებათ.",
      cta: "ფერების კატალოგი",
      link: "/shop?cat=solvents",
      tint: "color",
    },
    {
      id: "h3",
      kicker: "პროფესიონალებს",
      title: "ბითუმად ფასები ობიექტებისთვის",
      sub: "ხელშეკრულება, პირადი მენეჯერი და მიწოდება ობიექტზე — მოითხოვეთ შეთავაზება.",
      cta: "მოითხოვე შეთავაზება",
      link: "/contact?type=bulk",
      tint: "pro",
    },
  ],

  promotions: [],

  bundles: [],

  /* ---------------- seed orders / inquiries ---------------- */
  orders: [
    {
      id: "MC-1042",
      type: "order",
      status: "new",
      date: "2026-06-08T14:22:00",
      customer: { name: "გიორგი მაისურაძე", phone: "+995 599 12 34 56", city: "თბილისი", address: "ვაჟა-ფშაველას 71" },
      items: [
        { pid: "sobplastik-int", size: "10კგ", color: "თეთრი", qty: 2 },
        { pid: "roller-poly18", size: "25სმ", qty: 1 },
        { pid: "tape-masking", size: "38მმ", qty: 3 },
      ],
    },
    {
      id: "MC-1041",
      type: "quote",
      status: "processing",
      date: "2026-06-08T10:05:00",
      customer: {
        name: "შპს „მშენებელი 2020“",
        phone: "+995 577 44 55 66",
        city: "ბათუმი",
        company: "შპს მშენებელი 2020",
        note: "გვჭირდება ფასადის საღებავი ~400მ² ობიექტისთვის, ივლისის დასაწყისში.",
      },
      items: [
        { pid: "sobsil-facade", size: "15ლტ", qty: 12 },
        { pid: "primer-deep", size: "10ლტ", qty: 6 },
      ],
    },
    {
      id: "MC-1040",
      type: "order",
      status: "done",
      date: "2026-06-07T16:48:00",
      customer: { name: "ნინო ბერიძე", phone: "+995 555 98 76 54", city: "თბილისი", address: "ჭავჭავაძის 24ბ" },
      items: [
        { pid: "grout-epoxy", size: "2კგ", color: "ანთრაციტი", qty: 1 },
        { pid: "seal-sanitary", size: "280მლ", color: "გამჭვირვალე", qty: 2 },
      ],
    },
    {
      id: "MC-1039",
      type: "order",
      status: "processing",
      date: "2026-06-07T11:30:00",
      customer: { name: "ლევან კვარაცხელია", phone: "+995 593 11 22 33", city: "ქუთაისი", address: "წერეთლის 88" },
      items: [
        { pid: "drill-sdsplus", size: "8×160მმ", qty: 5 },
        { pid: "bit-set32", size: "32 ცალი", qty: 1 },
        { pid: "foam-pro65", size: "850მლ", qty: 4 },
      ],
    },
    {
      id: "MC-1038",
      type: "quote",
      status: "new",
      date: "2026-06-06T09:15:00",
      customer: {
        name: "თემურ ჩხეიძე",
        phone: "+995 591 77 88 99",
        city: "რუსთავი",
        company: "ინდ. მეწარმე",
        note: "სახურავის ჰიდროიზოლაცია 250მ², მჭირდება კონსულტაციაც მასალაზე.",
      },
      items: [
        { pid: "hydro-pu", size: "25კგ", qty: 3 },
        { pid: "tape-butyl", size: "10სმ", qty: 8 },
      ],
    },
  ],
};

/* ---------------- lookups ---------------- */
export const brandById = (id: string) => MC_DATA.brands.find((b) => b.id === id);
export const catById = (id: string) => MC_DATA.categories.find((c) => c.id === id);
export const prodById = (id: string) => MC_DATA.products.find((p) => p.id === id);
export const surfName = (id: string) => {
  const s = MC_DATA.surfaces.find((x) => x.id === id);
  return s ? s.name : id;
};
