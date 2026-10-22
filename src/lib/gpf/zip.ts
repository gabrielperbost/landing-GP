import "server-only";

// Archive ZIP sans compression (méthode « stored ») : suffisant pour regrouper
// des PDF et images déjà compressés, sans dépendance externe.

const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function creerZip(fichiers: { nom: string; contenu: Buffer }[]): Buffer {
  const locaux: Buffer[] = [];
  const centraux: Buffer[] = [];
  let offset = 0;
  const vus = new Set<string>();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const f of fichiers) {
    // Noms uniques dans l'archive.
    let nom = f.nom;
    for (let i = 2; vus.has(nom); i++) nom = f.nom.replace(/(\.[^.]+)?$/, ` (${i})$1`);
    vus.add(nom);
    const nomBuf = Buffer.from(nom, "utf8");
    const crc = crc32(f.contenu);
    const taille = f.contenu.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // noms en UTF-8
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(taille, 18);
    local.writeUInt32LE(taille, 22);
    local.writeUInt16LE(nomBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locaux.push(local, nomBuf, f.contenu);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(taille, 20);
    central.writeUInt32LE(taille, 24);
    central.writeUInt16LE(nomBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centraux.push(central, nomBuf);
    offset += 30 + nomBuf.length + taille;
  }

  const tailleCentral = centraux.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(fichiers.length, 8);
  fin.writeUInt16LE(fichiers.length, 10);
  fin.writeUInt32LE(tailleCentral, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locaux, ...centraux, fin]);
}
