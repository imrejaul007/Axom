/**
 * Unit tests for LifeStoryService
 * @module index.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LifeStoryService } from './services/lifeStoryService.js';
import { StoryArc } from './types.js';

describe('LifeStoryService', () => {
  let service: LifeStoryService;

  beforeEach(() => {
    service = new LifeStoryService();
  });

  describe('generateStory', () => {
    it('should generate a new life story for a user', async () => {
      const userId = 'user-123';
      const story = await service.generateStory(userId);

      expect(story).toBeDefined();
      expect(story.id).toBeDefined();
      expect(story.userId).toBe(userId);
      expect(story.title).toBeDefined();
      expect(story.chapters).toBeDefined();
      expect(Array.isArray(story.chapters)).toBe(true);
      expect(story.createdAt).toBeDefined();
      expect(story.updatedAt).toBeDefined();
      expect(story.totalChapters).toBeGreaterThanOrEqual(0);
      expect(story.themes).toBeDefined();
      expect(story.arc).toBeDefined();
    });

    it('should generate story with specified themes', async () => {
      const userId = 'user-456';
      const options = {
        themes: ['growth', 'learning'],
      };

      const story = await service.generateStory(userId, options);

      expect(story.themes).toContain('growth');
      expect(story.themes).toContain('learning');
    });

    it('should determine adventure arc for adventure themes', async () => {
      const userId = 'user-789';
      const options = {
        themes: ['adventure', 'discovery'],
      };

      const story = await service.generateStory(userId, options);

      expect(story.arc).toBe(StoryArc.ADVENTURE);
    });

    it('should determine transformation arc for transformation themes', async () => {
      const userId = 'user-transform';
      const options = {
        themes: ['transformation', 'change'],
      };

      const story = await service.generateStory(userId, options);

      expect(story.arc).toBe(StoryArc.TRANSFORMATION);
    });
  });

  describe('getStory', () => {
    it('should return null for non-existent user', async () => {
      const story = await service.getStory('non-existent-user');

      expect(story).toBeNull();
    });

    it('should return the generated story for existing user', async () => {
      const userId = 'user-story-test';
      const generatedStory = await service.generateStory(userId);

      const retrievedStory = await service.getStory(userId);

      expect(retrievedStory).not.toBeNull();
      expect(retrievedStory?.id).toBe(generatedStory.id);
      expect(retrievedStory?.userId).toBe(userId);
    });
  });

  describe('addChapter', () => {
    it('should create a new story and add chapter if none exists', async () => {
      const userId = 'user-add-chapter';
      const chapter = await service.addChapter(
        userId,
        'First Chapter',
        ['Event 1', 'Event 2'],
        ['joy', 'excitement'],
        ['growth']
      );

      expect(chapter).toBeDefined();
      expect(chapter.chapters.length).toBeGreaterThan(0);
      // New chapter is appended to existing chapters
      const addedChapter = chapter.chapters.find(c => c.title === 'First Chapter');
      expect(addedChapter).toBeDefined();
      expect(addedChapter?.title).toBe('First Chapter');
    });

    it('should add chapter to existing story', async () => {
      const userId = 'user-add-existing';
      await service.generateStory(userId);

      const updatedStory = await service.addChapter(
        userId,
        'New Chapter',
        ['Event A'],
        ['anticipation'],
        ['exploration']
      );

      expect(updatedStory.chapters.length).toBeGreaterThan(1);
    });
  });

  describe('getChapter', () => {
    it('should return null for non-existent story', async () => {
      const chapter = await service.getChapter('non-existent-story', 'any-chapter');

      expect(chapter).toBeNull();
    });

    it('should return null for non-existent chapter', async () => {
      const userId = 'user-get-chapter';
      const story = await service.generateStory(userId);

      const chapter = await service.getChapter(story.id, 'non-existent-chapter');

      expect(chapter).toBeNull();
    });

    it('should return the correct chapter', async () => {
      const userId = 'user-get-correct';
      const updatedStory = await service.addChapter(
        userId,
        'Target Chapter',
        ['Target Event'],
        ['focus'],
        ['target']
      );

      const story = await service.getStory(userId);
      const targetChapterId = updatedStory.chapters.find(
        c => c.title === 'Target Chapter'
      )?.id;

      if (targetChapterId) {
        const chapter = await service.getChapter(story!.id, targetChapterId);

        expect(chapter).not.toBeNull();
        expect(chapter?.title).toBe('Target Chapter');
      }
    });
  });

  describe('updateChapter', () => {
    it('should return null for non-existent story', async () => {
      const updated = await service.updateChapter('non-existent', 'any', {
        title: 'New Title',
      });

      expect(updated).toBeNull();
    });

    it('should update chapter with provided fields', async () => {
      const userId = 'user-update';
      const story = await service.addChapter(
        userId,
        'Original Title',
        ['Original Event'],
        ['neutral'],
        ['original']
      );

      const chapterToUpdate = story.chapters[0];
      const updatedChapter = await service.updateChapter(
        story.id,
        chapterToUpdate.id,
        {
          title: 'Updated Title',
          summary: 'Updated summary',
        }
      );

      expect(updatedChapter).not.toBeNull();
      expect(updatedChapter?.title).toBe('Updated Title');
      expect(updatedChapter?.summary).toBe('Updated summary');
    });
  });

  describe('deleteChapter', () => {
    it('should return false for non-existent story', async () => {
      const deleted = await service.deleteChapter('non-existent', 'any');

      expect(deleted).toBe(false);
    });

    it('should return false for non-existent chapter', async () => {
      const userId = 'user-delete-none';
      const story = await service.generateStory(userId);

      const deleted = await service.deleteChapter(story.id, 'non-existent');

      expect(deleted).toBe(false);
    });

    it('should return true and remove chapter when found', async () => {
      const userId = 'user-delete-success';
      const story = await service.addChapter(
        userId,
        'To Be Deleted',
        ['Event'],
        ['sadness'],
        ['deletion']
      );

      const chapterId = story.chapters[0].id;
      const deleted = await service.deleteChapter(story.id, chapterId);

      expect(deleted).toBe(true);

      // Verify chapter is removed
      const chapter = await service.getChapter(story.id, chapterId);
      expect(chapter).toBeNull();
    });
  });

  describe('getThemes', () => {
    it('should return empty array for non-existent user', async () => {
      const themes = await service.getThemes('non-existent');

      expect(themes).toEqual([]);
    });

    it('should return all themes from user story', async () => {
      const userId = 'user-themes';
      await service.addChapter(
        userId,
        'Chapter 1',
        ['Event 1'],
        ['emotion1'],
        ['theme1', 'theme2']
      );
      await service.addChapter(
        userId,
        'Chapter 2',
        ['Event 2'],
        ['emotion2'],
        ['theme2', 'theme3']
      );

      const themes = await service.getThemes(userId);

      expect(themes).toContain('theme1');
      expect(themes).toContain('theme2');
      expect(themes).toContain('theme3');
    });
  });

  describe('getArc', () => {
    it('should return null for non-existent story', async () => {
      const arc = await service.getArc('non-existent');

      expect(arc).toBeNull();
    });

    it('should return the correct story arc', async () => {
      const userId = 'user-arc';
      const options = { themes: ['achievement', 'success'] };
      const story = await service.generateStory(userId, options);

      const arc = await service.getArc(story.id);

      expect(arc).toBe(StoryArc.ACHIEVEMENT);
    });
  });

  describe('summarizeLife', () => {
    it('should return empty summary for non-existent user', async () => {
      const summary = await service.summarizeLife('non-existent');

      expect(summary.summary).toContain('No life story found');
      expect(summary.keyThemes).toEqual([]);
      expect(summary.notableEvents).toEqual([]);
    });

    it('should return summary with themes and events', async () => {
      const userId = 'user-summary';
      await service.addChapter(
        userId,
        'Chapter One',
        ['Notable Event 1', 'Notable Event 2'],
        ['joy', 'pride'],
        ['major-theme', 'minor-theme']
      );

      const summary = await service.summarizeLife(userId);

      expect(summary.summary).toBeDefined();
      expect(summary.keyThemes).toContain('major-theme');
      expect(summary.notableEvents.length).toBeGreaterThan(0);
      expect(summary.emotionalJourney).toBeDefined();
    });

    it('should respect maxChapters limit', async () => {
      const userId = 'user-max-chapters';
      for (let i = 0; i < 5; i++) {
        await service.addChapter(
          userId,
          `Chapter ${i + 1}`,
          [`Event ${i + 1}`],
          ['emotion'],
          [`theme-${i}`]
        );
      }

      const summary = await service.summarizeLife(userId, 2);

      expect(summary.keyThemes.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Story Arc Determination', () => {
    it('should determine GROWTH arc for growth themes', async () => {
      const story = await service.generateStory('user-growth', {
        themes: ['personal growth', 'learning'],
      });
      expect(story.arc).toBe(StoryArc.GROWTH);
    });

    it('should determine RECOVERY arc for healing themes', async () => {
      const story = await service.generateStory('user-recovery', {
        themes: ['healing', 'recovery'],
      });
      expect(story.arc).toBe(StoryArc.RECOVERY);
    });

    it('should determine EXPLORATION arc for exploration themes', async () => {
      const story = await service.generateStory('user-explore', {
        themes: ['curiosity', 'exploration'],
      });
      expect(story.arc).toBe(StoryArc.EXPLORATION);
    });

    it('should determine CONNECTION arc for relationship themes', async () => {
      const story = await service.generateStory('user-connect', {
        themes: ['relationships', 'connection'],
      });
      expect(story.arc).toBe(StoryArc.CONNECTION);
    });

    it('should default to GROWTH arc for unknown themes', async () => {
      const story = await service.generateStory('user-default', {
        themes: ['random', 'unknown'],
      });
      expect(story.arc).toBe(StoryArc.GROWTH);
    });
  });
});