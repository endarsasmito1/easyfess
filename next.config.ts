import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@tiptap/react', '@tiptap/pm', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
};

export default nextConfig;
