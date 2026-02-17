import "@testing-library/jest-dom/vitest";
import { server } from "./src/__tests__/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
