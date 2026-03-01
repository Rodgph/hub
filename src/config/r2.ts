// Placeholder para cliente R2 (S3-compatible)
// Na implementação real, usaria @aws-sdk/client-s3

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://placeholder.r2.dev';

export const r2 = {
  publicUrl: R2_PUBLIC_URL,
  // Métodos de upload seriam implementados aqui usando presigned URLs
};
