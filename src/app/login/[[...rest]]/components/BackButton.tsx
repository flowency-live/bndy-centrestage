import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const BackButton: React.FC = () => {
  return (
    <Link
      href="/"
      className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </Link>
  );
};
