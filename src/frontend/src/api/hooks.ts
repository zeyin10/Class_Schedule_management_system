import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { buildLookup } from '../lib/lookup'
import { api } from './index'
import type {
  ConstraintInput,
  FreeRoomsQuery,
  GenerationParams,
  SaveOptions,
  ScheduleEntryInput,
  ScheduleQuery,
} from './types'

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

export function useTeachingLoad() {
  return useQuery({ queryKey: ['load'], queryFn: () => api.getTeachingLoad() })
}

export function useConstraints() {
  return useQuery({ queryKey: ['constraints'], queryFn: () => api.getConstraints() })
}

export function useCreateConstraint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ConstraintInput) => api.createConstraint(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['constraints'] }),
  })
}

export function useDeleteConstraint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteConstraint(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['constraints'] }),
  })
}

export function useParseConstraint() {
  return useMutation({ mutationFn: (text: string) => api.parseConstraint(text) })
}

export function useExplainRun() {
  return useMutation({
    mutationFn: ({ runId, language }: { runId: number; language: string }) => api.explainRun(runId, language),
  })
}

export function useStartGeneration() {
  return useMutation({ mutationFn: (params: GenerationParams) => api.startGeneration(params) })
}

/** Polls the job while the worker is busy (FR-27). */
export function useGenerationRun(id: number | null) {
  return useQuery({
    queryKey: ['generationRun', id],
    queryFn: () => api.getGenerationRun(id!),
    enabled: id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'queued' || status === 'running' ? 500 : false
    },
  })
}

export function usePublishRun() {
  const invalidate = useInvalidateSchedule()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.publishRun(id),
    onSuccess: (run) => {
      queryClient.setQueryData(['generationRun', run.id], run)
      invalidate()
    },
  })
}

export function useDeleteEntry() {
  const invalidate = useInvalidateSchedule()
  return useMutation({
    mutationFn: (id: number) => api.deleteEntry(id),
    onSuccess: invalidate,
  })
}
