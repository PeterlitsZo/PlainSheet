import clsx from "clsx";
import styles from "./preview.module.css";

interface PreviewProps {
  imageUrl: string | null;
  className?: string;
}

export function Preview(props: PreviewProps) {
  const { imageUrl, className } = props;

  return (
    <div className={clsx(styles.Preview, className)}>
      {imageUrl ? (
        <img src={imageUrl} className={styles.Canvas} alt="Typst preview" />
      ) : null}
    </div>
  );
}
