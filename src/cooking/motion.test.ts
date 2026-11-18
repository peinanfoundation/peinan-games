import { AnimationClip, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';
import { lockRootMotion, prepareClip } from './motion';

describe('lockRootMotion', () => {
  it('keeps the hips from sliding while preserving the bounce', () => {
    const hips = new VectorKeyframeTrack('mixamorig1Hips.position', [0, 1], [1, 2, 3, 4, 5, 6]);
    const head = new VectorKeyframeTrack('mixamorig1Head.position', [0, 1], [1, 2, 3, 4, 5, 6]);
    const locked = lockRootMotion(new AnimationClip('walk', 1, [hips, head]));
    expect(Array.from(locked.tracks[0]!.values)).toEqual([1, 2, 3, 1, 5, 3]);
    expect(Array.from(locked.tracks[1]!.values)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('renames the current rig so the clips drive the granny skeleton', () => {
    const track = new VectorKeyframeTrack('mixamorig1LeftHandThumb1.quaternion', [0], [0, 0, 0, 1]);
    const clip = prepareClip(new AnimationClip('point', 1, [track]), 'point');
    expect(clip.name).toBe('point');
    expect(clip.tracks[0]!.name).toBe('mixamorigLeftHandThumb1.quaternion');
  });
});
