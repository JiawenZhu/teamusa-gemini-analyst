import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Athlete_Key {
  id: UUIDString;
  __typename?: 'Athlete_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface Games_Key {
  id: UUIDString;
  __typename?: 'Games_Key';
}

export interface GetAthleteAgeStatsData {
  results: ({
    age?: number | null;
    athlete: {
      name: string;
      sex?: string | null;
    };
      event: {
        sport: {
          name: string;
        };
      };
        games: {
          year: number;
          season: string;
        };
          noc: {
            noc: string;
            region?: string | null;
          } & NocRegion_Key;
  })[];
}

export interface GetAthleteAgeStatsVariables {
  noc?: string | null;
  sport?: string | null;
  year?: number | null;
}

export interface GetAthleteBiometricsData {
  results: ({
    athlete: {
      name: string;
      sex?: string | null;
      height?: number | null;
      weight?: number | null;
    };
      event: {
        sport: {
          name: string;
        };
      };
        noc: {
          noc: string;
          region?: string | null;
        } & NocRegion_Key;
  })[];
}

export interface GetAthleteBiometricsVariables {
  noc?: string | null;
  sport?: string | null;
  sex?: string | null;
}

export interface GetBmiBySportData {
  results: ({
    athlete: {
      height?: number | null;
      weight?: number | null;
    };
      event: {
        sport: {
          name: string;
        };
      };
        games: {
          year: number;
        };
  })[];
}

export interface GetBmiBySportVariables {
  noc?: string | null;
  year?: number | null;
}

export interface GetGamesSummaryData {
  results: ({
    athlete: {
      name: string;
      sex?: string | null;
    };
      noc: {
        noc: string;
        region?: string | null;
      } & NocRegion_Key;
        event: {
          name: string;
          sport: {
            name: string;
          };
        };
          games: {
            year: number;
            season: string;
            city: string;
          };
            medal?: string | null;
  })[];
}

export interface GetGamesSummaryVariables {
  year: number;
  season?: string | null;
}

export interface GetGenderBreakdownData {
  results: ({
    athlete: {
      sex?: string | null;
    };
      games: {
        year: number;
        season: string;
      };
        noc: {
          noc: string;
          region?: string | null;
        } & NocRegion_Key;
  })[];
}

export interface GetGenderBreakdownVariables {
  noc?: string | null;
  year?: number | null;
}

export interface GetMedalStatsData {
  results: ({
    id: UUIDString;
    medal?: string | null;
    athlete: {
      name: string;
      sex?: string | null;
      height?: number | null;
      weight?: number | null;
    };
      games: {
        year: number;
        season: string;
        city: string;
      };
        event: {
          name: string;
          sport: {
            name: string;
          };
        };
          noc: {
            noc: string;
            region?: string | null;
          } & NocRegion_Key;
  } & Result_Key)[];
}

export interface GetMedalStatsVariables {
  noc?: string | null;
  year?: number | null;
  medal?: string | null;
  sport?: string | null;
}

export interface GetSportBreakdownData {
  results: ({
    medal?: string | null;
    event: {
      name: string;
      sport: {
        name: string;
      };
    };
      games: {
        year: number;
        season: string;
        city: string;
      };
        noc: {
          noc: string;
          region?: string | null;
        } & NocRegion_Key;
  })[];
}

export interface GetSportBreakdownVariables {
  noc?: string | null;
  year?: number | null;
}

export interface GetSportHistoryData {
  results: ({
    games: {
      year: number;
      season: string;
      city: string;
    };
      medal?: string | null;
      event: {
        name: string;
        sport: {
          name: string;
        };
      };
        noc: {
          noc: string;
          region?: string | null;
        } & NocRegion_Key;
  })[];
}

export interface GetSportHistoryVariables {
  sport: string;
}

export interface GetTopNationsData {
  results: ({
    medal?: string | null;
    noc: {
      noc: string;
      region?: string | null;
    } & NocRegion_Key;
      event: {
        sport: {
          name: string;
        };
      };
  })[];
}

export interface GetTopNationsVariables {
  medal?: string | null;
  sport?: string | null;
}

export interface NocRegion_Key {
  noc: string;
  __typename?: 'NocRegion_Key';
}

export interface Result_Key {
  id: UUIDString;
  __typename?: 'Result_Key';
}

export interface Sport_Key {
  id: UUIDString;
  __typename?: 'Sport_Key';
}

interface GetMedalStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetMedalStatsVariables): QueryRef<GetMedalStatsData, GetMedalStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetMedalStatsVariables): QueryRef<GetMedalStatsData, GetMedalStatsVariables>;
  operationName: string;
}
export const getMedalStatsRef: GetMedalStatsRef;

