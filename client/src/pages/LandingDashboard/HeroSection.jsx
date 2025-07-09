import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React from 'react';

const HeroSection = ({ handleSearch, searchQuery, setSearchQuery }) => {
    return (
        <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                        Find Amazing
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Pet Services</span>
                    </h2>
                    <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover trusted pet grooming, veterinary care, boarding, and training services in your area.
                        Your pet deserves the best care.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-10 max-w-2xl mx-auto">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search for pet services, grooming, vet clinics..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="absolute right-2 top-2 bottom-2 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
