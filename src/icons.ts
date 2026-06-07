export const BRAND_MARK = `
<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
  <rect x="3" y="4" width="11" height="8" rx="1.5" fill="white" stroke="currentColor" stroke-width="2"/>
  <rect x="18" y="20" width="11" height="8" rx="1.5" fill="white" stroke="currentColor" stroke-width="2"/>
  <path d="M14 12 L19 20" stroke="currentColor" stroke-width="2" fill="none"/>
  <polygon points="19,20 17,17 20,18" fill="currentColor"/>
</svg>`;

export const ICON_OP: Record<string, string> = {
  '-':   `<svg viewBox="0 0 36 16" class="op-icon"><line x1="3" y1="8" x2="33" y2="8" stroke="currentColor" stroke-width="1.6"/></svg>`,
  '->':  `<svg viewBox="0 0 36 16" class="op-icon"><line x1="3" y1="8" x2="28" y2="8" stroke="currentColor" stroke-width="1.6"/><polygon points="28,3 34,8 28,13" fill="currentColor"/></svg>`,
  '<-':  `<svg viewBox="0 0 36 16" class="op-icon"><line x1="8" y1="8" x2="33" y2="8" stroke="currentColor" stroke-width="1.6"/><polygon points="8,3 2,8 8,13" fill="currentColor"/></svg>`,
  '<->': `<svg viewBox="0 0 36 16" class="op-icon"><line x1="8" y1="8" x2="28" y2="8" stroke="currentColor" stroke-width="1.6"/><polygon points="8,3 2,8 8,13" fill="currentColor"/><polygon points="28,3 34,8 28,13" fill="currentColor"/></svg>`,
  '..':  `<svg viewBox="0 0 36 16" class="op-icon"><line x1="3" y1="8" x2="33" y2="8" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2"/></svg>`,
  '.>':  `<svg viewBox="0 0 36 16" class="op-icon"><line x1="3" y1="8" x2="28" y2="8" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2"/><polygon points="28,3 34,8 28,13" fill="currentColor"/></svg>`,
  '=>':  `<svg viewBox="0 0 36 16" class="op-icon"><line x1="3" y1="8" x2="24" y2="8" stroke="currentColor" stroke-width="3"/><polygon points="24,1 35,8 24,15" fill="currentColor"/></svg>`,
};

export const OP_LABEL: Record<string, string> = {
  '-':   '単線',
  '->':  '矢印',
  '<-':  '逆矢印',
  '<->': '双方向',
  '..':  '破線',
  '.>':  '破線矢印',
  '=>':  '太矢印',
};

export const ICON_HELP =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 6.2c0-1.2 0.9-2.2 2.1-2.2 1.1 0 2 0.9 2 1.9 0 0.9-0.5 1.4-1.4 1.9-0.6 0.3-0.7 0.6-0.7 1.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="currentColor"/></svg>`;

export const ICON_DOWNLOAD =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M3 13h10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const ICON_LIST =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="4" r="0.9" fill="currentColor"/><circle cx="3.5" cy="8" r="0.9" fill="currentColor"/><circle cx="3.5" cy="12" r="0.9" fill="currentColor"/><line x1="6.5" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6.5" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6.5" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

export const ICON_NEW =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="8" height="10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M11 2v3h3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><line x1="7" y1="6" x2="7" y2="11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="4.5" y1="8.5" x2="9.5" y2="8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

export const ICON_TRASH =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.5 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><line x1="6.5" y1="7" x2="6.5" y2="12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="9.5" y1="7" x2="9.5" y2="12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;

export const ICON_ZOOM_IN =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="7" y1="4.8" x2="7" y2="9.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="4.8" y1="7" x2="9.2" y2="7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

export const ICON_ZOOM_OUT =
  `<svg class="btn-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.3"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="4.8" y1="7" x2="9.2" y2="7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;

export const ICON_SHAPE: Record<string, string> = {
  normal: `<svg viewBox="0 0 28 16" class="shape-icon" aria-hidden="true"><rect x="2" y="3" width="24" height="10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  cond:   `<svg viewBox="0 0 28 16" class="shape-icon" aria-hidden="true"><polygon points="14,2 25,8 14,14 3,8" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
};

export const ICON_MODE: Record<string, string> = {
  edit:    `<svg class="mode-icon" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 12L3 10 10.5 2.5l1.5 1.5L4.5 11.5z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  split:   `<svg class="mode-icon" viewBox="0 0 14 14" aria-hidden="true"><rect x="1.5" y="2.5" width="5" height="9" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="7.5" y="2.5" width="5" height="9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`,
  preview: `<svg class="mode-icon" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7C2.5 4 5 3 7 3c2 0 4.5 1 6 4-1.5 3-4 4-6 4-2 0-4.5-1-6-4z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="1.6" fill="currentColor"/></svg>`,
};

