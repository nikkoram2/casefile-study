// M3 benchmark: animated vehicle-search investigation. observe → investigate → gather facts → decide → watch the officer act → consequences.
import type { Scenario } from '../content/types';
import type { VehicleSeq, Hotspot } from '../content/sequences';
import { Assets } from '../engine/assets';
import { Stage } from '../engine/stage';
import { Actor } from '../engine/anim';
import { Director } from '../engine/director';
import { sfx } from '../engine/audio';
import { gradeScenario } from '../learning/grade';
import { Outcome, feedbackBlock, hintBlock } from './panels';
import { h, btn } from './ui';

export interface SeqOpts { index?: number; total?: number; mode?: string; reduced: boolean; onCase?: (id: string) => void }
const CAR = { x: 300, y: 262 }, PATROL = { x: 440, y: 262 }, DOOR = { x: 293, y: 285 };

function typeInto(el: HTMLElement, text: string, dir: Director): Promise<void> {
  return new Promise(res => {
    el.textContent = ''; if (dir.instant) { el.textContent = text; return res(); }
    let i = 0; const id = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(id); el.onclick = null; res(); } }, 18);
    el.onclick = () => { clearInterval(id); el.textContent = text; el.onclick = null; res(); };
    dir.onSkip(() => { clearInterval(id); el.textContent = text; res(); });
  });
}
function spriteCanvas(a: Assets, name: string, scale = 5) {
  const f = a.info(name), cv = document.createElement('canvas'); cv.width = f.w * scale; cv.height = f.h * scale; cv.className = 'ev-sprite'; const c = cv.getContext('2d')!; c.imageSmoothingEnabled = false;
  c.drawImage(a.atlas, f.x, f.y, f.w, f.h, 0, 0, f.w * scale, f.h * scale); return cv;
}

