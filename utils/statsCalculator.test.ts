import {
    calculateRideStats,
    calculateTimeDistribution,
    calculateSeasonalStats,
    calculateWeekdayStats,
} from './statsCalculator'
import type { StravaActivity } from '../types/strava'

// Helper function to create mock activities
const createMockActivity = (overrides: Partial<StravaActivity> = {}): StravaActivity => ({
    id: 1,
    name: 'Test Activity',
    distance: 10000, // 10km in meters
    moving_time: 1800, // 30 minutes in seconds
    elapsed_time: 2000,
    total_elevation_gain: 100,
    type: 'Ride',
    sport_type: 'Ride',
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
    ...overrides,
})

describe('calculateRideStats', () => {
    it('should return zeroed stats for empty array', () => {
        const result = calculateRideStats([])

        expect(result.totalDistance).toBe(0)
        expect(result.totalTime).toBe(0)
        expect(result.totalElevation).toBe(0)
        expect(result.totalRides).toBe(0)
        expect(result.averageDistance).toBe(0)
        expect(result.averageSpeed).toBe(0)
        expect(result.averagePower).toBe(0)
    })

    it('should calculate stats correctly for single activity', () => {
        const activities = [createMockActivity()]

        const result = calculateRideStats(activities)

        expect(result.totalDistance).toBe(10000)
        expect(result.totalTime).toBe(1800)
        expect(result.totalElevation).toBe(100)
        expect(result.totalRides).toBe(1)
        expect(result.averageDistance).toBe(10000)
    })

    it('should calculate stats correctly for multiple activities', () => {
        const activities = [
            createMockActivity({ distance: 10000, moving_time: 1800, total_elevation_gain: 100 }),
            createMockActivity({ id: 2, distance: 20000, moving_time: 3600, total_elevation_gain: 200 }),
            createMockActivity({ id: 3, distance: 15000, moving_time: 2700, total_elevation_gain: 150 }),
        ]

        const result = calculateRideStats(activities)

        expect(result.totalDistance).toBe(45000)
        expect(result.totalTime).toBe(8100)
        expect(result.totalElevation).toBe(450)
        expect(result.totalRides).toBe(3)
        expect(result.averageDistance).toBe(15000)
    })

    it('should find longest ride', () => {
        const activities = [
            createMockActivity({ name: 'Short Ride', distance: 10000 }),
            createMockActivity({ id: 2, name: 'Long Ride', distance: 50000 }),
            createMockActivity({ id: 3, name: 'Medium Ride', distance: 25000 }),
        ]

        const result = calculateRideStats(activities)

        expect(result.longestRide.name).toBe('Long Ride')
        expect(result.longestRide.distance).toBe(50000)
    })

    it('should find highest climb', () => {
        const activities = [
            createMockActivity({ name: 'Flat Ride', total_elevation_gain: 50 }),
            createMockActivity({ id: 2, name: 'Mountain Climb', total_elevation_gain: 2000 }),
            createMockActivity({ id: 3, name: 'Hilly Ride', total_elevation_gain: 500 }),
        ]

        const result = calculateRideStats(activities)

        expect(result.highestClimb.name).toBe('Mountain Climb')
        expect(result.highestClimb.elevation).toBe(2000)
    })

    it('should find fastest speed', () => {
        const activities = [
            createMockActivity({ name: 'Slow Ride', max_speed: 8 }),
            createMockActivity({ id: 2, name: 'Fast Ride', max_speed: 15 }),
            createMockActivity({ id: 3, name: 'Normal Ride', max_speed: 10 }),
        ]

        const result = calculateRideStats(activities)

        expect(result.fastestSpeed.name).toBe('Fast Ride')
        expect(result.fastestSpeed.speed).toBe(15)
    })

    it('should calculate average power only from activities with power data', () => {
        const activities = [
            createMockActivity({ average_watts: 200 }),
            createMockActivity({ id: 2, average_watts: 250 }),
            createMockActivity({ id: 3 }), // No power data
        ]

        const result = calculateRideStats(activities)

        expect(result.averagePower).toBe(225)
    })
})

