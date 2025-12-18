
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface FilterState {
  priceRange: [number, number]
  locations: string[]
  categories: string[]
  sortBy: string
}

interface FilterOptions {
  locations: string[]
  categories: string[]
}

interface ExperienceFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  filterOptions?: FilterOptions
}

export function ExperienceFilters({ filters, onFiltersChange, filterOptions }: ExperienceFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = useState(filters.priceRange)

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]]
    setLocalPriceRange(newRange)
    onFiltersChange({
      ...filters,
      priceRange: newRange
    })
  }

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked
      ? [...filters.locations, location]
      : filters.locations.filter(l => l !== location)
    
    onFiltersChange({
      ...filters,
      locations: newLocations
    })
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category)
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    })
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      priceRange: [0, 10000] as [number, number],
      locations: [],
      categories: [],
      sortBy: 'title'
    }
    setLocalPriceRange(clearedFilters.priceRange)
    onFiltersChange(clearedFilters)
  }

  const removeFilter = (type: string, value: string) => {
    if (type === 'location') {
      handleLocationChange(value, false)
    } else if (type === 'category') {
      handleCategoryChange(value, false)
    }
  }

  const hasActiveFilters = filters.locations.length > 0 || filters.categories.length > 0 || 
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {filters.locations.map(location => (
                <Badge key={location} variant="secondary" className="text-xs">
                  {location}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeFilter('location', location)}
                  />
                </Badge>
              ))}
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeFilter('category', category)}
                  />
                </Badge>
              ))}
              {(filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000) && (
                <Badge variant="secondary" className="text-xs">
                  ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort By */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={filters.sortBy} 
            onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Name (A-Z)</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
              <SelectItem value="rating">Rating (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider
              value={localPriceRange}
              onValueChange={handlePriceChange}
              max={10000}
              min={0}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{localPriceRange[0]}</span>
              <span>₹{localPriceRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      {filterOptions?.locations && filterOptions.locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {filterOptions.locations.map(location => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={filters.locations.includes(location)}
                    onCheckedChange={(checked) => handleLocationChange(location, !!checked)}
                  />
                  <label 
                    htmlFor={`location-${location}`} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {location}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {filterOptions?.categories && filterOptions.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {filterOptions.categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                  />
                  <label 
                    htmlFor={`category-${category}`} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
