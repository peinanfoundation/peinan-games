import { useFBX } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  AnimationClip,
  AnimationMixer,
  Bone,
  Box3,
  LoopOnce,
  LoopRepeat,
  Object3D,
  CanvasTexture,
  MeshBasicMaterial,
  Skeleton,
  SRGBColorSpace,
  Texture,
  Vector3,
  type Group,
  type Material,
  type Mesh,
  type MeshLambertMaterial,
  type MeshPhongMaterial,
  type SkinnedMesh,
} from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CHARACTER_HEIGHT, HOME } from './layout';
import { prepareClip } from './motion';

const WALK_SPEED = 4.3;
const FACE_OFFSET = 0;

export interface WalkGoal {
  index: number;
  x: number;
  z: number;
}

interface CharacterProps {
  modelUrl?: string;
  home?: { x: number; z: number };
  action: 'idle' | 'walk' | 'point';
  goal: WalkGoal | null;
  roundId: number;
  onArrived: () => void;
  onReady: () => void;
  onPointDuration: (duration: number) => void;
}

function clipOf(root: Object3D) {
  const animations = (root as Group).animations ?? [];
  const clip = animations.find((item) => item.tracks.length > 0 && item.duration > 0);
  if (!clip) throw new Error('角色動畫讀取失敗');
  return clip;
}

function dampAngle(current: number, target: number, delta: number) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const t = 1 - Math.exp(-10 * delta);
  return current + diff * t;
}

function brightenMap(source: Texture) {
  const image = source.image as (CanvasImageSource & { width?: number; height?: number }) | undefined;
  if (!image?.width || !image.height) return source;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;
  ctx.filter = 'brightness(1.7) contrast(1.15)';
  ctx.drawImage(image, 0, 0);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  map.needsUpdate = true;
  return map;
}

function tuneMaterials(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh || mesh.userData.tuned) return;
    mesh.userData.tuned = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    mesh.raycast = () => undefined;
    const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const tuned = sources.map((source) => tuneMaterial(source));
    mesh.material = Array.isArray(mesh.material) ? tuned : tuned[0]!;
  });
}

function tuneMaterial(source: Material) {
  const mapped = source as MeshPhongMaterial | MeshLambertMaterial;
  if (mapped.map) return new MeshBasicMaterial({ map: brightenMap(mapped.map), toneMapped: false });
  return new MeshBasicMaterial({ color: mapped.color ?? '#ffffff', toneMapped: false });
}

function bindSharedRig(root: Object3D) {
  const rigs: Object3D[] = [];
  root.traverse((node) => {
    if (node.name === 'mixamorigHips' && node.children.some((child) => child.name === 'mixamorigSpine')) {
      rigs.push(node);
    }
  });
  const primary = rigs[0];
  if (!primary) return;
  const byName = new Map<string, Bone>();
  primary.traverse((node) => {
    if ((node as Bone).isBone && !byName.has(node.name)) byName.set(node.name, node as Bone);
  });
  root.traverse((node) => {
    const mesh = node as SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const bones = mesh.skeleton.bones.map((bone) => byName.get(bone.name) ?? bone);
    const already = bones.every((bone, index) => bone === mesh.skeleton.bones[index]);
    if (already) return;
    mesh.skeleton = new Skeleton(bones, mesh.skeleton.boneInverses);
  });
  for (const extra of [...primary.children]) {
    if (extra.name === 'mixamorigHips') extra.removeFromParent();
  }
}

