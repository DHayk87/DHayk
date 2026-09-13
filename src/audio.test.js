import { describe, it, expect, beforeEach } from 'vitest';
import { toggleAudioState } from './audio.js';

describe('Audio Logic', () => {
  describe('toggleAudioState', () => {
    it('should toggle mute state correctly', () => {
      // By default isMuted is false, so first toggle should return true
      const state1 = toggleAudioState();
      expect(typeof state1).toBe('boolean');
      
      const state2 = toggleAudioState();
      expect(state2).toBe(!state1);
      
      const state3 = toggleAudioState();
      expect(state3).toBe(state1);
    });
  });
});
