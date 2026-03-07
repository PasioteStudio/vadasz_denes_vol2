import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Dust } from "./MarsDust"

export function ParticleManager() {

  const { scene } = useThree()
  const dustRef = useRef<Dust | null>(null)

  useEffect(() => {
    dustRef.current = new Dust(scene, 700, 50, [-10, 10, -30], -20)

    return () => {
      if (dustRef.current) {
        scene.remove(dustRef.current.points)
      }
    }
  }, [scene])

  useFrame((_,delta) => {
    dustRef.current?.update(delta)
  })

  return null
}