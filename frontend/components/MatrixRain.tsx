'use client';

import React, { useEffect, useRef } from 'react';

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const chars = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEF$#@*+<>~Ξ₿';
    const fontSize = 15;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = [];
    const speeds: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100);
      speeds[i] = 0.80 + Math.random() * 0.70;
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = 400;
    offCanvas.height = 800;
    const offCtx = offCanvas.getContext('2d');
    let maskData: Uint8ClampedArray | null = null;

    const maskImg = new Image();
    maskImg.src = '/mask-matrix.png';
    maskImg.onload = () => {
      if (offCtx) {
        offCtx.drawImage(maskImg, 0, 0, 400, 800);
        maskData = offCtx.getImageData(0, 0, 400, 800).data;
      }
    };

    const isInsideMask = (x: number, y: number, cx: number, cy: number, w: number, h: number) => {
      if (!maskData) return false;
      const lx = x - (cx - w / 2);
      const ly = y - (cy - h / 2);
      if (lx < 0 || lx >= w || ly < 0 || ly >= h) return false;
      const px = Math.floor((lx / w) * 400);
      const py = Math.floor((ly / h) * 800);
      const idx = (py * 400 + px) * 4;
      return maskData[idx + 3] > 30;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 6, 8, 0.20)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maskH = Math.min(canvas.height * 0.74, 520);
      const maskW = maskH * (400 / 800);

      if (maskImg.complete && maskImg.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.18;
        ctx.drawImage(maskImg, cx - maskW / 2, cy - maskH / 2, maskW, maskH);
        ctx.restore();
      }

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const char = chars[Math.floor(Math.random() * chars.length)];
        const trailChar = chars[Math.floor(Math.random() * chars.length)];
        const onMask = isInsideMask(x, y, cx, cy, maskW, maskH);

        if (onMask) {
          ctx.save();
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, x, y);
          ctx.restore();

          ctx.fillStyle = '#39ff14';
          ctx.fillText(trailChar, x, y - fontSize);
        } else {
          ctx.fillStyle = 'rgba(187, 247, 208, 0.90)';
          ctx.fillText(char, x, y);

          ctx.fillStyle = 'rgba(0, 255, 65, 0.75)';
          ctx.fillText(trailChar, x, y - fontSize);

          ctx.fillStyle = 'rgba(0, 180, 50, 0.35)';
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize * 2);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
