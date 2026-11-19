import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { OrthographicCamera, Vector3, type Group } from 'three';
import {
  CARD_D,
  CARD_W,
  GRID_D,
  GRID_W,
  TABLE_D,
  TABLE_W,
  TABLE_Z,
  frameZoom,
  slotPosition,
} from './layout';
import { backTexture, clothTexture, frontTexture, ringTexture, woodTexture } from './textures';

export function FrameBoard() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    camera.zoom = frameZoom(size.width, size.height);
    camera.position.set(0, 18, TABLE_Z + 18);
    camera.lookAt(0, 0, TABLE_Z);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame(() => {
    camera.lookAt(0, 0, TABLE_Z);
  });

  return null;
}

export function Table() {
  const wood = useMemo(() => woodTexture(), []);
  const cloth = useMemo(() => clothTexture(), []);
  const clothW = GRID_W + 0.28;
  const clothD = GRID_D + 0.28;
  const trim = 0.04;
  return (
    <group>
      <mesh position={[0, -0.1, TABLE_Z]} receiveShadow>
        <boxGeometry args={[TABLE_W + 0.16, 0.12, TABLE_D + 0.16]} />
        <meshStandardMaterial color="#5a341c" roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.05, TABLE_Z]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_W, 0.1, TABLE_D]} />
        <meshStandardMaterial attach="material-0" color="#6b4424" roughness={0.84} />
        <meshStandardMaterial attach="material-1" color="#6b4424" roughness={0.84} />
        <meshStandardMaterial attach="material-2" map={wood} color="#ffffff" roughness={0.72} />
        <meshStandardMaterial attach="material-3" color="#4e2e18" roughness={0.9} />
        <meshStandardMaterial attach="material-4" color="#6b4424" roughness={0.84} />
        <meshStandardMaterial attach="material-5" color="#6b4424" roughness={0.84} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]}>
        <planeGeometry args={[clothW + 0.16, clothD + 0.16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, 0]} receiveShadow>
        <planeGeometry args={[clothW, clothD]} />
        <meshStandardMaterial map={cloth} color="#ffffff" roughness={1} />
      </mesh>
      <mesh position={[0, 0.022, clothD / 2]}>
        <boxGeometry args={[clothW, 0.012, trim]} />
        <meshBasicMaterial color="#c6a15a" />
      </mesh>
      <mesh position={[0, 0.022, -clothD / 2]}>
        <boxGeometry args={[clothW, 0.012, trim]} />
        <meshBasicMaterial color="#c6a15a" />
      </mesh>
      <mesh position={[-clothW / 2, 0.022, 0]}>
        <boxGeometry args={[trim, 0.012, clothD]} />
        <meshBasicMaterial color="#c6a15a" />
      </mesh>
      <mesh position={[clothW / 2, 0.022, 0]}>
        <boxGeometry args={[trim, 0.012, clothD]} />
        <meshBasicMaterial color="#c6a15a" />
      </mesh>
    </group>
  );
}

export function CardProjector({
  projectRef,
}: {
  projectRef: RefObject<((index: number) => { x: number; y: number }) | null>;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    projectRef.current = (index) => {
      const spot = slotPosition(index);
      const point = new Vector3(spot.x, 0.5, spot.z);
      point.project(camera);
      const rect = gl.domElement.getBoundingClientRect();
      return {
        x: rect.left + (point.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-point.y * 0.5 + 0.5) * rect.height,
      };
    };
  });
  return null;
}

interface CardProps {
  index: number;
  ingredientId: string;
  dishId?: string;
  faceUp: boolean;
  playable: boolean;
  pending: boolean;
  gone: boolean;
  mark: 'held' | 'good' | 'bad' | 'p1' | 'p2' | 'both' | null;
  onPick: (index: number) => void;
}

