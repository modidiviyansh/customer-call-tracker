import React from 'react';
import { Button } from '../components';

const HomePage = ({ onNavigateToDashboard }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
            Customer Call Tracker
          </h1>
          <p className="text-lg text-white/90 mb-12">
            Premium mobile web experience with modern React stack
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">🚀 Supabase Integration</h3>
              <p className="text-sm text-white/80">Backend powered by @supabase/supabase-js</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">📊 Data Sync</h3>
              <p className="text-sm text-white/80">@tanstack/react-query for data management</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">✨ Smooth Animations</h3>
              <p className="text-sm text-white/80">framer-motion for super-smooth UX</p>
            </div>
          </div>

          <div className="mt-12">
            <Button
              variant="primary"
              size="lg"
              onClick={onNavigateToDashboard}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;