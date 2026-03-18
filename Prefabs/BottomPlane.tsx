import React from "react";

export type BottomType={
    gap:number
}

export function BottomPlane({gap}:BottomType) {
  return (
    <mesh position={[(25*gap)-(gap/2), -0.1, (25*gap)-(gap/2)]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50*gap, 50*gap]} />
      <meshBasicMaterial color="black" />
    </mesh>
  );
}