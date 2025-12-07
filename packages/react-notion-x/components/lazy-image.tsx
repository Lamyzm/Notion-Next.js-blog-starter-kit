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
  // Next.js Image 최적화 실패 시 일반 img 태그로 전환
  const [useUnoptimized, setUseUnoptimized] = React.useState(false);
  // 재시도 횟수 추적 (무한 루프 방지)
  const retryCountRef = React.useRef(0);
  // 이미지 로딩 실패 여부
  const [hasFailed, setHasFailed] = React.useState(false);
  // 이미지가 성공적으로 로드되었는지 추적
  const [isLoaded, setIsLoaded] = React.useState(false);

  // URL에서 안정적인 식별자 추출 (S3 경로의 파일 해시 등)
  const getStableImageId = React.useCallback((url: string | undefined): string | null => {
    if (!url) return null;

    try {
      // S3 URL에서 안정적인 부분 추출
      // 예: prod-files-secure.s3.us-west-2.amazonaws.com/.../4ce6291f931e9b8f386c82e3cb1fad5dd174eb8341785a70209605f4ce9f38a6.webp
      const s3Match = url.match(/prod-files-secure\.s3\.us-west-2\.amazonaws\.com\/([^/?]+)/);
      if (s3Match) {
        return s3Match[1]; // spaceId/fileId/filename 부분
      }

      // img.notionusercontent.com URL에서 안정적인 부분 추출
      const imgMatch = url.match(/img\.notionusercontent\.com\/[^/]+\/([^/?]+)/);
      if (imgMatch) {
        return imgMatch[1];
      }

      // Notion 프록시 URL에서 원본 URL 추출
      if (url.includes('notion.so/image/') || url.includes('notion.site/image/')) {
        try {
          const u = new URL(url);
          const encodedUrl = u.pathname.replace(/^\/image\//, '');
          const decodedUrl = decodeURIComponent(encodedUrl);
          // 디코딩된 URL에서 S3 경로 추출
          const decodedS3Match = decodedUrl.match(
            /prod-files-secure\.s3\.us-west-2\.amazonaws\.com\/([^/?]+)/,
          );
          if (decodedS3Match) {
            return decodedS3Match[1];
          }
        } catch (e) {
          // URL 파싱 실패 시 무시
        }
      }

      // 안정적인 식별자를 찾을 수 없으면 전체 URL의 정규화된 버전 사용
      return url.split('?')[0].split('#')[0];
    } catch {
      return url;
    }
  }, []);

  // src가 변경되면 상태 초기화 (단, 같은 이미지인 경우는 제외)
  React.useEffect(() => {
    const newStableId = getStableImageId(src);
    const currentStableId = getStableImageId(currentSrc);

    // 같은 이미지인 경우 (안정적인 식별자가 같음) 상태를 유지
    if (newStableId && currentStableId && newStableId === currentStableId && isLoaded) {
      // URL만 업데이트 (이미 로드된 이미지는 재로딩하지 않음)
      if (src && src !== currentSrc) {
        setCurrentSrc(src);
      }
      return;
    }

    // 다른 이미지이거나 처음 로드하는 경우 상태 초기화
    setCurrentSrc(src);
    setUseUnoptimized(false);
    retryCountRef.current = 0;
    setHasFailed(false);
    setIsLoaded(false);
  }, [src, currentSrc, getStableImageId, isLoaded]);

  const zoomRef = React.useRef(zoom ? zoom.clone() : null);
  const previewImage = previewImages
    ? recordMap?.preview_images?.[currentSrc] ??
      recordMap?.preview_images?.[normalizeUrl(currentSrc)]
    : null;

  const onLoad = React.useCallback(
    (e: any) => {
      setIsLoaded(true); // 이미지 로드 성공 표시
      if (zoomable && (e.target.src || e.target.srcset)) {
        if (zoomRef.current) {
          (zoomRef.current as any).attach(e.target);
        }
      }
    },
    [zoomRef, zoomable],
  );

  const onError = React.useCallback(() => {
    // 이미 실패했으면 더 이상 시도하지 않음
    if (hasFailed) {
      return;
    }

    retryCountRef.current += 1;

    // 첫 번째 재시도: Next.js Image 최적화가 실패한 경우 unoptimized로 전환
    if (components.Image && !useUnoptimized && retryCountRef.current === 1) {
      setUseUnoptimized(true);
      return;
    }

    // 두 번째 재시도: fallbackSrc가 있고 아직 시도하지 않았으면 시도
    if (fallbackSrc && currentSrc !== fallbackSrc && retryCountRef.current === 2) {
      retryCountRef.current = 0; // fallbackSrc로 변경했으므로 재시도 카운터 리셋
      setCurrentSrc(fallbackSrc);
      return;
    }

    // 세 번째 재시도: fallbackSrc도 실패했으면 더 이상 시도하지 않음
    if (retryCountRef.current >= 3) {
      setHasFailed(true);
    }
  }, [fallbackSrc, currentSrc, components.Image, useUnoptimized, hasFailed]);

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

    // 이미지 로딩이 완전히 실패한 경우 (fallbackSrc도 없는 경우) 빈 div 반환
    if (hasFailed && !currentSrc && !fallbackSrc) {
      return null;
    }

    if (components.Image && !useUnoptimized) {
      return (
        <components.Image
          src={currentSrc || ''}
          alt={alt}
          style={style}
          className={className}
          width={previewImage.originalWidth}
          height={previewImage.originalHeight}
          blurDataURL={previewImage.dataURIBase64}
          placeholder="blur"
          priority={priority}
          onLoad={onLoad}
          onError={onError}
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

              {!hasFailed && (
                <img
                  className="lazy-image-real"
                  src={currentSrc || ''}
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
                  onError={onError}
                />
              )}
            </div>
          );
        }}
      </LazyImageFull>
    );
  } else {
    // 이미지 로딩이 완전히 실패한 경우 (fallbackSrc도 없는 경우) 빈 div 반환
    if (hasFailed && !currentSrc && !fallbackSrc) {
      return null;
    }

    if (components.Image && forceCustomImages && !useUnoptimized) {
      return (
        <components.Image
          src={currentSrc || ''}
          alt={alt}
          className={className}
          style={style}
          width={null}
          height={height || null}
          priority={priority}
          onLoad={onLoad}
          onError={onError}
        />
      );
    }

    return (
      <img
        className={className}
        style={style}
        src={currentSrc || ''}
        alt={alt}
        ref={attachZoomRef}
        loading="lazy"
        decoding="async"
        onError={onError}
        {...rest}
      />
    );
  }
};
