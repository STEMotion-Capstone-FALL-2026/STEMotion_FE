import { afterEach, describe, expect, it, vi } from 'vitest';
import katex from 'katex';
import { renderLatexToString } from './latex';

afterEach(() => vi.restoreAllMocks());

describe('LaTeX rendering security', () => {
  it.each([
    'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
    '2H_2 + O_2 \\xrightarrow{t^\\circ} 2H_2O',
    'a^2 + b^2 = c^2',
  ])('renders the existing math/chemistry/geometry formulas: %s', (formula) => {
    const html = renderLatexToString(formula).__html;
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('katex-error');
  });

  it('ignores inherited trust settings even with an already polluted options prototype', () => {
    // Exercise the upstream advisory prerequisite without polluting global Object.prototype.
    const options = Object.create({ trust: true });
    Object.assign(options, { throwOnError: false, output: 'html' });
    const html = katex.renderToString('\\href{javascript:alert(1)}{click}', options);
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(container.querySelector('a')).toBeNull();
  });

  it('blocks external HTML resources in user supplied formulas', () => {
    const container = document.createElement('div');
    container.innerHTML = renderLatexToString('\\includegraphics{https://attacker.example/image.png}').__html;
    expect(container.querySelector('img')).toBeNull();
  });

  it('escapes untrusted text if the renderer throws', () => {
    vi.spyOn(katex, 'renderToString').mockImplementation(() => { throw new Error('render failed'); });
    const container = document.createElement('div');
    container.innerHTML = renderLatexToString('<img src=x onerror="alert(1)"> &').__html;
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('<img src=x onerror="alert(1)"> &');
  });
});
