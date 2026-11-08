import { safeReturnUrl } from './login.component';

describe('safeReturnUrl', () => {
  it('keeps same-app relative paths', () => {
    expect(safeReturnUrl('/organizer/events')).toBe('/organizer/events');
  });

  it('rejects absolute and protocol-relative URLs (open redirect guard)', () => {
    expect(safeReturnUrl('https://evil.example')).toBeNull();
    expect(safeReturnUrl('//evil.example')).toBeNull();
    expect(safeReturnUrl(null)).toBeNull();
  });
});
