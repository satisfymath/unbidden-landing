import { reducedMotionQuery } from '../lib/device'
import { useMediaQuery } from './useMediaQuery'
export function useReducedMotion(): boolean { return useMediaQuery(reducedMotionQuery) }
