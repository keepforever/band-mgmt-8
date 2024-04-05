import { useOptimisticThemeMode } from '#app/hooks/useOptimisticThemeMode.ts'
import { useHints } from '#app/utils/client-hints.tsx'
import { useRequestInfo } from '#app/utils/request-info.ts'

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const hints = useHints()
  const requestInfo = useRequestInfo()
  const optimisticMode = useOptimisticThemeMode()
  if (optimisticMode) {
    return optimisticMode === 'system' ? hints.theme : optimisticMode
  }
  return requestInfo.userPrefs.theme ?? hints.theme
}