export function getMedalStats(vars?: GetMedalStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetMedalStatsData, GetMedalStatsVariables>;
export function getMedalStats(dc: DataConnect, vars?: GetMedalStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetMedalStatsData, GetMedalStatsVariables>;

interface GetAthleteBiometricsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetAthleteBiometricsVariables): QueryRef<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetAthleteBiometricsVariables): QueryRef<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
  operationName: string;
}
export const getAthleteBiometricsRef: GetAthleteBiometricsRef;

export function getAthleteBiometrics(vars?: GetAthleteBiometricsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
export function getAthleteBiometrics(dc: DataConnect, vars?: GetAthleteBiometricsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;

interface GetSportBreakdownRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetSportBreakdownVariables): QueryRef<GetSportBreakdownData, GetSportBreakdownVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetSportBreakdownVariables): QueryRef<GetSportBreakdownData, GetSportBreakdownVariables>;
  operationName: string;
}
export const getSportBreakdownRef: GetSportBreakdownRef;

export function getSportBreakdown(vars?: GetSportBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportBreakdownData, GetSportBreakdownVariables>;
export function getSportBreakdown(dc: DataConnect, vars?: GetSportBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportBreakdownData, GetSportBreakdownVariables>;

interface GetTopNationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetTopNationsVariables): QueryRef<GetTopNationsData, GetTopNationsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetTopNationsVariables): QueryRef<GetTopNationsData, GetTopNationsVariables>;
  operationName: string;
}
export const getTopNationsRef: GetTopNationsRef;

export function getTopNations(vars?: GetTopNationsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopNationsData, GetTopNationsVariables>;
export function getTopNations(dc: DataConnect, vars?: GetTopNationsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopNationsData, GetTopNationsVariables>;

interface GetAthleteAgeStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetAthleteAgeStatsVariables): QueryRef<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetAthleteAgeStatsVariables): QueryRef<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
  operationName: string;
}
export const getAthleteAgeStatsRef: GetAthleteAgeStatsRef;

export function getAthleteAgeStats(vars?: GetAthleteAgeStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
export function getAthleteAgeStats(dc: DataConnect, vars?: GetAthleteAgeStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;

interface GetGenderBreakdownRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetGenderBreakdownVariables): QueryRef<GetGenderBreakdownData, GetGenderBreakdownVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetGenderBreakdownVariables): QueryRef<GetGenderBreakdownData, GetGenderBreakdownVariables>;
  operationName: string;
}
export const getGenderBreakdownRef: GetGenderBreakdownRef;

export function getGenderBreakdown(vars?: GetGenderBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetGenderBreakdownData, GetGenderBreakdownVariables>;
export function getGenderBreakdown(dc: DataConnect, vars?: GetGenderBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetGenderBreakdownData, GetGenderBreakdownVariables>;

interface GetGamesSummaryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetGamesSummaryVariables): QueryRef<GetGamesSummaryData, GetGamesSummaryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetGamesSummaryVariables): QueryRef<GetGamesSummaryData, GetGamesSummaryVariables>;
  operationName: string;
}
export const getGamesSummaryRef: GetGamesSummaryRef;

export function getGamesSummary(vars: GetGamesSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<GetGamesSummaryData, GetGamesSummaryVariables>;
export function getGamesSummary(dc: DataConnect, vars: GetGamesSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<GetGamesSummaryData, GetGamesSummaryVariables>;

interface GetSportHistoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSportHistoryVariables): QueryRef<GetSportHistoryData, GetSportHistoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSportHistoryVariables): QueryRef<GetSportHistoryData, GetSportHistoryVariables>;
  operationName: string;
}
export const getSportHistoryRef: GetSportHistoryRef;

export function getSportHistory(vars: GetSportHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportHistoryData, GetSportHistoryVariables>;
export function getSportHistory(dc: DataConnect, vars: GetSportHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportHistoryData, GetSportHistoryVariables>;

interface GetBmiBySportRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetBmiBySportVariables): QueryRef<GetBmiBySportData, GetBmiBySportVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetBmiBySportVariables): QueryRef<GetBmiBySportData, GetBmiBySportVariables>;
  operationName: string;
}
export const getBmiBySportRef: GetBmiBySportRef;

export function getBmiBySport(vars?: GetBmiBySportVariables, options?: ExecuteQueryOptions): QueryPromise<GetBmiBySportData, GetBmiBySportVariables>;
export function getBmiBySport(dc: DataConnect, vars?: GetBmiBySportVariables, options?: ExecuteQueryOptions): QueryPromise<GetBmiBySportData, GetBmiBySportVariables>;

