import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React from 'react';

const RenderNoResultsWithSuggestions = ({ searchQuery, loadingSuggestions, suggestions, handleSuggestionClick }) => {
    return (
        <div className="text-center">
            <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-400" />
            </div>

            <h4 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h4>
            <p className="text-gray-600 mb-6">
                {searchQuery ? `No businesses found for "${searchQuery}"` : 'No businesses found for your search'}
            </p>

            {loadingSuggestions ? (
                <div className="mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Finding suggestions...</p>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="mb-6">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Available services near you:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                                            {suggestion.query}
                                        </span>
                                    </div>
                                    {suggestion.count > 0 && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {suggestion.count}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {suggestion.type === 'business' && 'Business name'}
                                    {suggestion.type === 'service' && 'Available service'}
                                    {suggestion.type === 'category' && 'Service category'}
                                    {suggestion.type === 'popular' && 'Popular search'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <p className="text-gray-500">No suggestions available at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default RenderNoResultsWithSuggestions;
