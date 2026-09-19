import { runRelanceCheck } from "./relance.js";

runRelanceCheck()
  .then((sent) => {
    console.log(`Relance manuelle terminee : ${sent} message(s) envoye(s).`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });