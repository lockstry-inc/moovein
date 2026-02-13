import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useRef, useMemo, useContext, createContext } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

const ThemeContext = createContext<'dark' | 'light'>('dark')

const IDLE_MS = 60_000 // 1 minute
const COW_POINTS = 3000
const GRASS_POINTS = 800

// ---------------------------------------------------------------------------
// Procedural cow geometry (same as PointCloudCow)
// ---------------------------------------------------------------------------
function buildCowGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []

  const bodyBarrel = new THREE.CylinderGeometry(0.6, 0.6, 2.6, 16, 1)
  bodyBarrel.rotateZ(Math.PI / 2)
  bodyBarrel.scale(1, 1, 0.85)
  parts.push(bodyBarrel)

  const belly = new THREE.SphereGeometry(0.5, 16, 10)
  belly.scale(2.0, 0.35, 0.7)
  belly.translate(0, -0.35, 0)
  parts.push(belly)

  const back = new THREE.CylinderGeometry(0.15, 0.15, 2.2, 8, 1)
  back.rotateZ(Math.PI / 2)
  back.translate(0, 0.52, 0)
  parts.push(back)

  const shoulder = new THREE.SphereGeometry(0.35, 12, 10)
  shoulder.scale(0.8, 0.7, 0.7)
  shoulder.translate(0.6, 0.45, 0)
  parts.push(shoulder)

  const rump = new THREE.SphereGeometry(0.38, 12, 10)
  rump.scale(0.7, 0.65, 0.7)
  rump.translate(-0.9, 0.2, 0)
  parts.push(rump)

  const neck = new THREE.CylinderGeometry(0.22, 0.28, 0.85, 12)
  neck.rotateZ(Math.PI / 2 + 0.85)
  neck.translate(1.35, -0.25, 0)
  parts.push(neck)

  const head = new THREE.SphereGeometry(0.34, 16, 12)
  head.scale(1.1, 0.85, 0.8)
  head.translate(1.55, -0.95, 0)
  parts.push(head)

  const snout = new THREE.CylinderGeometry(0.15, 0.17, 0.22, 10)
  snout.rotateZ(Math.PI / 2 + 0.4)
  snout.translate(1.65, -1.25, 0)
  parts.push(snout)

  const jaw = new THREE.SphereGeometry(0.11, 8, 6)
  jaw.scale(1.2, 0.5, 0.8)
  jaw.translate(1.58, -1.38, 0)
  parts.push(jaw)

  const legGeo = new THREE.CylinderGeometry(0.09, 0.07, 1.0, 8)
  const fl = legGeo.clone(); fl.translate(0.85, -1.05, 0.3)
  const fr = legGeo.clone(); fr.translate(0.85, -1.05, -0.3)
  parts.push(fl, fr)

  const rearLegGeo = new THREE.CylinderGeometry(0.11, 0.07, 1.0, 8)
  const bl = rearLegGeo.clone(); bl.translate(-0.85, -1.05, 0.3)
  const br = rearLegGeo.clone(); br.translate(-0.85, -1.05, -0.3)
  parts.push(bl, br)

  const hoofGeo = new THREE.CylinderGeometry(0.09, 0.10, 0.06, 8)
  const hfl = hoofGeo.clone(); hfl.translate(0.85, -1.58, 0.3)
  const hfr = hoofGeo.clone(); hfr.translate(0.85, -1.58, -0.3)
  const hbl = hoofGeo.clone(); hbl.translate(-0.85, -1.58, 0.3)
  const hbr = hoofGeo.clone(); hbr.translate(-0.85, -1.58, -0.3)
  parts.push(hfl, hfr, hbl, hbr)

  const kneeGeo = new THREE.SphereGeometry(0.08, 6, 4)
  const kfl = kneeGeo.clone(); kfl.translate(0.85, -0.7, 0.3)
  const kfr = kneeGeo.clone(); kfr.translate(0.85, -0.7, -0.3)
  const kbl = kneeGeo.clone(); kbl.translate(-0.85, -0.7, 0.3)
  const kbr = kneeGeo.clone(); kbr.translate(-0.85, -0.7, -0.3)
  parts.push(kfl, kfr, kbl, kbr)

  const hornGeo = new THREE.ConeGeometry(0.04, 0.28, 6)
  const hl = hornGeo.clone(); hl.rotateZ(0.3); hl.translate(1.48, -0.60, 0.16)
  const hr = hornGeo.clone(); hr.rotateZ(0.3); hr.translate(1.48, -0.60, -0.16)
  parts.push(hl, hr)

  const earGeo = new THREE.SphereGeometry(0.09, 8, 6)
  earGeo.scale(1.2, 0.35, 1.6)
  const el = earGeo.clone(); el.translate(1.42, -0.72, 0.30)
  const er = earGeo.clone(); er.translate(1.42, -0.72, -0.30)
  parts.push(el, er)

  const tail = new THREE.CylinderGeometry(0.07, 0.04, 0.6, 8)
  tail.rotateZ(-0.9)
  tail.translate(-1.42, -0.15, 0)
  parts.push(tail)

  const tuft = new THREE.SphereGeometry(0.08, 8, 6)
  tuft.translate(-1.58, -0.42, 0)
  parts.push(tuft)

  const udder = new THREE.SphereGeometry(0.12, 8, 6)
  udder.translate(-0.3, -0.65, 0)
  parts.push(udder)

  const nonIndexed = parts.map(p => p.index ? p.toNonIndexed() : p)
  const merged = mergeGeometries(nonIndexed, false)
  if (!merged) throw new Error('Failed to merge cow geometry')
  merged.computeVertexNormals()
  return merged
}

function buildGrassGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const ground = new THREE.PlaneGeometry(5.5, 1.8, 20, 8)
  ground.rotateX(-Math.PI / 2)
  ground.translate(0.1, -1.62, 0)
  parts.push(ground)

  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.4) * 5.0
    const z = (Math.random() - 0.5) * 1.4
    const h = 0.12 + Math.random() * 0.25
    const blade = new THREE.CylinderGeometry(0.008, 0.014, h, 3)
    blade.translate(x, -1.62 + h / 2, z)
    parts.push(blade)
  }

  for (let i = 0; i < 12; i++) {
    const x = 0.8 + Math.random() * 1.5
    const z = (Math.random() - 0.5) * 1.0
    const h = 0.18 + Math.random() * 0.30
    const t = new THREE.CylinderGeometry(0.006, 0.015, h, 3)
    t.translate(x, -1.62 + h / 2, z)
    parts.push(t)
  }

  const nonIndexed = parts.map(p => p.index ? p.toNonIndexed() : p)
  const merged = mergeGeometries(nonIndexed, false)
  if (!merged) throw new Error('Failed to merge grass geometry')
  merged.computeVertexNormals()
  return merged
}

function samplePoints(geometry: THREE.BufferGeometry, count: number) {
  const tempMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
  const sampler = new MeshSurfaceSampler(tempMesh).setWeightAttribute(null).build()
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const randoms = new Float32Array(count)
  const _pos = new THREE.Vector3()
  const _norm = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    sampler.sample(_pos, _norm)
    positions[i * 3] = _pos.x
    positions[i * 3 + 1] = _pos.y
    positions[i * 3 + 2] = _pos.z
    normals[i * 3] = _norm.x
    normals[i * 3 + 1] = _norm.y
    normals[i * 3 + 2] = _norm.z
    randoms[i] = Math.random()
  }
  return { positions, normals, randoms }
}