describe('calculateTimeDistribution', () => {
    it('should return zeroed distribution for empty array', () => {
        const result = calculateTimeDistribution([])

        expect(result.morning).toBe(0)
        expect(result.afternoon).toBe(0)
        expect(result.evening).toBe(0)
        expect(result.night).toBe(0)
    })

    it('should categorize morning activities (5-11)', () => {
        // Using 07:00 UTC which is morning in most timezones
        const activities = [
            createMockActivity({ start_date: '2024-06-15T07:00:00Z' }),
            createMockActivity({ id: 2, start_date: '2024-06-15T09:00:00Z' }),
        ]

        const result = calculateTimeDistribution(activities)

        // At least one should be categorized as morning
        expect(result.morning).toBeGreaterThanOrEqual(1)
    })

    it('should categorize afternoon activities (11-17)', () => {
        const activities = [
            createMockActivity({ start_date: '2024-06-15T14:00:00Z' }),
        ]

        const result = calculateTimeDistribution(activities)

        expect(result.afternoon).toBe(1)
    })

    it('should categorize evening activities (17-22)', () => {
        const activities = [
            createMockActivity({ start_date: '2024-06-15T18:30:00Z' }),
        ]

        const result = calculateTimeDistribution(activities)

        expect(result.evening).toBe(1)
    })

    it('should categorize night activities (22-5)', () => {
        // Using times clearly in the night slot
        const activities = [
            createMockActivity({ start_date: '2024-06-15T01:00:00Z' }),
            createMockActivity({ id: 2, start_date: '2024-06-15T02:00:00Z' }),
        ]

        const result = calculateTimeDistribution(activities)

        // At least one should be categorized as night
        expect(result.night).toBeGreaterThanOrEqual(1)
    })
})

describe('calculateSeasonalStats', () => {
    it('should group activities by season', () => {
        const activities = [
            createMockActivity({ start_date: '2024-03-15T10:00:00Z' }), // Spring (March)
            createMockActivity({ id: 2, start_date: '2024-07-15T10:00:00Z' }), // Summer (July)
            createMockActivity({ id: 3, start_date: '2024-09-15T10:00:00Z' }), // Autumn (September)
            createMockActivity({ id: 4, start_date: '2024-01-15T10:00:00Z' }), // Winter (January)
        ]

        const result = calculateSeasonalStats(activities)

        expect(result.spring.totalRides).toBe(1)
        expect(result.summer.totalRides).toBe(1)
        expect(result.autumn.totalRides).toBe(1)
        expect(result.winter.totalRides).toBe(1)
    })

    it('should handle empty seasons', () => {
        const activities = [
            createMockActivity({ start_date: '2024-07-15T10:00:00Z' }), // Only summer
        ]

        const result = calculateSeasonalStats(activities)

        expect(result.spring.totalRides).toBe(0)
        expect(result.summer.totalRides).toBe(1)
        expect(result.autumn.totalRides).toBe(0)
        expect(result.winter.totalRides).toBe(0)
    })
})

describe('calculateWeekdayStats', () => {
    it('should separate weekdays from weekends', () => {
        const activities = [
            createMockActivity({ start_date: '2024-06-10T10:00:00Z' }), // Monday
            createMockActivity({ id: 2, start_date: '2024-06-12T10:00:00Z' }), // Wednesday
            createMockActivity({ id: 3, start_date: '2024-06-15T10:00:00Z' }), // Saturday
            createMockActivity({ id: 4, start_date: '2024-06-16T10:00:00Z' }), // Sunday
        ]

        const result = calculateWeekdayStats(activities)

        expect(result.weekday.totalRides).toBe(2)
        expect(result.weekend.totalRides).toBe(2)
    })

    it('should handle only weekday activities', () => {
        const activities = [
            createMockActivity({ start_date: '2024-06-10T10:00:00Z' }), // Monday
            createMockActivity({ id: 2, start_date: '2024-06-11T10:00:00Z' }), // Tuesday
        ]

        const result = calculateWeekdayStats(activities)

        expect(result.weekday.totalRides).toBe(2)
        expect(result.weekend.totalRides).toBe(0)
    })

    it('should handle only weekend activities', () => {
        const activities = [
            createMockActivity({ start_date: '2024-06-15T10:00:00Z' }), // Saturday
            createMockActivity({ id: 2, start_date: '2024-06-16T10:00:00Z' }), // Sunday
        ]

        const result = calculateWeekdayStats(activities)

        expect(result.weekday.totalRides).toBe(0)
        expect(result.weekend.totalRides).toBe(2)
    })
})
