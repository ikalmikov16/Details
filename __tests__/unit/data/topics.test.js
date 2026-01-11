import { FALLBACK_THEMES, FALLBACK_TOPICS } from '../../../src/data/topics';

describe('topics', () => {
  describe('FALLBACK_TOPICS array', () => {
    it('should have exactly 100 topics', () => {
      expect(FALLBACK_TOPICS.length).toBe(100);
    });

    it('should contain only non-empty strings', () => {
      FALLBACK_TOPICS.forEach((topic) => {
        expect(typeof topic).toBe('string');
        expect(topic.length).toBeGreaterThan(0);
      });
    });

    it('should have unique topics', () => {
      const uniqueTopics = new Set(FALLBACK_TOPICS);
      expect(uniqueTopics.size).toBe(FALLBACK_TOPICS.length);
    });
  });

  describe('FALLBACK_THEMES', () => {
    it('should have exactly 10 themes', () => {
      const themeCount = Object.keys(FALLBACK_THEMES).length;
      expect(themeCount).toBe(10);
    });

    it('each theme should have required properties', () => {
      Object.entries(FALLBACK_THEMES).forEach(([key, theme]) => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('emoji');
        expect(theme).toHaveProperty('topics');
        expect(typeof theme.name).toBe('string');
        expect(typeof theme.emoji).toBe('string');
        expect(Array.isArray(theme.topics)).toBe(true);
      });
    });

    it('each theme should have exactly 10 topics', () => {
      Object.entries(FALLBACK_THEMES).forEach(([key, theme]) => {
        expect(theme.topics.length).toBe(10);
      });
    });

    it('flattened themes should equal FALLBACK_TOPICS', () => {
      const flattened = Object.values(FALLBACK_THEMES).flatMap((theme) => theme.topics);
      expect(flattened.length).toBe(FALLBACK_TOPICS.length);
      expect(flattened).toEqual(FALLBACK_TOPICS);
    });
  });

  describe('topic content quality', () => {
    it('topics should not be too short', () => {
      FALLBACK_TOPICS.forEach((topic) => {
        expect(topic.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('topics should not be excessively long', () => {
      FALLBACK_TOPICS.forEach((topic) => {
        expect(topic.length).toBeLessThan(100);
      });
    });

    it('topics should be properly capitalized', () => {
      FALLBACK_TOPICS.forEach((topic) => {
        // First character should be uppercase (A-Z) or a number/quote for some edge cases
        expect(topic[0]).toMatch(/[A-Z0-9"']/);
      });
    });
  });
});
