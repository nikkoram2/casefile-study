import { sfx } from '../engine/audio';

type Kid = Node | string | null | false | undefined;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> | null, ...kids: Kid[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (v === true) e.setAttribute(k, ''); else e.setAttribute(k, String(v));
  }
  for (const kid of kids.flat() as Kid[]) if (kid !== null && kid !== false && kid !== undefined) e.append(kid instanceof Node ? kid : document.createTextNode(kid));
  return e;
}
export const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
export const btn = (label: string, onclick: () => void, cls = '', extra: Record<string, any> = {}) => h('button', { class: 'btn ' + cls, type: 'button', onclick: () => { sfx.click(); onclick(); }, ...extra }, label);

export interface ModalHandle { close(): void; el: HTMLElement; }
const stack: { el: HTMLElement; onEsc?: () => void }[] = [];
export function modalDepth() { return stack.length; }
export function openModal(content: Node, opts: { wide?: boolean; onClose?: () => void; closable?: boolean; label?: string } = {}): ModalHandle {
  const ui = $('#ui');
  const card = h('div', { class: 'card' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.label ?? 'Dialog' }, content);
  const back = h('div', { class: 'backdrop' }, card);
  ui.append(back);
  const handle: ModalHandle = { el: card, close() { const i = stack.findIndex(s => s.el === back); if (i >= 0) stack.splice(i, 1); back.remove(); opts.onClose?.(); } };
  stack.push({ el: back, onEsc: opts.closable === false ? undefined : () => handle.close() });
  setTimeout(() => (card.querySelector('[autofocus], button, [tabindex]') as HTMLElement | null)?.focus({ preventScroll: true }), 30);
  return handle;
}
export function handleEscape(): boolean { const top = stack[stack.length - 1]; if (top?.onEsc) { top.onEsc(); return true; } return !!top; }
export function toast(msg: string) { const t = h('div', { class: 'toast', role: 'status' }, msg); $('#ui').append(t); setTimeout(() => t.remove(), 2400); }

export interface DLine { who: string; text: string; }
export function runDialogue(lines: DLine[], seen: boolean): Promise<void> {
  return new Promise(resolve => {
    if (!lines.length) return resolve();
    let i = 0; const ui = $('#ui');
    const who = h('div', { class: 'who' }), text = h('div', { class: 'say' }), count = h('div', { class: 'dcount' });
    const next = btn('Next ▸', () => advance(), 'primary small', { autofocus: true });
    const skip = btn(seen ? 'Skip (already seen)' : 'Skip', () => finish(), 'ghost small');
    const box = h('div', { class: 'dialogue', role: 'dialog', 'aria-live': 'polite' }, who, text, h('div', { class: 'drow' }, count, skip, next));
    ui.append(box);
    const show = () => { who.textContent = lines[i].who; text.textContent = lines[i].text; count.textContent = `${i + 1}/${lines.length}`; sfx.paper(); };
    const advance = () => { i++; if (i >= lines.length) finish(); else show(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); advance(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); } };
    function finish() { window.removeEventListener('keydown', onKey, true); box.remove(); resolve(); }
    window.addEventListener('keydown', onKey, true); show();
  });
}
export const confirmModal = (msg: string, yes = 'Yes', no = 'Cancel'): Promise<boolean> => new Promise(res => {
  const m = openModal(h('div', null, h('p', { class: 'lead' }, msg), h('div', { class: 'row end' }, btn(no, () => { m.close(); res(false); }, 'ghost'), btn(yes, () => { m.close(); res(true); }, 'primary', { autofocus: true }))), { closable: false, label: 'Confirm' });
});
