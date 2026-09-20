import katex from 'katex';

export const renderLatexToString = (tex: string) => {
  try {
    return {
      __html: katex.renderToString(tex || '', {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      }),
    };
  } catch {
    return { __html: `<span>${tex}</span>` };
  }
};
