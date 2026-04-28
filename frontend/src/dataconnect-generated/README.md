# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMedalStats
You can execute the `GetMedalStats` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMedalStats(vars?: GetMedalStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetMedalStatsData, GetMedalStatsVariables>;

interface GetMedalStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetMedalStatsVariables): QueryRef<GetMedalStatsData, GetMedalStatsVariables>;
}
export const getMedalStatsRef: GetMedalStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMedalStats(dc: DataConnect, vars?: GetMedalStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetMedalStatsData, GetMedalStatsVariables>;

interface GetMedalStatsRef {
  ...
  (dc: DataConnect, vars?: GetMedalStatsVariables): QueryRef<GetMedalStatsData, GetMedalStatsVariables>;
}
export const getMedalStatsRef: GetMedalStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMedalStatsRef:
```typescript
const name = getMedalStatsRef.operationName;
console.log(name);
```

### Variables
The `GetMedalStats` query has an optional argument of type `GetMedalStatsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMedalStatsVariables {
  noc?: string | null;
  year?: number | null;
  medal?: string | null;
  sport?: string | null;
}
```
### Return Type
Recall that executing the `GetMedalStats` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMedalStatsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMedalStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMedalStats, GetMedalStatsVariables } from '@dataconnect/generated';

// The `GetMedalStats` query has an optional argument of type `GetMedalStatsVariables`:
const getMedalStatsVars: GetMedalStatsVariables = {
  noc: ..., // optional
  year: ..., // optional
  medal: ..., // optional
  sport: ..., // optional
};

