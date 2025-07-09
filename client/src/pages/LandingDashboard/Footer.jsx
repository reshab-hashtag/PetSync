import { HeartIcon } from '@heroicons/react/24/outline';
import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center mb-4">
                            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <HeartIcon className="h-6 w-6 text-white" />
                            </div>
                            <span className="ml-3 text-2xl font-bold">PetSync</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Connecting pet owners with the best pet services in their area. Your pet's health and happiness is our priority.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Services</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li>Pet Grooming</li>
                            <li>Veterinary Care</li>
                            <li>Pet Boarding</li>
                            <li>Pet Training</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li>support@petsync.com</li>
                            <li>+91 12345 67890</li>
                            <li>24/7 Customer Support</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 PetSync. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
