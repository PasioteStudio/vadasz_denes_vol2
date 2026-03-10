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

  constructor(scene: THREE.Scene, dustcount:number=2000, radius = 30, offset: [number, number, number] = [0,0,0], lowerBound: number = -20, size:number = 0.1) {
    //random pozíció és sebesség
    const positions = new Float32Array(this.dustCount * 3)
    this.velocities = new Float32Array(this.dustCount)
    this.lowerBound = lowerBound
    this.offset = offset
    this.dustCount = dustcount
    this.size = size
    this.radius = radius

    for (let i = 0; i < this.dustCount; i++) {

      positions[i * 3] = (Math.random() - 0.5) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * Math.abs((offset[1]-lowerBound))
      positions[i * 3 + 2] = (Math.random() - 0.5) * radius

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

      if (pos[i * 3 + 1] < -20) {

        pos[i * 3 + 1] = this.offset[1]
        pos[i * 3] = (Math.random() - 0.5) * this.radius
        pos[i * 3 + 2] = (Math.random() - 0.5) * this.radius

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
    
      useEffect(() => {
        dustRef.current = new Dust(scene, 20, 50, [0, 10, 0], -20, 2)
    
        return () => {
          if (dustRef.current) {
            scene.remove(dustRef.current.points)
          }
        }
      }, [scene])
    useFrame((_, delta) => {
  if (!dustRef.current) return

  const dust = dustRef.current

  dust.offset = [
    camPosition[0],
    10,
    camPosition[2]
  ]

  dust.update(delta)
})

  return null
  }