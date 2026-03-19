import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Dust } from "./MarsDust"

interface IMainParticle{
    camPosition: [number, number, number],
}

export function MainParticle({ camPosition }: IMainParticle) {
  const { scene } = useThree()
  const DUSTCOUNT = 150
  const dustRef = useRef<Dust | null>(null)
  //legutóbbi reset pozíció
  const lastResetPos = useRef<[number, number, number]>([0,0,0])

  useEffect(() => {
    //csinálunk egy initial dustot
    const dust = new Dust(
      scene, DUSTCOUNT, 50,
      [camPosition[0] - 10, 10, camPosition[2] - 100],
      0, 1
    )
    dustRef.current = dust
    //legutóbbi reset pozíció az a camera offsetje
    lastResetPos.current = [camPosition[0], camPosition[1], camPosition[2]]

    return () => {
      if (dustRef.current) {
        scene.remove(dustRef.current.points)
      }
    }
  }, [scene])//csak a scene

  useFrame((_, delta) => {
    if (!dustRef.current) return

    //megnézzük a camera pozícióját, és ha túl messze van a legutóbbi reset pozíciótól, akkor reseteljük a dustot
    const [lastX, , lastZ] = lastResetPos.current
    const dx = Math.abs(camPosition[0] - lastX)
    const dz = Math.abs(camPosition[2] - lastZ)
    
    //itt lehet változtatni a distancet a resethez
    if (dx > 45 || dz > 45) {

      scene.remove(dustRef.current.points)
      

      dustRef.current = new Dust(
        scene, 150, 50,
        [camPosition[0] - 10, 10, camPosition[2] - 100],
        0, 2
      )
      lastResetPos.current = [camPosition[0], camPosition[1], camPosition[2]]
    } else {

      dustRef.current.offset = [
        camPosition[0] - 10,
        10,
        camPosition[2] - 100
      ]
      dustRef.current.update(delta)
    }
  })

  return null
}