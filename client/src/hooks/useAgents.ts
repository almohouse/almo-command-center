import { useQuery } from '@tanstack/react-query'
import { paperclipApi, type Agent } from '@/api/paperclip'

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: paperclipApi.agents,
  })
}
