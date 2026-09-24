// Original animal companions in a textured paper-cut style. viewBox 0 0 120 120.
const defs = `<defs>
<pattern id="ht" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#fff" opacity=".45"/></pattern>
<pattern id="htd" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#3a2a1a" opacity=".16"/></pattern>
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.6"/></filter>
</defs>`;
const eye = (x, y, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2A2A2A"/><circle cx="${x + 1.3}" cy="${y - 1.4}" r="${r * .32}" fill="#fff"/>`;
const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="3.4" fill="#EB9A97" opacity=".75"/>`;
const smile = (x, y, w = 5) => `<path d="M${x - w} ${y} q${w} ${w * .9} ${w * 2} 0" stroke="#2A2A2A" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
const shadow = `<ellipse cx="60" cy="112" rx="34" ry="5" fill="#2A2A2A" opacity=".08"/>`;

const A = {
  erizo: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M18 86 C10 60 22 30 52 24 C60 14 72 16 78 24 C98 26 112 48 106 70 C104 86 92 96 72 98 L36 98 C26 97 20 93 18 86Z" fill="#C98B4E"/>
    <path d="M18 86 C10 60 22 30 52 24 C60 14 72 16 78 24 C98 26 112 48 106 70 C104 86 92 96 72 98 L36 98 C26 97 20 93 18 86Z" fill="url(#htd)"/>
    ${[[30,40],[44,30],[60,24],[76,30],[92,42],[100,58],[24,58]].map(([x,y])=>`<path d="M${x} ${y} l-6 -9 l10 3z" fill="#A86E38"/>`).join('')}
    <path d="M22 80 C22 62 36 52 54 54 C70 56 80 70 78 84 C76 96 62 100 44 99 C30 98 22 92 22 80Z" fill="#F3E3C8"/>
    <path d="M22 80 C22 62 36 52 54 54 C70 56 80 70 78 84 C76 96 62 100 44 99 C30 98 22 92 22 80Z" fill="url(#ht)"/>
  </g>
  <circle cx="18" cy="80" r="5" fill="#2A2A2A"/>
  ${eye(40, 72)} ${cheek(50, 84)} ${cheek(28, 84)} ${smile(36, 86, 4)}
  <path d="M52 99 q4 8 10 0" fill="#F3E3C8"/>`,

  ardilla: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M78 100 C104 100 116 76 108 52 C102 34 110 18 96 12 C80 6 70 22 76 38 C82 54 70 60 72 76Z" fill="#E08B55"/>
    <path d="M78 100 C104 100 116 76 108 52 C102 34 110 18 96 12 C80 6 70 22 76 38 C82 54 70 60 72 76Z" fill="url(#ht)"/>
    <path d="M30 100 C22 84 26 62 42 56 C58 50 74 60 76 78 C78 94 66 102 50 102Z" fill="#E9A06C"/>
    <ellipse cx="50" cy="84" rx="14" ry="15" fill="#F6E2CB"/>
    <path d="M26 58 C20 38 36 22 52 28 C68 32 70 52 60 62 C50 70 32 70 26 58Z" fill="#E9A06C"/>
    <path d="M26 58 C20 38 36 22 52 28 C68 32 70 52 60 62 C50 70 32 70 26 58Z" fill="url(#htd)"/>
    <path d="M30 32 l-4 -14 l12 8z" fill="#E08B55"/><path d="M52 28 l4 -14 l6 14z" fill="#E08B55"/>
  </g>
  ${eye(36, 46)} ${eye(54, 46)} ${cheek(30, 56)} ${cheek(60, 56)}
  <ellipse cx="45" cy="53" rx="3" ry="2.2" fill="#2A2A2A"/>${smile(45, 57, 3)}
  <ellipse cx="44" cy="92" rx="7" ry="6" fill="#B7743F"/>`,

  colibri: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M60 70 C40 60 22 38 30 20 C44 30 56 44 64 60Z" fill="#C8DCE2"/>
    <path d="M60 70 C40 60 22 38 30 20 C44 30 56 44 64 60Z" fill="url(#ht)"/>
    <path d="M36 70 C36 52 52 42 68 46 C84 50 90 66 82 80 C74 94 50 98 40 88 C36 84 36 76 36 70Z" fill="#8FB28A"/>
    <path d="M36 70 C36 52 52 42 68 46 C84 50 90 66 82 80 C74 94 50 98 40 88 C36 84 36 76 36 70Z" fill="url(#htd)"/>
    <path d="M44 84 C48 72 64 70 72 80 C66 92 50 94 44 84Z" fill="#EBB7B5"/>
    <path d="M40 90 L24 106 L34 104 L30 112 L46 96Z" fill="#6E9470"/>
    <path d="M62 62 C74 44 96 36 104 30 C98 44 86 58 74 66Z" fill="#D8CEF0"/>
  </g>
  <path d="M84 62 L114 54" stroke="#2A2A2A" stroke-width="2.6" stroke-linecap="round"/>
  ${eye(74, 60, 3.8)} ${cheek(72, 70)}`,

  loro: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M40 104 C30 84 30 56 44 40 C58 24 82 28 88 48 C94 68 88 92 74 104Z" fill="#8DB36F"/>
    <path d="M40 104 C30 84 30 56 44 40 C58 24 82 28 88 48 C94 68 88 92 74 104Z" fill="url(#ht)"/>
    <path d="M36 70 C28 80 30 96 42 104 C48 92 48 80 36 70Z" fill="#E6A93C"/>
    <path d="M52 36 C58 20 76 18 80 28 C70 26 62 30 52 36Z" fill="#EBB7B5"/>
    <ellipse cx="72" cy="56" rx="12" ry="10" fill="#F6F1E7"/>
    <path d="M52 104 l-4 12 l8 -6 l4 8 l2 -14z" fill="#6E9470"/>
  </g>
  <path d="M82 56 C94 54 98 64 92 72 C90 66 86 64 82 66Z" fill="#E6A93C" stroke="#2A2A2A" stroke-width="1.6"/>
  ${eye(72, 55, 3.8)} ${cheek(62, 66)}`,

  zorro: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M86 102 C110 96 114 70 100 60 C98 76 90 84 78 88Z" fill="#E08B55"/>
    <path d="M100 60 C110 66 110 80 104 88 C104 78 102 70 100 60Z" fill="#F6F1E7"/>
    <path d="M34 104 C28 88 32 70 46 64 L74 64 C88 70 90 90 82 104Z" fill="#E6964F"/>
    <path d="M48 104 C46 92 52 82 60 82 C68 82 72 92 70 104Z" fill="#F6F1E7"/>
    <path d="M26 30 L40 50 L30 56Z" fill="#E6964F"/><path d="M94 30 L80 50 L90 56Z" fill="#E6964F"/>
    <path d="M24 40 C24 30 30 26 30 26 L44 44 C60 38 76 44 76 44 L90 26 C90 26 96 30 96 40 C98 58 84 76 60 80 C36 76 22 58 24 40Z" fill="#E6964F"/>
    <path d="M24 40 C24 30 30 26 30 26 L44 44 C60 38 76 44 76 44 L90 26 C90 26 96 30 96 40 C98 58 84 76 60 80 C36 76 22 58 24 40Z" fill="url(#ht)"/>
    <path d="M34 58 C44 60 52 66 60 80 C68 66 76 60 86 58 C84 72 74 80 60 82 C46 80 36 72 34 58Z" fill="#F6F1E7"/>
  </g>
  ${eye(46, 54)} ${eye(74, 54)} ${cheek(40, 64)} ${cheek(80, 64)}
  <ellipse cx="60" cy="72" rx="4" ry="3" fill="#2A2A2A"/>`,

  buho: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M28 96 C20 70 22 40 40 28 L44 16 L54 26 C58 25 62 25 66 26 L76 16 L80 28 C98 40 100 70 92 96 C84 108 36 108 28 96Z" fill="#B7A7D9"/>
    <path d="M28 96 C20 70 22 40 40 28 L44 16 L54 26 C58 25 62 25 66 26 L76 16 L80 28 C98 40 100 70 92 96 C84 108 36 108 28 96Z" fill="url(#ht)"/>
    <ellipse cx="60" cy="80" rx="22" ry="20" fill="#E9E1F7"/>
    <ellipse cx="60" cy="80" rx="22" ry="20" fill="url(#htd)"/>
    <circle cx="46" cy="50" r="14" fill="#F6F1E7"/><circle cx="74" cy="50" r="14" fill="#F6F1E7"/>
    <path d="M24 70 C16 80 20 94 30 98 C30 88 30 78 24 70Z" fill="#9C8BC4"/><path d="M96 70 C104 80 100 94 90 98 C90 88 90 78 96 70Z" fill="#9C8BC4"/>
  </g>
  ${eye(46, 50, 5.5)} ${eye(74, 50, 5.5)}
  <path d="M56 60 L64 60 L60 68Z" fill="#E6A93C"/>
  <path d="M50 104 v6 M56 104 v6 M64 104 v6 M70 104 v6" stroke="#E6A93C" stroke-width="3" stroke-linecap="round"/>`,

  gato: () => `${shadow}
  <g filter="url(#rough)">
    <path d="M84 100 C104 100 110 82 100 72 C108 70 112 78 110 86 C108 100 96 108 84 106Z" fill="#9FB6BE"/>
    <path d="M30 104 C24 86 30 66 46 62 L74 62 C90 66 96 86 90 104Z" fill="#AFC6CE"/>
    <path d="M30 104 C24 86 30 66 46 62 L74 62 C90 66 96 86 90 104Z" fill="url(#ht)"/>
    <path d="M28 26 L46 40 L30 50Z" fill="#AFC6CE"/><path d="M92 26 L74 40 L90 50Z" fill="#AFC6CE"/>
    <path d="M32 30 L42 40 L34 44Z" fill="#EBB7B5"/><path d="M88 30 L78 40 L86 44Z" fill="#EBB7B5"/>
    <ellipse cx="60" cy="54" rx="34" ry="26" fill="#AFC6CE"/>
    <ellipse cx="60" cy="54" rx="34" ry="26" fill="url(#htd)"/>
    <path d="M44 104 C44 92 50 86 60 86 C70 86 76 92 76 104Z" fill="#E4EEF1"/>
  </g>
  ${eye(47, 52)} ${eye(73, 52)} ${cheek(40, 62)} ${cheek(80, 62)}
  <path d="M57 60 L63 60 L60 63Z" fill="#E08B8B"/>${smile(60, 65, 3)}
  <path d="M28 58 h12 M28 64 l12 -2 M92 58 h-12 M92 64 l-12 -2" stroke="#2A2A2A" stroke-width="1.2" opacity=".5"/>`,
};

export const MODULE_ANIMAL = { verbos: 'erizo', palabras: 'ardilla', rapidas: 'colibri', charla: 'loro', explora: 'zorro', lector: 'buho', escucha: 'gato' };

export function animal(name, cls = 'idle') {
  const f = A[name] || A.erizo;
  return `<div class="animal ${cls}" data-animal="${name}"><svg viewBox="0 0 120 120" aria-hidden="true">${defs}${f()}</svg></div>`;
}

export function react(el, kind) {
  const a = el && el.querySelector ? el.querySelector('.animal') : null;
  if (!a) return;
  a.classList.remove('cheer', 'shrug', 'idle');
  void a.offsetWidth;
  a.classList.add(kind);
}