export const ICON_PATTERN: Record<string, string> = {
  cond: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="28" y="4" width="24" height="10" rx="5" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <polygon points="40,22 56,33 40,44 24,33" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="6" y="52" width="22" height="10" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="52" y="52" width="22" height="10" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="40" y1="14" x2="40" y2="20" stroke="currentColor" stroke-width="1.2"/>
      <line x1="32" y1="40" x2="17" y2="52" stroke="currentColor" stroke-width="1.2"/>
      <line x1="48" y1="40" x2="63" y2="52" stroke="currentColor" stroke-width="1.2"/>
      <rect x="28" y="68" width="24" height="10" rx="5" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="17" y1="62" x2="34" y2="68" stroke="currentColor" stroke-width="1.2"/>
      <line x1="63" y1="62" x2="46" y2="68" stroke="currentColor" stroke-width="1.2"/>
    </svg>`,
  container: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="4" y="4" width="72" height="72" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <text x="9" y="13" font-size="7" fill="currentColor">10</text>
      <rect x="14" y="20" width="52" height="14" fill="white" stroke="currentColor" stroke-width="1.2"/>
      <rect x="14" y="38" width="52" height="14" fill="white" stroke="currentColor" stroke-width="1.2"/>
      <rect x="14" y="56" width="52" height="14" fill="white" stroke="currentColor" stroke-width="1.2"/>
    </svg>`,
  external: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="4" y="14" width="44" height="56" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <text x="9" y="23" font-size="7" fill="currentColor">10</text>
      <rect x="12" y="28" width="28" height="12" fill="white" stroke="currentColor" stroke-width="1.2"/>
      <rect x="12" y="44" width="28" height="12" fill="white" stroke="currentColor" stroke-width="1.2"/>
      <rect x="52" y="36" width="24" height="14" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="48" y1="43" x2="52" y2="43" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="50,43 47,41 47,45" fill="currentColor"/>
    </svg>`,
  seq: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="10" y="6" width="20" height="10" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="50" y="6" width="20" height="10" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="20" y1="16" x2="20" y2="72" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="60" y1="16" x2="60" y2="72" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="20" y1="28" x2="56" y2="28" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="56,28 53,26 53,30" fill="currentColor"/>
      <line x1="60" y1="44" x2="24" y2="44" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="24,44 27,42 27,46" fill="currentColor"/>
      <line x1="20" y1="60" x2="56" y2="60" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="56,60 53,58 53,62" fill="currentColor"/>
    </svg>`,
  state: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <circle cx="40" cy="10" r="4" fill="currentColor"/>
      <line x1="40" y1="14" x2="40" y2="26" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="40,26 38,23 42,23" fill="currentColor"/>
      <rect x="20" y="28" width="40" height="14" rx="7" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="40" y1="42" x2="40" y2="54" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="40,54 38,51 42,51" fill="currentColor"/>
      <rect x="20" y="56" width="40" height="14" rx="7" fill="white" stroke="currentColor" stroke-width="1.4"/>
    </svg>`,
  bidir: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="10" y="32" width="22" height="16" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="48" y="32" width="22" height="16" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="34" y1="40" x2="46" y2="40" stroke="currentColor" stroke-width="1.4"/>
      <polygon points="34,40 38,37 38,43" fill="currentColor"/>
      <polygon points="46,40 42,37 42,43" fill="currentColor"/>
    </svg>`,
  hierarchy: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="3" y="3" width="74" height="74" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="14" y="10" width="52" height="29" fill="white" stroke="currentColor" stroke-width="1.2"/>
      <rect x="14" y="41" width="52" height="29" fill="white" stroke="currentColor" stroke-width="1.2"/>
      <rect x="19" y="16" width="42" height="9" fill="white" stroke="currentColor" stroke-width="1"/>
      <rect x="19" y="27" width="42" height="9" fill="white" stroke="currentColor" stroke-width="1"/>
      <rect x="19" y="47" width="42" height="9" fill="white" stroke="currentColor" stroke-width="1"/>
      <rect x="19" y="58" width="42" height="9" fill="white" stroke="currentColor" stroke-width="1"/>
    </svg>`,
  pipeline: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="6"  y="8"  width="68" height="11" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="6"  y="24" width="68" height="11" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="6"  y="40" width="68" height="11" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="6"  y="56" width="68" height="11" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="40" y1="19" x2="40" y2="23" stroke="currentColor" stroke-width="1.2" marker-end="url(#pa)"/>
      <line x1="40" y1="35" x2="40" y2="39" stroke="currentColor" stroke-width="1.2" marker-end="url(#pa)"/>
      <line x1="40" y1="51" x2="40" y2="55" stroke="currentColor" stroke-width="1.2" marker-end="url(#pa)"/>
      <defs><marker id="pa" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="3" markerHeight="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="currentColor"/></marker></defs>
    </svg>`,
  parallel: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="28" y="4"  width="24" height="10" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="6"  y="32" width="20" height="12" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="30" y="32" width="20" height="12" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="54" y="32" width="20" height="12" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="28" y="62" width="24" height="10" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="40" y1="14" x2="16" y2="32" stroke="currentColor" stroke-width="1.1"/>
      <line x1="40" y1="14" x2="40" y2="32" stroke="currentColor" stroke-width="1.1"/>
      <line x1="40" y1="14" x2="64" y2="32" stroke="currentColor" stroke-width="1.1"/>
      <line x1="16" y1="44" x2="40" y2="62" stroke="currentColor" stroke-width="1.1"/>
      <line x1="40" y1="44" x2="40" y2="62" stroke="currentColor" stroke-width="1.1"/>
      <line x1="64" y1="44" x2="40" y2="62" stroke="currentColor" stroke-width="1.1"/>
    </svg>`,
  handshake: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="8"  y="6" width="20" height="9" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="52" y="6" width="20" height="9" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="18" y1="15" x2="18" y2="74" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="62" y1="15" x2="62" y2="74" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="18" y1="24" x2="58" y2="24" stroke="currentColor" stroke-width="1.1"/>
      <polygon points="58,24 55,22 55,26" fill="currentColor"/>
      <line x1="62" y1="36" x2="22" y2="36" stroke="currentColor" stroke-width="1.1"/>
      <polygon points="22,36 25,34 25,38" fill="currentColor"/>
      <line x1="18" y1="48" x2="58" y2="48" stroke="currentColor" stroke-width="1.1"/>
      <polygon points="58,48 55,46 55,50" fill="currentColor"/>
      <line x1="18" y1="62" x2="58" y2="62" stroke="currentColor" stroke-width="1.1"/>
      <polygon points="58,62 55,60 55,64" fill="currentColor"/>
      <polygon points="22,62 25,60 25,64" fill="currentColor"/>
    </svg>`,
  state_with_cond: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="22" y="7" width="36" height="11" rx="5.5" fill="white" stroke="currentColor" stroke-width="1.3"/>
      <rect x="22" y="25" width="36" height="11" fill="white" stroke="currentColor" stroke-width="1.3"/>
      <polygon points="40,43 55,52 40,61 25,52" fill="white" stroke="currentColor" stroke-width="1.3"/>
      <rect x="4"  y="66" width="30" height="10" rx="5" fill="white" stroke="currentColor" stroke-width="1.3"/>
      <rect x="46" y="66" width="30" height="10" rx="5" fill="white" stroke="currentColor" stroke-width="1.3"/>
      <line x1="40" y1="18" x2="40" y2="25" stroke="currentColor" stroke-width="1.1"/>
      <line x1="40" y1="36" x2="40" y2="43" stroke="currentColor" stroke-width="1.1"/>
      <line x1="31" y1="57" x2="20" y2="66" stroke="currentColor" stroke-width="1.1"/>
      <line x1="49" y1="57" x2="61" y2="66" stroke="currentColor" stroke-width="1.1"/>
    </svg>`,
  system: `
    <svg viewBox="0 0 80 80" class="pattern-thumb" aria-hidden="true">
      <rect x="3" y="22" width="48" height="44" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="7" y="28" width="20" height="14" fill="white" stroke="currentColor" stroke-width="1.1"/>
      <rect x="29" y="28" width="20" height="14" fill="white" stroke="currentColor" stroke-width="1.1"/>
      <rect x="7" y="46" width="20" height="14" fill="white" stroke="currentColor" stroke-width="1.1"/>
      <rect x="29" y="46" width="20" height="14" fill="white" stroke="currentColor" stroke-width="1.1"/>
      <rect x="58" y="6" width="20" height="13" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <rect x="58" y="62" width="20" height="13" fill="white" stroke="currentColor" stroke-width="1.4"/>
      <line x1="51" y1="35" x2="58" y2="14" stroke="currentColor" stroke-width="1" stroke-dasharray="2 1.5"/>
      <line x1="51" y1="55" x2="58" y2="68" stroke="currentColor" stroke-width="1"/>
    </svg>`,
};
