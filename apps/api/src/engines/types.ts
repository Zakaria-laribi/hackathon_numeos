export type Product = {
  ref: string;
  modele: string;
  famille: string;
  genre: string;
  couleur: string;
  taille: string;
  matiere: string;
  saison: string;
  prix_mad: number;
  stock: number;
  // delai_reassort_jours volontairement absent :
  // la politique commerciale interdit de l'exposer à l'agent.
};

export type DeliveryRule = {
  ville: string;
  frais_mad: number;
  delai_heures: number;
  paiement_a_la_livraison: boolean;
  retrait_boutique: boolean;
};

export type Promotion = {
  code?: string;
  ref?: string;
  famille?: string;
  taux_pct: number;
  debut: string;
  fin: string;
};

/** Toute décision déterministe renvoie ceci : jamais une exception muette. */
export type Decision<T> =
  | { ok: true; value: T }
  | { ok: false; escalate: true; reason: string };