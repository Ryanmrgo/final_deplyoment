import Link from 'next/link';
import { BookOpen, Mail, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-[#F59E0B]" />
              <span className="text-xl font-semibold">AlinHub</span>
            </div>
            <p className="text-gray-400 text-sm">
              A charity-based learning platform providing free and accessible education to everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-[#F59E0B] transition">Home</Link></li>
              <li><Link href="/courses" className="hover:text-[#F59E0B] transition">Browse Courses</Link></li>
              <li><Link href="/categories" className="hover:text-[#F59E0B] transition">Categories</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#F59E0B] transition">Dashboard</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/courses?category=1" className="hover:text-[#F59E0B] transition">Web Development</Link></li>
              <li><Link href="/courses?category=2" className="hover:text-[#F59E0B] transition">Data Science</Link></li>
              <li><Link href="/courses?category=4" className="hover:text-[#F59E0B] transition">UI/UX Design</Link></li>
              <li><Link href="/courses?category=5" className="hover:text-[#F59E0B] transition">Business</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Mail className="w-4 h-4" />
              <a href="mailto:info@alinhub.org" className="hover:text-[#F59E0B] transition">
                info@alinhub.org
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              We are a non-profit organization dedicated to making education accessible to all.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p className="flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by AlinHub Team
          </p>
          <p className="mt-2">© 2026 AlinHub. All rights reserved. Free education for everyone.</p>
        </div>
      </div>
    </footer>
  );
}
