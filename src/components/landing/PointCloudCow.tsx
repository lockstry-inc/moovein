import { useRef, useMemo, Suspense, lazy } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

const COW_POINTS = 4500
const PERSON_POINTS = 1500

// ---------------------------------------------------------------------------
// Procedural cow built from composed primitive geometries
// ---------------------------------------------------------------------------
function buildCowGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []

  // Body — elongated barrel, flat top and bottom (not round)
  // Use a cylinder on its side for a boxy barrel shape
  const bodyBarrel = new THREE.CylinderGeometry(0.6, 0.6, 2.6, 16, 1)
  bodyBarrel.rotateZ(Math.PI / 2)
  bodyBarrel.scale(1, 1, 0.85) // slightly narrower side-to-side
  parts.push(bodyBarrel)

  // Belly rounding (slight sag underneath)
  const belly = new THREE.SphereGeometry(0.5, 16, 10)
  belly.scale(2.0, 0.35, 0.7)
  belly.translate(0, -0.35, 0)
  parts.push(belly)

  // Back ridge (flat along the top)
  const back = new THREE.CylinderGeometry(0.15, 0.15, 2.2, 8, 1)
  back.rotateZ(Math.PI / 2)
  back.translate(0, 0.52, 0)
  parts.push(back)

  // Shoulder hump
  const shoulder = new THREE.SphereGeometry(0.35, 12, 10)
  shoulder.scale(0.8, 0.7, 0.7)
  shoulder.translate(0.6, 0.45, 0)
  parts.push(shoulder)

  // Rump (rear hip)
  const rump = new THREE.SphereGeometry(0.38, 12, 10)
  rump.scale(0.7, 0.65, 0.7)
  rump.translate(-0.9, 0.2, 0)
  parts.push(rump)

  // Neck — angled upward from shoulder
  const neck = new THREE.CylinderGeometry(0.28, 0.35, 0.6, 12)
  neck.rotateZ(Math.PI / 2 - 0.35)
  neck.translate(1.35, 0.35, 0)
  parts.push(neck)

  // Head — flatter, more angular
  const head = new THREE.SphereGeometry(0.36, 16, 12)
  head.scale(1.2, 0.85, 0.8) // elongated, flat on top
  head.translate(1.65, 0.5, 0)
  parts.push(head)

  // Snout / muzzle — boxy
  const snout = new THREE.CylinderGeometry(0.16, 0.18, 0.25, 10)
  snout.rotateZ(Math.PI / 2)
  snout.translate(2.0, 0.35, 0)
  parts.push(snout)

  // Jaw line
  const jaw = new THREE.SphereGeometry(0.12, 8, 6)
  jaw.scale(1.3, 0.5, 0.8)
  jaw.translate(1.85, 0.22, 0)
  parts.push(jaw)

  // --- Legs (4) — longer, thinner, clearly visible ---
  const legGeo = new THREE.CylinderGeometry(0.09, 0.07, 1.0, 8)

  // Front legs
  const fl = legGeo.clone(); fl.translate(0.85, -1.05, 0.3)
  const fr = legGeo.clone(); fr.translate(0.85, -1.05, -0.3)
  parts.push(fl, fr)

  // Rear legs (slightly thicker at top)
  const rearLegGeo = new THREE.CylinderGeometry(0.11, 0.07, 1.0, 8)
  const bl = rearLegGeo.clone(); bl.translate(-0.85, -1.05, 0.3)
  const br = rearLegGeo.clone(); br.translate(-0.85, -1.05, -0.3)
  parts.push(bl, br)

  // Hooves — small flat cylinders
  const hoofGeo = new THREE.CylinderGeometry(0.09, 0.10, 0.06, 8)
  const hfl = hoofGeo.clone(); hfl.translate(0.85, -1.58, 0.3)
  const hfr = hoofGeo.clone(); hfr.translate(0.85, -1.58, -0.3)
  const hbl = hoofGeo.clone(); hbl.translate(-0.85, -1.58, 0.3)
  const hbr = hoofGeo.clone(); hbr.translate(-0.85, -1.58, -0.3)
  parts.push(hfl, hfr, hbl, hbr)

  // Knee joints (subtle bumps)
  const kneeGeo = new THREE.SphereGeometry(0.08, 6, 4)
  const kfl = kneeGeo.clone(); kfl.translate(0.85, -0.7, 0.3)
  const kfr = kneeGeo.clone(); kfr.translate(0.85, -0.7, -0.3)
  const kbl = kneeGeo.clone(); kbl.translate(-0.85, -0.7, 0.3)
  const kbr = kneeGeo.clone(); kbr.translate(-0.85, -0.7, -0.3)
  parts.push(kfl, kfr, kbl, kbr)

  // --- Horns ---
  const hornGeo = new THREE.ConeGeometry(0.04, 0.28, 6)
  const hl = hornGeo.clone(); hl.rotateZ(0.3); hl.translate(1.52, 0.88, 0.16)
  const hr = hornGeo.clone(); hr.rotateZ(0.3); hr.translate(1.52, 0.88, -0.16)
  parts.push(hl, hr)

  // --- Ears --- (flatter, more prominent)
  const earGeo = new THREE.SphereGeometry(0.09, 8, 6)
  earGeo.scale(1.2, 0.35, 1.6)
  const el = earGeo.clone(); el.translate(1.45, 0.72, 0.30)
  const er = earGeo.clone(); er.translate(1.45, 0.72, -0.30)
  parts.push(el, er)

  // --- Tail --- (longer, starts at rump)
  const tail = new THREE.CylinderGeometry(0.035, 0.025, 0.75, 6)
  tail.rotateZ(-0.5)
  tail.translate(-1.6, 0.1, 0)
  parts.push(tail)

  const tuft = new THREE.SphereGeometry(0.055, 6, 4)
  tuft.translate(-1.88, 0.38, 0)
  parts.push(tuft)

  // --- Udder ---
  const udder = new THREE.SphereGeometry(0.12, 8, 6)
  udder.translate(-0.3, -0.65, 0)
  parts.push(udder)

  const nonIndexed = parts.map(p => p.index ? p.toNonIndexed() : p)
  const merged = mergeGeometries(nonIndexed, false)
  if (!merged) throw new Error('Failed to merge cow geometry')
  merged.computeVertexNormals()
  return merged
}