const vertexShader = /* glsl */ `
  attribute vec3 aNormal;
  attribute float aRandom;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vOpacity;

  void main() {
    float phase = uTime * 0.7 + aRandom * 6.2831;
    float breath = sin(phase) * 0.02;
    vec3 pos = position + aNormal * breath;

    float cycle = mod(uTime, 8.0);
    float liftAngle = 1.1;
    float headAngle;

    if (cycle < 3.0) {
      headAngle = sin(uTime * 4.0) * 0.04;
    } else if (cycle < 4.5) {
      float t = smoothstep(3.0, 4.5, cycle);
      headAngle = mix(0.0, liftAngle, t);
    } else if (cycle < 6.5) {
      headAngle = liftAngle + sin(uTime * 5.0) * 0.06;
    } else {
      float t = smoothstep(6.5, 8.0, cycle);
      headAngle = mix(liftAngle, 0.0, t);
    }

    float neckFactor = smoothstep(1.0, 1.4, pos.x);
    float pivotX = 0.95;
    float pivotY = -0.1;
    float dx = pos.x - pivotX;
    float dy = pos.y - pivotY;
    float angle = headAngle * neckFactor;
    float c = cos(angle);
    float s = sin(angle);
    pos.x = pivotX + dx * c - dy * s;
    pos.y = pivotY + dx * s + dy * c;

    float tailFactor = smoothstep(-1.1, -1.6, pos.x) * smoothstep(0.3, -0.2, pos.y);
    pos.z += sin(uTime * 2.8) * 0.14 * tailFactor;
    pos.y += sin(uTime * 2.8 + 0.8) * 0.06 * tailFactor;

    float earActive = smoothstep(4.0, 4.5, cycle) * (1.0 - smoothstep(6.5, 7.0, cycle));
    float earFactor = step(0.3, neckFactor) * earActive;
    pos.y += sin(uTime * 3.5 + 2.0) * 0.03 * earFactor;

    float legFactor = smoothstep(-0.5, -1.2, pos.y) * (1.0 - tailFactor);
    pos.x += sin(uTime * 0.6 + pos.z * 2.0) * 0.015 * legFactor;

    float bodyBreath = sin(uTime * 0.6) * 0.015;
    pos.y += bodyBreath * smoothstep(-0.6, 0.3, pos.y);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float size = (0.4 + aRandom * 0.6) * uPixelRatio;
    gl_PointSize = size * (25.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
    vOpacity = 0.25 + aRandom * 0.55;
  }
`

const grassVertexShader = /* glsl */ `
  attribute vec3 aNormal;
  attribute float aRandom;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vOpacity;

  void main() {
    vec3 pos = position;
    float heightAboveGround = max(pos.y - (-1.65), 0.0);
    float wind = sin(uTime * 1.5 + pos.x * 2.0 + aRandom * 4.0) * 0.03 * heightAboveGround;
    pos.x += wind;
    pos.z += sin(uTime * 1.2 + pos.x * 1.5) * 0.01 * heightAboveGround;

    float phase = uTime * 0.5 + aRandom * 6.2831;
    pos.y += sin(phase) * 0.005;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float size = (0.3 + aRandom * 0.5) * uPixelRatio;
    gl_PointSize = size * (20.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
    vOpacity = 0.2 + aRandom * 0.5;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacityBoost;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.3, d) * vOpacity * uOpacityBoost;
    gl_FragColor = vec4(uColor, min(alpha, 1.0));
  }
`

function makePointGeo(surfaceGeo: THREE.BufferGeometry, count: number) {
  const { positions, normals, randoms } = samplePoints(surfaceGeo, count)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3))
  geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))
  return geo
}

