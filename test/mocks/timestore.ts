// Import Node.js Dependencies
import { mock } from "node:test";

export function createTimestore() {
  return {
    add: mock.fn(),
    has: mock.fn(),
    delete: mock.fn(),
    reset() {
      this.add.mock.resetCalls();
      this.has.mock.resetCalls();
      this.delete.mock.resetCalls();
    }
  };
}
