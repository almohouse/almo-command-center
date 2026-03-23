import { useQuery } from '@tanstack/react-query'
import { paperclipApi, type DashboardData } from '@/api/paperclip'

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: paperclipApi.dashboard,
  })
}
