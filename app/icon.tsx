import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#003A5D',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circle of people */}
          <circle cx="50" cy="20" r="8" fill="white" />
          <circle cx="80" cy="35" r="8" fill="white" />
          <circle cx="85" cy="65" r="8" fill="white" />
          <circle cx="65" cy="85" r="8" fill="white" />
          <circle cx="35" cy="85" r="8" fill="white" />
          <circle cx="15" cy="65" r="8" fill="white" />
          <circle cx="20" cy="35" r="8" fill="white" />

          {/* Shield */}
          <path
            d="M50 30 L70 42 L70 60 L50 75 L30 60 L30 42 Z"
            fill="white"
          />

          {/* Checkmark */}
          <path
            d="M40 52 L47 60 L62 42"
            stroke="#6B9E3E"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
