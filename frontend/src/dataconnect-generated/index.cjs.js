const { queryRef, executeQuery, validateArgsWithOptions, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'teamusa-service',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const getMedalStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMedalStats', inputVars);
}
getMedalStatsRef.operationName = 'GetMedalStats';
exports.getMedalStatsRef = getMedalStatsRef;

exports.getMedalStats = function getMedalStats(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getMedalStatsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAthleteBiometricsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAthleteBiometrics', inputVars);
}
getAthleteBiometricsRef.operationName = 'GetAthleteBiometrics';
exports.getAthleteBiometricsRef = getAthleteBiometricsRef;

exports.getAthleteBiometrics = function getAthleteBiometrics(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getAthleteBiometricsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getSportBreakdownRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSportBreakdown', inputVars);
}
getSportBreakdownRef.operationName = 'GetSportBreakdown';
exports.getSportBreakdownRef = getSportBreakdownRef;

exports.getSportBreakdown = function getSportBreakdown(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getSportBreakdownRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getTopNationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTopNations', inputVars);
}
getTopNationsRef.operationName = 'GetTopNations';
exports.getTopNationsRef = getTopNationsRef;

exports.getTopNations = function getTopNations(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getTopNationsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAthleteAgeStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAthleteAgeStats', inputVars);
}
getAthleteAgeStatsRef.operationName = 'GetAthleteAgeStats';
exports.getAthleteAgeStatsRef = getAthleteAgeStatsRef;

exports.getAthleteAgeStats = function getAthleteAgeStats(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getAthleteAgeStatsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getGenderBreakdownRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetGenderBreakdown', inputVars);
}
getGenderBreakdownRef.operationName = 'GetGenderBreakdown';
exports.getGenderBreakdownRef = getGenderBreakdownRef;

exports.getGenderBreakdown = function getGenderBreakdown(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getGenderBreakdownRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getGamesSummaryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetGamesSummary', inputVars);
}
getGamesSummaryRef.operationName = 'GetGamesSummary';
exports.getGamesSummaryRef = getGamesSummaryRef;

exports.getGamesSummary = function getGamesSummary(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getGamesSummaryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getSportHistoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetSportHistory', inputVars);
}
getSportHistoryRef.operationName = 'GetSportHistory';
exports.getSportHistoryRef = getSportHistoryRef;

exports.getSportHistory = function getSportHistory(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getSportHistoryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getBmiBySportRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBmiBySport', inputVars);
}
getBmiBySportRef.operationName = 'GetBmiBySport';
exports.getBmiBySportRef = getBmiBySportRef;

exports.getBmiBySport = function getBmiBySport(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(getBmiBySportRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
