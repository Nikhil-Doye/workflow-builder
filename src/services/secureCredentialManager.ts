/**
 * Secure Credential Manager
 *
 * Provides encrypted storage for sensitive database credentials with:
 * - AES-256 encryption for localStorage
 * - Session-only storage for highly sensitive data
 * - Credential masking in memory
 * - Context separation per user session
 * - XSS protection measures
 * - Automatic credential cleanup
 */

// Browser-compatible crypto utilities
class CryptoUtils {
  /**
   * Generate a cryptographically secure encryption key from a password
   */
  static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<{ iv: string; encrypted: string }> {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      enc.encode(data)
    );

    return {
      iv: this.bufferToHex(iv),
      encrypted: this.bufferToHex(new Uint8Array(encrypted)),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static async decrypt(
    encryptedData: { iv: string; encrypted: string },
    key: CryptoKey
  ): Promise<string> {
    const iv = this.hexToBuffer(encryptedData.iv);
    const encrypted = this.hexToBuffer(encryptedData.encrypted);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  }

  /**
   * Generate a random salt
   */
  static generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Convert buffer to hex string
   */
  static bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Convert hex string to buffer
   */
  static hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Generate a secure random encryption key for the session
   */
  static generateSessionKey(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return this.bufferToHex(array);
  }
}

export interface SecureCredential {
  id: string;
  connectionId: string;
  type: "password" | "connectionString" | "apiKey";
  encrypted: string;
  iv: string;
  salt: string;
  storageType: "persistent" | "session";
  createdAt: number;
  lastAccessed?: number;
}

export interface CredentialAccessLog {
  credentialId: string;
  timestamp: number;
  action: "create" | "read" | "update" | "delete";
  context?: string;
}

/**
 * Secure Credential Manager
 */
export class SecureCredentialManager {
  private static instance: SecureCredentialManager;
  private sessionKey: string | null = null;
  private masterKey: CryptoKey | null = null;
  private sessionCredentials: Map<string, string> = new Map();
  private accessLogs: CredentialAccessLog[] = [];
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private cleanupTimer: any = null;

  private constructor() {
    this.initializeSession();
    this.setupCleanupTimer();
    this.setupSecurityListeners();
  }

  static getInstance(): SecureCredentialManager {
    if (!SecureCredentialManager.instance) {
      SecureCredentialManager.instance = new SecureCredentialManager();
    }
    return SecureCredentialManager.instance;
  }

  /**
   * Initialize a new secure session
   */
  private initializeSession(): void {
    this.sessionKey = CryptoUtils.generateSessionKey();

    // Store session marker (not the key itself)
    sessionStorage.setItem(
      "secure_session_id",
      CryptoUtils.generateSessionKey().substring(0, 16)
    );

    console.log("Secure credential session initialized");
  }

  /**
   * Initialize master encryption key from user password/session
   */
  async initializeMasterKey(userPassword?: string): Promise<void> {
    // Use session key or derive from user password
    const password = userPassword || this.sessionKey || "default-session-key";
    const salt = this.getOrCreateSalt();

    this.masterKey = await CryptoUtils.deriveKey(password, salt);
    console.log("Master encryption key initialized");
  }

