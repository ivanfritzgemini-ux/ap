const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const src = path.join(__dirname, '..', 'public', 'polivalente logo c.png');
const outDir = path.join(__dirname, '..', 'public');

(async () => {
  try {
    // generate PNG icons
    await sharp(src).resize(192, 192, { fit: 'contain' }).toFile(path.join(outDir, 'icon-192.png'));
    await sharp(src).resize(512, 512, { fit: 'contain' }).toFile(path.join(outDir, 'icon-512.png'));

    // generate a 64x64 PNG to feed into png-to-ico
    const tmpPng = path.join(outDir, 'tmp-64.png');
    await sharp(src).resize(64, 64, { fit: 'contain' }).toFile(tmpPng);

    // create favicon.ico
    const icoBuffer = await pngToIco(tmpPng);
    fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoBuffer);
    fs.unlinkSync(tmpPng);

    console.log('Generated: /favicon.ico, /icon-192.png, /icon-512.png');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
})();
