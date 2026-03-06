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

      positions[i * 3] = (Math.random() - 0.5) * 100 
      positions[i * 3 + 1] = Math.random() * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100

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

  update() {

    const pos = this.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < this.dustCount; i++) {

      // lefelé esik
      pos[i * 3 + 1] -= this.velocities[i]

      // oldalra fújja a szél
      pos[i * 3] += 0.1

      if (pos[i * 3 + 1] < -100) {

        pos[i * 3 + 1] = 0
        pos[i * 3] = (Math.random() - 0.5) * 100
        pos[i * 3 + 2] = (Math.random() - 0.5) * 100

      }

    }

    this.geometry.attributes.position.needsUpdate = true
  }

}