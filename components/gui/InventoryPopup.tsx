import { useCycle, useTimeline } from '@/lib/contexts'
import { Tile } from '@/util/constants'
import React, { useEffect, useMemo, useState } from 'react'

export type InvenotryPopupType = {
  onClose: () => void
}

const InventoryPopup = ({ onClose }: InvenotryPopupType) => {
  const {currentTick} = useCycle();
  const inventory = useTimeline().rover.inventory;
  const [items, setItems] = useState({
    y: 0,
    g: 0,
    b: 0,
  });

  const {y,g,b} = useMemo(()=>{
    let _y = inventory.find(x => x.ore == Tile.Yellow)?.amount ?? 0;
    let _g = inventory.find(x => x.ore == Tile.Green)?.amount ?? 0;
    let _b = inventory.find(x => x.ore == Tile.Blue)?.amount ?? 0;
    return {y:_y, g:_g, b:_b}
  }, [currentTick])

  useEffect(()=>{
    setItems({
      y:y,
      g:g,
      b:b,
    })
  }, [y,g,b])

  return (
    <>
      <div className="fixed w-full h-full left-0 top-0 bg-linear-0 from-black/50 from-40% to-transparent">
      <div className="w-3/12 absolute top-1/2 left-1/2 -translate-1/2 bg-gray-900 rounded-2xl px-10 py-4">
        <h2 className="text-center text-[2vw] font-bold mb-5">Inventory</h2>

        <button className="absolute top-0 right-0 rounded-tr-2xl bg-red-500 w-10 aspect-square rounded-bl-md cursor-pointer" onClick={onClose}>
          X
        </button>

        <ul className="w-full">
          <li className='flex items-center justify-center w-full my-3 relative'>
            <p className='text-xl '>Sárga érc</p>
            <img src="/icons/gold.png" alt="Sárga érc" className='w-10 aspect-square ml-auto mr-10' />
            <h5 className='absolute right-0'>{items.g}x</h5>
          </li>

          <li className='flex items-center justify-center w-full my-3 relative'>
            <p className='text-xl '>Kék ásvány</p>
            <img src="/icons/water.png" alt="Kék ásvány" className='w-10 aspect-square ml-auto mr-10' />
            <h5 className='absolute right-0'>{items.b}x</h5>
          </li>

          <li className='flex items-center justify-center w-full my-3 relative'>
            <p className='text-xl '>Zöld érc</p>
            <img src="/icons/rare.png" alt="Zöld érc" className='w-10 aspect-square ml-auto mr-10' />
            <h5 className='absolute right-0'>{items.y}x</h5>
          </li>
        </ul>
      </div>
      </div>
    </>
  )
}

export default InventoryPopup