#!/usr/bin/env node
// Déchiffre une sauvegarde GPF (.gpfbak) reçue par e-mail.
// Usage : node scripts/gpf-decrypt-backup.mjs gpf-sauvegarde-AAAA-MM-JJ.gpfbak > sauvegarde.json
// La clé est demandée via la variable GPF_BACKUP_KEY :
//   GPF_BACKUP_KEY=xxxxxxxx node scripts/gpf-decrypt-backup.mjs fichier.gpfbak > sauvegarde.json
import crypto from "node:crypto";
import fs from "node:fs";
import zlib from "node:zlib";

const [file] = process.argv.slice(2);
const keyHex = (process.env.GPF_BACKUP_KEY ?? "").trim();
if (!file || !/^[0-9a-f]{64}$/i.test(keyHex)) {
  console.error("Usage : GPF_BACKUP_KEY=<clé de 64 caractères> node scripts/gpf-decrypt-backup.mjs fichier.gpfbak > sauvegarde.json");
  process.exit(1);
}

const buf = fs.readFileSync(file);
if (buf.subarray(0, 5).toString() !== "GPFB1") {
  console.error("Ce fichier n'est pas une sauvegarde GPF.");
  process.exit(1);
}
const iv = buf.subarray(5, 17);
const tag = buf.subarray(17, 33);
const data = buf.subarray(33);
const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
decipher.setAuthTag(tag);
const gz = Buffer.concat([decipher.update(data), decipher.final()]);
process.stdout.write(zlib.gunzipSync(gz).toString("utf8"));
