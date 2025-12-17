import React from 'react'
import { Button } from '@/components/ui/button'

interface MobileFloatingButtonProps {
    price: number
    originalPrice?: number
    currency: string
    bookingButtonText: string
    onBookingClick: () => void
    discountedPrice?: number | null
}

export function MobileFloatingButton({
    price,
    originalPrice,
    currency,
    bookingButtonText,
    onBookingClick,
    discountedPrice
}: MobileFloatingButtonProps) {
    // Determine which price to display
    const displayPrice = discountedPrice || price;
    const isDiscounted = discountedPrice && discountedPrice !== price;
    
    return (
        <div className="MobileOnlyButtonContainer">
            <div>
                <div>
                    {isDiscounted ? (
                        <div className="flex flex-col gap-0" style={{textAlign: "start"}}>
                            <div className="FlexAdjustContainer">
                                <span style={{ color: "grey" }} className='textSmall'>From</span>
                                <span className="text-muted-foreground line-through textSmall">
                                    {currency === "USD"
                                        ? "₹"
                                        : currency == "INR"
                                            ? "₹"
                                            : currency}{" "}
                                    {price}
                                </span>
                            </div>
                            <span className="text-3xl font-bold text-green-600">
                                {currency === "USD"
                                    ? "₹"
                                    : currency == "INR"
                                        ? "₹"
                                        : currency}{" "}
                                {displayPrice}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span style={{ color: "grey" }}>From</span>
                            <span className="text-3xl font-bold text-orange-500">
                                {currency === "USD"
                                    ? "₹"
                                    : currency == "INR"
                                        ? "₹"
                                        : currency}{" "}
                                {displayPrice}
                            </span>
                            {originalPrice && (
                                <span className="text-lg text-muted-foreground line-through">
                                    {currency === "USD"
                                        ? "₹"
                                        : currency == "INR"
                                            ? "₹"
                                            : currency}{" "}
                                    {originalPrice}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                
            </div>
            <div>
                <Button
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={onBookingClick}
                >
                    {bookingButtonText}
                </Button>
            </div>
        </div>
    )
}
