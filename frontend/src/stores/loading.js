import { ref } from 'vue'

export const isLoading = ref(false)

export function startLoading() {
  isLoading.value = true
}

export function stopLoading() {
  isLoading.value = false
}

/**
 * Выполнить async-функцию с автоматическим включением/выключением loading.
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withLoading(fn) {
  startLoading()
  try {
    return await fn()
  } finally {
    stopLoading()
  }
}
