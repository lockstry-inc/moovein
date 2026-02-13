import { useRef, useMemo, Suspense, lazy } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

const COW_POINTS = 3500
const PERSON_POINTS = 1200

// ---------------------------------------------------------------------------
// Procedural cow built from composed primitive geometries
// ---------------------------------------------------------------------------
function buildCowGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []

  // Body — main barrel
  const body = new THREE.SphereGeometry(1, 32, 20)
  body.scale(1.4, 0.85, 0.75)
  parts.push(body)

  // Neck bridge
  const neck = new THREE.CylinderGeometry(0.35, 0.42, 0.5, 12)
  neck.rotateZ(Math.PI / 2)
  neck.translate(1.0, 0.15, 0)
  parts.push(neck)

  // Head
  const head = new THREE.SphereGeometry(0.44, 20, 14)
  head.translate(1.38, 0.3, 0)
  parts.push(head)

  // Snout
  const snout = new THREE.SphereGeometry(0.22, 12, 8)
  snout.scale(1, 0.8, 0.9)
  snout.translate(1.74, 0.14, 0)
  parts.push(snout)

  // --- Legs (4) ---
  const legGeo = new THREE.CylinderGeometry(0.12, 0.10, 0.85, 8)
  const fl = legGeo.clone(); fl.translate(0.72, -0.88, 0.35)
  const fr = legGeo.clone(); fr.translate(0.72, -0.88, -0.35)
  const bl = legGeo.clone(); bl.translate(-0.72, -0.88, 0.35)
  const br = legGeo.clone(); br.translate(-0.72, -0.88, -0.35)
  parts.push(fl, fr, bl, br)

  // Hooves
  const hoofGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.07, 8)
  const hfl = hoofGeo.clone(); hfl.translate(0.72, -1.34, 0.35)
  const hfr = hoofGeo.clone(); hfr.translate(0.72, -1.34, -0.35)
  const hbl = hoofGeo.clone(); hbl.translate(-0.72, -1.34, 0.35)
  const hbr = hoofGeo.clone(); hbr.translate(-0.72, -1.34, -0.35)
  parts.push(hfl, hfr, hbl, hbr)

  // --- Horns ---
  const hornGeo = new THREE.ConeGeometry(0.05, 0.30, 6)
  const hl = hornGeo.clone(); hl.rotateZ(0.35); hl.translate(1.28, 0.74, 0.18)
  const hr = hornGeo.clone(); hr.rotateZ(0.35); hr.translate(1.28, 0.74, -0.18)
  parts.push(hl, hr)

  // --- Ears ---
  const earGeo = new THREE.SphereGeometry(0.10, 8, 6)
  earGeo.scale(1, 0.4, 1.4)
  const el = earGeo.clone(); el.translate(1.18, 0.56, 0.34)
  const er = earGeo.clone(); er.translate(1.18, 0.56, -0.34)
  parts.push(el, er)

  // --- Tail ---
  const tail = new THREE.CylinderGeometry(0.04, 0.03, 0.65, 6)
  tail.rotateZ(-0.55)
  tail.translate(-1.55, 0.22, 0)
  parts.push(tail)

  const tuft = new THREE.SphereGeometry(0.06, 6, 4)
  tuft.translate(-1.78, 0.48, 0)
  parts.push(tuft)

  // --- Udder ---
  const udder = new THREE.SphereGeometry(0.14, 8, 6)
  udder.translate(-0.35, -0.62, 0)
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

  // Person positioned at cow's head, facing same direction
  const px = 2.15

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
  // Left leg (slightly forward)
  const lThigh = new THREE.CylinderGeometry(0.08, 0.07, 0.42, 8)
  lThigh.translate(px + 0.03, -0.55, 0)
  parts.push(lThigh)

  const lShin = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 8)
  lShin.translate(px + 0.03, -0.95, 0)
  parts.push(lShin)

  const lFoot = new THREE.BoxGeometry(0.12, 0.05, 0.08)
  lFoot.translate(px + 0.04, -1.19, 0)
  parts.push(lFoot)

  // Right leg (slightly back)
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
  // Left arm (reaching toward cow — holding lead)
  const lUpperArm = new THREE.CylinderGeometry(0.055, 0.048, 0.30, 8)
  lUpperArm.rotateZ(0.4)
  lUpperArm.translate(px + 0.20, 0.16, 0)
  parts.push(lUpperArm)

  const lForearm = new THREE.CylinderGeometry(0.045, 0.038, 0.26, 8)
  lForearm.rotateZ(0.7)
  lForearm.translate(px + 0.34, 0.01, 0)
  parts.push(lForearm)

  // Right arm (relaxed at side)
  const rUpperArm = new THREE.CylinderGeometry(0.055, 0.048, 0.30, 8)
  rUpperArm.rotateZ(-0.15)
  rUpperArm.translate(px - 0.11, 0.14, 0)
  parts.push(rUpperArm)

  const rForearm = new THREE.CylinderGeometry(0.045, 0.038, 0.26, 8)
  rForearm.rotateZ(-0.3)
  rForearm.translate(px - 0.17, -0.06, 0)
  parts.push(rForearm)

  // Hat brim (nice silhouette touch)
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
  const randoms = new Float32Array(count) // per-point random seed

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
// Custom shader for round, glowing points
// ---------------------------------------------------------------------------
const vertexShader = /* glsl */ `
  attribute vec3 aNormal;
  attribute float aRandom;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vOpacity;

  void main() {
    // Breathing: displace along surface normal
    float phase = uTime * 0.7 + aRandom * 6.2831;
    float breath = sin(phase) * 0.02;
    vec3 pos = position + aNormal * breath;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    // Tiny point sizes — true point cloud look
    float size = (0.4 + aRandom * 0.6) * uPixelRatio;
    gl_PointSize = size * (25.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;

    // Vary opacity — some bright, some faint
    vOpacity = 0.2 + aRandom * 0.6;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;

  void main() {
    // Circular point with tight soft edge
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
    uColor: { value: new THREE.Color('#2dd4a0') },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }), [])

  const personUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#2dd4a0') },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Cow: gentle weight-shifting sway + subtle bob
    if (cowRef.current) {
      cowRef.current.rotation.z = Math.sin(t * 0.5) * 0.012
      cowRef.current.position.y = Math.sin(t * 0.3) * 0.008
    }

    // Person: slight weight shift, different phase
    if (personRef.current) {
      personRef.current.rotation.z = Math.sin(t * 0.4 + 1.2) * 0.018
      personRef.current.position.y = Math.sin(t * 0.35 + 0.7) * 0.006
    }

    if (cowMatRef.current) cowMatRef.current.uniforms.uTime.value = t
    if (personMatRef.current) personMatRef.current.uniforms.uTime.value = t
  })

  return (
    <group position={[-0.25, 0.25, 0]} rotation={[0.05, 0, 0]}>
      {/* Cow */}
      <group ref={cowRef}>
        <points geometry={cowGeo}>
          <shaderMaterial
            ref={cowMatRef}
            vertexShader={vertexShader}
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
            vertexShader={vertexShader}
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

// Lazy-loadable wrapper for HeroSection
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
