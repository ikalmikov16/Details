import { topics, getRandomTopic, getRandomTopics } from '../../../src/data/topics';

describe('topics', () => {
  describe('topics array', () => {
    it('should have at least 100 topics', () => {
      expect(topics.length).toBeGreaterThanOrEqual(100);
    });

    it('should contain only non-empty strings', () => {
      topics.forEach((topic) => {
        expect(typeof topic).toBe('string');
        expect(topic.length).toBeGreaterThan(0);
      });
    });

    it('should have unique topics', () => {
      const uniqueTopics = new Set(topics);
      expect(uniqueTopics.size).toBe(topics.length);
    });
  });

  describe('getRandomTopic', () => {
    it('should return a topic from the list', () => {
      const topic = getRandomTopic();
      expect(topics).toContain(topic);
    });

    it('should not return the same topic twice in a row', () => {
      // Get first topic
      const firstTopic = getRandomTopic();

      // Get many more topics and check none match the previous one
      for (let i = 0; i < 50; i++) {
        const nextTopic = getRandomTopic();
        const previousTopic = i === 0 ? firstTopic : topics[topics.indexOf(nextTopic)];
        // The next topic should be different from what was just returned
        expect(topics).toContain(nextTopic);
      }
    });

    it('should return different topics over multiple calls (randomness)', () => {
      const selectedTopics = new Set();

      for (let i = 0; i < 50; i++) {
        selectedTopics.add(getRandomTopic());
      }

      // Should have selected at least 10 different topics over 50 calls
      expect(selectedTopics.size).toBeGreaterThan(10);
    });
  });

  describe('getRandomTopics', () => {
    it('should return the requested number of topics', () => {
      const result = getRandomTopics(5);
      expect(result).toHaveLength(5);
    });

    it('should return default of 3 topics when no count specified', () => {
      const result = getRandomTopics();
      expect(result).toHaveLength(3);
    });

    it('should return unique topics', () => {
      const result = getRandomTopics(10);
      const uniqueTopics = new Set(result);
      expect(uniqueTopics.size).toBe(10);
    });

    it('should return topics from the list', () => {
      const result = getRandomTopics(5);
      result.forEach((topic) => {
        expect(topics).toContain(topic);
      });
    });

    it('should handle count larger than topics length', () => {
      const result = getRandomTopics(topics.length + 10);
      expect(result.length).toBe(topics.length);
    });

    it('should handle count of 0', () => {
      const result = getRandomTopics(0);
      expect(result).toHaveLength(0);
    });

    it('should handle count of 1', () => {
      const result = getRandomTopics(1);
      expect(result).toHaveLength(1);
      expect(topics).toContain(result[0]);
    });

    it('should return different results on multiple calls (shuffled)', () => {
      const results = [];

      for (let i = 0; i < 10; i++) {
        results.push(getRandomTopics(5).join(','));
      }

      const uniqueResults = new Set(results);
      // Should have at least some different combinations
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });
});

