import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { ListDraftsSchema, getToolByName } from './tools.js';

describe('ListDraftsSchema', () => {
  it('applies safe defaults', () => {
    const result = ListDraftsSchema.parse({});
    expect(result.maxResults).toBe(20);
    expect(result.includeSpamTrash).toBe(false);
  });

  it('accepts search and pagination parameters', () => {
    const result = ListDraftsSchema.parse({
      query: 'to:person@example.com',
      maxResults: 50,
      pageToken: 'next-page',
      includeSpamTrash: true,
    });

    expect(result).toEqual({
      query: 'to:person@example.com',
      maxResults: 50,
      pageToken: 'next-page',
      includeSpamTrash: true,
    });
  });

  it('rejects invalid result limits', () => {
    expect(() => ListDraftsSchema.parse({ maxResults: 0 })).toThrow();
    expect(() => ListDraftsSchema.parse({ maxResults: 501 })).toThrow();
    expect(() => ListDraftsSchema.parse({ maxResults: 1.5 })).toThrow();
  });
});

describe('list_drafts tool definition', () => {
  it('is registered as a read-only tool for all supported draft-read scopes', () => {
    const tool = getToolByName('list_drafts');
    expect(tool).toBeDefined();
    expect(tool!.scopes).toEqual(['gmail.readonly', 'gmail.modify', 'gmail.compose']);
    expect(tool!.annotations.readOnlyHint).toBe(true);
  });
});

describe('list_drafts handler', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const indexSource = fs.readFileSync(path.join(currentDir, 'index.ts'), 'utf8');

  it('uses the Gmail drafts list and get APIs', () => {
    expect(indexSource).toContain('gmail.users.drafts.list');
    expect(indexSource).toContain('gmail.users.drafts.get');
  });

  it('returns pagination metadata and recognizable draft fields', () => {
    expect(indexSource).toContain('nextPageToken: response.data.nextPageToken');
    expect(indexSource).toContain('resultSizeEstimate: response.data.resultSizeEstimate');
    expect(indexSource).toContain('draftId: detail.data.id');
    expect(indexSource).toContain('subject: headers.subject');
    expect(indexSource).toContain("snippet: message?.snippet");
  });
});
