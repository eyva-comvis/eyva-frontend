import {apiRequest} from './client';
import type {SessionConfig,SessionSummary} from '@/types/session';
export const sessionsApi={create:(config:SessionConfig)=>apiRequest<{id:string}>('/sessions',{method:'POST',body:JSON.stringify({configured_study_seconds:config.studyMinutes*60,configured_break_seconds:config.breakMinutes*60})}),summary:(id:string)=>apiRequest<SessionSummary>(`/sessions/${id}/summary`),end:(id:string)=>apiRequest(`/sessions/${id}/end`,{method:'POST'})};