function Card({ index, ingredientId, dishId, faceUp, playable, pending, gone, mark, onPick }: CardProps) {
  const front = useMemo(() => frontTexture(ingredientId), [ingredientId]);
  const back = useMemo(() => backTexture(dishId), [dishId]);
  const pivot = useRef<Group>(null);
  const lift = useRef<Group>(null);
  const body = useRef<Group>(null);
  const shown = useRef(faceUp ? Math.PI : 0);
  const scale = useRef(1);
  const [hovered, setHovered] = useState(false);
  const gl = useThree((state) => state.gl);
  const spot = slotPosition(index);
  const ring =
    mark === 'good' ? '#2f9e57'
      : mark === 'bad' ? '#d4534a'
        : mark === 'p1' ? '#4f8fd8'
          : mark === 'p2' ? '#d86aa5'
            : mark === 'both' ? '#9b7ad8'
              : mark === 'held' || pending ? '#e2b15a'
                : hovered && playable ? '#f3d7a4' : null;
  const ringMap = useMemo(() => (ring ? ringTexture(ring) : null), [ring]);

  useLayoutEffect(() => {
    if (pivot.current) pivot.current.rotation.x = shown.current;
  }, []);

  useFrame((_, delta) => {
    const target = faceUp ? Math.PI : 0;
    const rate = 1 - Math.exp(-10 * delta);
    shown.current += (target - shown.current) * rate;
    if (pivot.current) pivot.current.rotation.x = shown.current;
    if (lift.current) {
      const liftTarget = hovered && playable ? 0.14 : 0;
      lift.current.position.y += (liftTarget - lift.current.position.y) * rate;
    }
    const scaleTarget = gone ? 0.001 : 1;
    scale.current += (scaleTarget - scale.current) * rate;
    if (body.current) body.current.scale.setScalar(scale.current);
  });

  const pick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!playable) return;
    onPick(index);
  };

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!playable) return;
    setHovered(true);
    gl.domElement.style.cursor = 'pointer';
  };

  const out = () => {
    setHovered(false);
    gl.domElement.style.cursor = 'default';
  };

  return (
    <group ref={body} position={[spot.x, 0.02, spot.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <planeGeometry args={[CARD_W * 0.86, CARD_D * 0.86]} />
        <meshBasicMaterial color="#6a4630" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {ringMap && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
          <planeGeometry args={[CARD_W + 0.18, CARD_D + 0.18]} />
          <meshBasicMaterial map={ringMap} transparent alphaTest={0.35} toneMapped={false} />
        </mesh>
      )}
      <group ref={lift}>
        <group ref={pivot}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[CARD_W * 0.82, 0.07, CARD_D * 0.82]} />
            <meshBasicMaterial color="#e7d3b0" />
          </mesh>
          <mesh
            rotation-x={-Math.PI / 2}
            position={[0, 0.04, 0]}
            onClick={pick}
            onPointerOver={over}
            onPointerOut={out}
          >
            <planeGeometry args={[CARD_W, CARD_D]} />
            <meshBasicMaterial map={back} transparent alphaTest={0.35} toneMapped={false} />
          </mesh>
          <mesh
            rotation-x={Math.PI / 2}
            position={[0, -0.04, 0]}
            onClick={pick}
            onPointerOver={over}
            onPointerOut={out}
          >
            <planeGeometry args={[CARD_W, CARD_D]} />
            <meshBasicMaterial map={front} transparent alphaTest={0.35} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

interface CardGridProps {
  cards: string[];
  revealed: number[];
  removed: number[];
  matched: number[];
  faceUp: boolean;
  playable: boolean;
  pendingIndex: number | null;
  dishId?: string;
  /** Both seats' open cards for shared visibility (duel). */
  seatOpens?: [number[], number[]];
  /** Cards this player already has open — only these (plus blocked) lock clicks. */
  lockedOpens?: number[];
  blocked?: number[];
  onPick: (index: number) => void;
}

export function CardGrid({
  cards,
  revealed,
  removed,
  matched,
  faceUp,
  playable,
  pendingIndex,
  dishId,
  seatOpens,
  lockedOpens,
  blocked,
  onPick,
}: CardGridProps) {
  const openSet = useMemo(() => {
    if (!seatOpens) return new Set(revealed);
    return new Set([...seatOpens[0], ...seatOpens[1]]);
  }, [revealed, seatOpens]);
  const lockSet = useMemo(() => {
    if (lockedOpens) return new Set(lockedOpens);
    return openSet;
  }, [lockedOpens, openSet]);
  const goneSet = useMemo(() => new Set(removed), [removed]);
  const matchedSet = useMemo(() => new Set(matched), [matched]);
  const blockedSet = useMemo(() => new Set(blocked ?? []), [blocked]);
  const p1 = useMemo(() => new Set(seatOpens?.[0] ?? []), [seatOpens]);
  const p2 = useMemo(() => new Set(seatOpens?.[1] ?? []), [seatOpens]);
  return (
    <group>
      {cards.map((id, index) => {
        const gone = goneSet.has(index);
        const isOpen = !gone && (faceUp || openSet.has(index));
        const owners = (p1.has(index) ? 1 : 0) + (p2.has(index) ? 2 : 0);
        const seatMark = owners === 3 ? 'both' : owners === 1 ? 'p1' : owners === 2 ? 'p2' : null;
        const mark = gone ? null : matchedSet.has(index) ? 'good' : seatMark ?? (openSet.has(index) ? 'held' : null);
        return (
          <Card
            key={`${index}-${id}`}
            index={index}
            ingredientId={id}
            dishId={dishId}
            faceUp={isOpen}
            playable={playable && !gone && !lockSet.has(index) && !blockedSet.has(index)}
            pending={pendingIndex === index}
            gone={gone}
            mark={mark}
            onPick={onPick}
          />
        );
      })}
    </group>
  );
}
