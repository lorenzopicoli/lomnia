import z from 'zod'
import { DiaryEntriesService } from '../services/diaryEntries'
import { loggedProcedure } from './common/loggedProcedure'
import { t } from './trpc'

export const diaryEntriesRouter = t.router({
  getByDay: loggedProcedure
    .input(
      z.object({
        day: z.iso.date(),
        privateMode: z.boolean(),
      })
    )
    .query((opts) => {
      return DiaryEntriesService.getByDay(opts.input)
    }),
})
