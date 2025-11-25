import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock de fetch global
global.fetch = vi.fn();
