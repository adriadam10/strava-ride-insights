import { getActivityType, filterActivitiesByType } from './activity-type'
import type { StravaActivity } from '@/types/strava'

// Helper function to create mock activities
const createMockActivity = (sport_type: string): StravaActivity =>
    ({
        id: 1,
        name: 'Test Activity',
        distance: 10000,
        moving_time: 1800,
        elapsed_time: 2000,
        total_elevation_gain: 100,
        type: sport_type,
        sport_type: sport_type,
        start_date: '2024-06-15T10:00:00Z',
        start_date_local: '2024-06-15T12:00:00Z',
        timezone: 'Europe/Madrid',
        utc_offset: 7200,
        achievement_count: 0,
        kudos_count: 0,
        comment_count: 0,
        athlete_count: 1,
        photo_count: 0,
        average_speed: 5.5,
        max_speed: 10,
        has_heartrate: false,
        heartrate_opt_out: false,
        elev_high: 150,
        elev_low: 50,
        trainer: false,
        commute: false,
        manual: false,
        private: false,
        visibility: 'everyone',
        start_latlng: [40.0, -3.0],
        end_latlng: [40.1, -3.1],
        map: {
            id: 'map1',
            summary_polyline: '',
            resource_state: 2,
        },
        athlete: {
            id: 123,
            resource_state: 1,
        },
    }) as StravaActivity

describe('getActivityType', () => {
    describe('ride activities', () => {
        it('should return "ride" for Ride sport type', () => {
            const activity = createMockActivity('Ride')
            expect(getActivityType(activity)).toBe('ride')
        })

        it('should return "ride" for VirtualRide sport type', () => {
            const activity = createMockActivity('VirtualRide')
            expect(getActivityType(activity)).toBe('ride')
        })

        it('should return "ride" for MountainBikeRide sport type', () => {
            const activity = createMockActivity('MountainBikeRide')
            expect(getActivityType(activity)).toBe('ride')
        })

        it('should return "ride" for GravelRide sport type', () => {
            const activity = createMockActivity('GravelRide')
            expect(getActivityType(activity)).toBe('ride')
        })

        it('should return "ride" for EBikeRide sport type', () => {
            const activity = createMockActivity('EBikeRide')
            expect(getActivityType(activity)).toBe('ride')
        })
    })

    describe('run activities', () => {
        it('should return "run" for Run sport type', () => {
            const activity = createMockActivity('Run')
            expect(getActivityType(activity)).toBe('run')
        })

        it('should return "run" for TrailRun sport type', () => {
            const activity = createMockActivity('TrailRun')
            expect(getActivityType(activity)).toBe('run')
        })

        it('should return "run" for VirtualRun sport type', () => {
            const activity = createMockActivity('VirtualRun')
            expect(getActivityType(activity)).toBe('run')
        })

        it('should return "run" for Walk sport type', () => {
            const activity = createMockActivity('Walk')
            expect(getActivityType(activity)).toBe('run')
        })
    })

    describe('other activities', () => {
        it('should return "other" for Swim sport type', () => {
            const activity = createMockActivity('Swim')
            expect(getActivityType(activity)).toBe('other')
        })

        it('should return "other" for Yoga sport type', () => {
            const activity = createMockActivity('Yoga')
            expect(getActivityType(activity)).toBe('other')
        })

        it('should return "other" for WeightTraining sport type', () => {
            const activity = createMockActivity('WeightTraining')
            expect(getActivityType(activity)).toBe('other')
        })

        it('should return "other" for Hike sport type', () => {
            const activity = createMockActivity('Hike')
            expect(getActivityType(activity)).toBe('other')
        })
    })
})

describe('filterActivitiesByType', () => {
    const activities = [
        { ...createMockActivity('Ride'), id: 1 },
        { ...createMockActivity('Run'), id: 2 },
        { ...createMockActivity('MountainBikeRide'), id: 3 },
        { ...createMockActivity('Swim'), id: 4 },
        { ...createMockActivity('Walk'), id: 5 },
    ]

    it('should filter ride activities', () => {
        const result = filterActivitiesByType(activities, 'ride')

        expect(result).toHaveLength(2)
        expect(result.map((a) => a.id)).toEqual([1, 3])
    })

    it('should filter run activities', () => {
        const result = filterActivitiesByType(activities, 'run')

        expect(result).toHaveLength(2)
        expect(result.map((a) => a.id)).toEqual([2, 5])
    })

    it('should filter other activities', () => {
        const result = filterActivitiesByType(activities, 'other')

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(4)
    })

    it('should return empty array when no activities match', () => {
        const onlyRides = [createMockActivity('Ride')]

        const result = filterActivitiesByType(onlyRides, 'other')

        expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
        const result = filterActivitiesByType([], 'ride')

        expect(result).toHaveLength(0)
    })
})
