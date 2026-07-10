import './globals.css';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">C</div>
            <span className="text-xl font-bold tracking-tight">Canvas</span>
          </Link>
          <div className="flex-1 max-w-2xl mx-8">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <Link href="/create" className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <Plus size={20} />
          </Link>
        </nav>
        <main className="p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
