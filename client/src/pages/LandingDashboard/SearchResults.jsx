import React from 'react';

const SearchResults = ({
    hasSearched,
    loading,
    businesses,
    suggestions,
    selectedCategory,
    userLocation,
    renderBusinessCard,
    renderNoResultsWithSuggestions,
    categoriesLoading,
    categories,
    iconMap,
    SparklesIcon,
    handleCategoryClick
}) => {
    return (
        <div>
            {hasSearched && (loading || businesses.length > 0 || suggestions.length > 0) && (
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-gray-900">
                                {loading ? 'Searching...' : `Found ${businesses.length} Results`}
                            </h3>
                            {selectedCategory && (
                                <p className="mt-2 text-lg text-gray-600">
                                    Showing results for "{selectedCategory.name}"
                                    {userLocation && ' near your location'}
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                            </div>
                        ) : businesses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {businesses.map(renderBusinessCard)}
                            </div>
                        ) : (
                            renderNoResultsWithSuggestions()
                        )}
                    </div>
                </section>
            )}

            {/* Categories - Now positioned after search results or after hero if no search */}
            {!hasSearched && (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-gray-900">Popular Services</h3>
                            <p className="mt-4 text-lg text-gray-600">Browse by category to find exactly what you need</p>
                        </div>

                        {categoriesLoading ? (
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {categories.map((category) => {
                                    const IconComponent = iconMap[category.icon] || SparklesIcon;
                                    return (
                                        <div
                                            key={category._id}
                                            onClick={() => handleCategoryClick(category)}
                                            className="group cursor-pointer bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                                        >
                                            <div
                                                className="rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                                                style={{ backgroundColor: category.color || '#3B82F6' }}
                                            >
                                                <IconComponent className="h-8 w-8 text-white" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h4>
                                            <p className="text-gray-600">{category.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default SearchResults;
