import { ClipLoader } from "react-spinners"

type SpinnerProps = {
  size?: number
  color?: string
  inline?: boolean
}

export function Spinner({ size = 20, color = "var(--accent)", inline = false }: SpinnerProps) {
  return (
    <span style={{ display: inline ? 'inline-block' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ClipLoader size={size} color={color} />
    </span>
  )
}
