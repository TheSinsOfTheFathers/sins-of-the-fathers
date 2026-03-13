# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListBloodline*](#listbloodline)
- [**Mutations**](#mutations)
  - [*CreateEntity*](#createentity)
  - [*CreateLink*](#createlink)

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

## ListBloodline
You can execute the `ListBloodline` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listBloodline(): QueryPromise<ListBloodlineData, undefined>;

interface ListBloodlineRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListBloodlineData, undefined>;
}
export const listBloodlineRef: ListBloodlineRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBloodline(dc: DataConnect): QueryPromise<ListBloodlineData, undefined>;

interface ListBloodlineRef {
  ...
  (dc: DataConnect): QueryRef<ListBloodlineData, undefined>;
}
export const listBloodlineRef: ListBloodlineRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBloodlineRef:
```typescript
const name = listBloodlineRef.operationName;
console.log(name);
```

### Variables
The `ListBloodline` query has no variables.
### Return Type
Recall that executing the `ListBloodline` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBloodlineData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListBloodlineData {
  entities: ({
    id: string;
    name: string;
    role?: string | null;
    status: string;
    threatLevel: string;
    imageUrl?: string | null;
  } & Entity_Key)[];
    bloodlineLinks: ({
      id: string;
      source: {
        id: string;
        name: string;
      } & Entity_Key;
        target: {
          id: string;
          name: string;
        } & Entity_Key;
          relationType: string;
          isClassified: boolean;
    } & BloodlineLink_Key)[];
}
```
### Using `ListBloodline`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBloodline } from '@dataconnect/generated';


// Call the `listBloodline()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBloodline();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBloodline(dataConnect);

console.log(data.entities);
console.log(data.bloodlineLinks);

// Or, you can use the `Promise` API.
listBloodline().then((response) => {
  const data = response.data;
  console.log(data.entities);
  console.log(data.bloodlineLinks);
});
```

### Using `ListBloodline`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBloodlineRef } from '@dataconnect/generated';


// Call the `listBloodlineRef()` function to get a reference to the query.
const ref = listBloodlineRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBloodlineRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.entities);
console.log(data.bloodlineLinks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.entities);
  console.log(data.bloodlineLinks);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateEntity
You can execute the `CreateEntity` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEntity(vars: CreateEntityVariables): MutationPromise<CreateEntityData, CreateEntityVariables>;

interface CreateEntityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEntityVariables): MutationRef<CreateEntityData, CreateEntityVariables>;
}
export const createEntityRef: CreateEntityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEntity(dc: DataConnect, vars: CreateEntityVariables): MutationPromise<CreateEntityData, CreateEntityVariables>;

interface CreateEntityRef {
  ...
  (dc: DataConnect, vars: CreateEntityVariables): MutationRef<CreateEntityData, CreateEntityVariables>;
}
export const createEntityRef: CreateEntityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEntityRef:
```typescript
const name = createEntityRef.operationName;
console.log(name);
```

### Variables
The `CreateEntity` mutation requires an argument of type `CreateEntityVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEntityVariables {
  id: string;
  name: string;
  role?: string | null;
  status?: string | null;
  threatLevel?: string | null;
  imageUrl?: string | null;
  creatorId: string;
}
```
### Return Type
Recall that executing the `CreateEntity` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEntityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEntityData {
  entity_insert: Entity_Key;
}
```
### Using `CreateEntity`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEntity, CreateEntityVariables } from '@dataconnect/generated';

// The `CreateEntity` mutation requires an argument of type `CreateEntityVariables`:
const createEntityVars: CreateEntityVariables = {
  id: ..., 
  name: ..., 
  role: ..., // optional
  status: ..., // optional
  threatLevel: ..., // optional
  imageUrl: ..., // optional
  creatorId: ..., 
};

// Call the `createEntity()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEntity(createEntityVars);
// Variables can be defined inline as well.
const { data } = await createEntity({ id: ..., name: ..., role: ..., status: ..., threatLevel: ..., imageUrl: ..., creatorId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEntity(dataConnect, createEntityVars);

console.log(data.entity_insert);

// Or, you can use the `Promise` API.
createEntity(createEntityVars).then((response) => {
  const data = response.data;
  console.log(data.entity_insert);
});
```

### Using `CreateEntity`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEntityRef, CreateEntityVariables } from '@dataconnect/generated';

// The `CreateEntity` mutation requires an argument of type `CreateEntityVariables`:
const createEntityVars: CreateEntityVariables = {
  id: ..., 
  name: ..., 
  role: ..., // optional
  status: ..., // optional
  threatLevel: ..., // optional
  imageUrl: ..., // optional
  creatorId: ..., 
};

// Call the `createEntityRef()` function to get a reference to the mutation.
const ref = createEntityRef(createEntityVars);
// Variables can be defined inline as well.
const ref = createEntityRef({ id: ..., name: ..., role: ..., status: ..., threatLevel: ..., imageUrl: ..., creatorId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEntityRef(dataConnect, createEntityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.entity_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.entity_insert);
});
```

## CreateLink
You can execute the `CreateLink` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createLink(vars: CreateLinkVariables): MutationPromise<CreateLinkData, CreateLinkVariables>;

interface CreateLinkRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLinkVariables): MutationRef<CreateLinkData, CreateLinkVariables>;
}
export const createLinkRef: CreateLinkRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createLink(dc: DataConnect, vars: CreateLinkVariables): MutationPromise<CreateLinkData, CreateLinkVariables>;

interface CreateLinkRef {
  ...
  (dc: DataConnect, vars: CreateLinkVariables): MutationRef<CreateLinkData, CreateLinkVariables>;
}
export const createLinkRef: CreateLinkRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createLinkRef:
```typescript
const name = createLinkRef.operationName;
console.log(name);
```

### Variables
The `CreateLink` mutation requires an argument of type `CreateLinkVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateLinkVariables {
  id: string;
  source: string;
  target: string;
  relationType: string;
  notes?: string | null;
  isClassified?: boolean | null;
  creatorId: string;
}
```
### Return Type
Recall that executing the `CreateLink` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateLinkData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateLinkData {
  bloodlineLink_insert: BloodlineLink_Key;
}
```
### Using `CreateLink`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createLink, CreateLinkVariables } from '@dataconnect/generated';

// The `CreateLink` mutation requires an argument of type `CreateLinkVariables`:
const createLinkVars: CreateLinkVariables = {
  id: ..., 
  source: ..., 
  target: ..., 
  relationType: ..., 
  notes: ..., // optional
  isClassified: ..., // optional
  creatorId: ..., 
};

// Call the `createLink()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createLink(createLinkVars);
// Variables can be defined inline as well.
const { data } = await createLink({ id: ..., source: ..., target: ..., relationType: ..., notes: ..., isClassified: ..., creatorId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createLink(dataConnect, createLinkVars);

console.log(data.bloodlineLink_insert);

// Or, you can use the `Promise` API.
createLink(createLinkVars).then((response) => {
  const data = response.data;
  console.log(data.bloodlineLink_insert);
});
```

### Using `CreateLink`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createLinkRef, CreateLinkVariables } from '@dataconnect/generated';

// The `CreateLink` mutation requires an argument of type `CreateLinkVariables`:
const createLinkVars: CreateLinkVariables = {
  id: ..., 
  source: ..., 
  target: ..., 
  relationType: ..., 
  notes: ..., // optional
  isClassified: ..., // optional
  creatorId: ..., 
};

// Call the `createLinkRef()` function to get a reference to the mutation.
const ref = createLinkRef(createLinkVars);
// Variables can be defined inline as well.
const ref = createLinkRef({ id: ..., source: ..., target: ..., relationType: ..., notes: ..., isClassified: ..., creatorId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createLinkRef(dataConnect, createLinkVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.bloodlineLink_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.bloodlineLink_insert);
});
```

