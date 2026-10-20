import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { GetDraftSchema, getToolByName } from './tools.js';

describe('GetDraftSchema', () => {
  it('requires a draftId', () => {
    expect(() => GetDraftSchema.parse({})).toThrow();
    expect(() => GetDraftSchema.parse({ draftId: 123 })).toThrow();
  });

  it('accepts a draftId', () => {
    expect(GetDraftSchema.parse({ draftId: 'r-6356019993303966815' })).toEqual({
      draftId: 'r-6356019993303966815',
    });
  });
});

describe('get_draft tool definition', () => {
  it('is registered as a read-only tool for all supported draft-read scopes', () => {
    const tool = getToolByName('get_draft');
    expect(tool).toBeDefined();
    expect(tool!.scopes).toEqual(['gmail.readonly', 'gmail.modify', 'gmail.compose']);
    expect(tool!.annotations.readOnlyHint).toBe(true);
  });

  it('tells the caller why it exists — GUI-hidden drafts in multi-draft threads', () => {
    const tool = getToolByName('get_draft');
    expect(tool!.description).toContain('several drafts');
    expect(tool!.description).toContain('list_drafts');
  });
});

describe('get_draft handler', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const indexSource = fs.readFileSync(path.join(currentDir, 'index.ts'), 'utf8');
  const handler = indexSource.slice(
    indexSource.indexOf('case "get_draft"'),
    indexSource.indexOf('case "send_draft"'),
  );

  it('reads through the Gmail drafts.get API at full format', () => {
    expect(handler).toContain('gmail.users.drafts.get');
    expect(handler).toContain("format: 'full'");
  });

  it('unwraps draft.message before extracting headers and body', () => {
    expect(handler).toContain('response.data.message');
    expect(handler).toContain('extractHeaders(message?.payload)');
    expect(handler).toContain('extractEmailContent(payload)');
    expect(handler).toContain('extractAttachments(payload)');
  });

  it('returns the identifiers needed to act on the draft afterwards', () => {
    // draftId -> update_draft/send_draft, threadId -> get_thread, Message-ID -> reply threading
    expect(handler).toContain('Draft ID:');
    expect(handler).toContain('Thread ID:');
    expect(handler).toContain('Message-ID:');
  });
});
