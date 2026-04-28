# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMedalStats*](#getmedalstats)
  - [*GetAthleteBiometrics*](#getathletebiometrics)
  - [*GetSportBreakdown*](#getsportbreakdown)
  - [*GetTopNations*](#gettopnations)
  - [*GetAthleteAgeStats*](#getathleteagestats)
  - [*GetGenderBreakdown*](#getgenderbreakdown)
  - [*GetGamesSummary*](#getgamessummary)
  - [*GetSportHistory*](#getsporthistory)
  - [*GetBmiBySport*](#getbmibysport)
- [**Mutations**](#mutations)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `example`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `example` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetMedalStats
You can execute the `GetMedalStats` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMedalStats(dc: DataConnect, vars?: GetMedalStatsVariables, options?: useDataConnectQueryOptions<GetMedalStatsData>): UseDataConnectQueryResult<GetMedalStatsData, GetMedalStatsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMedalStats(vars?: GetMedalStatsVariables, options?: useDataConnectQueryOptions<GetMedalStatsData>): UseDataConnectQueryResult<GetMedalStatsData, GetMedalStatsVariables>;
```

### Variables
The `GetMedalStats` Query has an optional argument of type `GetMedalStatsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetMedalStatsVariables {
  noc?: string | null;
  year?: number | null;
  medal?: string | null;
  sport?: string | null;
}
```
### Return Type
Recall that calling the `GetMedalStats` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMedalStats` Query is of type `GetMedalStatsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMedalStats`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetMedalStatsVariables } from '@dataconnect/generated';
import { useGetMedalStats } from '@dataconnect/generated/react'

export default function GetMedalStatsComponent() {
  // The `useGetMedalStats` Query hook has an optional argument of type `GetMedalStatsVariables`:
  const getMedalStatsVars: GetMedalStatsVariables = {
    noc: ..., // optional
    year: ..., // optional
    medal: ..., // optional
    sport: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMedalStats(getMedalStatsVars);
  // Variables can be defined inline as well.
  const query = useGetMedalStats({ noc: ..., year: ..., medal: ..., sport: ..., });
  // Since all variables are optional for this Query, you can omit the `GetMedalStatsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetMedalStats();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMedalStats(dataConnect, getMedalStatsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMedalStats(getMedalStatsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetMedalStats(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMedalStats(dataConnect, getMedalStatsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetAthleteBiometrics
You can execute the `GetAthleteBiometrics` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetAthleteBiometrics(dc: DataConnect, vars?: GetAthleteBiometricsVariables, options?: useDataConnectQueryOptions<GetAthleteBiometricsData>): UseDataConnectQueryResult<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAthleteBiometrics(vars?: GetAthleteBiometricsVariables, options?: useDataConnectQueryOptions<GetAthleteBiometricsData>): UseDataConnectQueryResult<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
```

### Variables
The `GetAthleteBiometrics` Query has an optional argument of type `GetAthleteBiometricsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAthleteBiometricsVariables {
  noc?: string | null;
  sport?: string | null;
  sex?: string | null;
}
```
### Return Type
Recall that calling the `GetAthleteBiometrics` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAthleteBiometrics` Query is of type `GetAthleteBiometricsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAthleteBiometrics`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAthleteBiometricsVariables } from '@dataconnect/generated';
import { useGetAthleteBiometrics } from '@dataconnect/generated/react'

export default function GetAthleteBiometricsComponent() {
  // The `useGetAthleteBiometrics` Query hook has an optional argument of type `GetAthleteBiometricsVariables`:
  const getAthleteBiometricsVars: GetAthleteBiometricsVariables = {
    noc: ..., // optional
    sport: ..., // optional
    sex: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAthleteBiometrics(getAthleteBiometricsVars);
  // Variables can be defined inline as well.
  const query = useGetAthleteBiometrics({ noc: ..., sport: ..., sex: ..., });
  // Since all variables are optional for this Query, you can omit the `GetAthleteBiometricsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetAthleteBiometrics();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAthleteBiometrics(dataConnect, getAthleteBiometricsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAthleteBiometrics(getAthleteBiometricsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetAthleteBiometrics(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAthleteBiometrics(dataConnect, getAthleteBiometricsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetSportBreakdown
You can execute the `GetSportBreakdown` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetSportBreakdown(dc: DataConnect, vars?: GetSportBreakdownVariables, options?: useDataConnectQueryOptions<GetSportBreakdownData>): UseDataConnectQueryResult<GetSportBreakdownData, GetSportBreakdownVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetSportBreakdown(vars?: GetSportBreakdownVariables, options?: useDataConnectQueryOptions<GetSportBreakdownData>): UseDataConnectQueryResult<GetSportBreakdownData, GetSportBreakdownVariables>;
```

### Variables
The `GetSportBreakdown` Query has an optional argument of type `GetSportBreakdownVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetSportBreakdownVariables {
  noc?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that calling the `GetSportBreakdown` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetSportBreakdown` Query is of type `GetSportBreakdownData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetSportBreakdown`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetSportBreakdownVariables } from '@dataconnect/generated';
import { useGetSportBreakdown } from '@dataconnect/generated/react'

export default function GetSportBreakdownComponent() {
  // The `useGetSportBreakdown` Query hook has an optional argument of type `GetSportBreakdownVariables`:
  const getSportBreakdownVars: GetSportBreakdownVariables = {
    noc: ..., // optional
    year: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetSportBreakdown(getSportBreakdownVars);
  // Variables can be defined inline as well.
  const query = useGetSportBreakdown({ noc: ..., year: ..., });
  // Since all variables are optional for this Query, you can omit the `GetSportBreakdownVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetSportBreakdown();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetSportBreakdown(dataConnect, getSportBreakdownVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetSportBreakdown(getSportBreakdownVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetSportBreakdown(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetSportBreakdown(dataConnect, getSportBreakdownVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetTopNations
You can execute the `GetTopNations` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetTopNations(dc: DataConnect, vars?: GetTopNationsVariables, options?: useDataConnectQueryOptions<GetTopNationsData>): UseDataConnectQueryResult<GetTopNationsData, GetTopNationsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetTopNations(vars?: GetTopNationsVariables, options?: useDataConnectQueryOptions<GetTopNationsData>): UseDataConnectQueryResult<GetTopNationsData, GetTopNationsVariables>;
```

### Variables
The `GetTopNations` Query has an optional argument of type `GetTopNationsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetTopNationsVariables {
  medal?: string | null;
  sport?: string | null;
}
```
### Return Type
Recall that calling the `GetTopNations` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetTopNations` Query is of type `GetTopNationsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetTopNations`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetTopNationsVariables } from '@dataconnect/generated';
import { useGetTopNations } from '@dataconnect/generated/react'

export default function GetTopNationsComponent() {
  // The `useGetTopNations` Query hook has an optional argument of type `GetTopNationsVariables`:
  const getTopNationsVars: GetTopNationsVariables = {
    medal: ..., // optional
    sport: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetTopNations(getTopNationsVars);
  // Variables can be defined inline as well.
  const query = useGetTopNations({ medal: ..., sport: ..., });
  // Since all variables are optional for this Query, you can omit the `GetTopNationsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetTopNations();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetTopNations(dataConnect, getTopNationsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetTopNations(getTopNationsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetTopNations(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetTopNations(dataConnect, getTopNationsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetAthleteAgeStats
You can execute the `GetAthleteAgeStats` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetAthleteAgeStats(dc: DataConnect, vars?: GetAthleteAgeStatsVariables, options?: useDataConnectQueryOptions<GetAthleteAgeStatsData>): UseDataConnectQueryResult<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetAthleteAgeStats(vars?: GetAthleteAgeStatsVariables, options?: useDataConnectQueryOptions<GetAthleteAgeStatsData>): UseDataConnectQueryResult<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
```

### Variables
The `GetAthleteAgeStats` Query has an optional argument of type `GetAthleteAgeStatsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetAthleteAgeStatsVariables {
  noc?: string | null;
  sport?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that calling the `GetAthleteAgeStats` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetAthleteAgeStats` Query is of type `GetAthleteAgeStatsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetAthleteAgeStats`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetAthleteAgeStatsVariables } from '@dataconnect/generated';
import { useGetAthleteAgeStats } from '@dataconnect/generated/react'

export default function GetAthleteAgeStatsComponent() {
  // The `useGetAthleteAgeStats` Query hook has an optional argument of type `GetAthleteAgeStatsVariables`:
  const getAthleteAgeStatsVars: GetAthleteAgeStatsVariables = {
    noc: ..., // optional
    sport: ..., // optional
    year: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetAthleteAgeStats(getAthleteAgeStatsVars);
  // Variables can be defined inline as well.
  const query = useGetAthleteAgeStats({ noc: ..., sport: ..., year: ..., });
  // Since all variables are optional for this Query, you can omit the `GetAthleteAgeStatsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetAthleteAgeStats();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetAthleteAgeStats(dataConnect, getAthleteAgeStatsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetAthleteAgeStats(getAthleteAgeStatsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetAthleteAgeStats(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetAthleteAgeStats(dataConnect, getAthleteAgeStatsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetGenderBreakdown
You can execute the `GetGenderBreakdown` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetGenderBreakdown(dc: DataConnect, vars?: GetGenderBreakdownVariables, options?: useDataConnectQueryOptions<GetGenderBreakdownData>): UseDataConnectQueryResult<GetGenderBreakdownData, GetGenderBreakdownVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetGenderBreakdown(vars?: GetGenderBreakdownVariables, options?: useDataConnectQueryOptions<GetGenderBreakdownData>): UseDataConnectQueryResult<GetGenderBreakdownData, GetGenderBreakdownVariables>;
```

### Variables
The `GetGenderBreakdown` Query has an optional argument of type `GetGenderBreakdownVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetGenderBreakdownVariables {
  noc?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that calling the `GetGenderBreakdown` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetGenderBreakdown` Query is of type `GetGenderBreakdownData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetGenderBreakdown`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetGenderBreakdownVariables } from '@dataconnect/generated';
import { useGetGenderBreakdown } from '@dataconnect/generated/react'

export default function GetGenderBreakdownComponent() {
  // The `useGetGenderBreakdown` Query hook has an optional argument of type `GetGenderBreakdownVariables`:
  const getGenderBreakdownVars: GetGenderBreakdownVariables = {
    noc: ..., // optional
    year: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetGenderBreakdown(getGenderBreakdownVars);
  // Variables can be defined inline as well.
  const query = useGetGenderBreakdown({ noc: ..., year: ..., });
  // Since all variables are optional for this Query, you can omit the `GetGenderBreakdownVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetGenderBreakdown();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetGenderBreakdown(dataConnect, getGenderBreakdownVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetGenderBreakdown(getGenderBreakdownVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetGenderBreakdown(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetGenderBreakdown(dataConnect, getGenderBreakdownVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetGamesSummary
You can execute the `GetGamesSummary` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetGamesSummary(dc: DataConnect, vars: GetGamesSummaryVariables, options?: useDataConnectQueryOptions<GetGamesSummaryData>): UseDataConnectQueryResult<GetGamesSummaryData, GetGamesSummaryVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetGamesSummary(vars: GetGamesSummaryVariables, options?: useDataConnectQueryOptions<GetGamesSummaryData>): UseDataConnectQueryResult<GetGamesSummaryData, GetGamesSummaryVariables>;
```

### Variables
The `GetGamesSummary` Query requires an argument of type `GetGamesSummaryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetGamesSummaryVariables {
  year: number;
  season?: string | null;
}
```
### Return Type
Recall that calling the `GetGamesSummary` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetGamesSummary` Query is of type `GetGamesSummaryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetGamesSummary`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetGamesSummaryVariables } from '@dataconnect/generated';
import { useGetGamesSummary } from '@dataconnect/generated/react'

export default function GetGamesSummaryComponent() {
  // The `useGetGamesSummary` Query hook requires an argument of type `GetGamesSummaryVariables`:
  const getGamesSummaryVars: GetGamesSummaryVariables = {
    year: ..., 
    season: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetGamesSummary(getGamesSummaryVars);
  // Variables can be defined inline as well.
  const query = useGetGamesSummary({ year: ..., season: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetGamesSummary(dataConnect, getGamesSummaryVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetGamesSummary(getGamesSummaryVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetGamesSummary(dataConnect, getGamesSummaryVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetSportHistory
You can execute the `GetSportHistory` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetSportHistory(dc: DataConnect, vars: GetSportHistoryVariables, options?: useDataConnectQueryOptions<GetSportHistoryData>): UseDataConnectQueryResult<GetSportHistoryData, GetSportHistoryVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetSportHistory(vars: GetSportHistoryVariables, options?: useDataConnectQueryOptions<GetSportHistoryData>): UseDataConnectQueryResult<GetSportHistoryData, GetSportHistoryVariables>;
```

### Variables
The `GetSportHistory` Query requires an argument of type `GetSportHistoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetSportHistoryVariables {
  sport: string;
}
```
### Return Type
Recall that calling the `GetSportHistory` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetSportHistory` Query is of type `GetSportHistoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetSportHistory`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetSportHistoryVariables } from '@dataconnect/generated';
import { useGetSportHistory } from '@dataconnect/generated/react'

export default function GetSportHistoryComponent() {
  // The `useGetSportHistory` Query hook requires an argument of type `GetSportHistoryVariables`:
  const getSportHistoryVars: GetSportHistoryVariables = {
    sport: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetSportHistory(getSportHistoryVars);
  // Variables can be defined inline as well.
  const query = useGetSportHistory({ sport: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetSportHistory(dataConnect, getSportHistoryVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetSportHistory(getSportHistoryVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetSportHistory(dataConnect, getSportHistoryVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetBmiBySport
You can execute the `GetBmiBySport` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetBmiBySport(dc: DataConnect, vars?: GetBmiBySportVariables, options?: useDataConnectQueryOptions<GetBmiBySportData>): UseDataConnectQueryResult<GetBmiBySportData, GetBmiBySportVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetBmiBySport(vars?: GetBmiBySportVariables, options?: useDataConnectQueryOptions<GetBmiBySportData>): UseDataConnectQueryResult<GetBmiBySportData, GetBmiBySportVariables>;
```

### Variables
The `GetBmiBySport` Query has an optional argument of type `GetBmiBySportVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetBmiBySportVariables {
  noc?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that calling the `GetBmiBySport` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetBmiBySport` Query is of type `GetBmiBySportData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetBmiBySport`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetBmiBySportVariables } from '@dataconnect/generated';
import { useGetBmiBySport } from '@dataconnect/generated/react'

export default function GetBmiBySportComponent() {
  // The `useGetBmiBySport` Query hook has an optional argument of type `GetBmiBySportVariables`:
  const getBmiBySportVars: GetBmiBySportVariables = {
    noc: ..., // optional
    year: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetBmiBySport(getBmiBySportVars);
  // Variables can be defined inline as well.
  const query = useGetBmiBySport({ noc: ..., year: ..., });
  // Since all variables are optional for this Query, you can omit the `GetBmiBySportVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useGetBmiBySport();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetBmiBySport(dataConnect, getBmiBySportVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetBmiBySport(getBmiBySportVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useGetBmiBySport(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetBmiBySport(dataConnect, getBmiBySportVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.results);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

No Mutations were generated for the `example` connector.

If you want to learn more about how to use Mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

