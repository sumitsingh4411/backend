import "@testing-library/react";
import { vi } from "vitest";

// jsdom implements none of these; the app calls them for scroll behaviour
// and for the "On this page" scrollspy.
vi.stubGlobal("scrollTo", vi.fn());
Element.prototype.scrollIntoView = vi.fn();

vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = "";
    thresholds = [];
  },
);
