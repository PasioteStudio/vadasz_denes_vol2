import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"

export class Dust {
  dustCount = 2000
  geometry: THREE.BufferGeometry
  points: THREE.Points
  velocities: Float32Array
  offset: [number, number, number]
  lowerBound: number
  radius: number
  size: number

  constructor(scene: THREE.Scene, dustcount: number = 2000, radius = 30, offset: [number, number, number], lowerBound: number = 0, size: number = 0.1) {
    //random pozíció és sebesség
    this.dustCount = dustcount
    const positions = new Float32Array(this.dustCount * 3)
    this.velocities = new Float32Array(this.dustCount)
    this.lowerBound = lowerBound
    this.offset = [...offset]
    this.size = size
    this.radius = radius

    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3] = offset[0] + (Math.random() - 0.5) * radius
      positions[i * 3 + 1] = offset[1] + (Math.random() - 0.5)
      positions[i * 3 + 2] = offset[2] + (Math.random() - 0.5) * radius
      // random esési sebesség
      this.velocities[i] = 0.05 + Math.random() * 0.1
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )

    const material = new THREE.PointsMaterial({
      color: 0xC98A10,
      size: size
    })

    this.points = new THREE.Points(this.geometry, material)
    scene.add(this.points)
  }

// In your Dust class update method:
update(delta: number) {
  const pos = this.geometry.attributes.position.array as Float32Array
  const d = delta * 100

  for (let i = 0; i < this.dustCount; i++) {
    pos[i * 3 + 1] -= this.velocities[i] * d
    pos[i * 3] += 0.1 * d

    // ha leért, újragenerálja felül
    if (pos[i * 3 + 1] < this.lowerBound) {
      // FIXED: Reset ABOVE the camera, not at a fixed world height
      pos[i * 3] = this.offset[0] + (Math.random() - 0.5) * this.radius
      pos[i * 3 + 1] = this.offset[1] + 20  // Increased from 10 to 20
      pos[i * 3 + 2] = this.offset[2] + (Math.random() - 0.5) * this.radius
      this.velocities[i] = 0.05 + Math.random() * 0.1
    }
  }

  this.geometry.attributes.position.needsUpdate = true
}
}

