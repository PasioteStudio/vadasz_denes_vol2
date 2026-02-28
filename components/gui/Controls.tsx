import { useRef, useEffect } from 'react'
import { useThree, useFrame, extend } from '@react-three/fiber'
import CameraControls from 'camera-controls'
import * as THREE from 'three'

CameraControls.install({ THREE })
extend({ CameraControls })

export function Controls() {
  const ref = useRef<CameraControls | null>(null)
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    if (!ref.current) {
      ref.current = new CameraControls(camera, gl.domElement)
    }
    return () => {
      ref.current?.dispose()
      ref.current = null
    }
  }, [camera, gl.domElement])

  useFrame((_, delta) => {
    ref.current?.update(delta)
  })

  return null
}