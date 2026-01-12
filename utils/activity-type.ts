import type { StravaActivity } from '@/types/strava'

export type ActivityType = 'ride' | 'run' | 'other'

const typeMatchers: Record<ActivityType, (type: string) => boolean> = {
  ride: (type: string) => type.includes('ride'),
  run: (type: string) => type.includes('run') || type.includes('walk'),
  other: (type: string) =>
    !type.includes('ride') && !type.includes('run') && !type.includes('walk'),
}

export function getActivityType(activity: StravaActivity): ActivityType {
  const sportType = activity.sport_type.toLowerCase()
  return (
    (Object.entries(typeMatchers).find(([_, matcher]) =>
      matcher(sportType)
    )?.[0] as ActivityType) || 'other'
  )
}

export function filterActivitiesByType(
  activities: StravaActivity[],
  type: ActivityType
): StravaActivity[] {
  return activities.filter(activity => getActivityType(activity) === type)
}