export function Character({
  modelUrl = `${import.meta.env.BASE_URL}models/granny.fbx`,
  home = HOME,
  action,
  goal,
  roundId,
  onArrived,
  onReady,
  onPointDuration,
}: CharacterProps) {
  const bodyFbx = useFBX(modelUrl);
  const idleFbx = useFBX(`${import.meta.env.BASE_URL}models/idle.fbx`);
  const walkFbx = useFBX(`${import.meta.env.BASE_URL}models/walk.fbx`);
  const pointFbx = useFBX(`${import.meta.env.BASE_URL}models/point.fbx`);
  const model = useMemo(() => {
    const cloned = cloneSkeleton(bodyFbx) as Group;
    bindSharedRig(cloned);
    return cloned;
  }, [bodyFbx]);
  const clips = useMemo(() => {
    const named: AnimationClip[] = [
      prepareClip(clipOf(idleFbx), 'idle'),
      prepareClip(clipOf(walkFbx), 'walk'),
      prepareClip(clipOf(pointFbx), 'point'),
    ];
    return named;
  }, [idleFbx, walkFbx, pointFbx]);

  const rootRef = useRef<Group>(null);
  const yawRef = useRef<Group>(null);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const actions = useMemo(() => {
    const bag = new Map<string, ReturnType<AnimationMixer['clipAction']>>();
    for (const clip of clips) bag.set(clip.name, mixer.clipAction(clip));
    return bag;
  }, [clips, mixer]);
  const homeRef = useRef(home);
  homeRef.current = home;
  const pos = useRef(new Vector3(home.x, 0, home.z));
  const arrived = useRef(false);
  const goalWatch = useRef(goal?.index ?? -1);
  const playing = useRef<string | null>(null);
  const onArrivedRef = useRef(onArrived);
  const onReadyRef = useRef(onReady);
  const onPointDurationRef = useRef(onPointDuration);
  const actionRef = useRef(action);
  const goalRef = useRef(goal);
  onArrivedRef.current = onArrived;
  onReadyRef.current = onReady;
  onPointDurationRef.current = onPointDuration;
  actionRef.current = action;
  goalRef.current = goal;

  const goalIndex = goal?.index ?? -1;
  if (goalWatch.current !== goalIndex) {
    goalWatch.current = goalIndex;
    arrived.current = false;
  }

  useLayoutEffect(() => {
    tuneMaterials(model);
    model.scale.setScalar(1);
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const height = box.max.y - box.min.y;
    if (height > 0.001) {
      model.scale.setScalar(CHARACTER_HEIGHT / height);
      model.updateMatrixWorld(true);
      const grounded = new Box3().setFromObject(model);
      model.position.y -= grounded.min.y;
    }
  }, [model]);

  useLayoutEffect(() => {
    const point = clips.find((clip) => clip.name === 'point');
    if (point) onPointDurationRef.current(point.duration);
    onReadyRef.current();
  }, [clips]);

  useLayoutEffect(() => {
    const spot = homeRef.current;
    pos.current.set(spot.x, 0, spot.z);
    rootRef.current?.position.set(spot.x, 0, spot.z);
    if (yawRef.current) yawRef.current.rotation.y = FACE_OFFSET;
    onReadyRef.current();
  }, [roundId, home.x, home.z]);

  useLayoutEffect(() => {
    const next = actions.get(action);
    if (!next) return;
    if (playing.current === action) return;
    const prev = playing.current ? actions.get(playing.current) : null;
    if (action === 'point') {
      next.setLoop(LoopOnce, 1);
      next.clampWhenFinished = true;
      next.timeScale = 1;
    } else {
      next.setLoop(LoopRepeat, Infinity);
      next.clampWhenFinished = false;
      next.timeScale = action === 'walk' ? 2.7 : 1;
    }
    if (prev && prev !== next) {
      prev.fadeOut(0.22);
      next.reset().fadeIn(0.22).play();
    } else {
      next.reset().play();
    }
    mixer.update(0.001);
    playing.current = action;
  }, [action, actions, mixer]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    mixer.update(dt);
    const root = rootRef.current;
    const yaw = yawRef.current;
    if (!root || !yaw) return;
    const currentGoal = goalRef.current;
    if (actionRef.current === 'walk' && currentGoal) {
      const dx = currentGoal.x - pos.current.x;
      const dz = currentGoal.z - pos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        pos.current.x = currentGoal.x;
        pos.current.z = currentGoal.z;
        if (!arrived.current) {
          arrived.current = true;
          onArrivedRef.current();
        }
      } else {
        const step = Math.min(dist, WALK_SPEED * dt);
        pos.current.x += (dx / dist) * step;
        pos.current.z += (dz / dist) * step;
        yaw.rotation.y = dampAngle(yaw.rotation.y, Math.atan2(dx, dz) + FACE_OFFSET, dt);
      }
    } else if (actionRef.current === 'point') {
      yaw.rotation.y = dampAngle(yaw.rotation.y, FACE_OFFSET, dt);
    }
    root.position.set(pos.current.x, 0, pos.current.z);
  });

  return (
    <group ref={rootRef} position={[home.x, 0, home.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} raycast={() => undefined}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <group ref={yawRef} rotation={[0, FACE_OFFSET, 0]}>
        <primitive object={model} />
      </group>
    </group>
  );
}
