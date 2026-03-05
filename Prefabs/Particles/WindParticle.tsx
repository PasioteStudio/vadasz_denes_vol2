import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

type ParticleProps = {
  count?: number
}

export function WindParticles({ count = 1000 }: ParticleProps) {
  const mesh = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = Math.random() * 5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10
    }

    return arr
  }, [count])

  useFrame(() => {
    const pos = mesh.current.geometry.attributes.position

    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] -= 0.01

      if (pos.array[i * 3 + 1] < 0) {
        pos.array[i * 3 + 1] = 5
      }
    }

    pos.needsUpdate = true
  })

  return (
    <points ref={mesh}>
        <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
        />
        </bufferGeometry>

      <pointsMaterial size={0.05} color="white" />
    </points>
  )
}