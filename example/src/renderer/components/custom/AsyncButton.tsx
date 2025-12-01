import { Button, ButtonProps } from '@/components/ui/button';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { BsStars } from 'react-icons/bs';
import { TbLoader2 } from 'react-icons/tb';

type AsyncButtonProps = Omit<ButtonProps, 'onClick'> & {
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
};

/** 异步按钮, 默认loading状态为true时，按钮会显示loading状态 */
export const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>(
  (props, ref) => {
    const {
      children = 'AI生成',
      loading: externalLoading,
      onClick,
      ...rest
    } = props;
    const [internalLoading, setInternalLoading] = useState(false);
    const mounted = useRef(true);

    useEffect(() => {
      return () => {
        mounted.current = false;
      };
    }, []);

    const loading = externalLoading ?? internalLoading;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || loading) return;

      try {
        setInternalLoading(true);
        await onClick(e);
      } finally {
        if (mounted.current) {
          setInternalLoading(false);
        }
      }
    };

    return (
      <Button ref={ref} disabled={loading} onClick={handleClick} {...rest}>
        {loading ? (
          <TbLoader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BsStars className={'w-4 h-4'} />
        )}
        {loading ? '生成中' : children}
      </Button>
    );
  }
);

AsyncButton.displayName = 'AsyncButton';
