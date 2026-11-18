import { AnimationClip, VectorKeyframeTrack, type KeyframeTrack } from 'three';

const ROOT_POS = /hips\.position$/i;

export function lockRootMotion(source: AnimationClip) {
  const tracks: KeyframeTrack[] = source.tracks.map((track) => {
    if (!ROOT_POS.test(track.name) || !(track instanceof VectorKeyframeTrack)) return track;
    const values = track.values.slice();
    const x0 = values[0] ?? 0;
    const z0 = values[2] ?? 0;
    for (let i = 0; i < values.length; i += 3) {
      values[i] = x0;
      values[i + 2] = z0;
    }
    return new VectorKeyframeTrack(track.name, track.times, values);
  });
  return new AnimationClip(source.name, source.duration, tracks);
}

export function retargetMixamo(source: AnimationClip) {
  const tracks = source.tracks.map((track) => {
    const name = track.name.replaceAll('mixamorig1', 'mixamorig');
    if (name === track.name) return track;
    const next = track.clone();
    next.name = name;
    return next;
  });
  return new AnimationClip(source.name, source.duration, tracks);
}

export function prepareClip(source: AnimationClip, name: string) {
  const clip = lockRootMotion(retargetMixamo(source.clone()));
  clip.name = name;
  return clip;
}