export async function runVehicleSequence(s: Scenario, seq: VehicleSeq, o: SeqOpts): Promise<Outcome> {
  const assets = await Assets.get(); (window as any).__current = s;
  return new Promise<Outcome>(resolve => {
    const dir = new Director(); dir.reduced = o.reduced;
    const canvas = h('canvas', { class: 'seq-canvas', role: 'img', 'aria-label': 'Night street. A patrol car and a parked blue sedan, rain, and detectives approaching.' }) as HTMLCanvasElement;
    const caption = h('p', { class: 'cap-text', 'aria-live': 'polite' }); const who = h('div', { class: 'cap-who' });
    const capBox = h('div', { class: 'caption' }, who, caption);
    const hotLayer = h('div', { class: 'hotlayer' });
    const skip = btn('Skip ▸▸', () => { dir.skip(); }, 'skip small', { hidden: true, 'aria-label': 'Skip animation (S)' });
    const stamp = h('div', { class: 'stamp', hidden: true });
    const evCard = h('div', { class: 'evcard', hidden: true, role: 'status' });
    const eyebrow = h('div', { class: 'eyebrow' }, `${o.total ? `Decision ${(o.index ?? 0) + 1} of ${o.total} · ` : ''}Field investigation · ${s.title}`);
    const stageWrap = h('div', { class: 'seq-stage' }, canvas, hotLayer, capBox, skip, stamp, evCard, h('div', { class: 'bar top' }), h('div', { class: 'bar bot' }));
    const notes = h('ul', { class: 'facts seqnotes' });
    const panel = h('div', { class: 'seq-panel' });
    const root = h('div', { class: 'seq', role: 'dialog', 'aria-label': s.title }, stageWrap, panel);
    document.getElementById('app')!.append(root);

    const stage = new Stage(canvas, assets); stage.reduced = o.reduced; stage.loadScene('alder'); stage.rain = true;
    // ───── cast & props
    const ward = new Actor('ward', 'ward', 70, 196), me = new Actor('player', 'player', 40, 202), brooks = new Actor('brooks', 'brooks', 262, 284); ward.dir = me.dir = 'right'; brooks.dir = 'right';
    stage.actors.push(ward, me, brooks);
    stage.props.push({ id: 'sedan', sprite: 'veh/sedan_0', x: CAR.x, y: CAR.y }, { id: 'patrol', sprite: seq.arrestee === 'patrol' ? 'veh/patrol_occ' : 'veh/patrol', x: PATROL.x, y: PATROL.y }, { id: 'lamp', sprite: 'prop/lamp', x: 330, y: 214 }, { id: 'item', sprite: seq.finding?.sprite ?? 'ev/baggie', x: DOOR.x, y: 252, visible: false });
    if (seq.arrestee === 'standing') { const v = new Actor('vance', 'vance', 322, 280); v.dir = 'left'; stage.actors.push(v); }
    stage.policeLights = true; stage.policeAt = { x: PATROL.x, y: PATROL.y - 31 };
    stage.focus(320, 210, 1, true); stage.fade = 1; stage.start(); const fadeIn = () => { const t0 = performance.now(); const step = () => { stage.fade = Math.max(0, 1 - (performance.now() - t0) / 700); if (stage.fade > 0 && !dir.reduced) requestAnimationFrame(step); else stage.fade = 0; }; step(); }; fadeIn();
    const say = async (who_: string, text: string) => { who.textContent = who_; capBox.classList.add('on'); await typeInto(caption, text, dir); await dir.wait(dir.instant ? 0 : 450); };
    const cleanup = () => { stage.stop(); window.removeEventListener('keydown', keys, true); root.remove(); };
    const setSkip = (on: boolean) => { skip.hidden = !on; if (!on) dir.reset(); };

    // ───── key handling
    let phase: 'intro' | 'observe' | 'decide' | 'anim' | 'done' = 'intro'; let pickOpt: (n: number) => void = () => {}; let hintClick: () => void = () => {}; let submitClick: () => void = () => {};
    const keys = (e: KeyboardEvent) => {
      if (phase === 'intro' || phase === 'anim') { if (e.key.toLowerCase() === 's' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); dir.skip(); } return; }
      if (phase === 'decide') { const n = parseInt(e.key, 10); if (n >= 1 && n <= s.options.length) { e.stopPropagation(); pickOpt(n); } else if (e.key.toLowerCase() === 'h') { e.stopPropagation(); hintClick(); } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.stopPropagation(); submitClick(); } }
    };
    window.addEventListener('keydown', keys, true);

    // ───── choreography
    const approach = async () => {
      setSkip(true);
      stage.focus(180, 220, 1.15); await ward.walkTo(188, 238, 58, dir.instant); ward.face('right');
      await me.walkTo(226, 270, 58, dir.instant); me.face('right');
      stage.focus(310, 230, 1.35);
      await say('Narration', s.setup);
      brooks.face('right'); ward.play('talk', 'right'); await dir.wait(500); ward.play('idle', 'right');
      setSkip(false);
    };
    const observe = () => new Promise<void>(res => {
      phase = 'observe'; who.textContent = 'Detective'; caption.textContent = 'Examine the scene. Click each marked spot (or Tab to a marker and press Enter). Gather every fact before you decide.';
      panel.replaceChildren(h('div', { class: 'eyebrow' }, 'Case notes'), notes, h('p', { class: 'muted tiny' }, 'Facts you collect appear here. You need all of them to decide.'));
      const found = new Set<string>(); let decideBtn: HTMLButtonElement | null = null;
      for (const hs of seq.hotspots) {
        const pos = stage.project(hs.x, hs.y);
        const b = h('button', { type: 'button', class: 'hot', style: `left:${pos.x}%;top:${pos.y}%`, 'aria-label': `Examine: ${hs.label}`, title: hs.label }, h('span', { class: 'ring' }), h('span', { class: 'hl' }, hs.label)) as HTMLButtonElement;
        b.onclick = async () => {
          if (found.has(hs.id) || phase !== 'observe') return; found.add(hs.id); b.classList.add('done'); sfx.discover(); b.disabled = true;
          const sp = stage.project(hs.x, hs.y); stage.focus(hs.x, hs.y - 10, 1.5);
          if (hs.id === 'officer') { brooks.face('right'); brooks.play('talk', 'right'); } if (hs.id === 'vehicle') me.face('up');
          const fact = s.facts[hs.fact]; void sp; who.textContent = hs.who; capBox.classList.add('on'); await typeInto(caption, fact, dir); brooks.play('idle', 'right');
          notes.append(h('li', { class: 'found' }, h('b', null, hs.label + ': '), fact));
          if (hs.id === 'vehicle') { stage.flash = { x: me.x + 6, y: me.y - 14, ang: -0.35, on: true }; setTimeout(() => { if (stage.flash) stage.flash.on = false; }, dir.instant ? 0 : 1200); }
          stage.focus(320, 230, 1.3);
          if (found.size === seq.hotspots.length && !decideBtn) { decideBtn = btn('I have the facts: decide ▸', () => res(), 'primary', { autofocus: true }) as HTMLButtonElement; panel.append(decideBtn); who.textContent = 'Detective'; caption.textContent = 'That is everything the scene shows. Time to decide.'; setTimeout(() => decideBtn?.focus(), 30); }
        };
        (b as any).__hs = hs; hotLayer.append(b);
      }
      stage.onFrame = () => { for (const el of hotLayer.children) { const hs = (el as any).__hs as Hotspot | undefined; if (!hs) continue; const p = stage.project(hs.x, hs.y); (el as HTMLElement).style.left = p.x + '%'; (el as HTMLElement).style.top = p.y + '%'; } };
      (hotLayer.querySelector('button') as HTMLElement)?.focus();
    });
    const decide = () => new Promise<string>(res => {
      phase = 'decide'; hotLayer.replaceChildren(); capBox.classList.remove('on'); stage.focus(320, 225, 1.2);
      const state = { used: 0 }; const hint = hintBlock(s.hints, state); let sel = ''; const bts = new Map<string, HTMLButtonElement>();
      const submit = btn('Submit decision', () => { if (sel) { res(sel); } }, 'primary', { disabled: true }) as HTMLButtonElement;
      const pick = (id: string) => { sel = id; sfx.click(); for (const [k, b] of bts) { b.classList.toggle('sel', k === id); b.setAttribute('aria-pressed', String(k === id)); } submit.disabled = false; };
      const opts = h('div', { class: 'opts choice' }, ...s.options.map((op, i) => { const b = h('button', { type: 'button', class: 'opt', 'aria-pressed': 'false', onclick: () => pick(op.id) }, h('span', { class: 'key' }, String(i + 1)), h('span', { class: 'otext' }, op.text)) as HTMLButtonElement; bts.set(op.id, b); return b; }));
      pickOpt = n => pick(s.options[n - 1].id); hintClick = () => (hint.btn as HTMLButtonElement).click(); submitClick = () => submit.click();
      panel.replaceChildren(eyebrow.cloneNode(true), h('div', { class: 'seqcols' }, h('div', null, h('div', { class: 'tiny muted' }, 'Case notes'), notes), h('div', null, h('p', { class: 'prompt' }, s.prompt), opts, hint.wrap, h('div', { class: 'row end' }, submit))));
      resolveDecide = () => state.used;
    });
    let resolveDecide = () => 0;

    const act = async (pick: string) => {
      phase = 'anim'; panel.replaceChildren(h('p', { class: 'muted' }, 'Watch what Brooks does with your decision. (S or Space skips.)')); setSkip(true); dir.onSkip(() => { stage.actors.forEach(a => a.snap()); });
      const doSearch = seq.acts[pick] === 'search'; const sedan = stage.prop('sedan'); const item = stage.prop('item');
      who.textContent = 'Officer Brooks'; capBox.classList.add('on'); await typeInto(caption, doSearch ? '"Understood. Searching the vehicle."' : '"Understood. I will leave the vehicle alone."', dir);
      let note = '';
      if (doSearch) {
        stage.focus(DOOR.x, DOOR.y - 24, 2.0);
        await brooks.walkTo(DOOR.x, DOOR.y, 60, dir.instant); brooks.face('up');
        for (let i = 1; i <= 3; i++) { sedan.sprite = `veh/sedan_${i}`; sfx.click(); await dir.wait(130); }
        stage.flash = { x: brooks.x + 2, y: brooks.y - 16, ang: -1.45, on: true };
        brooks.play('search', 'up'); await dir.wait(seq.searchSpot === 'glove' ? 1500 : 1900);
        stage.spark(DOOR.x + 2, DOOR.y - 34); sfx.discover(); item.visible = true; item.lift = 6; stage.focus(DOOR.x, DOOR.y - 26, 2.3);
        who.textContent = 'Officer Brooks'; await typeInto(caption, `"Found something: ${seq.finding!.name.toLowerCase()}, ${seq.finding!.where}."`, dir);
        brooks.play('pickup', 'down'); await dir.wait(700); item.visible = false; brooks.play('present', 'left'); stage.flash.on = false;
        const g0 = gradeScenario(s, [pick]); const lawful = seq.acts[s.correct[0]] === 'search';
        const status = lawful ? (g0.correct ? 'ADMISSIBLE' : 'SEARCH LAWFUL · YOUR REASON WAS WRONG') : 'SUPPRESSION RISK';
        const tone = lawful ? (g0.correct ? 'ok' : 'warn') : 'bad';
        if (!lawful) stage.shake(2.4, 0.3);
        evCard.replaceChildren(h('div', { class: 'ev-h' }, 'EVIDENCE LOGGED'), spriteCanvas(assets, seq.finding!.sprite), h('div', { class: 'ev-n' }, seq.finding!.name), h('div', { class: 'ev-w tiny muted' }, 'Found: ' + seq.finding!.where), h('div', { class: 'ev-s ' + tone }, status)); evCard.hidden = false; sfx.paper();
        note = `Evidence: ${seq.finding!.name} (${seq.finding!.where}): ${status.toLowerCase()}`;
        await dir.wait(1900); evCard.hidden = true; brooks.play('idle', 'down');
        for (let i = 2; i >= 0; i--) { sedan.sprite = `veh/sedan_${i}`; await dir.wait(100); }
        await brooks.walkTo(262, 284, 60, dir.instant); brooks.face('right');
      } else {
        stage.focus(280, 250, 1.4); brooks.face('down'); brooks.play('react', 'down'); await dir.wait(1100);
        const lawful = seq.acts[s.correct[0]] === 'search';
        stamp.textContent = lawful ? 'NO SEARCH · LAWFUL SEARCH LEFT UNUSED' : 'NO SEARCH · UNLAWFUL SEARCH AVOIDED'; stamp.className = 'stamp ' + (lawful ? 'warn' : 'ok'); stamp.hidden = false; sfx.paper(); await dir.wait(1400); stamp.hidden = true; brooks.play('idle', 'right');
        note = `Brooks did not search (${s.title}): ` + (lawful ? 'a lawful search was available' : 'a search would have been unlawful');
      }
      capBox.classList.remove('on'); setSkip(false); stage.focus(320, 230, 1.15);
      return note;
    };

    (async () => {
      try {
        await approach(); await observe(); const pick = await decide(); const hintsUsed = resolveDecide();
        const g = gradeScenario(s, [pick]); (g.correct ? sfx.right : sfx.wrong)();
        const note = await act(pick); phase = 'done';
        const misc = s.options.find(x => x.id === pick)?.misconception; const extra = !g.correct && misc ? [h('p', { class: 'why' }, h('b', null, 'Why that pick fails: '), misc)] : [];
        panel.replaceChildren(h('div', { class: 'fbhost' }, feedbackBlock({ correct: g.correct, consequence: g.correct ? s.consequenceRight : s.consequenceWrong, explanation: s.explanation, extra, detail: s.detail, rule: s.rule, caseIds: s.caseIds, onCase: o.onCase, onContinue: () => { cleanup(); resolve({ correct: g.correct, hintsUsed, evidenceNote: note }); } })));
      } catch (err) { console.error(err); cleanup(); resolve({ correct: false, hintsUsed: 0 }); }
    })();
  });
}