// ---------------------------------------------------------------------------
// Procedural person standing next to the cow
// ---------------------------------------------------------------------------
function buildPersonGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const px = 2.35

  // Head
  const head = new THREE.SphereGeometry(0.15, 14, 10)
  head.translate(px, 0.58, 0)
  parts.push(head)

  // Neck
  const neck = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8)
  neck.translate(px, 0.42, 0)
  parts.push(neck)

  // Torso
  const torso = new THREE.CylinderGeometry(0.14, 0.17, 0.6, 10)
  torso.translate(px, 0.06, 0)
  parts.push(torso)

  // Shoulders
  const shoulders = new THREE.SphereGeometry(0.16, 10, 8)
  shoulders.scale(1.2, 0.4, 0.8)
  shoulders.translate(px, 0.30, 0)
  parts.push(shoulders)

  // Pelvis / hips
  const hips = new THREE.SphereGeometry(0.16, 10, 8)
  hips.scale(1, 0.5, 0.7)
  hips.translate(px, -0.26, 0)
  parts.push(hips)

  // --- Legs ---
  const lThigh = new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8)
  lThigh.translate(px + 0.03, -0.55, 0)
  parts.push(lThigh)

  const lShin = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 8)
  lShin.translate(px + 0.03, -0.95, 0)
  parts.push(lShin)

  const lFoot = new THREE.BoxGeometry(0.12, 0.05, 0.08)
  lFoot.translate(px + 0.04, -1.19, 0)
  parts.push(lFoot)

  const rThigh = new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8)
  rThigh.translate(px - 0.04, -0.55, 0)
  parts.push(rThigh)

  const rShin = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 8)
  rShin.translate(px - 0.04, -0.95, 0)
  parts.push(rShin)

  const rFoot = new THREE.BoxGeometry(0.12, 0.05, 0.08)
  rFoot.translate(px - 0.03, -1.19, 0)
  parts.push(rFoot)

  // --- Arms ---
  const lUpperArm = new THREE.CylinderGeometry(0.055, 0.048, 0.30, 8)
  lUpperArm.rotateZ(0.4)
  lUpperArm.translate(px + 0.20, 0.16, 0)
  parts.push(lUpperArm)

  const lForearm = new THREE.CylinderGeometry(0.045, 0.038, 0.26, 8)
  lForearm.rotateZ(0.7)
  lForearm.translate(px + 0.34, 0.01, 0)
  parts.push(lForearm)

  const rUpperArm = new THREE.CylinderGeometry(0.055, 0.048, 0.30, 8)
  rUpperArm.rotateZ(-0.15)
  rUpperArm.translate(px - 0.11, 0.14, 0)
  parts.push(rUpperArm)

  const rForearm = new THREE.CylinderGeometry(0.045, 0.038, 0.26, 8)
  rForearm.rotateZ(-0.3)
  rForearm.translate(px - 0.17, -0.06, 0)
  parts.push(rForearm)

  // Hat brim
  const brim = new THREE.CylinderGeometry(0.14, 0.17, 0.03, 12)
  brim.translate(px, 0.71, 0)
  parts.push(brim)

  // Hat crown
  const crown = new THREE.CylinderGeometry(0.10, 0.12, 0.12, 10)
  crown.translate(px, 0.78, 0)
  parts.push(crown)

  const nonIndexed = parts.map(p => p.index ? p.toNonIndexed() : p)
  const merged = mergeGeometries(nonIndexed, false)
  if (!merged) throw new Error('Failed to merge person geometry')
  merged.computeVertexNormals()
  return merged
}

