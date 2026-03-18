import React from "react";

export type BottomType={
    gap:number
}

export function BottomPlane({gap}:BottomType) {
  return (
    <mesh position={[(25*gap)-1.05, -0.1, (25*gap)-1.05]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50*gap, 50*gap]} />
      <meshBasicMaterial color="brown" />
    </mesh>
  );
}