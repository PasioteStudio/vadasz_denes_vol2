import * as THREE from "three"

export class Dust {

  dustCount = 2000
  geometry: THREE.BufferGeometry
  points: THREE.Points
  velocities: Float32Array

  constructor(scene: THREE.Scene) {
    //random pozíció és sebesség
    const positions = new Float32Array(this.dustCount * 3)
    this.velocities = new Float32Array(this.dustCount)

    for (let i = 0; i < this.dustCount; i++) {

      positions[i * 3] = -10 + (Math.random() - 0.5) * 30 
      positions[i * 3 + 1] = 10 + (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = -15 + (Math.random() - 0.5) * 30

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
      size: 0.1
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

      if (pos[i * 3 + 1] < -100) {

        pos[i * 3 + 1] = 10
        pos[i * 3] = -10 + (Math.random() - 0.5) * 30
        pos[i * 3 + 2] = -15 + (Math.random() - 0.5) * 30

      }

    }

    this.geometry.attributes.position.needsUpdate = true
  }

}