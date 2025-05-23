//path C:\VSProjects\bndy-centrestage\src\app\login\[[...rest]]\page.tsx
'use client';

import React from 'react';
import Providers from '../../providers';
import { LoginContent } from './components/LoginContent';

export default function LoginPage() {
  return (
    <Providers>
      <LoginContent />
    </Providers>
  );
}