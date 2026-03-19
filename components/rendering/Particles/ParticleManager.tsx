import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Dust } from "./MarsDust"
import { Explosion } from "./Exploson"

export function ParticleManager() {

  const { scene } = useThree()
  const dustRef = useRef<Dust | null>(null)
  const explosionRef = useRef<Explosion | null>(null)

  useEffect(() => {
    dustRef.current = new Dust(scene, 200, 50, [-10, 10, -30], 0)
    return () => {
      if (dustRef.current) {
        scene.remove(dustRef.current.points)
      }
      if (explosionRef.current) {
        scene.remove(explosionRef.current.points)
      }
    }
  }, [scene])

  useFrame((_,delta) => {
    dustRef.current?.update(delta)
    explosionRef.current?.update(delta)
  })

  return null
}