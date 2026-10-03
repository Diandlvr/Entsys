import type { Api } from '../preload/index.cjs';

declare global {
  interface Window {
    api: Api;
  }
}
