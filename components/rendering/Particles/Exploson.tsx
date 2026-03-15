import React from 'react'
import * as THREE from "three"


export class Explosion {
  particleCount = 2000
  geometry: THREE.BufferGeometry
  points: THREE.Points
  velocities: Float32Array
  offset: [number, number, number]
  lowerBound: number
  radius: number
  size: number

  directions: Float32Array
  speed: number = 0.1
  life: number = 1
  scene: THREE.Scene
  material: THREE.PointsMaterial
  

  constructor(scene: THREE.Scene, particleCount: number = 2000, radius = 30, offset: [number, number, number], lowerBound: number = 0, size: number = 0.1, speed: number = 0.1) {
    
    //a robbanás paraméterei
    this.particleCount = particleCount
    this.scene = scene
    const positions = new Float32Array(this.particleCount * 3)
    this.directions = new Float32Array(this.particleCount * 3)
    this.velocities = new Float32Array(this.particleCount)
    this.lowerBound = lowerBound
    this.offset = [...offset]
    this.size = size
    this.radius = radius
    this.geometry = new THREE.BufferGeometry()
    this.speed = speed
    //particle élete
    //pareaméterek a színváltozáshoz

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = offset[0]
      positions[i * 3 + 1] = offset[1]
      positions[i * 3 + 2] = offset[2]

      //random irány
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize()

      this.directions[i * 3] = dir.x * speed
      this.directions[i * 3 + 1] = dir.y *speed
      this.directions[i * 3 + 2] = dir.z* speed

      this.velocities[i] = 0.05 + Math.random() * 0.1
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )

    //material és pontok létrehozása
    this.material = new THREE.PointsMaterial({
          color: new THREE.Color(1, 0, 0),
          size: size
        })
    this.points = new THREE.Points(this.geometry, this.material)
    scene.add(this.points)
  }

  update(delta: number) {
    const pos = this.geometry.attributes.position.array as Float32Array
    const d = delta * 60
    this.life -= delta
    //szín változtatása
    const t = 1 - this.life / 2
    const g = Math.min(1, t)
    this.material.color.setRGB(1, g, 0)

    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3] += this.directions[i * 3] * this.velocities[i] * d
      pos[i * 3 + 1] += this.directions[i * 3 + 1] * this.velocities[i] * d
      pos[i * 3 + 2] += this.directions[i * 3 + 2] * this.velocities[i] * d
    }

    this.geometry.attributes.position.needsUpdate = true
    if (this.life <= 0) {
      this.scene.remove(this.points)

    }
  }



}
