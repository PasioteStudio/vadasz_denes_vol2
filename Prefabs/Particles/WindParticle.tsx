import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

type Props = {
  count?: number
}

export default function WindParticles({ count = 2000 }: Props) {
  const mesh = useRef<THREE.Points>(null!)

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }

    return positions
  }, [count])

  useFrame(() => {
    const geometry = mesh.current.geometry
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute
    const array = positionAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      array[i * 3] += 0.02

      if (array[i * 3] > 10) {
        array[i * 3] = -10
      }
    }

    positionAttr.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      {/* <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry> */}

      <pointsMaterial color="white" size={0.05} />
    </points>
  )
}