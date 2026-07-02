/**
 * Locally-stored list of saved visualisations. A visualisation is a small record pointing at a
 * project step and a title chosen by the user.
 *
 * Persisted to localStorage so the user can come back to their reports without standing up a
 * backend. A future iteration could move this to a `org.dds-wg.v1.visualisation` lexicon record
 * in the user's PDS.
 */

import { browser } from "$app/environment";

export interface SavedVisualisation {
  id: string;
  title: string;
  projectUri: string;
  projectCid: string;
  phase: string;
  /**
   * Optional clustering-server API URL. When set, the report viewer overlays groups + metrics
   * from the server's latest run on top of whatever it finds in the project host's PDS.
   * The polis interface / visualisation themselves never write here; only the clustering
   * server does.
   */
  clusteringApiUrl?: string;
  createdAt: string;
}

const STORAGE_KEY = "dds-visualisations.v1";

function defaultClusteringApiUrl(): string {
  if (typeof window === "undefined") return "";
  // Best guess: same hostname as the page, FastAPI default port. Works in our Docker dev
  // setup (visualisation on :5175, clustering server on :8000) and gracefully degrades to
  // empty in unusual setups.
  return `${window.location.protocol}//${window.location.hostname}:8000`;
}

class Store {
  #items = $state<SavedVisualisation[]>([]);

  constructor() {
    if (browser) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) this.#items = JSON.parse(raw) as SavedVisualisation[];
      } catch {
        /* ignore */
      }
    }
  }

  get items(): SavedVisualisation[] {
    return this.#items;
  }

  get defaultClusteringApiUrl(): string {
    return defaultClusteringApiUrl();
  }

  add(input: Omit<SavedVisualisation, "id" | "createdAt">): SavedVisualisation {
    const v: SavedVisualisation = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.#items = [v, ...this.#items];
    this.persist();
    return v;
  }

  remove(id: string) {
    this.#items = this.#items.filter((v) => v.id !== id);
    this.persist();
  }

  find(id: string): SavedVisualisation | undefined {
    return this.#items.find((v) => v.id === id);
  }

  private persist() {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#items));
  }
}

export const visualisations = new Store();
