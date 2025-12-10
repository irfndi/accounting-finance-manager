declare module '@noble/hashes/argon2.js' {
  export const argon2id: (password: Uint8Array | string, salt: Uint8Array | string, opts?: any) => Uint8Array;
}

declare module '@noble/hashes/utils.js' {
  export const randomBytes: (bytesLength?: number) => Uint8Array;
}