// ---------------------------------------------------------------------------
// Sample points from a surface
// ---------------------------------------------------------------------------
function samplePoints(geometry: THREE.BufferGeometry, count: number) {
  const tempMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
  const sampler = new MeshSurfaceSampler(tempMesh)
    .setWeightAttribute(null)
    .build()

  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const randoms = new Float32Array(count)

  const _pos = new THREE.Vector3()
  const _norm = new THREE.Vector3()

  for (let i = 0; i < count; i++) {
    sampler.sample(_pos, _norm)
    positions[i * 3]     = _pos.x
    positions[i * 3 + 1] = _pos.y
    positions[i * 3 + 2] = _pos.z
    normals[i * 3]       = _norm.x
    normals[i * 3 + 1]   = _norm.y
    normals[i * 3 + 2]   = _norm.z
    randoms[i] = Math.random()
  }

  return { positions, normals, randoms }
}

// ---------------------------------------------------------------------------
// Cow shader — tail wag, head bob, body breathing
// ---------------------------------------------------------------------------
const cowVertexShader = /* glsl */ `
  attribute vec3 aNormal;
  attribute float aRandom;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vOpacity;

  void main() {
    // Particle breathing
    float phase = uTime * 0.7 + aRandom * 6.2831;
    float breath = sin(phase) * 0.02;
    vec3 pos = position + aNormal * breath;

    // Tail wag — points in tail region swing laterally
    float tailFactor = smoothstep(-1.1, -1.9, pos.x);
    pos.z += sin(uTime * 2.8) * 0.18 * tailFactor;
    pos.y += sin(uTime * 2.8 + 0.8) * 0.10 * tailFactor;

    // Head bob — gentle nod and drift
    float headFactor = smoothstep(1.2, 1.8, pos.x);
    pos.y += sin(uTime * 1.0) * 0.05 * headFactor;
    pos.x += sin(uTime * 0.8 + 1.0) * 0.03 * headFactor;

    // Ear flick
    float earFactor = smoothstep(0.6, 0.8, pos.y) * smoothstep(1.2, 1.5, pos.x);
    pos.y += sin(uTime * 3.5 + 2.0) * 0.025 * earFactor;

    // Leg shifting — front legs shift slightly
    float legFactor = smoothstep(-0.5, -1.2, pos.y) * (1.0 - tailFactor);
    pos.x += sin(uTime * 0.6 + pos.z * 2.0) * 0.015 * legFactor;

    // Whole-body breathing (rib cage expand)
    float bodyBreath = sin(uTime * 0.6) * 0.015;
    pos.y += bodyBreath * smoothstep(-0.6, 0.3, pos.y);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float size = (0.4 + aRandom * 0.6) * uPixelRatio;
    gl_PointSize = size * (25.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
    vOpacity = 0.25 + aRandom * 0.55;
  }
`

