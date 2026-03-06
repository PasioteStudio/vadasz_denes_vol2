import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Dust } from "./MarsDust"

export function ParticleManager() {

  const { scene } = useThree()
  const dustRef = useRef<Dust | null>(null)

  useEffect(() => {
    dustRef.current = new Dust(scene)

    return () => {
      if (dustRef.current) {
        scene.remove(dustRef.current.points)
      }
    }
  }, [scene])

  useFrame(() => {
    dustRef.current?.update()
  })

  return null
}