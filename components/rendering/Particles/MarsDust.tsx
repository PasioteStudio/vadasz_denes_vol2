import * as THREE from "three"

export class Dust {

  rainCount = 2000
  geometry: THREE.BufferGeometry
  points: THREE.Points

  constructor(scene: THREE.Scene) {

    const positions = new Float32Array(this.rainCount * 3)

    for (let i = 0; i < this.rainCount; i++) {

      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = Math.random() * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10

    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )

    const material = new THREE.PointsMaterial({
      color: 0x66ccff,
      size: 0.05
    })

    this.points = new THREE.Points(this.geometry, material)

    scene.add(this.points)
  }

  update() {

    const pos = this.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < this.rainCount; i++) {

      pos[i * 3 + 1] -= 0.1

      if (pos[i * 3 + 1] < -5) {
        pos[i * 3 + 1] = 5
      }

    }

    this.geometry.attributes.position.needsUpdate = true
  }

}