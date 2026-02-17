import { EncryptedPackage } from '../types';

// Utils
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export const cryptoService = {
  generateKeyPair: async (): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> => {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  },

  exportKey: async (key: CryptoKey, type: 'public' | 'private'): Promise<string> => {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
  },

  importKey: async (jwkStr: string, type: "public" | "private"): Promise<CryptoKey> => {
    const jwk = JSON.parse(jwkStr);
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      type === "public" ? ["encrypt"] : ["decrypt"]
    );
  },

  // Encrypts text for multiple recipients (AES key encrypted with each recipient's Public Key)
  encryptData: async (text: string, recipients: { userId: string; publicKey: string }[]): Promise<string> => {
    // 1. Generate Session Key (AES-GCM)
    const aesKey = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // 2. Encrypt Content
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(text);
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encodedData
    );

    // 3. Encrypt Session Key for each recipient
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const keysMap: Record<string, string> = {};

    for (const recipient of recipients) {
      try {
        const pubKey = await cryptoService.importKey(recipient.publicKey, 'public');
        const encryptedKey = await window.crypto.subtle.encrypt(
          { name: "RSA-OAEP" },
          pubKey,
          rawAesKey
        );
        keysMap[recipient.userId] = arrayBufferToBase64(encryptedKey);
      } catch (e) {
        console.error(`Failed to encrypt key for user ${recipient.userId}`, e);
      }
    }

    const packageData: EncryptedPackage = {
      iv: arrayBufferToBase64(iv),
      content: arrayBufferToBase64(encryptedContent),
      keys: keysMap
    };

    return JSON.stringify(packageData);
  },

  decryptData: async (encryptedPackageStr: string, privateKeyStr: string, userId: string): Promise<string> => {
    try {
      const pkg: EncryptedPackage = JSON.parse(encryptedPackageStr);
      const encryptedKeyForUser = pkg.keys[userId];
      
      if (!encryptedKeyForUser) {
        throw new Error("No key found for this user");
      }

      const privateKey = await cryptoService.importKey(privateKeyStr, 'private');
      
      // 1. Decrypt AES Key
      const rawAesKey = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        base64ToArrayBuffer(encryptedKeyForUser)
      );

      // 2. Import AES Key
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        rawAesKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      // 3. Decrypt Content
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToArrayBuffer(pkg.iv) },
        aesKey,
        base64ToArrayBuffer(pkg.content)
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedContent);
    } catch (e) {
      console.error("Decryption failed", e);
      return "🔒 Decryption Failed";
    }
  }
};
