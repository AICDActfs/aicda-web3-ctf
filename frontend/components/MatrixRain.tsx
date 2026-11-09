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

    // Authentic Matrix glyphs (Katakana, numbers, cyber symbols)
    const chars = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEF$#@*+<>~Ξ₿';
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = [];
    const speeds: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100);
      speeds[i] = 0.8 + Math.random() * 0.7;
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = 250;
    offCanvas.height = 250;
    const offCtx = offCanvas.getContext('2d');
    let maskData: Uint8ClampedArray | null = null;

    const img = new Image();
    img.src = '/matrix-logo.png';
    img.onload = () => {
      if (offCtx) {
        offCtx.drawImage(img, 0, 0, 250, 250);
        maskData = offCtx.getImageData(0, 0, 250, 250).data;
      }
    };

    const isInsideLogo = (x: number, y: number, cx: number, cy: number, size: number) => {
      if (!maskData) return false;
      const lx = x - (cx - size / 2);
      const ly = y - (cy - size / 2);
      if (lx < 0 || lx >= size || ly < 0 || ly >= size) return false;
      const px = Math.floor((lx / size) * 250);
      const py = Math.floor((ly / size) * 250);
      const idx = (py * 250 + px) * 4;
      return maskData[idx + 3] > 35;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(4, 7, 10, 0.16)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const curLogoSize = Math.min(Math.min(canvas.width, canvas.height) * 0.55, 420);

      // Glowing center hologram (Screen blend mode = zero black rectangle)
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.22;

        const glow = ctx.createRadialGradient(cx, cy, 30, cx, cy, curLogoSize * 0.6);
        glow.addColorStop(0, 'rgba(0, 255, 65, 0.45)');
        glow.addColorStop(0.5, 'rgba(0, 255, 65, 0.15)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, curLogoSize * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(img, cx - curLogoSize / 2, cy - curLogoSize / 2, curLogoSize, curLogoSize);
        ctx.restore();
      }

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const char = chars[Math.floor(Math.random() * chars.length)];
        const inLogo = isInsideLogo(x, y, cx, cy, curLogoSize);

        if (inLogo) {
          // Inside logo: digits illuminate intensely to carve out the logo in real time!
          ctx.save();
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, x, y);
          ctx.restore();

          ctx.fillStyle = '#39ff14';
          ctx.fillText(char, x, y - fontSize);
        } else {
          // Flowing matrix rain
          ctx.save();
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = 9;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, x, y);
          ctx.restore();

          ctx.fillStyle = '#00ff41';
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
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
