import type { StyleDefinition } from '@dicebear/core';
import { D } from '@mobily/ts-belt';
import { visitParents } from 'unist-util-visit-parents';
import { COMPONENT, LAYOUT_PARTS, MIRRORS, QUARTER } from './compose';
import { fail } from './fail';
import { LAYOUTS, SIZE } from './grid';
import {
  baseComponent,
  type StyleElement,
  type StyleNode,
  styleRoot,
} from './styleDefinition';

// The only attributes a wrapper of a reference may set: inherited paint, never geometry
const INHERITED_PAINT = ['stroke', 'color', 'fill', 'stroke-width'];

function componentRefs(elements: readonly StyleElement[]): StyleElement[] {
  const out: StyleElement[] = [];
  visitParents(styleRoot(elements), (e) => {
    if (e.type === 'component') {
      out.push(e);
    }
  });
  return out;
}

// A reference may carry only its transform, and sit only in plain groups that set inherited paint
function checkPlacements(elements: readonly StyleElement[], where: string): void {
  visitParents(styleRoot(elements), (e, ancestors) => {
    if (e.type !== 'component') {
      return;
    }
    const extra = Object.keys(e.attributes ?? {}).filter((key) => key !== 'transform');
    if (extra.length > 0) {
      fail(
        `${where}: a reference to ${e.name} may carry only a transform, got ${extra.join(', ')}`
      );
    }
    const wrapper = ancestors.find(
      (a): a is StyleNode =>
        a.type !== 'root' &&
        (a.name !== 'g' ||
          Object.keys(a.attributes ?? {}).some((key) => !INHERITED_PAINT.includes(key)))
    );
    if (wrapper) {
      fail(
        `${where}: ${e.name} sits in <${wrapper.name}> ${JSON.stringify(wrapper.attributes ?? {})}; only a plain <g> setting ${INHERITED_PAINT.join(', ')} may wrap a reference`
      );
    }
  });
}

function transformOf(e: StyleElement): string {
  const transform = e.attributes?.transform;
  return typeof transform === 'object'
    ? fail(`${e.name}: transform must be text`)
    : (transform ?? '');
}

const placement = (e: StyleElement): string => `${e.name}:${transformOf(e)}`;

// Top-level elements as references and their transforms; anything else shows as <name>
const topLevel = (elements: readonly StyleElement[]): string =>
  elements
    .map((e) => (e.type === 'component' ? placement(e) : `<${e.name ?? e.type}>`))
    .join('|');

// The mirror guarantee rests on DiceBear drawing one definition per component per avatar; this pins the wiring that relies on it
export function checkWiring(def: StyleDefinition): void {
  if (def.canvas.width !== SIZE || def.canvas.height !== SIZE) {
    fail(`canvas must be ${SIZE} square, the mirror matrices assume it`);
  }
  for (const name of Object.keys(def.components ?? {})) {
    const c = baseComponent(def, name);
    for (const key of ['rotate', 'translate', 'scale']) {
      if (key in c) {
        fail(`component ${name}: ${key} would let a reference differ from its mirror`);
      }
    }
    if (c.width !== SIZE || c.height !== SIZE) {
      fail(`component ${name}: must be ${SIZE} square`);
    }
    for (const [vName, v] of Object.entries(c.variants)) {
      checkPlacements(v.elements, `${name}.${vName}`);
    }
  }
  const parts = D.values(COMPONENT);
  for (const name of ['q', ...parts]) {
    if ('probability' in baseComponent(def, name)) {
      fail(`component ${name}: must always be drawn`);
    }
  }
  // DiceBear picks one quarter variant per avatar, as for every part, so all four references draw the same layout
  const quarters = baseComponent(def, 'q').variants;
  if (Object.keys(quarters).sort().join() !== [...LAYOUTS].sort().join()) {
    fail(`component q: needs one variant per layout (${LAYOUTS.join(', ')})`);
  }
  for (const layout of LAYOUTS) {
    const inQuarter = topLevel(quarters[layout].elements);
    const expected = QUARTER.map(
      ([slot, t]) => `${COMPONENT[LAYOUT_PARTS[layout][slot]]}:${t}`
    ).join('|');
    if (inQuarter !== expected) {
      fail(`component q.${layout}: expected ${expected}, got ${inQuarter}`);
    }
  }
  for (const name of [...parts, 'b']) {
    for (const [vName, v] of Object.entries(baseComponent(def, name).variants)) {
      if (componentRefs(v.elements).length > 0) {
        fail(`${name}.${vName}: parts may not reference components`);
      }
    }
  }
  checkPlacements(def.canvas.elements, 'canvas');
  if (topLevel(def.canvas.elements) !== 'p:') {
    fail('canvas must hold only the palette component, untransformed');
  }
  const mirrors = [...MIRRORS].sort().join('|');
  for (const [pName, v] of Object.entries(baseComponent(def, 'p').variants)) {
    const refs = componentRefs(v.elements);
    const placed = refs.filter((r) => r.name === 'q').map(transformOf);
    if ([...placed].sort().join('|') !== mirrors) {
      fail(
        `palette ${pName}: the quarter must be placed exactly by ${mirrors}, got ${placed.join('|')}`
      );
    }
    if (refs.some((r) => r.name !== 'q' && !(r.name === 'b' && transformOf(r) === ''))) {
      fail(
        `palette ${pName}: only the quarter and an untransformed border may be referenced`
      );
    }
  }
}