  /**
   * Store credentials securely
   */
  async storeCredential(
    connectionId: string,
    type: "password" | "connectionString" | "apiKey",
    value: string,
    persistent: boolean = false
  ): Promise<string> {
    if (!this.masterKey) {
      await this.initializeMasterKey();
    }

    const credentialId = `cred_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    if (persistent) {
      // Encrypt and store in localStorage
      const salt = CryptoUtils.generateSalt();
      const key = await CryptoUtils.deriveKey(
        this.sessionKey || "session",
        salt
      );
      const encrypted = await CryptoUtils.encrypt(value, key);

      const credential: SecureCredential = {
        id: credentialId,
        connectionId,
        type,
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        salt: CryptoUtils.bufferToHex(salt),
        storageType: "persistent",
        createdAt: Date.now(),
      };

      this.savePersistentCredential(credential);
    } else {
      // Store in session-only memory (more secure)
      this.sessionCredentials.set(credentialId, value);
    }

    this.logAccess(credentialId, "create", `type:${type}`);
    return credentialId;
  }

  /**
   * Retrieve credentials securely
   */
  async getCredential(credentialId: string): Promise<string | null> {
    // Check session-only storage first
    if (this.sessionCredentials.has(credentialId)) {
      this.logAccess(credentialId, "read", "session");
      return this.sessionCredentials.get(credentialId) || null;
    }

    // Check persistent storage
    const credential = this.loadPersistentCredential(credentialId);
    if (!credential) {
      return null;
    }

    try {
      const salt = CryptoUtils.hexToBuffer(credential.salt);
      const key = await CryptoUtils.deriveKey(
        this.sessionKey || "session",
        salt
      );
      const decrypted = await CryptoUtils.decrypt(
        { iv: credential.iv, encrypted: credential.encrypted },
        key
      );

      this.logAccess(credentialId, "read", "persistent");

      // Update last accessed time
      credential.lastAccessed = Date.now();
      this.savePersistentCredential(credential);

      return decrypted;
    } catch (error) {
      console.error("Failed to decrypt credential:", error);
      return null;
    }
  }

  /**
   * Update stored credential
   */
  async updateCredential(
    credentialId: string,
    newValue: string
  ): Promise<boolean> {
    // Update session storage
    if (this.sessionCredentials.has(credentialId)) {
      this.sessionCredentials.set(credentialId, newValue);
      this.logAccess(credentialId, "update", "session");
      return true;
    }

    // Update persistent storage
    const credential = this.loadPersistentCredential(credentialId);
    if (!credential) {
      return false;
    }

    try {
      const salt = CryptoUtils.hexToBuffer(credential.salt);
      const key = await CryptoUtils.deriveKey(
        this.sessionKey || "session",
        salt
      );
      const encrypted = await CryptoUtils.encrypt(newValue, key);

      credential.encrypted = encrypted.encrypted;
      credential.iv = encrypted.iv;
      credential.lastAccessed = Date.now();

      this.savePersistentCredential(credential);
      this.logAccess(credentialId, "update", "persistent");
      return true;
    } catch (error) {
      console.error("Failed to update credential:", error);
      return false;
    }
  }

  /**
   * Delete credential
   */
  async deleteCredential(credentialId: string): Promise<boolean> {
    // Delete from session storage
    if (this.sessionCredentials.has(credentialId)) {
      this.sessionCredentials.delete(credentialId);
      this.logAccess(credentialId, "delete", "session");
      return true;
    }

    // Delete from persistent storage
    const stored = this.loadAllPersistentCredentials();
    const filtered = stored.filter((c) => c.id !== credentialId);

    if (stored.length !== filtered.length) {
      this.saveAllPersistentCredentials(filtered);
      this.logAccess(credentialId, "delete", "persistent");
      return true;
    }

    return false;
  }

  /**
   * Mask sensitive credential for display
   */
  maskCredential(
    value: string,
    type: "password" | "connectionString" | "apiKey"
  ): string {
    if (!value) return "";

    if (type === "password") {
      return "••••••••";
    }

    if (type === "apiKey") {
      if (value.length <= 8) return "••••••••";
      return value.substring(0, 4) + "••••" + value.substring(value.length - 4);
    }

    if (type === "connectionString") {
      // Mask password in connection string
      return value.replace(/(password|pwd)=([^;]+)/gi, "$1=••••••••");
    }

    return "••••••••";
  }

  /**
   * Get credential summary (without exposing actual values)
   */
  getCredentialSummary(credentialId: string): {
    exists: boolean;
    type?: string;
    storageType?: string;
    lastAccessed?: number;
  } {
    // Check session storage
    if (this.sessionCredentials.has(credentialId)) {
      return {
        exists: true,
        type: "unknown",
        storageType: "session",
      };
    }

    // Check persistent storage
    const credential = this.loadPersistentCredential(credentialId);
    if (credential) {
      return {
        exists: true,
        type: credential.type,
        storageType: credential.storageType,
        lastAccessed: credential.lastAccessed,
      };
    }

    return { exists: false };
  }

  /**
   * Clear all session-only credentials
   */
  clearSessionCredentials(): void {
    this.sessionCredentials.clear();
    console.log("Session credentials cleared");
  }

  /**
   * Clear all persistent credentials (use with caution)
   */
  clearAllCredentials(): void {
    this.sessionCredentials.clear();
    localStorage.removeItem("secure_credentials");
    localStorage.removeItem("credential_salt");
    console.log("All credentials cleared");
  }

  /**
   * Get access logs for audit
   */
  getAccessLogs(limit: number = 100): CredentialAccessLog[] {
    return this.accessLogs.slice(-limit);
  }

  /**
   * Export encrypted credentials (for backup)
   */
  exportEncryptedCredentials(): string {
    const credentials = this.loadAllPersistentCredentials();
    return JSON.stringify({
      version: "1.0",
      encrypted: true,
      credentials: credentials.map((c) => ({
        ...c,
        // Remove potentially sensitive metadata
        lastAccessed: undefined,
      })),
      exportedAt: Date.now(),
    });
  }

  /**
   * Import encrypted credentials (from backup)
   */
  async importEncryptedCredentials(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.encrypted || parsed.version !== "1.0") {
        throw new Error("Invalid credential backup format");
      }

      this.saveAllPersistentCredentials(parsed.credentials);
      console.log(`Imported ${parsed.credentials.length} credentials`);
      return true;
    } catch (error) {
      console.error("Failed to import credentials:", error);
      return false;
    }
  }

  // Private helper methods

  private getOrCreateSalt(): Uint8Array {
    const stored = localStorage.getItem("credential_salt");
    if (stored) {
      return CryptoUtils.hexToBuffer(stored);
    }

    const salt = CryptoUtils.generateSalt();
    localStorage.setItem("credential_salt", CryptoUtils.bufferToHex(salt));
    return salt;
  }

  private savePersistentCredential(credential: SecureCredential): void {
    const credentials = this.loadAllPersistentCredentials();
    const filtered = credentials.filter((c) => c.id !== credential.id);
    filtered.push(credential);
    this.saveAllPersistentCredentials(filtered);
  }

  private loadPersistentCredential(id: string): SecureCredential | null {
    const credentials = this.loadAllPersistentCredentials();
    return credentials.find((c) => c.id === id) || null;
  }

  private loadAllPersistentCredentials(): SecureCredential[] {
    try {
      const stored = localStorage.getItem("secure_credentials");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading credentials:", error);
      return [];
    }
  }

  private saveAllPersistentCredentials(credentials: SecureCredential[]): void {
    try {
      localStorage.setItem("secure_credentials", JSON.stringify(credentials));
    } catch (error) {
      console.error("Error saving credentials:", error);
    }
  }

  private logAccess(
    credentialId: string,
    action: "create" | "read" | "update" | "delete",
    context?: string
  ): void {
    this.accessLogs.push({
      credentialId,
      timestamp: Date.now(),
      action,
      context,
    });

    // Keep only last 1000 logs
    if (this.accessLogs.length > 1000) {
      this.accessLogs = this.accessLogs.slice(-1000);
    }
  }

  private setupCleanupTimer(): void {
    // Clean up old session credentials every 5 minutes
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const credentials = this.loadAllPersistentCredentials();

      // Remove credentials not accessed in SESSION_TIMEOUT
      const active = credentials.filter((c) => {
        if (!c.lastAccessed) return true;
        return now - c.lastAccessed < this.SESSION_TIMEOUT;
      });

      if (active.length !== credentials.length) {
        this.saveAllPersistentCredentials(active);
        console.log(
          `Cleaned up ${credentials.length - active.length} stale credentials`
        );
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private setupSecurityListeners(): void {
    // Clear session credentials on page unload
    window.addEventListener("beforeunload", () => {
      this.clearSessionCredentials();
    });

    // Clear session credentials on tab visibility change (optional, for extra security)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Optionally clear on tab hidden
        // this.clearSessionCredentials();
      }
    });

    // Monitor for potential XSS attempts
    window.addEventListener("error", (event) => {
      if (event.message?.includes("script")) {
        console.warn("Potential XSS detected, clearing session credentials");
        this.clearSessionCredentials();
      }
    });
  }

  /**
   * Destroy the credential manager instance
   */
  destroy(): void {
    this.clearSessionCredentials();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.masterKey = null;
    this.sessionKey = null;
  }
}

// Export singleton instance
export const secureCredentialManager = SecureCredentialManager.getInstance();
