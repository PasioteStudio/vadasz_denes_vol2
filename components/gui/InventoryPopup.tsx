import { useCycle, useTimeline, useUIHelper } from '@/lib/contexts'
import { Tile } from '@/lib/constants'
import { useEffect, useMemo, useState } from 'react'

/**
 * A leltárt megjelenítő elem.
 */
const InventoryPopup = () => {
  const { inventoryOpen, toggleInventoryOpen } = useUIHelper();
  const {resting,restingOpacity} = useUIHelper();
  const { currentTick } = useCycle();
  const inventory = useTimeline().rover.inventory;
  const [items, setItems] = useState({
    y: 0,
    g: 0,
    b: 0,
  });

  const { y, g, b } = useMemo(() => {
    let _y = inventory.find(x => x.ore == Tile.Yellow)?.amount ?? 0;
    let _g = inventory.find(x => x.ore == Tile.Green)?.amount ?? 0;
    let _b = inventory.find(x => x.ore == Tile.Blue)?.amount ?? 0;
    return { y: _y, g: _g, b: _b }
  }, [currentTick])

  useEffect(() => {
    setItems({
      y: y,
      g: g,
      b: b,
    })
  }, [y, g, b])

  return (
    <>
      <div className='fixed right-[22vw] bottom-2 w-14 flex items-center justify-center aspect-square bg-[#1e1e2f]/90 border border-[#ff4500] rounded-lg shadow-lg' style={{ opacity: resting ? restingOpacity / 100 : 1 }}>
        <button className='cursor-pointer hover:bg-[#ff4500]/30 rounded-md w-9 aspect-square flex items-center justify-center' onClick={toggleInventoryOpen}>
          <img src="/inventory.svg" alt="Leltár" className='w-7 h-7' style={{filter:inventoryOpen ? "invert(50%) sepia(100%) saturate(800%) hue-rotate(15deg) brightness(1.2)" : "invert(100%)"}} />
        </button>
      </div>
      {inventoryOpen && <>
        <div className="fixed w-full h-full left-0 top-0 bg-linear-0 from-black/50 from-40% to-transparent">
          <div className="w-3/12 min-w-md absolute top-1/2 left-1/2 -translate-1/2 bg-gray-900 rounded-2xl px-10 py-4 pb-10">
            <h2 className="text-center text-[2vw] font-bold mb-5">Ércek</h2>

            <button className="absolute top-0 right-0 rounded-tr-2xl bg-red-500 w-10 aspect-square rounded-bl-md cursor-pointer" onClick={toggleInventoryOpen}>
              X
            </button>

            <ul className="w-full">
              <li className='flex items-center justify-center w-full my-3 relative'>
                <p className='text-xl '>Sárga érc</p>
                <img src="/icons/gold.png" alt="Sárga érc" className='w-10 aspect-square ml-auto mr-10' />
                <h5 className='absolute right-0'>{items.y}x</h5>
              </li>

              <li className='flex items-center justify-center w-full my-3 relative'>
                <p className='text-xl '>Kék ásvány</p>
                <img src="/icons/water.png" alt="Kék ásvány" className='w-10 aspect-square ml-auto mr-10' />
                <h5 className='absolute right-0'>{items.b}x</h5>
              </li>

              <li className='flex items-center justify-center w-full my-3 relative'>
                <p className='text-xl '>Zöld érc</p>
                <img src="/icons/rare.png" alt="Zöld érc" className='w-10 aspect-square ml-auto mr-10' />
                <h5 className='absolute right-0'>{items.g}x</h5>
              </li>
            </ul>
            <p className='text-[14px] absolute bottom-0 right-0 pb-3 pr-10'>Összesen: {items.b + items.y + items.g}</p>
          </div>
        </div></>}
    </>
  )
}

export default InventoryPopup