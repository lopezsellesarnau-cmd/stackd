/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shop used to live at /components; it is the home page now
  async redirects() {
    return [{ source: '/components', destination: '/', permanent: true }]
  },
}
export default nextConfig
