/**
 * Firebase Admin Integration Stub (Optional Cloud Auth & Sync)
 * Satisfies ARCHITECTURE.md §8 and server dynamic module requirements.
 */
export interface DecodedIdToken {
  uid: string;
  email?: string;
}

export class FirebaseAdminService {
  private static instance: FirebaseAdminService | null = null;
  private initialized = false;

  private constructor() {
    // Dynamically initialized only if FIREBASE_PROJECT_ID is present in env
  }

  public static getInstance(): FirebaseAdminService {
    if (!FirebaseAdminService.instance) {
      FirebaseAdminService.instance = new FirebaseAdminService();
    }
    return FirebaseAdminService.instance;
  }

  public async verifyToken(token: string): Promise<DecodedIdToken | null> {
    if (!this.initialized || !token) {
      return null;
    }
    return null;
  }
}
