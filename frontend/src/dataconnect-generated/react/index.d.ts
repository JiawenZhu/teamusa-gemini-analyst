import { GetMedalStatsData, GetMedalStatsVariables, GetAthleteBiometricsData, GetAthleteBiometricsVariables, GetSportBreakdownData, GetSportBreakdownVariables, GetTopNationsData, GetTopNationsVariables, GetAthleteAgeStatsData, GetAthleteAgeStatsVariables, GetGenderBreakdownData, GetGenderBreakdownVariables, GetGamesSummaryData, GetGamesSummaryVariables, GetSportHistoryData, GetSportHistoryVariables, GetBmiBySportData, GetBmiBySportVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetMedalStats(vars?: GetMedalStatsVariables, options?: useDataConnectQueryOptions<GetMedalStatsData>): UseDataConnectQueryResult<GetMedalStatsData, GetMedalStatsVariables>;
export function useGetMedalStats(dc: DataConnect, vars?: GetMedalStatsVariables, options?: useDataConnectQueryOptions<GetMedalStatsData>): UseDataConnectQueryResult<GetMedalStatsData, GetMedalStatsVariables>;

export function useGetAthleteBiometrics(vars?: GetAthleteBiometricsVariables, options?: useDataConnectQueryOptions<GetAthleteBiometricsData>): UseDataConnectQueryResult<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
export function useGetAthleteBiometrics(dc: DataConnect, vars?: GetAthleteBiometricsVariables, options?: useDataConnectQueryOptions<GetAthleteBiometricsData>): UseDataConnectQueryResult<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;

export function useGetSportBreakdown(vars?: GetSportBreakdownVariables, options?: useDataConnectQueryOptions<GetSportBreakdownData>): UseDataConnectQueryResult<GetSportBreakdownData, GetSportBreakdownVariables>;
export function useGetSportBreakdown(dc: DataConnect, vars?: GetSportBreakdownVariables, options?: useDataConnectQueryOptions<GetSportBreakdownData>): UseDataConnectQueryResult<GetSportBreakdownData, GetSportBreakdownVariables>;

export function useGetTopNations(vars?: GetTopNationsVariables, options?: useDataConnectQueryOptions<GetTopNationsData>): UseDataConnectQueryResult<GetTopNationsData, GetTopNationsVariables>;
export function useGetTopNations(dc: DataConnect, vars?: GetTopNationsVariables, options?: useDataConnectQueryOptions<GetTopNationsData>): UseDataConnectQueryResult<GetTopNationsData, GetTopNationsVariables>;

export function useGetAthleteAgeStats(vars?: GetAthleteAgeStatsVariables, options?: useDataConnectQueryOptions<GetAthleteAgeStatsData>): UseDataConnectQueryResult<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
export function useGetAthleteAgeStats(dc: DataConnect, vars?: GetAthleteAgeStatsVariables, options?: useDataConnectQueryOptions<GetAthleteAgeStatsData>): UseDataConnectQueryResult<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;

export function useGetGenderBreakdown(vars?: GetGenderBreakdownVariables, options?: useDataConnectQueryOptions<GetGenderBreakdownData>): UseDataConnectQueryResult<GetGenderBreakdownData, GetGenderBreakdownVariables>;
export function useGetGenderBreakdown(dc: DataConnect, vars?: GetGenderBreakdownVariables, options?: useDataConnectQueryOptions<GetGenderBreakdownData>): UseDataConnectQueryResult<GetGenderBreakdownData, GetGenderBreakdownVariables>;

export function useGetGamesSummary(vars: GetGamesSummaryVariables, options?: useDataConnectQueryOptions<GetGamesSummaryData>): UseDataConnectQueryResult<GetGamesSummaryData, GetGamesSummaryVariables>;
export function useGetGamesSummary(dc: DataConnect, vars: GetGamesSummaryVariables, options?: useDataConnectQueryOptions<GetGamesSummaryData>): UseDataConnectQueryResult<GetGamesSummaryData, GetGamesSummaryVariables>;

export function useGetSportHistory(vars: GetSportHistoryVariables, options?: useDataConnectQueryOptions<GetSportHistoryData>): UseDataConnectQueryResult<GetSportHistoryData, GetSportHistoryVariables>;
export function useGetSportHistory(dc: DataConnect, vars: GetSportHistoryVariables, options?: useDataConnectQueryOptions<GetSportHistoryData>): UseDataConnectQueryResult<GetSportHistoryData, GetSportHistoryVariables>;

export function useGetBmiBySport(vars?: GetBmiBySportVariables, options?: useDataConnectQueryOptions<GetBmiBySportData>): UseDataConnectQueryResult<GetBmiBySportData, GetBmiBySportVariables>;
export function useGetBmiBySport(dc: DataConnect, vars?: GetBmiBySportVariables, options?: useDataConnectQueryOptions<GetBmiBySportData>): UseDataConnectQueryResult<GetBmiBySportData, GetBmiBySportVariables>;
