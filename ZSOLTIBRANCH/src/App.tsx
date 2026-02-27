import { Canvas } from '@react-three/fiber'

import { MarsRover } from './Prefabs/MarsRover'
import Tickers from './Components/Tickers'
import { useState } from 'react'
import { NormalTile } from './Prefabs/NormalTile'
import { BarrierTile } from './Prefabs/BarrierTile'

function App() {
  const [moveForward, setMoveForward] = useState(0);
  return (
    <>

      <Canvas style={{ width: '100wh', height: '90vh' }} camera={{ position: [0, 70, 50], fov: 50 }}>
        <ambientLight intensity={1.3} />
        <spotLight position={[0, 64, 32]} />

        <MarsRover moveForward={moveForward} />

        <NormalTile />
        <BarrierTile />
      </Canvas>
      <Tickers onMove={() => setMoveForward(prev => prev + 20)}
        onBack={() => setMoveForward(prev => prev - 20)} />
    </>



  )
}

export default App