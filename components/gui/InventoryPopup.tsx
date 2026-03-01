import React from 'react'


const InventoryPopup = ({ onClose }: { onClose: () => void }) => {
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
      >
        X
      </button>
    </div>
  );
};

export default InventoryPopup