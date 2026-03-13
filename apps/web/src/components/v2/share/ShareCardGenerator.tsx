/**
 * VYBEROLOGY V2.0 - SHARE CARD GENERATOR
 * Mystic Minimal Aesthetic
 * Generates: 1080x1920 (vertical) and 1080x1080 (square)
 */

import React, { useRef } from 'react';
import { ShareCardConfig } from '../types';
import { colors, typography, gradients, elements, chakras } from '../styles/tokens';

interface ShareCardGeneratorProps {
  config: ShareCardConfig;
  onGenerate?: (canvas: HTMLCanvasElement) => void;
}

export const ShareCardGenerator: React.FC<ShareCardGeneratorProps> = ({
  config,
  onGenerate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on format
    const { format } = config;
    canvas.width = 1080;
    canvas.height = format === 'vertical' ? 1920 : 1080;

    // Draw card
    drawShareCard(ctx, canvas, config);

    // Callback with canvas
    if (onGenerate) {
      onGenerate(canvas);
    }
  };

  React.useEffect(() => {
    generateCard();
  }, [config]);

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />
      <button onClick={generateCard} style={styles.button}>
        Regenerate Card
      </button>
      <button
        onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = `vyberology-${config.format}-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }}
        style={styles.button}
      >
        Download PNG
      </button>
    </div>
  );
};

function drawShareCard(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: ShareCardConfig
) {
  const { reading, format } = config;
  const elementConfig = elements[reading.element];
  const chakraConfig = chakras[reading.chakra];

  const width = canvas.width;
  const height = canvas.height;

  // BACKGROUND: Soft Ivory → Warm Quartz gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.softIvory);
  gradient.addColorStop(1, colors.warmQuartz);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add 2% texture noise (optional - can be implemented with pattern)
  // For now, keeping clean

  const padding = 80;
  const contentWidth = width - padding * 2;
  let y = format === 'vertical' ? 200 : 120;

  // HEADER: "Your Vyberology Reading"
  ctx.fillStyle = colors.midnightCharcoal;
  ctx.font = '300 32px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Your Vyberology Reading', width / 2, y);
  y += 100;

  // ELEMENT GLYPH
  ctx.font = '96px serif'; // Alchemical symbols
  ctx.textAlign = 'center';
  ctx.fillText(elementConfig.glyph, width / 2, y);
  y += 40;

  // ELEMENT LABEL
  ctx.fillStyle = elementConfig.color;
  ctx.font = '600 28px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(elementConfig.label, width / 2, y);
  y += 80;

  // CHAKRA MARKER (small dot + label)
  const chakraDotX = width / 2 - 60;
  ctx.fillStyle = chakraConfig.color;
  ctx.globalAlpha = chakraConfig.opacity;
  ctx.beginPath();
  ctx.arc(chakraDotX, y - 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.midnightCharcoal;
  ctx.font = '600 24px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(chakraConfig.label, chakraDotX + 20, y);
  y += 80;

  // ESSENCE LINE (main message) - Lumen refinement: Use Inter, not Cormorant
  ctx.fillStyle = colors.midnightCharcoal;
  ctx.font = '600 38px "Inter", sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, reading.essenceLine, width / 2, y, contentWidth, 56);
  y += 120;

  // REFLECTION KEY (micro text)
  ctx.fillStyle = colors.midnightCharcoal;
  ctx.globalAlpha = 0.7;
  ctx.font = 'italic 300 28px "Inter", sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, reading.reflectionKey, width / 2, y, contentWidth - 100, 48);
  ctx.globalAlpha = 1;

  // FOOTER: vyberology.com
  const footerY = height - 100;
  ctx.fillStyle = colors.midnightCharcoal;
  ctx.font = '400 28px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('vyberology.com', width / 2, footerY);
}

// Helper: Wrap text to fit width
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '40px',
    background: colors.softIvory,
  },

  canvas: {
    maxWidth: '100%',
    height: 'auto',
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },

  button: {
    fontFamily: typography.body.family,
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 32px',
    background: colors.midnightCharcoal,
    color: colors.softIvory,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 120ms ease-out',
  },
};
