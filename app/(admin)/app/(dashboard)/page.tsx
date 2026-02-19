import Link from 'next/link';

export default function AppDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome to your studio admin.</p>
      <ul className="flex flex-wrap gap-4">
        <li><Link href="/app/rooms" className="text-blue-600 underline">Rooms</Link></li>
        <li><Link href="/app/services" className="text-blue-600 underline">Services</Link></li>
        <li><Link href="/app/availability" className="text-blue-600 underline">Availability</Link></li>
        <li><Link href="/app/bookings" className="text-blue-600 underline">Bookings</Link></li>
      </ul>
    </div>
  );
}
