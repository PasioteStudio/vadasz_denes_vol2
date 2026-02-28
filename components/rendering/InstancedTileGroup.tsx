import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useRef, useLayoutEffect, useMemo } from 'react';
import { Tile } from '@/util/constants';
import { getTileModelPath, TILE_REGISTRY } from '@/util/tileRegistry';
import type { GLTF } from 'three-stdlib';

interface InstancedTileGroupProps {
  tileType: Tile;
  positions: Array<{ x: number; y: number; index: number }>;
  castShadow?: boolean;
  receiveShadow?: boolean;
  tileGap: number;
}

interface InstancedGeometryData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

/**
 * Renders a group of identical tiles using GPU instancing
 * Automatically extracts geometries and materials from GLTF
 * and creates InstancedMesh for each unique geometry+material combo
 */
export const InstancedTileGroup = ({
  tileType,
  positions,
  castShadow = true,
  receiveShadow = true,
  tileGap,
}: InstancedTileGroupProps) => {
  const modelPath = getTileModelPath(tileType);
  const gltf = useGLTF(modelPath) as any;
  const nodes = gltf.nodes;
  const materials = gltf.materials;

  // Extract unique geometry+material combinations from the loaded GLTF
  const instancedData = useMemo(() => {
    const data: Array<{
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      count: number;
    }> = [];

    if (!nodes) return data;

    // Iterate through all nodes to find meshes
    Object.values(nodes).forEach((node: any) => {
      // Check if this node is a mesh with geometry and material
      if (node && node.isMesh && node.geometry && node.material) {
        const mesh = node as THREE.Mesh;
        const material = mesh.material;

        // Handle array of materials
        const materialToUse = Array.isArray(material) ? material[0] : material;

        if (materialToUse) {
          // Check if we already have this geometry+material combo
          const existing = data.find(
            (d) =>
              d.geometry === mesh.geometry &&
              d.material === materialToUse
          );

          if (!existing) {
            data.push({
              geometry: mesh.geometry,
              material: materialToUse as THREE.Material,
              count: positions.length,
            });
          }
        }
      }
    });

    return data;
  }, [nodes, positions.length]);

  // Create InstancedMesh refs for each geometry+material combo
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);

  // Update matrices when positions change
  useLayoutEffect(() => {
    // Early exit if no positions
    if (positions.length === 0) return;

    const matrix = new THREE.Matrix4();
    meshRefs.current.forEach((mesh) => {
      if (!mesh) return;

      positions.forEach((pos, idx) => {
        if (idx < mesh.count) {
          const x = pos.x * tileGap;
          const y = 0;
          const z = pos.y * tileGap;
          matrix.setPosition(x, y, z);
          mesh.setMatrixAt(idx, matrix);
        }
      });

      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [positions, tileGap]);

  // Render only if we have valid data
  if (instancedData.length === 0 || positions.length === 0) {
    return null;
  }

  return (
    <>
      {instancedData.map((data, idx) => (
        <instancedMesh
          key={`${tileType}-${idx}`}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
          args={[data.geometry, data.material, data.count]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ))}
    </>
  );
};

// Preload all tile models at module load time
Object.values(TILE_REGISTRY).forEach((modelPath) => {
  useGLTF.preload(modelPath);
});
