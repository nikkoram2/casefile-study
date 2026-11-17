import { Game } from './game/game';
import { showMenu } from './game/screens';
import { $ } from './game/ui';
import { SCENARIOS } from './content/scenarios';

function start() {
const game = new Game($('#game') as HTMLCanvasElement);
$('#btn-notebook').addEventListener('click', () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })));
$('#btn-pause').addEventListener('click', () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
$('#mute').addEventListener('click', () => { game.profile.settings.muted = !game.profile.settings.muted; game.applySettings(); });
$('#btn-full').addEventListener('click', () => game.toggleFullscreen());
showMenu(game);
(window as any).__casefile = game; (window as any).__scenarios = SCENARIOS;   // debugging/test hook
}
if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
