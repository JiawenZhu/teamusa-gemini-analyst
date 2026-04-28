import { queryRef, executeQuery, validateArgsWithOptions, validateArgs, makeMemoryCacheProvider } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'teamusa-service',
  location: 'us-central1'
};
export const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
export const getMedalStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMedalStats', inputVars);
}
getMedalStatsRef.operationName = 'GetMedalStats';

export function getMedalStats(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getMedalStatsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAthleteBiometricsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAthleteBiometrics', inputVars);
}
getAthleteBiometricsRef.operationName = 'GetAthleteBiometrics';

export function getAthleteBiometrics(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getAthleteBiometricsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getSportBreakdownRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSportBreakdown', inputVars);
}
getSportBreakdownRef.operationName = 'GetSportBreakdown';

export function getSportBreakdown(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getSportBreakdownRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getTopNationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTopNations', inputVars);
}
getTopNationsRef.operationName = 'GetTopNations';

export function getTopNations(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getTopNationsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAthleteAgeStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAthleteAgeStats', inputVars);
}
getAthleteAgeStatsRef.operationName = 'GetAthleteAgeStats';

export function getAthleteAgeStats(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getAthleteAgeStatsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getGenderBreakdownRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetGenderBreakdown', inputVars);
}
getGenderBreakdownRef.operationName = 'GetGenderBreakdown';

export function getGenderBreakdown(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getGenderBreakdownRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getGamesSummaryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetGamesSummary', inputVars);
}
getGamesSummaryRef.operationName = 'GetGamesSummary';

export function getGamesSummary(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getGamesSummaryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getSportHistoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSportHistory', inputVars);
}
getSportHistoryRef.operationName = 'GetSportHistory';

export function getSportHistory(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSportHistoryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getBmiBySportRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBmiBySport', inputVars);
}
getBmiBySportRef.operationName = 'GetBmiBySport';

export function getBmiBySport(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getBmiBySportRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

