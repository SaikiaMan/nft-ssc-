const { readFileSync, writeFileSync, readdirSync, rmSync, existsSync, mkdirSync } = require('fs');
const sharp = require('sharp');

const template = `
  <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- layerA -->
    <!-- layerB -->
    <!-- layerC -->
    <!-- layerD -->
  </svg>
`;

const takenNames = {};
const takenCombos = {};
let idx = 999;

function randInt(max) { return Math.floor(Math.random() * (max + 1)); }
function randElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getRandomName() {
  const adjectives = 'fired trashy tubular nasty jacked swol buff ferocious firey flamin agnostic artificial bloody crazy cringey crusty dirty eccentric glutinous harry juicy simple stylish awesome creepy corny freaky shady sketchy lame sloppy hot intrepid juxtaposed killer ludicrous mangy pastey ragin rusty rockin sinful shameful stupid sterile ugly vascular wild young old zealous flamboyant super sly shifty trippy fried injured depressed anxious clinical'.split(' ');
  const names = 'aaron bart chad dale earl fred grady harry ivan jeff joe kyle lester steve tanner lucifer todd mitch hunter mike arnold norbert olaf plop quinten randy saul balzac tevin jack ulysses vince will xavier yusuf zack roger raheem rex dustin seth bronson dennis'.split(' ');
  const name = `${randElement(adjectives)}-${randElement(names)}`;
  if (takenNames[name] || !name) return getRandomName();
  takenNames[name] = name;
  return name;
}

function getLayer(name, skip = 0.0) {
  if (Math.random() < skip) return '';
  const svg = readFileSync(`./layers/${name}.svg`, 'utf-8');
  const re = /(?<=\<svg\s*[^>]*>)([\s\S]*?)(?=\<\/svg\>)/g;
  const match = svg.match(re);
  return match ? match[0] : '';
}

async function svgToPng(name) {
  const src = `./out/${name}.svg`;
  const dest = `./out/${name}.png`;
  const img = await sharp(src);
  const resized = await img.resize(1024);
  await resized.toFile(dest);
}

const DIMENSIONS = [
  { key: 'LayerA', prefix: 'A', maxIndex: 5 },
  { key: 'LayerB', prefix: 'B', maxIndex: 7 },
  { key: 'LayerC', prefix: 'C', maxIndex: 4 },
  { key: 'LayerD', prefix: 'D', maxIndex: 6 },
];

function pickCombo() {
  return DIMENSIONS.map(dim => {
    const i = randInt(dim.maxIndex);
    return { key: dim.key, file: `${dim.prefix}${i}`, idx: i };
  });
}

function comboKey(picks) {
  return picks.map(p => `${p.key}:${p.idx}`).join('|');
}

async function createImage(n) {
  const picks = pickCombo();
  const key = comboKey(picks);
  if (takenCombos[key]) return createImage(n);
  takenCombos[key] = true;
  const name = getRandomName();
  let final = template;
  const placeholders = ['<!-- layerA -->', '<!-- layerB -->', '<!-- layerC -->', '<!-- layerD -->'];
  picks.forEach((p, i) => {
    const ph = placeholders[i] || `<!-- ${p.key} -->`;
    final = final.replace(ph, getLayer(p.file));
  });
  const attributes = picks.map(p => ({ trait_type: p.key, value: p.file }));
  const meta = { name, description: `Generated ${name.split('-').join(' ')}`, image: `${n}.png`, attributes };
  writeFileSync(`./out/${n}.json`, JSON.stringify(meta));
  writeFileSync(`./out/${n}.svg`, final);
  await svgToPng(n);
}

if (!existsSync('./out')) mkdirSync('./out');
readdirSync('./out').forEach(f => rmSync(`./out/${f}`));

(async () => {
  do {
    await createImage(idx);
    idx--;
  } while (idx >= 0);
})();
