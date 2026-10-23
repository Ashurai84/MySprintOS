export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`sprintos_${key}`)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`Failed to parse localStorage key sprintos_${key}:`, err)
    return defaultValue
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`sprintos_${key}`, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to save to localStorage key sprintos_${key}:`, err)
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(`sprintos_${key}`)
  } catch (err) {
    console.error(`Failed to remove localStorage key sprintos_${key}:`, err)
  }
}
