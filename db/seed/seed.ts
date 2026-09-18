import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "csv-parse/sync";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "raw", "sujet-02-kenza");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function readCsv(file: string): Record<string, string>[] {
  const content = readFileSync(join(RAW, file), "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true });
}

function toBool(v: string): boolean {
  return v.trim().toLowerCase() === "oui";
}

function toNullableInt(v: string): number | null {
  return v === undefined || v === "" ? null : Number(v);
}

async function alreadySeeded(): Promise<boolean> {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM products");
  return rows[0].n > 0;
}

async function seedProducts() {
  const rows = readCsv("catalogue.csv");
  for (const r of rows) {
    await pool.query(
      `INSERT INTO products
       (ref, modele, famille, genre, couleur, taille, matiere, saison, prix_mad, stock, delai_reassort_jours, code_barre, poids_g)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [r.ref, r.modele, r.famille, r.genre, r.couleur, r.taille, r.matiere, r.saison,
       Number(r.prix_mad), Number(r.stock), toNullableInt(r.delai_reassort_jours),
       r.code_barre, toNullableInt(r.poids_g)]
    );
  }
  console.log(`products: ${rows.length} lignes inserees`);
}

async function seedCustomers() {
  const rows = readCsv("clients.csv");
  for (const r of rows) {
    await pool.query(
      `INSERT INTO customers
       (client_id, nom, telephone, ville, langue_preferee, premier_achat, nb_commandes, segment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [r.client_id, r.nom, r.telephone, r.ville, r.langue_preferee,
       r.premier_achat || null, toNullableInt(r.nb_commandes), r.segment]
    );
  }
  console.log(`customers: ${rows.length} lignes inserees`);
}

async function seedDeliveryGrid() {
  const rows = readCsv("livraison.csv");
  for (const r of rows) {
    await pool.query(
      `INSERT INTO delivery_grid
       (ville, frais_mad, delai_heures, paiement_a_la_livraison, retrait_boutique)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.ville, Number(r.frais_mad), Number(r.delai_heures),
       toBool(r.paiement_a_la_livraison), toBool(r.retrait_boutique)]
    );
  }
  console.log(`delivery_grid: ${rows.length} lignes inserees`);
}

async function seedPromotions() {
  const rows = readCsv("promotions.csv");
  for (const r of rows) {
    await pool.query(
      `INSERT INTO promotions
       (ref, modele, prix_normal_mad, prix_promo_mad, debut, fin, condition)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.ref, r.modele, Number(r.prix_normal_mad), Number(r.prix_promo_mad),
       r.debut, r.fin, r.condition]
    );
  }
  console.log(`promotions: ${rows.length} lignes inserees`);
}

async function seedOrders() {
  const rows = readCsv("commandes.csv");
  for (const r of rows) {
    await pool.query(
      `INSERT INTO orders
       (id, customer_id, date, canal, statut, total_articles_mad, frais_livraison_mad, total_mad, ville_livraison, paiement)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [r.commande_id, r.client_id, r.date, r.canal, r.statut,
       Number(r.total_articles_mad), Number(r.frais_livraison_mad),
       Number(r.total_mad), r.ville_livraison, r.paiement]
    );
  }
  console.log(`orders: ${rows.length} lignes inserees`);
}

async function seedOrderLines() {
  const rows = readCsv("commandes-lignes.csv");
  for (const r of rows) {
    await pool.query(
      `INSERT INTO order_lines
       (order_id, ref, modele, taille, quantite, prix_unitaire_mad)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [r.commande_id, r.ref, r.modele, r.taille,
       Number(r.quantite), Number(r.prix_unitaire_mad)]
    );
  }
  console.log(`order_lines: ${rows.length} lignes inserees`);
}

async function main() {
  if (await alreadySeeded()) {
    console.log("Seed deja fait (products non vide) -- rien a faire.");
    await pool.end();
    return;
  }
  await seedProducts();
  await seedCustomers();
  await seedDeliveryGrid();
  await seedPromotions();
  await seedOrders();
  await seedOrderLines();
  await pool.end();
  console.log("Seed termine avec succes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});