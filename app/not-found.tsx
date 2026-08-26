import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#070b14] text-white p-4">
      <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-gray-400 mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-6 py-2.5 bg-[#00ADB5] text-black font-semibold rounded-lg hover:bg-[#00c4ce] transition-colors">
        Return Home
      </Link>
    </div>
  );
}
