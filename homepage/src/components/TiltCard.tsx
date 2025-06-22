import { useRef, type MouseEventHandler, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

const ROTATION_RANGE = 30;
const HALF_ROTATION_RANGE = ROTATION_RANGE / 2;
const TiltCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  const xSpring = useSpring(x);
  const ySpring = useSpring(y);
  const scaleSpring = useSpring(scale);

  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg) scale(${scaleSpring})`;

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return [0, 0];

    const rect = (ref.current as HTMLElement).getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) * ROTATION_RANGE;
    const mouseY = (e.clientY - rect.top) * ROTATION_RANGE;

    const rX = (mouseY / height - HALF_ROTATION_RANGE) * -1;
    const rY = mouseX / width - HALF_ROTATION_RANGE;

    x.set(rX);
    y.set(rY);
    scale.set(1.1);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove as unknown as MouseEventHandler<HTMLDivElement>}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform,
      }}
      className={`relative rounded-xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default TiltCard;
