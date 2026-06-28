import { firestore, isFirebaseEnabled } from "@/lib/firebase";
import { FirestoreRepo } from "./firestore-repo";
import { LocalRepo } from "./local-repo";
import type { Repo } from "./types";

let repo: Repo | null = null;

/** Returns the active repository (Firestore when configured, else local). */
export function getRepo(): Repo {
  if (repo) return repo;
  repo = isFirebaseEnabled && firestore ? new FirestoreRepo(firestore) : new LocalRepo();
  return repo;
}

export type { Repo };
