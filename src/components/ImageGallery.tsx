
import { useState } from 'react'
import { LazyImage } from './LazyImage'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import "../Styles/ExperienceDetail.css"
interface ImageGalleryProps {
  images: Array<{
    id: string
    image_url: string
    alt_text?: string
    display_order: number
    is_primary?: boolean
  }>
  experienceTitle: string
}

export function ImageGallery({ images, experienceTitle }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sort images by display_order, with primary image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.display_order - b.display_order
  })

  const openModal = (index: number) => {
    setSelectedImageIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const goToPrevious = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setSelectedImageIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    )
  }

  const handlePlayButtonClick = () => {
    // Handle play button click - could open video modal or navigate to video
    console.log('Play button clicked')
  }

  const handleViewAllClick = () => {
    // Open modal with all images
    openModal(0)
  }

  if (sortedImages.length === 0) {
    return (
      <div className="image-gallery-grid">
        <div className="image-gallery-main">
          <div className="image-gallery-placeholder">No images available</div>
        </div>
        <div className="image-gallery-side">
          <div className="image-gallery-side-item">
            <div className="image-gallery-placeholder">No images available</div>
          </div>
          <div className="image-gallery-side-item">
            <div className="image-gallery-placeholder">No images available</div>
          </div>
          <div className="image-gallery-side-item">
            <div className="image-gallery-placeholder">No images available</div>
          </div>
          <div className="image-gallery-side-item">
            <div className="image-gallery-placeholder">No images available</div>
          </div>
        </div>
      </div>
    )
  }

  // Get main image and side images
  const mainImage = sortedImages[0]
  const sideImages = sortedImages.slice(1, 5) // Get up to 4 side images

  return (
    <>
      {/* Desktop Layout */}
      <div className="image-gallery-grid hidden md:grid" >
        {/* Main Image */}
        <div className="image-gallery-main" onClick={() => openModal(0)}>
          <img
            src={mainImage.image_url}
            alt={mainImage.alt_text || `${experienceTitle} main image`}
          />
          <div className="image-gallery-main-overlay"></div>
          <div className="image-gallery-play-btn" onClick={(e) => {
            e.stopPropagation()
            handlePlayButtonClick()
          }}>
            <div className="image-gallery-play-icon"></div>
          </div>
        </div>

        {/* Side Images Grid */}
        <div className="image-gallery-side">
          {[0, 1, 2, 3].map((index) => {
            const image = sideImages[index]
            const imageIndex = index + 1

            return (
              <div
                key={image?.id || `placeholder-${index}`}
                className="image-gallery-side-item"
                onClick={() => image ? openModal(imageIndex) : null}
              >
                {image ? (
                  <>
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `${experienceTitle} ${imageIndex + 1}`}
                    />
                    <div className="image-gallery-side-overlay"></div>
                    {/* Show "View all images" button on the 4th image if there are more than 5 total images */}
                    {index === 3 && sortedImages.length > 5 && (
                      <div
                        className="image-gallery-view-all"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewAllClick()
                        }}
                      >
                        <div className="image-gallery-view-icon"></div>
                        <span>View all images</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="image-gallery-placeholder">No image</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="image-gallery-mobile md:hidden">
        {/* Mobile Full Carousel */}
        <div className="image-gallery-mobile-carousel">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={true}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            // autoplay={{
            //   delay: 4000,
            //   disableOnInteraction: false,
            // }}
            loop={sortedImages.length > 1}
            className="mobile-full-carousel"
          >
            {sortedImages.map((image, index) => (
              <SwiperSlide key={image.id}>
                <div 
                  className="image-gallery-mobile-slide"
                  onClick={() => openModal(index)}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `${experienceTitle} ${index + 1}`}
                  />
                  <div className="image-gallery-main-overlay"></div>
                  <div className="image-gallery-play-btn" onClick={(e) => {
                    e.stopPropagation()
                    handlePlayButtonClick()
                  }}>
                    <div className="image-gallery-play-icon"></div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center " id='ImageGalleryModal' style={{ height: '100vh' }}>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div className="max-w-4xl max-h-full">
              <img
                src={sortedImages[selectedImageIndex].image_url}
                alt={sortedImages[selectedImageIndex].alt_text || experienceTitle}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
