export {}

declare global {
  interface Window {
    handleGlobalSearch: (query: string) => Promise<void>
  }

  interface GlobalThis {
    handleGlobalSearch?: (query: string) => Promise<void>
  }
}