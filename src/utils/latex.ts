import katex from 'katex';

export const renderLatexToString = (tex: string) => {
  try {
    return {
      __html: katex.renderToString(tex || '', {
        displayMode: true,
        throwOnError: false,
        output: 'html',
        trust: false,
      }),
    };
  } catch {
    const escaped = (tex || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]!);
    return { __html: `<span>${escaped}</span>` };
  }
};