// Call the `getMedalStats()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMedalStats(getMedalStatsVars);
// Variables can be defined inline as well.
const { data } = await getMedalStats({ noc: ..., year: ..., medal: ..., sport: ..., });
// Since all variables are optional for this query, you can omit the `GetMedalStatsVariables` argument.
const { data } = await getMedalStats();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMedalStats(dataConnect, getMedalStatsVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getMedalStats(getMedalStatsVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetMedalStats`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMedalStatsRef, GetMedalStatsVariables } from '@dataconnect/generated';

// The `GetMedalStats` query has an optional argument of type `GetMedalStatsVariables`:
const getMedalStatsVars: GetMedalStatsVariables = {
  noc: ..., // optional
  year: ..., // optional
  medal: ..., // optional
  sport: ..., // optional
};

// Call the `getMedalStatsRef()` function to get a reference to the query.
const ref = getMedalStatsRef(getMedalStatsVars);
// Variables can be defined inline as well.
const ref = getMedalStatsRef({ noc: ..., year: ..., medal: ..., sport: ..., });
// Since all variables are optional for this query, you can omit the `GetMedalStatsVariables` argument.
const ref = getMedalStatsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMedalStatsRef(dataConnect, getMedalStatsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetAthleteBiometrics
You can execute the `GetAthleteBiometrics` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAthleteBiometrics(vars?: GetAthleteBiometricsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;

interface GetAthleteBiometricsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetAthleteBiometricsVariables): QueryRef<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
}
export const getAthleteBiometricsRef: GetAthleteBiometricsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAthleteBiometrics(dc: DataConnect, vars?: GetAthleteBiometricsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;

interface GetAthleteBiometricsRef {
  ...
  (dc: DataConnect, vars?: GetAthleteBiometricsVariables): QueryRef<GetAthleteBiometricsData, GetAthleteBiometricsVariables>;
}
export const getAthleteBiometricsRef: GetAthleteBiometricsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAthleteBiometricsRef:
```typescript
const name = getAthleteBiometricsRef.operationName;
console.log(name);
```

### Variables
The `GetAthleteBiometrics` query has an optional argument of type `GetAthleteBiometricsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAthleteBiometricsVariables {
  noc?: string | null;
  sport?: string | null;
  sex?: string | null;
}
```
### Return Type
Recall that executing the `GetAthleteBiometrics` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAthleteBiometricsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAthleteBiometrics`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAthleteBiometrics, GetAthleteBiometricsVariables } from '@dataconnect/generated';

// The `GetAthleteBiometrics` query has an optional argument of type `GetAthleteBiometricsVariables`:
const getAthleteBiometricsVars: GetAthleteBiometricsVariables = {
  noc: ..., // optional
  sport: ..., // optional
  sex: ..., // optional
};

// Call the `getAthleteBiometrics()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAthleteBiometrics(getAthleteBiometricsVars);
// Variables can be defined inline as well.
const { data } = await getAthleteBiometrics({ noc: ..., sport: ..., sex: ..., });
// Since all variables are optional for this query, you can omit the `GetAthleteBiometricsVariables` argument.
const { data } = await getAthleteBiometrics();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAthleteBiometrics(dataConnect, getAthleteBiometricsVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getAthleteBiometrics(getAthleteBiometricsVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetAthleteBiometrics`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAthleteBiometricsRef, GetAthleteBiometricsVariables } from '@dataconnect/generated';

// The `GetAthleteBiometrics` query has an optional argument of type `GetAthleteBiometricsVariables`:
const getAthleteBiometricsVars: GetAthleteBiometricsVariables = {
  noc: ..., // optional
  sport: ..., // optional
  sex: ..., // optional
};

// Call the `getAthleteBiometricsRef()` function to get a reference to the query.
const ref = getAthleteBiometricsRef(getAthleteBiometricsVars);
// Variables can be defined inline as well.
const ref = getAthleteBiometricsRef({ noc: ..., sport: ..., sex: ..., });
// Since all variables are optional for this query, you can omit the `GetAthleteBiometricsVariables` argument.
const ref = getAthleteBiometricsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAthleteBiometricsRef(dataConnect, getAthleteBiometricsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetSportBreakdown
You can execute the `GetSportBreakdown` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSportBreakdown(vars?: GetSportBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportBreakdownData, GetSportBreakdownVariables>;

interface GetSportBreakdownRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetSportBreakdownVariables): QueryRef<GetSportBreakdownData, GetSportBreakdownVariables>;
}
export const getSportBreakdownRef: GetSportBreakdownRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSportBreakdown(dc: DataConnect, vars?: GetSportBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportBreakdownData, GetSportBreakdownVariables>;

interface GetSportBreakdownRef {
  ...
  (dc: DataConnect, vars?: GetSportBreakdownVariables): QueryRef<GetSportBreakdownData, GetSportBreakdownVariables>;
}
export const getSportBreakdownRef: GetSportBreakdownRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSportBreakdownRef:
```typescript
const name = getSportBreakdownRef.operationName;
console.log(name);
```

### Variables
The `GetSportBreakdown` query has an optional argument of type `GetSportBreakdownVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSportBreakdownVariables {
  noc?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that executing the `GetSportBreakdown` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSportBreakdownData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetSportBreakdown`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSportBreakdown, GetSportBreakdownVariables } from '@dataconnect/generated';

// The `GetSportBreakdown` query has an optional argument of type `GetSportBreakdownVariables`:
const getSportBreakdownVars: GetSportBreakdownVariables = {
  noc: ..., // optional
  year: ..., // optional
};

// Call the `getSportBreakdown()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSportBreakdown(getSportBreakdownVars);
// Variables can be defined inline as well.
const { data } = await getSportBreakdown({ noc: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetSportBreakdownVariables` argument.
const { data } = await getSportBreakdown();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSportBreakdown(dataConnect, getSportBreakdownVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getSportBreakdown(getSportBreakdownVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetSportBreakdown`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSportBreakdownRef, GetSportBreakdownVariables } from '@dataconnect/generated';

// The `GetSportBreakdown` query has an optional argument of type `GetSportBreakdownVariables`:
const getSportBreakdownVars: GetSportBreakdownVariables = {
  noc: ..., // optional
  year: ..., // optional
};

// Call the `getSportBreakdownRef()` function to get a reference to the query.
const ref = getSportBreakdownRef(getSportBreakdownVars);
// Variables can be defined inline as well.
const ref = getSportBreakdownRef({ noc: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetSportBreakdownVariables` argument.
const ref = getSportBreakdownRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSportBreakdownRef(dataConnect, getSportBreakdownVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetTopNations
You can execute the `GetTopNations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTopNations(vars?: GetTopNationsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopNationsData, GetTopNationsVariables>;

interface GetTopNationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetTopNationsVariables): QueryRef<GetTopNationsData, GetTopNationsVariables>;
}
export const getTopNationsRef: GetTopNationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTopNations(dc: DataConnect, vars?: GetTopNationsVariables, options?: ExecuteQueryOptions): QueryPromise<GetTopNationsData, GetTopNationsVariables>;

interface GetTopNationsRef {
  ...
  (dc: DataConnect, vars?: GetTopNationsVariables): QueryRef<GetTopNationsData, GetTopNationsVariables>;
}
export const getTopNationsRef: GetTopNationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTopNationsRef:
```typescript
const name = getTopNationsRef.operationName;
console.log(name);
```

### Variables
The `GetTopNations` query has an optional argument of type `GetTopNationsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTopNationsVariables {
  medal?: string | null;
  sport?: string | null;
}
```
### Return Type
Recall that executing the `GetTopNations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTopNationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetTopNations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTopNations, GetTopNationsVariables } from '@dataconnect/generated';

// The `GetTopNations` query has an optional argument of type `GetTopNationsVariables`:
const getTopNationsVars: GetTopNationsVariables = {
  medal: ..., // optional
  sport: ..., // optional
};

// Call the `getTopNations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTopNations(getTopNationsVars);
// Variables can be defined inline as well.
const { data } = await getTopNations({ medal: ..., sport: ..., });
// Since all variables are optional for this query, you can omit the `GetTopNationsVariables` argument.
const { data } = await getTopNations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTopNations(dataConnect, getTopNationsVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getTopNations(getTopNationsVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetTopNations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTopNationsRef, GetTopNationsVariables } from '@dataconnect/generated';

// The `GetTopNations` query has an optional argument of type `GetTopNationsVariables`:
const getTopNationsVars: GetTopNationsVariables = {
  medal: ..., // optional
  sport: ..., // optional
};

// Call the `getTopNationsRef()` function to get a reference to the query.
const ref = getTopNationsRef(getTopNationsVars);
// Variables can be defined inline as well.
const ref = getTopNationsRef({ medal: ..., sport: ..., });
// Since all variables are optional for this query, you can omit the `GetTopNationsVariables` argument.
const ref = getTopNationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTopNationsRef(dataConnect, getTopNationsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetAthleteAgeStats
You can execute the `GetAthleteAgeStats` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAthleteAgeStats(vars?: GetAthleteAgeStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;

interface GetAthleteAgeStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetAthleteAgeStatsVariables): QueryRef<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
}
export const getAthleteAgeStatsRef: GetAthleteAgeStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAthleteAgeStats(dc: DataConnect, vars?: GetAthleteAgeStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;

interface GetAthleteAgeStatsRef {
  ...
  (dc: DataConnect, vars?: GetAthleteAgeStatsVariables): QueryRef<GetAthleteAgeStatsData, GetAthleteAgeStatsVariables>;
}
export const getAthleteAgeStatsRef: GetAthleteAgeStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAthleteAgeStatsRef:
```typescript
const name = getAthleteAgeStatsRef.operationName;
console.log(name);
```

### Variables
The `GetAthleteAgeStats` query has an optional argument of type `GetAthleteAgeStatsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAthleteAgeStatsVariables {
  noc?: string | null;
  sport?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that executing the `GetAthleteAgeStats` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAthleteAgeStatsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetAthleteAgeStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAthleteAgeStats, GetAthleteAgeStatsVariables } from '@dataconnect/generated';

// The `GetAthleteAgeStats` query has an optional argument of type `GetAthleteAgeStatsVariables`:
const getAthleteAgeStatsVars: GetAthleteAgeStatsVariables = {
  noc: ..., // optional
  sport: ..., // optional
  year: ..., // optional
};

// Call the `getAthleteAgeStats()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAthleteAgeStats(getAthleteAgeStatsVars);
// Variables can be defined inline as well.
const { data } = await getAthleteAgeStats({ noc: ..., sport: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetAthleteAgeStatsVariables` argument.
const { data } = await getAthleteAgeStats();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAthleteAgeStats(dataConnect, getAthleteAgeStatsVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getAthleteAgeStats(getAthleteAgeStatsVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetAthleteAgeStats`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAthleteAgeStatsRef, GetAthleteAgeStatsVariables } from '@dataconnect/generated';

// The `GetAthleteAgeStats` query has an optional argument of type `GetAthleteAgeStatsVariables`:
const getAthleteAgeStatsVars: GetAthleteAgeStatsVariables = {
  noc: ..., // optional
  sport: ..., // optional
  year: ..., // optional
};

// Call the `getAthleteAgeStatsRef()` function to get a reference to the query.
const ref = getAthleteAgeStatsRef(getAthleteAgeStatsVars);
// Variables can be defined inline as well.
const ref = getAthleteAgeStatsRef({ noc: ..., sport: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetAthleteAgeStatsVariables` argument.
const ref = getAthleteAgeStatsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAthleteAgeStatsRef(dataConnect, getAthleteAgeStatsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetGenderBreakdown
You can execute the `GetGenderBreakdown` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getGenderBreakdown(vars?: GetGenderBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetGenderBreakdownData, GetGenderBreakdownVariables>;

interface GetGenderBreakdownRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetGenderBreakdownVariables): QueryRef<GetGenderBreakdownData, GetGenderBreakdownVariables>;
}
export const getGenderBreakdownRef: GetGenderBreakdownRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getGenderBreakdown(dc: DataConnect, vars?: GetGenderBreakdownVariables, options?: ExecuteQueryOptions): QueryPromise<GetGenderBreakdownData, GetGenderBreakdownVariables>;

interface GetGenderBreakdownRef {
  ...
  (dc: DataConnect, vars?: GetGenderBreakdownVariables): QueryRef<GetGenderBreakdownData, GetGenderBreakdownVariables>;
}
export const getGenderBreakdownRef: GetGenderBreakdownRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getGenderBreakdownRef:
```typescript
const name = getGenderBreakdownRef.operationName;
console.log(name);
```

### Variables
The `GetGenderBreakdown` query has an optional argument of type `GetGenderBreakdownVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetGenderBreakdownVariables {
  noc?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that executing the `GetGenderBreakdown` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetGenderBreakdownData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetGenderBreakdown`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getGenderBreakdown, GetGenderBreakdownVariables } from '@dataconnect/generated';

// The `GetGenderBreakdown` query has an optional argument of type `GetGenderBreakdownVariables`:
const getGenderBreakdownVars: GetGenderBreakdownVariables = {
  noc: ..., // optional
  year: ..., // optional
};

// Call the `getGenderBreakdown()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getGenderBreakdown(getGenderBreakdownVars);
// Variables can be defined inline as well.
const { data } = await getGenderBreakdown({ noc: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetGenderBreakdownVariables` argument.
const { data } = await getGenderBreakdown();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getGenderBreakdown(dataConnect, getGenderBreakdownVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getGenderBreakdown(getGenderBreakdownVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetGenderBreakdown`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getGenderBreakdownRef, GetGenderBreakdownVariables } from '@dataconnect/generated';

// The `GetGenderBreakdown` query has an optional argument of type `GetGenderBreakdownVariables`:
const getGenderBreakdownVars: GetGenderBreakdownVariables = {
  noc: ..., // optional
  year: ..., // optional
};

// Call the `getGenderBreakdownRef()` function to get a reference to the query.
const ref = getGenderBreakdownRef(getGenderBreakdownVars);
// Variables can be defined inline as well.
const ref = getGenderBreakdownRef({ noc: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetGenderBreakdownVariables` argument.
const ref = getGenderBreakdownRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getGenderBreakdownRef(dataConnect, getGenderBreakdownVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetGamesSummary
You can execute the `GetGamesSummary` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getGamesSummary(vars: GetGamesSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<GetGamesSummaryData, GetGamesSummaryVariables>;

interface GetGamesSummaryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetGamesSummaryVariables): QueryRef<GetGamesSummaryData, GetGamesSummaryVariables>;
}
export const getGamesSummaryRef: GetGamesSummaryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getGamesSummary(dc: DataConnect, vars: GetGamesSummaryVariables, options?: ExecuteQueryOptions): QueryPromise<GetGamesSummaryData, GetGamesSummaryVariables>;

interface GetGamesSummaryRef {
  ...
  (dc: DataConnect, vars: GetGamesSummaryVariables): QueryRef<GetGamesSummaryData, GetGamesSummaryVariables>;
}
export const getGamesSummaryRef: GetGamesSummaryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getGamesSummaryRef:
```typescript
const name = getGamesSummaryRef.operationName;
console.log(name);
```

### Variables
The `GetGamesSummary` query requires an argument of type `GetGamesSummaryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetGamesSummaryVariables {
  year: number;
  season?: string | null;
}
```
### Return Type
Recall that executing the `GetGamesSummary` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetGamesSummaryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetGamesSummary`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getGamesSummary, GetGamesSummaryVariables } from '@dataconnect/generated';

// The `GetGamesSummary` query requires an argument of type `GetGamesSummaryVariables`:
const getGamesSummaryVars: GetGamesSummaryVariables = {
  year: ..., 
  season: ..., // optional
};

// Call the `getGamesSummary()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getGamesSummary(getGamesSummaryVars);
// Variables can be defined inline as well.
const { data } = await getGamesSummary({ year: ..., season: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getGamesSummary(dataConnect, getGamesSummaryVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getGamesSummary(getGamesSummaryVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetGamesSummary`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getGamesSummaryRef, GetGamesSummaryVariables } from '@dataconnect/generated';

// The `GetGamesSummary` query requires an argument of type `GetGamesSummaryVariables`:
const getGamesSummaryVars: GetGamesSummaryVariables = {
  year: ..., 
  season: ..., // optional
};

// Call the `getGamesSummaryRef()` function to get a reference to the query.
const ref = getGamesSummaryRef(getGamesSummaryVars);
// Variables can be defined inline as well.
const ref = getGamesSummaryRef({ year: ..., season: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getGamesSummaryRef(dataConnect, getGamesSummaryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetSportHistory
You can execute the `GetSportHistory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSportHistory(vars: GetSportHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportHistoryData, GetSportHistoryVariables>;

interface GetSportHistoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSportHistoryVariables): QueryRef<GetSportHistoryData, GetSportHistoryVariables>;
}
export const getSportHistoryRef: GetSportHistoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSportHistory(dc: DataConnect, vars: GetSportHistoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetSportHistoryData, GetSportHistoryVariables>;

interface GetSportHistoryRef {
  ...
  (dc: DataConnect, vars: GetSportHistoryVariables): QueryRef<GetSportHistoryData, GetSportHistoryVariables>;
}
export const getSportHistoryRef: GetSportHistoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSportHistoryRef:
```typescript
const name = getSportHistoryRef.operationName;
console.log(name);
```

### Variables
The `GetSportHistory` query requires an argument of type `GetSportHistoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSportHistoryVariables {
  sport: string;
}
```
### Return Type
Recall that executing the `GetSportHistory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSportHistoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetSportHistory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSportHistory, GetSportHistoryVariables } from '@dataconnect/generated';

// The `GetSportHistory` query requires an argument of type `GetSportHistoryVariables`:
const getSportHistoryVars: GetSportHistoryVariables = {
  sport: ..., 
};

// Call the `getSportHistory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSportHistory(getSportHistoryVars);
// Variables can be defined inline as well.
const { data } = await getSportHistory({ sport: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSportHistory(dataConnect, getSportHistoryVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getSportHistory(getSportHistoryVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetSportHistory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSportHistoryRef, GetSportHistoryVariables } from '@dataconnect/generated';

// The `GetSportHistory` query requires an argument of type `GetSportHistoryVariables`:
const getSportHistoryVars: GetSportHistoryVariables = {
  sport: ..., 
};

// Call the `getSportHistoryRef()` function to get a reference to the query.
const ref = getSportHistoryRef(getSportHistoryVars);
// Variables can be defined inline as well.
const ref = getSportHistoryRef({ sport: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSportHistoryRef(dataConnect, getSportHistoryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

## GetBmiBySport
You can execute the `GetBmiBySport` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getBmiBySport(vars?: GetBmiBySportVariables, options?: ExecuteQueryOptions): QueryPromise<GetBmiBySportData, GetBmiBySportVariables>;

interface GetBmiBySportRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetBmiBySportVariables): QueryRef<GetBmiBySportData, GetBmiBySportVariables>;
}
export const getBmiBySportRef: GetBmiBySportRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getBmiBySport(dc: DataConnect, vars?: GetBmiBySportVariables, options?: ExecuteQueryOptions): QueryPromise<GetBmiBySportData, GetBmiBySportVariables>;

interface GetBmiBySportRef {
  ...
  (dc: DataConnect, vars?: GetBmiBySportVariables): QueryRef<GetBmiBySportData, GetBmiBySportVariables>;
}
export const getBmiBySportRef: GetBmiBySportRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getBmiBySportRef:
```typescript
const name = getBmiBySportRef.operationName;
console.log(name);
```

### Variables
The `GetBmiBySport` query has an optional argument of type `GetBmiBySportVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetBmiBySportVariables {
  noc?: string | null;
  year?: number | null;
}
```
### Return Type
Recall that executing the `GetBmiBySport` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetBmiBySportData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetBmiBySport`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getBmiBySport, GetBmiBySportVariables } from '@dataconnect/generated';

// The `GetBmiBySport` query has an optional argument of type `GetBmiBySportVariables`:
const getBmiBySportVars: GetBmiBySportVariables = {
  noc: ..., // optional
  year: ..., // optional
};

// Call the `getBmiBySport()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getBmiBySport(getBmiBySportVars);
// Variables can be defined inline as well.
const { data } = await getBmiBySport({ noc: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetBmiBySportVariables` argument.
const { data } = await getBmiBySport();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getBmiBySport(dataConnect, getBmiBySportVars);

console.log(data.results);

// Or, you can use the `Promise` API.
getBmiBySport(getBmiBySportVars).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

### Using `GetBmiBySport`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getBmiBySportRef, GetBmiBySportVariables } from '@dataconnect/generated';

// The `GetBmiBySport` query has an optional argument of type `GetBmiBySportVariables`:
const getBmiBySportVars: GetBmiBySportVariables = {
  noc: ..., // optional
  year: ..., // optional
};

// Call the `getBmiBySportRef()` function to get a reference to the query.
const ref = getBmiBySportRef(getBmiBySportVars);
// Variables can be defined inline as well.
const ref = getBmiBySportRef({ noc: ..., year: ..., });
// Since all variables are optional for this query, you can omit the `GetBmiBySportVariables` argument.
const ref = getBmiBySportRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getBmiBySportRef(dataConnect, getBmiBySportVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.results);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.results);
});
```

# Mutations

No mutations were generated for the `example` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

