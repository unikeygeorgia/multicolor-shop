/* Georgian → Latin transliteration + slug generation.
   Keeps the same mapping used to backfill existing product slugs. */

const KA_MAP: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i",
  კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s",
  ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts",
  ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

export function transliterate(input: string): string {
  return input
    .split("")
    .map((c) => (KA_MAP[c] !== undefined ? KA_MAP[c] : c))
    .join("");
}

export function slugify(name: string): string {
  let s = transliterate(name || "").toLowerCase();
  s = s.replace(/[ıİ]/g, "i");
  s = s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "product";
}
