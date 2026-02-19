import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <main className="max-w-md w-full text-center space-y-8">
        <h1 className="text-2xl font-semibold">Booking for creative studios</h1>
        <p className="text-gray-600">
          Book a session or manage your studio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/studio/fotf"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700"
          >
            Book
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-50"
          >
            Studio admin
          </Link>
        </div>
      </main>
    </div>
  );
}
