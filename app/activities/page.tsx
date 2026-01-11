'use client'
import { ActivityCard } from '@/components/ActivityCard'
import { ActivityTypeTab } from '@/components/ActivityTypeTab'
import { useActivities } from '@/hooks/useActivities'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { ActivityType, filterActivitiesByType } from '@/utils/activity-type'

export default function Activities() {
  const { activities, isLoading, error, loadMore, hasMore } = useActivities()
  const [selectedType, setSelectedType] = useState<ActivityType>('ride')
  const t = useTranslations()

  // Calculate available activity types
  const activityCounts = {
    ride: filterActivitiesByType(activities, 'ride').length,
    run: filterActivitiesByType(activities, 'run').length,
    other: filterActivitiesByType(activities, 'other').length,
  }

  const availableTypes = Object.entries(activityCounts)
    .filter(([, count]) => count > 0)
    .map(([type]) => type as ActivityType)

  // Update selected type if current type has no data
  useEffect(() => {
    if (
      activities.length > 0 &&
      !availableTypes.includes(selectedType) &&
      availableTypes.length > 0
    ) {
      setSelectedType(availableTypes[0])
    }
  }, [activities, availableTypes, selectedType])

  const filteredActivities = filterActivitiesByType(activities, selectedType)

  return (
    <div className="space-y-6">
      {availableTypes.length > 1 && (
        <ActivityTypeTab
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          availableTypes={availableTypes}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      )}

      {isLoading && activities.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          {filteredActivities.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('activities.noActivities')}
            </div>
          )}
        </div>
      )}

      {hasMore && selectedType === 'ride' && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? t('common.loading') : t('activities.loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
