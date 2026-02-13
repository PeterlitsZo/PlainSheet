import { useEffect, useRef } from "react";
import clsx from "clsx";
import styles from "./Preview.module.css";

interface PreviewProps {
  pngData: Uint8Array<ArrayBuffer> | null;
  className?: string;
}

export function Preview(props: PreviewProps) {
  const { pngData, className } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!pngData) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let cancelled = false;
    const objectUrl = URL.createObjectURL(
      new Blob([pngData], { type: "image/png" }),
    );
    const image = new Image();

    image.onload = () => {
      if (cancelled) {
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(objectUrl);
    };
  }, [pngData]);

  return (
    <div className={clsx(styles.Preview, className)}>
      <canvas ref={canvasRef} className={styles.Canvas} />
    </div>
  );
}
