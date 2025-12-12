// Re-export the new IndexedDB-based storage
// This file maintains backwards compatibility for imports

export { dbStorage as storage, migrateFromLocalStorage } from './db';
