import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Dust, MarsDust } from "./MarsDust"
import { Vector3 } from "three"
import { cameraPosition } from "three/tsl"

interface IMainParticle{
    camPosition: [number, number, number],
}
export function MainParticle({ camPosition }: IMainParticle) {
  return (
    <MarsDust camPosition={camPosition} />
  )
}

