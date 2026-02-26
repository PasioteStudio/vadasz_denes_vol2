import React from 'react'

type TickersProps = {
  onMove: () => void
  onBack: () => void
}

const Tickers = ({ onMove, onBack }: TickersProps) => {
  return (
    <div className='tickerDiv'>
      <ul>
        <li>
          <button onClick={onBack}> back </button>
        </li>
        <li>
          <button> pause </button>
        </li>
        <li>
          <button onClick={onMove}> next </button>
        </li>
      </ul>
    </div>
  )
}

export default Tickers