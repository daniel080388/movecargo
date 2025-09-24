// Re-export the canonical AuthContext implementation so all imports
// (including older imports referencing this file) resolve to the same
// provider and hook instance. This avoids duplicate React context
// identities which cause "useAuth must be used within AuthProvider" errors.

export * from "./AuthContext";
