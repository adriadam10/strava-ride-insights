import React from 'react'
import { Bike, Footprints, Ellipsis } from 'lucide-react'
import { ActivityType } from '@/utils/activity-type'

interface ActivityTypeTabProps {
  selectedType: ActivityType
  onTypeChange: (type: ActivityType) => void
  availableTypes: ActivityType[]
}

export function ActivityTypeTab({
  selectedType,
  onTypeChange,
  availableTypes,
}: ActivityTypeTabProps) {
  return (
    <div className="flex space-x-2 mb-4">
      {availableTypes.includes('ride') && (
        <button
          onClick={() => onTypeChange('ride')}
          className={`p-2 rounded-lg transition-colors ${
            selectedType === 'ride'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          title="Cycling"
        >
          <Bike className="h-5 w-5" />
        </button>
      )}
      {availableTypes.includes('run') && (
        <button
          onClick={() => onTypeChange('run')}
          className={`p-2 rounded-lg transition-colors ${
            selectedType === 'run'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          title="Running"
        >
          <Footprints className="h-5 w-5" />
        </button>
      )}
      {availableTypes.includes('other') && (
        <button
          onClick={() => onTypeChange('other')}
          className={`p-2 rounded-lg transition-colors ${
            selectedType === 'other'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          title="Other Sports"
        >
          <Ellipsis className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
