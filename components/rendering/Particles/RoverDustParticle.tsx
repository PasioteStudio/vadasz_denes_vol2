import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"

export type ParticleType = {
    offset: [number, number, number]
    rotation: number
    stepType?: {
        type: "rotate" | "move" | "mine"}[]
}
export class RoverDust {
  dustCount: number
  geometry: THREE.BufferGeometry
  points: THREE.Points
  velocities: Float32Array
  offset: [number, number, number]
  lowerBound: number
  radius: number
  rotation: number
  size: number
  speed : number = 1

  scene: THREE.Scene

  constructor(scene: THREE.Scene, dustcount: number = 2000, radius = 30, offset: [number, number, number], rotation: number = 0, lowerBound: number = 0, size: number = 0.1) {
    //random pozíció és sebesség
    this.dustCount = dustcount
    const positions = new Float32Array(this.dustCount * 3)
    this.velocities = new Float32Array(this.dustCount)
    this.lowerBound = lowerBound
    this.offset = [...offset]
    this.size = size
    this.radius = radius
    this.scene = scene
    this.speed = 5
    //rtation 
    this.rotation = rotation
    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3] = offset[0]
      positions[i * 3 + 1] = offset[1]
      positions[i * 3 + 2] = offset[2]
      // random esési sebesség
      this.velocities[i] = 0.05 + Math.random() * 0.1
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(0.2, 0.02, 0.02),
      size: size
    })

    this.points = new THREE.Points(this.geometry, material)
    scene.add(this.points)
  }



update(delta: number) {

  const pos = this.geometry.attributes.position.array as Float32Array
  const d = delta * 100
  //irányvektor kiszámolása a rotation alapján
  const dirX = Math.sin(this.rotation - 90 * Math.PI / 180)
  const dirZ = Math.cos(this.rotation - 90 * Math.PI / 180)

  for (let i = 0; i < this.dustCount; i++) {

    pos[i * 3 + 1] += this.velocities[i] * d * this.speed 
    pos[i * 3] += (Math.random() + 0.1) * 0.5 * d * dirX
    pos[i * 3 + 2] += (Math.random() - 0.1) * 0.5 * d * dirZ
    

    if (pos[i * 3 + 1] > this.offset[1] + 1 || pos[i * 3 + 1] < this.lowerBound) {
      pos[i * 3] = this.offset[0] + (Math.random() - 0.5) * 2 
      pos[i * 3 + 1] = this.offset[1]
      pos[i * 3 + 2] = this.offset[2] + (Math.random() - 0.5) * 2
      this.velocities[i] = 0.05 + Math.random() * 0.1
    }
  }

  this.geometry.attributes.position.needsUpdate = true
}
}

export function RoverDustParticle({ offset, rotation, stepType }: ParticleType) {
  const { scene } = useThree()
  const dustRef = useRef<RoverDust | null>(null)


  const offsetRef = useRef(offset)
  const rotationRef = useRef(rotation)


  useEffect(() => {
    offsetRef.current = offset
    rotationRef.current = rotation
  })


useEffect(() => {
    const initialOffset = offsetRef.current
    const initialRotation = rotationRef.current
    
    dustRef.current = new RoverDust(
      scene, 
      100, 
      50, 
      [initialOffset[0], 3, initialOffset[2]], 
      initialRotation, 
      0, 
      2
    )

    return () => {
      if (dustRef.current) {
        scene.remove(dustRef.current.points)
        dustRef.current.geometry.dispose();
        (dustRef.current.points.material as THREE.Material).dispose()
      }
    }
  }, [])

  useFrame((_, delta) => {
    if (dustRef.current) {
      const backOffsetDistance = 2
      const currentOffset = offsetRef.current
      const currentRotation = rotationRef.current

      const forwardX = Math.sin(currentRotation + Math.PI / 2)
      const forwardZ = Math.cos(currentRotation + Math.PI / 2)

      const dustOffset: [number, number, number] = [
        currentOffset[0] - forwardX * backOffsetDistance,
        0.3,
        currentOffset[2] - forwardZ * backOffsetDistance,
      ]

      dustRef.current.offset = dustOffset
      dustRef.current.rotation = currentRotation
      dustRef.current.update(delta)
    }
  })

  return null
}

export default RoverDustParticle