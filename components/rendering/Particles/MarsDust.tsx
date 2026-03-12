import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"

import { Vector3 } from "three"
import { cameraPosition } from "three/tsl"

export class Dust {

  dustCount = 2000
  geometry: THREE.BufferGeometry
  points: THREE.Points
  velocities: Float32Array
  offset: [number, number, number]
  lowerBound: number
  radius: number
  size: number

  constructor(scene: THREE.Scene, dustcount:number=2000, radius = 30, offset: [number, number, number], lowerBound: number = -20, size:number = 0.1) {
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

  update(delta:number) {

    const pos = this.geometry.attributes.position.array as Float32Array
    const d = delta*100 // nem tudom, miért nem 1000, de rendben.
    
    for (let i = 0; i < this.dustCount; i++) {

      // lefelé esik
      pos[i * 3 + 1] -= this.velocities[i] * d

      // oldalra fújja a szél
      pos[i * 3] += 0.1 * d

      if (pos[i * 3 + 1] < this.offset[1] - 10) {

        pos[i * 3 + 1] = this.offset[1] + 10
        pos[i * 3] = this.offset[0] + (Math.random() - 0.5) * this.radius
        pos[i * 3 + 2] = this.offset[2] + (Math.random() - 0.5) * this.radius

      }

    }

    this.geometry.attributes.position.needsUpdate = true
  }
  
}
//interfész
interface IMainParticle{
    camPosition: [number, number, number],
}

export function MarsDust({ camPosition }: IMainParticle) {
  const { scene } = useThree()
  const dustRef = useRef<Dust | null>(null)
  const dustsRef = useRef<Dust[]>([])
  const camPositionRef = useRef(camPosition)

  // nem resetel ha mozdul a camera
  useEffect(() => {
    camPositionRef.current = camPosition
  }, [camPosition])

  
  useEffect(() => {
    const interval = setInterval(() => {
      
      dustsRef.current.forEach(dust => scene.remove(dust.points))
      dustsRef.current = []

      const cam = camPositionRef.current
      const dust = new Dust(
        scene, 15, 50,
        [cam[0] - 10, 10, cam[2] - 100],
        10, 2
      )
      dustRef.current = dust
      dustsRef.current.push(dust)
    }, 2000)

    return () => {
      clearInterval(interval)
      dustsRef.current.forEach(dust => scene.remove(dust.points))
    }
  }, [scene])//csak a scene

  useFrame((_, delta) => {
    if (!dustRef.current) return
    dustRef.current.offset = [
      camPositionRef.current[0],
      0,
      camPositionRef.current[2]
    ]
    dustRef.current.update(delta)
  })

  return null
}