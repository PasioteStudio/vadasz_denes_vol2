import React from 'react'


export type InvenotryPopupType={
    goldCount:number,
    waterCount:number,
    rareCount:number,
    onClose:()=>void

}

const InventoryPopup = ({goldCount,waterCount,rareCount,onClose}: InvenotryPopupType) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",
        height: "400px",
        backgroundColor: "#2c2c2c"
      }}
      className="inventoryPopup"
    >
      <h2 style={{ color: "white", textAlign: "center", padding: "10px" }}>
        Inventory
      </h2>
      {/* becsukó gomb */}
      <button
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "#ff0000",
          color: "white",
          border: "none",
          borderRadius: "5px",
          padding: "5px 10px"
        }}
        onClick={onClose}
      >X
      </button>
      <ul className='items'>
        <li>
            <p>Gold</p>
            <div className='gold'></div>
            <h5>{goldCount}x</h5>
        </li>
        <li>
            <p>Water</p>
            <div className='water'></div>
            <h5>{waterCount}x</h5>
        </li>
        <li>
            Rare
            <div className='rare'></div>
            <h5>{rareCount}x</h5>
        </li>
      </ul>
    </div>
  );
};

export default InventoryPopup