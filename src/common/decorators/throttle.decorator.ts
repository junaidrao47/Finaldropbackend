import { SetMetadata, applyDecorators } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';
export const THROTTLE_LIMIT_KEY = 'throttleLimit';
export const THROTTLE_TTL_KEY = 'throttleTtl';

/**
 * Skip rate limiting for specific endpoints
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);

/**
 * Custom rate limit for specific endpoints
 * @param limit - Number of requests allowed
 * @param ttl - Time window in seconds
 */
export const CustomThrottle = (limit: number, ttl: number) => {
  return applyDecorators(
    SetMetadata(THROTTLE_LIMIT_KEY, limit),
    SetMetadata(THROTTLE_TTL_KEY, ttl),
  );
};
