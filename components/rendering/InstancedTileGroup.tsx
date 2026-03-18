import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useRef, useLayoutEffect, useMemo } from 'react';
import { Tile } from '@/lib/constants';
import { getTileModelPath, TILE_REGISTRY } from '@/util/tileRegistry';
import type { ReactElement } from "react";

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

function getVariantIndex(x: number, y: number, count: number) {
  return Math.abs((x * 73856093) ^ (y * 19349663)) % count;
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

  const modelPathRaw = getTileModelPath(tileType);
 const modelPaths = useMemo(
  () => (Array.isArray(modelPathRaw) ? modelPathRaw : [modelPathRaw]),
  [modelPathRaw]
);

  const gltfs = useGLTF(modelPaths) as any[];

  const variantPositions = useMemo(() => {
    const groups: Array<typeof positions> = modelPaths.map(() => []);

    positions.forEach((pos) => {
      const index = getVariantIndex(pos.x, pos.y, modelPaths.length);
      groups[index].push(pos);
    });

    return groups;
  }, [positions, modelPaths]);

  const instancedData = useMemo(() => {
    return gltfs.map((gltf, variantIndex) => {
      const nodes = gltf.nodes;

      const data: Array<{
        geometry: THREE.BufferGeometry;
        material: THREE.Material;
        count: number;
      }> = [];

      if (!nodes) return data;

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
                count: variantPositions[variantIndex].length,
              });
            }
          }
        }
      });

      return data;
    });
  }, [gltfs, variantPositions]);

  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);

  // Update matrices when positions change
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    let meshIndex = 0;

    variantPositions.forEach((variantPos, variantIdx) => {
      const meshes = instancedData[variantIdx];

      meshes.forEach(() => {
        const mesh = meshRefs.current[meshIndex];
        meshIndex++;

        if (!mesh) return;

        variantPos.forEach((pos, idx) => {
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
    });

  }, [variantPositions, tileGap, instancedData]);

  // Render only if we have valid data
  if (positions.length === 0) {
    return null;
  }

  const meshes: ReactElement[] = [];
  let meshIndex = 0;

  instancedData.forEach((variantData, variantIdx) => {
    variantData.forEach((data, idx) => {

      if (data.count === 0) return;

      meshes.push(
        <instancedMesh
          key={`${tileType}-${variantIdx}-${idx}`}
          ref={(el) => {
            meshRefs.current[meshIndex++] = el;
          }}
          args={[data.geometry, data.material, data.count]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      );
    });
  });

  if (meshes.length === 0) {
    return null;
  }

  return <>{meshes}</>;
};

// Preload all tile models at module load time
Object.values(TILE_REGISTRY).forEach((modelPath) => {
  if (Array.isArray(modelPath)) {
    modelPath.forEach((p) => useGLTF.preload(p));
  } else {
    useGLTF.preload(modelPath);
  }
});