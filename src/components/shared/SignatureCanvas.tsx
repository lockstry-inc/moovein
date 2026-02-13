import { useRef, useEffect, useCallback } from 'react'

interface Props {
  onSign: (dataUrl: string | null) => void
}

export default function SignatureCanvas({ onSign }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(2, 2)
    ctx.strokeStyle = '#8F0000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    drawingRef.current = true
    const { x, y } = getPos(e)
    ctxRef.current?.beginPath()
    ctxRef.current?.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawingRef.current) return
    const { x, y } = getPos(e)
    ctxRef.current?.lineTo(x, y)
    ctxRef.current?.stroke()
  }

  const endDraw = () => {
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) onSign(canvas.toDataURL())
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !ctxRef.current) return
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
    onSign(null)
  }, [onSign])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[80px] bg-bg border-[1.5px] border-border rounded-[8px] cursor-crosshair block sig-canvas"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button
        onClick={clear}
        className="absolute top-[6px] right-[6px] bg-surface-3 border border-border rounded-[5px] text-text-dim text-[10px] font-semibold py-[3px] px-2 cursor-pointer"
      >
        Clear
      </button>
    </div>
  )
}
