import api from '../lib/api'

export interface ForecastDay {
  date: string
  dayName: string
  isToday: boolean
  isTomorrow: boolean
  suggested: number
  base: number
  confidence: 'high' | 'medium' | 'low'
}

export interface ProductForecast {
  product: {
    id: string
    name: string
    price: number
    imageUrl: string | null
  }
  totalSold: number
  avgPerDay: number
  trendFactor: number
  trendLabel: 'naik' | 'turun' | 'stabil'
  bestDay: string
  worstDay: string
  next7Days: ForecastDay[]
  todaySuggested: number
  tomorrowSuggested: number
}

export interface ForecastResult {
  generatedAt: string
  lookbackDays: number
  dayOfWeek: string
  forecasts: ProductForecast[]
}

export const forecastApi = {
  get: async (days?: number): Promise<ForecastResult> => {
    const res = await api.get('/forecast', { params: days ? { days } : {} })
    return res.data
  },
}
