import { TndPipe } from './tnd.pipe';

describe('TndPipe', () => {
  const pipe = new TndPipe();

  it('shows free events as "Free"', () => {
    expect(pipe.transform(0)).toBe('Free');
  });

  it('shows a dash when there is no price', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('formats prices in TND', () => {
    expect(pipe.transform(45)).toBe('45 TND');
  });
});
