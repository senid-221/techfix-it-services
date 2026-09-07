import type {NextConfig} from 'next';
import path from 'node:path';

const nextConfig:NextConfig={
  images:{remotePatterns:[{protocol:'https',hostname:'images.pexels.com'}]},
  webpack:(config)=>{
    config.resolve.alias={...(config.resolve.alias||{}),'lucide-react':path.resolve(process.cwd(),'components/SuperIcon.tsx')};
    return config;
  },
};

export default nextConfig;
