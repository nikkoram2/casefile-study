// Parses the study guide text into structured JSON. Source wording is preserved verbatim.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = readFileSync(join(root, 'src/content/source/study-guide.txt'), 'utf8');
const lines = text.split(/\r?\n/);

type Sec = 'none' | 'core' | 'dc' | 'cases' | 'table';
let chapter = 0, chapterTitle = '', sec: Sec = 'none';
const chapters: { n: number; title: string }[] = [];
const topics: any[] = [], dcs: any[] = [], cases: any[] = [], table: any[] = [];
let cur: any = null;

for (const raw of lines) {
  const l = raw.replace(/\s+$/, '');
  if (!l.trim()) continue;
  let m = l.match(/^Chapter (\d+): (.+)$/);
  if (m) { chapter = +m[1]; chapterTitle = m[2]; chapters.push({ n: chapter, title: chapterTitle }); sec = 'none'; continue; }
  if (/^Core Legal Topics/.test(l)) { sec = 'core'; continue; }
  if (/^Definition Cards/.test(l)) { sec = 'dc'; continue; }
  if (/^Cases \(Facts/.test(l)) { sec = 'cases'; continue; }
  if (/^Quick Test-Day/.test(l)) { sec = 'table'; continue; }
  if (sec === 'core') {
    m = l.match(/^-\s+(.+?): (.+)$/);
    if (m) topics.push({ chapter, label: m[1], text: m[2], idx: topics.filter(t => t.chapter === chapter).length + 1 });
  } else if (sec === 'dc') {
    m = l.match(/^(\d+)\.\s+(.+?): (.+)$/);
    if (m) dcs.push({ chapter, n: +m[1], term: m[2], definition: m[3] });
  } else if (sec === 'cases') {
    m = l.match(/^-\s+(.+?), (.+?) \[(.+?)\]$/);
    if (m) { cur = { chapter, name: m[1], cite: m[2], list: m[3] }; cases.push(cur); continue; }
    m = l.match(/^\s+-\s+(Story|Issue|Rule): (.+)$/);
    if (m && cur) cur[m[1].toLowerCase()] = m[2];
  } else if (sec === 'table') {
    m = l.match(/^\s+(.+?)\s{2,}(\d+)\s{2,}(.+)$/);
    if (m && !/^Case\b/.test(m[1]) && !/^-+$/.test(m[1])) table.push({ name: m[1].trim(), chapter: +m[2], takeaway: m[3].trim() });
  }
}
const out = { chapters, topics, dcs, cases, table };
writeFileSync(join(root, 'src/content/generated/guide.json'), JSON.stringify(out, null, 2));
console.log(`chapters=${chapters.length} topics=${topics.length} definitionCards=${dcs.length} cases=${cases.length} tableRows=${table.length}`);
if (cases.length !== 18 || dcs.length !== 20) { console.error('EXPECTED 18 cases and 20 definition cards'); process.exit(1); }