// ---------------------------------------------------------------------------
// Person shader — weight shift, arm swing, upper body sway
// ---------------------------------------------------------------------------
const personVertexShader = /* glsl */ `
  attribute vec3 aNormal;
  attribute float aRandom;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vOpacity;

  void main() {
    // Particle breathing
    float phase = uTime * 0.7 + aRandom * 6.2831;
    float breath = sin(phase) * 0.015;
    vec3 pos = position + aNormal * breath;

    // Weight shift — upper body sways, feet stay planted
    float heightRatio = smoothstep(-1.2, 0.7, pos.y);
    pos.x += sin(uTime * 0.7 + 2.0) * 0.045 * heightRatio;

    // Subtle forward-back lean
    pos.y += sin(uTime * 0.5 + 1.5) * 0.015 * heightRatio;

    // Arm swing — points far from torso center x
    float armDist = abs(pos.x - 2.35);
    float armFactor = smoothstep(0.08, 0.3, armDist);
    pos.y += sin(uTime * 1.4 + aRandom * 3.14) * 0.035 * armFactor;
    pos.x += sin(uTime * 1.2) * 0.02 * armFactor;

    // Head look (slight)
    float headFactor = smoothstep(0.5, 0.7, pos.y);
    pos.x += sin(uTime * 0.9 + 0.5) * 0.02 * headFactor;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float size = (0.4 + aRandom * 0.6) * uPixelRatio;
    gl_PointSize = size * (25.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
    vOpacity = 0.25 + aRandom * 0.55;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.3, d) * vOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`

// ---------------------------------------------------------------------------
// Helper: create point cloud buffer geometry from sampled surface
// ---------------------------------------------------------------------------
function makePointGeo(surfaceGeo: THREE.BufferGeometry, count: number) {
  const { positions, normals, randoms } = samplePoints(surfaceGeo, count)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3))
  geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
  return geo
}

// ---------------------------------------------------------------------------
// The animated point cloud scene — side profile, cow + person
// ---------------------------------------------------------------------------
function ScenePoints() {
  const cowRef = useRef<THREE.Group>(null)
  const personRef = useRef<THREE.Group>(null)
  const cowMatRef = useRef<THREE.ShaderMaterial>(null)
  const personMatRef = useRef<THREE.ShaderMaterial>(null)

  const cowGeo = useMemo(() => makePointGeo(buildCowGeometry(), COW_POINTS), [])
  const personGeo = useMemo(() => makePointGeo(buildPersonGeometry(), PERSON_POINTS), [])

  const cowUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffffff') },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }), [])

  const personUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffffff') },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Cow: gentle whole-body sway
    if (cowRef.current) {
      cowRef.current.rotation.z = Math.sin(t * 0.5) * 0.02
      cowRef.current.position.y = Math.sin(t * 0.3) * 0.015
    }

    // Person: rhythmic weight shift
    if (personRef.current) {
      personRef.current.rotation.z = Math.sin(t * 0.4 + 1.2) * 0.025
      personRef.current.position.y = Math.sin(t * 0.35 + 0.7) * 0.012
    }

    if (cowMatRef.current) cowMatRef.current.uniforms.uTime.value = t
    if (personMatRef.current) personMatRef.current.uniforms.uTime.value = t
  })

  return (
    <group position={[-0.3, 0.2, 0]} rotation={[0.05, 0, 0]}>
      {/* Cow — scaled down to 85% so person feels proportional */}
      <group ref={cowRef} scale={[0.85, 0.85, 0.85]}>
        <points geometry={cowGeo}>
          <shaderMaterial
            ref={cowMatRef}
            vertexShader={cowVertexShader}
            fragmentShader={fragmentShader}
            uniforms={cowUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Person */}
      <group ref={personRef}>
        <points geometry={personGeo}>
          <shaderMaterial
            ref={personMatRef}
            vertexShader={personVertexShader}
            fragmentShader={fragmentShader}
            uniforms={personUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Wrapper with Canvas — lazy-loadable
// ---------------------------------------------------------------------------
function PointCloudCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 30 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <ScenePoints />
    </Canvas>
  )
}

const LazyCanvas = lazy(() => Promise.resolve({ default: PointCloudCanvas }))

export default function PointCloudCow() {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: 600, height: 320 }}>
      <Suspense fallback={
        <div
          className="w-[100px] h-[100px] rounded-[20px] overflow-hidden mx-auto"
          style={{ background: '#0e1014', marginTop: 90 }}
        >
          <img
            src="/moovein.png"
            alt="Moove In"
            className="w-full h-full object-cover"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      }>
        <LazyCanvas />
      </Suspense>
    </div>
  )
}
