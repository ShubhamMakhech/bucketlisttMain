
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { X, Plus, Settings } from 'lucide-react'

interface TimeSlot {
  start_time: string
  end_time: string
  capacity: number
}

interface TimeSlotManagerProps {
  timeSlots: TimeSlot[]
  onChange: (slots: TimeSlot[]) => void
}

interface AutoGenerateConfig {
  startTime: string
  endTime: string
  slotDuration: number
  capacity: number
}

export const TimeSlotManager = ({ timeSlots, onChange }: TimeSlotManagerProps) => {
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    start_time: '',
    end_time: '',
    capacity: 10
  })

  const [autoConfig, setAutoConfig] = useState<AutoGenerateConfig>({
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 2,
    capacity: 10
  })

  const [showAutoDialog, setShowAutoDialog] = useState(false)

  const addTimeSlot = () => {
    if (newSlot.start_time && newSlot.end_time && newSlot.capacity > 0) {
      onChange([...timeSlots, newSlot])
      setNewSlot({ start_time: '', end_time: '', capacity: 10 })
    }
  }

  const removeTimeSlot = (index: number) => {
    onChange(timeSlots.filter((_, i) => i !== index))
  }

  const generateAutoSlots = () => {
    const { startTime, endTime, slotDuration, capacity } = autoConfig
    const slots: TimeSlot[] = []
    let currentTime = startTime

    // Convert end time to hours for comparison
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const endTimeInMinutes = endHours * 60 + endMinutes

    while (currentTime < endTime) {
      const [hours, minutes] = currentTime.split(':').map(Number)
      const currentTimeInMinutes = hours * 60 + minutes
      const endSlotTimeInMinutes = currentTimeInMinutes + (slotDuration * 60)
      
      if (endSlotTimeInMinutes <= endTimeInMinutes) {
        const endHours = Math.floor(endSlotTimeInMinutes / 60)
        const endMinutes = endSlotTimeInMinutes % 60
        const endTimeSlot = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
        
        slots.push({
          start_time: currentTime,
          end_time: endTimeSlot,
          capacity
        })
        
        currentTime = endTimeSlot
      } else {
        break
      }
    }

    onChange(slots)
    setShowAutoDialog(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time Slots</CardTitle>
          <Dialog open={showAutoDialog} onOpenChange={setShowAutoDialog}>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Auto Generate Slots
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Auto-Generate Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="auto-start-time">Start Time</Label>
                    <Input
                      id="auto-start-time"
                      type="time"
                      value={autoConfig.startTime}
                      onChange={(e) => setAutoConfig(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auto-end-time">End Time</Label>
                    <Input
                      id="auto-end-time"
                      type="time"
                      value={autoConfig.endTime}
                      onChange={(e) => setAutoConfig(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slot-duration">Slot Duration (hours)</Label>
                  <Input
                    id="slot-duration"
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={autoConfig.slotDuration}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, slotDuration: parseFloat(e.target.value) || 1 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto-capacity">Capacity per Slot</Label>
                  <Input
                    id="auto-capacity"
                    type="number"
                    min="1"
                    value={autoConfig.capacity}
                    onChange={(e) => setAutoConfig(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAutoDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generateAutoSlots}>
                    Generate Slots
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new slot form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              id="start_time"
              type="time"
              value={newSlot.start_time}
              onChange={(e) => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <Input
              id="end_time"
              type="time"
              value={newSlot.end_time}
              onChange={(e) => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={newSlot.capacity}
              onChange={(e) => setNewSlot(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={addTimeSlot} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </div>

        {/* Existing slots */}
        {timeSlots.length > 0 && (
          <div className="space-y-2">
            <Label>Current Time Slots</Label>
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {slot.start_time} - {slot.end_time}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Capacity: {slot.capacity} people
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeSlot(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {timeSlots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No time slots added yet. Add some time slots or use auto-generate.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
