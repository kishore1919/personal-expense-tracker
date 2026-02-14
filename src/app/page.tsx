/**
 * Home Page - Main entry point of the application.
 * Redirects to Dashboard component for authenticated users.
 */
'use client';

import React from 'react';
import Dashboard from './components/Dashboard';

const Home = () => {
  return <Dashboard />;
};

export default Home;