function MiniScenePoints() {
  const theme = useContext(ThemeContext)
  const cowRef = useRef<THREE.Group>(null)
  const cowMatRef = useRef<THREE.ShaderMaterial>(null)
  const grassMatRef = useRef<THREE.ShaderMaterial>(null)

  const cowGeo = useMemo(() => makePointGeo(buildCowGeometry(), COW_POINTS), [])
  const grassGeo = useMemo(() => makePointGeo(buildGrassGeometry(), GRASS_POINTS), [])

  const cowUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffffff') },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uOpacityBoost: { value: 1.0 },
  }), [])

  const grassUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#2dd4a0') },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uOpacityBoost: { value: 1.0 },
  }), [])

  const isLight = theme === 'light'
  const cowColor = isLight ? '#000000' : '#ffffff'
  const grassColor = isLight ? '#057a42' : '#2dd4a0'
  const blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending
  const cowOpacityBoost = isLight ? 2.8 : 1.0
  const grassOpacityBoost = isLight ? 4.5 : 1.0

  useMemo(() => {
    cowUniforms.uColor.value.set(cowColor)
    cowUniforms.uOpacityBoost.value = cowOpacityBoost
    grassUniforms.uColor.value.set(grassColor)
    grassUniforms.uOpacityBoost.value = grassOpacityBoost
    if (cowMatRef.current) {
      cowMatRef.current.blending = blending
      cowMatRef.current.needsUpdate = true
    }
    if (grassMatRef.current) {
      grassMatRef.current.blending = blending
      grassMatRef.current.needsUpdate = true
    }
  }, [cowColor, grassColor, blending, cowOpacityBoost, grassOpacityBoost, cowUniforms, grassUniforms])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (cowRef.current) {
      cowRef.current.rotation.z = Math.sin(t * 0.5) * 0.02
      cowRef.current.position.y = Math.sin(t * 0.3) * 0.015
    }
    if (cowMatRef.current) cowMatRef.current.uniforms.uTime.value = t
    if (grassMatRef.current) grassMatRef.current.uniforms.uTime.value = t
  })

  return (
    <group position={[0, 0.2, 0]} rotation={[0.05, 0, 0]}>
      <group ref={cowRef}>
        <points geometry={cowGeo}>
          <shaderMaterial
            ref={cowMatRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={cowUniforms}
            transparent
            blending={blending}
            depthWrite={false}
          />
        </points>
      </group>
      <points geometry={grassGeo}>
        <shaderMaterial
          ref={grassMatRef}
          vertexShader={grassVertexShader}
          fragmentShader={fragmentShader}
          uniforms={grassUniforms}
          transparent
          blending={blending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ---------------------------------------------------------------------------
// useIdleTimer — returns true after IDLE_MS of no user activity
// ---------------------------------------------------------------------------
function useIdleTimer(ms: number) {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), ms)
    }

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))

    // Start the timer on mount
    timer = setTimeout(() => setIdle(true), ms)

    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [ms])

  return idle
}

// ---------------------------------------------------------------------------
// Cornelius — small idle cow that appears next to heading
// Fades in after 1 min idle, fades out when user moves
// ---------------------------------------------------------------------------
interface CorneliusProps {
  theme?: 'dark' | 'light'
}

export default function Cornelius({ theme = 'dark' }: CorneliusProps) {
  const idle = useIdleTimer(IDLE_MS)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (idle) {
      // Mount first, then trigger fade-in after browser paints the opacity:0 state
      setMounted(true)
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(raf2)
      })
      return () => cancelAnimationFrame(raf1)
    } else {
      // Fade out, then unmount after transition completes
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 800)
      return () => clearTimeout(t)
    }
  }, [idle])

  if (!mounted) return null

  return (
    <div
      className="inline-flex items-center"
      style={{
        width: 150,
        height: 88,
        verticalAlign: 'middle',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        pointerEvents: 'none',
      }}
    >
      <Suspense fallback={null}>
        <ThemeContext.Provider value={theme}>
          <Canvas
            camera={{ position: [0, 0, 5.5], fov: 30 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            dpr={[1, 2]}
            style={{ background: 'transparent' }}
          >
            <MiniScenePoints />
          </Canvas>
        </ThemeContext.Provider>
      </Suspense>
    </div>
  )
}
