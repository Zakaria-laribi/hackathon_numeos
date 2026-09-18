CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_chunks (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(512)
);

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
  client_id TEXT PRIMARY KEY,
  nom TEXT,
  telephone TEXT,
  ville TEXT,
  langue_preferee TEXT,
  premier_achat DATE,
  nb_commandes INTEGER,
  segment TEXT
);

CREATE TABLE IF NOT EXISTS delivery_grid (
  ville TEXT PRIMARY KEY,
  frais_mad NUMERIC NOT NULL,
  delai_heures INTEGER NOT NULL,
  paiement_a_la_livraison BOOLEAN NOT NULL,
  retrait_boutique BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  ref TEXT REFERENCES products(ref),
  modele TEXT,
  prix_normal_mad NUMERIC,
  prix_promo_mad NUMERIC,
  debut DATE,
  fin DATE,
  condition TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(client_id),
  date DATE,
  canal TEXT,
  statut TEXT NOT NULL DEFAULT 'draft',
  total_articles_mad NUMERIC,
  frais_livraison_mad NUMERIC,
  total_mad NUMERIC NOT NULL DEFAULT 0,
  ville_livraison TEXT,
  paiement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_lines (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  ref TEXT REFERENCES products(ref),
  modele TEXT,
  taille TEXT,
  quantite INTEGER NOT NULL,
  prix_unitaire_mad NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(client_id),
  statut TEXT NOT NULL DEFAULT 'open',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(client_id),
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