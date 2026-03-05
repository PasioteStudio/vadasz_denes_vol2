import { useCycle, useSnapshots } from '@/lib/contexts'
import React from 'react'

export type InvenotryPopupType = {
  goldCount: number,
  waterCount: number,
  rareCount: number,
  onClose: () => void
}

const InventoryPopup = ({ goldCount, waterCount, rareCount, onClose }: InvenotryPopupType) => {
  const {currentTick} = useCycle();
  const inventory = useSnapshots().snapshots.get(currentTick)!.rover.inventory;
  return (
    <>
      <style>
        {`
          .inventoryPopup {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 400px;
            
            background-color: #2c2c2c;
          }

          .items {
            margin: auto;
            text-align: start;
            color: white;
            font-size: 1.2rem;
            padding-left: 60px;
            padding-right: 20px;
          }

          .items li {
            margin-top: 30px;
            
            list-style: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .gold, .water, .rare {
            width: 50px;
            height: 50px;
            background-size: cover;
            background-position: center;
            display: inline-block;
          }

          .gold {
            background-image: url("./icons/gold.png");
          }

          .water {
            background-image: url("./icons/water.png");
          }

          .rare {
            background-image: url("./icons/rare.png");
          }

          p {
            display: inline-block;
          }

          h5 {
            padding-right: 40px;
            display: inline-block;
          }

          .closeButton {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: #ff0000;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 5px 10px;
            cursor: pointer;
          }

          .title {
            color: white;
            text-align: center;
            padding: 10px;
          }
        `}
      </style>

      <div className="inventoryPopup">
        <h2 className="title">Inventory</h2>

        <button className="closeButton" onClick={onClose}>
          X
        </button>

        <ul className="items">
          <li>
            <p>Gold</p>
            <div className="gold"></div>
            <h5>{goldCount}x</h5>
          </li>

          <li>
            <p>Water</p>
            <div className="water"></div>
            <h5>{waterCount}x</h5>
          </li>

          <li>
            <p>Rare</p>
            <div className="rare"></div>
            <h5>{rareCount}x</h5>
          </li>
        </ul>
      </div>
    </>
  )
}

export default InventoryPopup