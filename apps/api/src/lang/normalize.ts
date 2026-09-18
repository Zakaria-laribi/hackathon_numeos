const ARABIZI_MAP: Record<string, string> = {
  "3": "ع",
  "7": "ح",
  "9": "ق",
  "2": "ء",
  "5": "خ",
};

/**
 * Convertit un chiffre arabizi en lettre arabe UNIQUEMENT s'il est colle
 * a une lettre (ex: "ch7al" -> "chحal"). Un chiffre isole (prix, quantite,
 * "450 MAD", "3 articles") n'est jamais touche.
 */
function arabiziDigitsToLetters(s: string): string {
  return s.replace(
    /(?<=[a-zA-Z\u0600-\u06FF])[23579]|[23579](?=[a-zA-Z\u0600-\u06FF])/g,
    (digit) => ARABIZI_MAP[digit] ?? digit
  );
}

/** Unifie les variantes graphiques de l'arabe (alef, ta marbuta, ya, tachkil). */
function normalizeArabicLetters(s: string): string {
  return s
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/[\u064B-\u0652]/g, ""); // tachkil (diacritiques)
}

/**
 * Normalise un message client (fr/ar/darija/arabizi) vers une forme
 * canonique, utilisee pour la recherche RAG et la detection d'intention.
 * Ne modifie jamais le texte affiche a l'utilisateur, seulement une
 * version de travail interne.
 */
export function normalizeDarija(input: string): string {
  let s = input.normalize("NFKC").toLowerCase().trim();
  s = arabiziDigitsToLetters(s);
  s = normalizeArabicLetters(s);
  s = s.replace(/\s+/g, " ");
  return s;
}