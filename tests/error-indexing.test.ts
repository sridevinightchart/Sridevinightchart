import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PageError from '../app/error';
import GlobalError from '../app/global-error';

describe.each([PageError, GlobalError])('error indexing safeguards', (Component) => {
  it('excludes error content from indexing and snippets and offers recovery', () => {
    const html = renderToStaticMarkup(createElement(Component, { error: new Error('test error'), reset: () => {} }));
    expect(html).toContain('<meta name="robots" content="noindex, follow"');
    expect(html).toContain('data-nosnippet');
    expect(html).toContain('Try again');
    expect(html).not.toContain('Application error: a client-side exception');
    expect(html).not.toContain('test error');
  });
});
