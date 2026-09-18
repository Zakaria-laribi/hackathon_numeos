CREATE TABLE IF NOT EXISTS products (
  ref TEXT PRIMARY KEY,
  modele TEXT NOT NULL,
  famille TEXT NOT NULL,
  genre TEXT,
  couleur TEXT,
  taille TEXT,
  matiere TEXT,
  saison TEXT,
  prix_mad NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  delai_reassort_jours INTEGER,
  code_barre TEXT,
  poids_g INTEGER
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  nom TEXT,
  telephone TEXT,
  ville TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS delivery_grid (
  ville TEXT PRIMARY KEY,
  frais_mad NUMERIC NOT NULL,
  delai_heures INTEGER NOT NULL,
  paiement_a_la_livraison BOOLEAN NOT NULL,
  retrait_boutique BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS promotions (
  ref TEXT REFERENCES products(ref),
  modele TEXT,
  prix_normal_mad NUMERIC,
  prix_promo_mad NUMERIC,
  debut DATE,
  fin DATE,
  condition TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  ville TEXT,
  statut TEXT NOT NULL DEFAULT 'draft',
  total_mad NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_lines (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  ref TEXT REFERENCES products(ref),
  quantite INTEGER NOT NULL,
  prix_unitaire_mad NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  statut TEXT NOT NULL DEFAULT 'open',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  thread_id TEXT UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escalations (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  reason TEXT NOT NULL,
  contexte JSONB,
  statut TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);