# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetMedalStats, useGetAthleteBiometrics, useGetSportBreakdown, useGetTopNations, useGetAthleteAgeStats, useGetGenderBreakdown, useGetGamesSummary, useGetSportHistory, useGetBmiBySport } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetMedalStats(getMedalStatsVars);

const { data, isPending, isSuccess, isError, error } = useGetAthleteBiometrics(getAthleteBiometricsVars);

const { data, isPending, isSuccess, isError, error } = useGetSportBreakdown(getSportBreakdownVars);

const { data, isPending, isSuccess, isError, error } = useGetTopNations(getTopNationsVars);

const { data, isPending, isSuccess, isError, error } = useGetAthleteAgeStats(getAthleteAgeStatsVars);

const { data, isPending, isSuccess, isError, error } = useGetGenderBreakdown(getGenderBreakdownVars);

const { data, isPending, isSuccess, isError, error } = useGetGamesSummary(getGamesSummaryVars);

const { data, isPending, isSuccess, isError, error } = useGetSportHistory(getSportHistoryVars);

const { data, isPending, isSuccess, isError, error } = useGetBmiBySport(getBmiBySportVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getMedalStats, getAthleteBiometrics, getSportBreakdown, getTopNations, getAthleteAgeStats, getGenderBreakdown, getGamesSummary, getSportHistory, getBmiBySport } from '@dataconnect/generated';


// Operation GetMedalStats:  For variables, look at type GetMedalStatsVars in ../index.d.ts
const { data } = await GetMedalStats(dataConnect, getMedalStatsVars);

// Operation GetAthleteBiometrics:  For variables, look at type GetAthleteBiometricsVars in ../index.d.ts
const { data } = await GetAthleteBiometrics(dataConnect, getAthleteBiometricsVars);

// Operation GetSportBreakdown:  For variables, look at type GetSportBreakdownVars in ../index.d.ts
const { data } = await GetSportBreakdown(dataConnect, getSportBreakdownVars);

// Operation GetTopNations:  For variables, look at type GetTopNationsVars in ../index.d.ts
const { data } = await GetTopNations(dataConnect, getTopNationsVars);

// Operation GetAthleteAgeStats:  For variables, look at type GetAthleteAgeStatsVars in ../index.d.ts
const { data } = await GetAthleteAgeStats(dataConnect, getAthleteAgeStatsVars);

// Operation GetGenderBreakdown:  For variables, look at type GetGenderBreakdownVars in ../index.d.ts
const { data } = await GetGenderBreakdown(dataConnect, getGenderBreakdownVars);

// Operation GetGamesSummary:  For variables, look at type GetGamesSummaryVars in ../index.d.ts
const { data } = await GetGamesSummary(dataConnect, getGamesSummaryVars);

// Operation GetSportHistory:  For variables, look at type GetSportHistoryVars in ../index.d.ts
const { data } = await GetSportHistory(dataConnect, getSportHistoryVars);

// Operation GetBmiBySport:  For variables, look at type GetBmiBySportVars in ../index.d.ts
const { data } = await GetBmiBySport(dataConnect, getBmiBySportVars);


```