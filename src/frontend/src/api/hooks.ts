import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { buildLookup } from '../lib/lookup'
import { api } from './index'
import type { FreeRoomsQuery, SaveOptions, ScheduleEntryInput, ScheduleQuery } from './types'

export function useReferenceData() {
  const query = useQuery({
    queryKey: ['reference'],
    queryFn: () => api.getReferenceData(),
    staleTime: Infinity,
  })
  const lookup = useMemo(() => (query.data ? buildLookup(query.data) : undefined), [query.data])
  return { ...query, lookup }
}

/** Pass null to disable the query (nothing selected yet). */
export function useSchedule(query: ScheduleQuery | null) {
  return useQuery({
    queryKey: ['schedule', query],
    queryFn: () => api.getSchedule(query ?? {}),
    enabled: query !== null,
  })
}

export function useFreeRooms(query: FreeRoomsQuery | null) {
  return useQuery({
    queryKey: ['freeRooms', query],
    queryFn: () => api.getFreeRooms(query!),
    enabled: query !== null,
  })
}

function useInvalidateSchedule() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['schedule'] })
    void queryClient.invalidateQueries({ queryKey: ['freeRooms'] })
  }
}

export function useSaveEntry() {
  const invalidate = useInvalidateSchedule()
  return useMutation({
    mutationFn: ({ id, input, options }: { id?: number; input: ScheduleEntryInput; options?: SaveOptions }) =>
      id === undefined ? api.createEntry(input, options) : api.updateEntry(id, input, options),
    onSuccess: invalidate,
  })
}

export function useDeleteEntry() {
  const invalidate = useInvalidateSchedule()
  return useMutation({
    mutationFn: (id: number) => api.deleteEntry(id),
    onSuccess: invalidate,
  })
}
