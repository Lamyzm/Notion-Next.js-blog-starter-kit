import * as React from 'react';
import { LazyImageFull, ImageState } from 'react-lazy-images';
import { normalizeUrl } from 'notion-utils';
import { useNotionContext } from '../context';
import { cs } from '../utils';

/**
 * Progressive, lazy images modeled after Medium's LQIP technique.
 */
export const LazyImage: React.FC<{
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  height?: number;
  zoomable?: boolean;
  priority?: boolean;
  fallbackSrc?: string; // 추가: 대체 이미지 소스
}> = ({
  src,
  alt,
  className,
  style,
  zoomable = false,
  priority = false,
  height,
  fallbackSrc, // 추가: 대체 이미지 소스
  ...rest
}) => {
  const { recordMap, zoom, previewImages, forceCustomImages, components } = useNotionContext();

  // 이미지 소스를 관리하는 상태 추가
  const [currentSrc, setCurrentSrc] = React.useState(src);

  const zoomRef = React.useRef(zoom ? zoom.clone() : null);
  const previewImage = previewImages
    ? recordMap?.preview_images?.[currentSrc] ??
      recordMap?.preview_images?.[normalizeUrl(currentSrc)]
    : null;

  const onLoad = React.useCallback(
    (e: any) => {
      if (zoomable && (e.target.src || e.target.srcset)) {
        if (zoomRef.current) {
          (zoomRef.current as any).attach(e.target);
        }
      }
    },
    [zoomRef, zoomable],
  );

  const onError = React.useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc); // 이미지 로드 실패 시 대체 이미지로 변경
    }
  }, [fallbackSrc, currentSrc]);

  const attachZoom = React.useCallback(
    (image: any) => {
      if (zoomRef.current && image) {
        (zoomRef.current as any).attach(image);
      }
    },
    [zoomRef],
  );

  const attachZoomRef = React.useMemo(
    () => (zoomable ? attachZoom : undefined),
    [zoomable, attachZoom],
  );

  if (previewImage) {
    const aspectRatio = previewImage.originalHeight / previewImage.originalWidth;

    if (components.Image) {
      return (
        <components.Image
          src={currentSrc}
          alt={alt}
          style={style}
          className={className}
          width={previewImage.originalWidth}
          height={previewImage.originalHeight}
          blurDataURL={previewImage.dataURIBase64}
          placeholder="blur"
          priority={priority}
          onLoad={onLoad}
          onError={onError} // 추가: onError 핸들러 전달
        />
      );
    }

    return (
      // @ts-ignore
      <LazyImageFull src={currentSrc} {...rest} experimentalDecode={true}>
        {({ imageState, ref }) => {
          const isLoaded = imageState === ImageState.LoadSuccess;
          const wrapperStyle: React.CSSProperties = {
            width: '100%',
          };
          const imgStyle: React.CSSProperties = {};

          if (height) {
            wrapperStyle.height = height;
          } else {
            imgStyle.position = 'absolute';
            wrapperStyle.paddingBottom = `${aspectRatio * 100}%`;
          }

          return (
            <div
              className={cs('lazy-image-wrapper', isLoaded && 'lazy-image-loaded', className)}
              style={wrapperStyle}
            >
              <img
                className="lazy-image-preview"
                src={previewImage.dataURIBase64}
                alt={alt}
                ref={ref}
                style={style}
                decoding="async"
                onError={onError} // 추가: onError 핸들러 전달
              />

              <img
                className="lazy-image-real"
                src={currentSrc}
                alt={alt}
                ref={attachZoomRef}
                style={{
                  ...style,
                  ...imgStyle,
                }}
                width={previewImage.originalWidth}
                height={previewImage.originalHeight}
                decoding="async"
                loading="lazy"
                onError={onError} // 추가: onError 핸들러 전달
              />
            </div>
          );
        }}
      </LazyImageFull>
    );
  } else {
    if (components.Image && forceCustomImages) {
      return (
        <components.Image
          src={currentSrc}
          alt={alt}
          className={className}
          style={style}
          width={null}
          height={height || null}
          priority={priority}
          onLoad={onLoad}
          onError={onError} // 추가: onError 핸들러 전달
        />
      );
    }

    return (
      <img
        className={className}
        style={style}
        src={currentSrc}
        alt={alt}
        ref={attachZoomRef}
        loading="lazy"
        decoding="async"
        onError={onError} // 추가: onError 핸들러 전달
        {...rest}
      />
    );
  }
};
