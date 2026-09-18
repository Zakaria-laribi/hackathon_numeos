import { describe, it, expect } from "vitest";
import { normalizeDarija } from "./normalize.js";

describe("normalizeDarija", () => {
  it("convertit un chiffre arabizi colle a une lettre", () => {
    expect(normalizeDarija("ch7al")).toBe("chحal");
    expect(normalizeDarija("3ndi")).toBe("عndi");
    expect(normalizeDarija("bghit n3ref")).toBe("bghit nعref");
  });

  it("ne touche jamais un nombre isole (prix, quantite)", () => {
    expect(normalizeDarija("450 MAD")).toBe("450 mad");
    expect(normalizeDarija("je veux 3 articles")).toBe("je veux 3 articles");
  });

  it("unifie les variantes de l'alef arabe", () => {
    expect(normalizeDarija("أنا")).toBe(normalizeDarija("انا"));
    expect(normalizeDarija("إيوا")).toBe(normalizeDarija("ايوا"));
  });

  it("unifie ta marbuta et ya", () => {
    expect(normalizeDarija("مدينة")).toBe(normalizeDarija("مدينه"));
    expect(normalizeDarija("فى")).toBe(normalizeDarija("في"));
  });

  it("supprime le tachkil sans changer le sens", () => {
    expect(normalizeDarija("شُحَال")).toBe(normalizeDarija("شحال"));
  });

  it("est insensible a la casse latine", () => {
    expect(normalizeDarija("Bonjour")).toBe("bonjour");
  });
});