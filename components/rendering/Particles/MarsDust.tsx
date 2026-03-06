import * as THREE from "three"

export class Dust {

  dustCount = 2000
  geometry: THREE.BufferGeometry
  points: THREE.Points
  velocities: Float32Array
  offset: [number, number, number]
  lowerBound: number
  radius: number

  constructor(scene: THREE.Scene, radius = 30, offset: [number, number, number] = [0,0,0], lowerBound: number = -20) {
    //random pozíció és sebesség
    const positions = new Float32Array(this.dustCount * 3)
    this.velocities = new Float32Array(this.dustCount)
    this.lowerBound = lowerBound
    this.offset = offset

    this.radius = radius

    for (let i = 0; i < this.dustCount; i++) {

      positions[i * 3] = offset[0] + (Math.random() - 0.5) * radius 
      positions[i * 3 + 1] = offset[1]/2 + (Math.random() - 0.5) * Math.abs((offset[1]-lowerBound))
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

      if (pos[i * 3 + 1] < -20) {

        pos[i * 3 + 1] = this.offset[1]
        pos[i * 3] = this.offset[0] + (Math.random() - 0.5) * this.radius
        pos[i * 3 + 2] = this.offset[2] + (Math.random() - 0.5) * this.radius

      }

    }

    this.geometry.attributes.position.needsUpdate = true
  }

}