import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface BloodlineLink_Key {
  id: string;
  __typename?: 'BloodlineLink_Key';
}

export interface CreateEntityData {
  entity_insert: Entity_Key;
}

export interface CreateEntityVariables {
  id: string;
  name: string;
  role?: string | null;
  status?: string | null;
  threatLevel?: string | null;
  imageUrl?: string | null;
  creatorId: string;
}

export interface CreateLinkData {
  bloodlineLink_insert: BloodlineLink_Key;
}

export interface CreateLinkVariables {
  id: string;
  source: string;
  target: string;
  relationType: string;
  notes?: string | null;
  isClassified?: boolean | null;
  creatorId: string;
}

export interface Entity_Key {
  id: string;
  __typename?: 'Entity_Key';
}

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

interface ListBloodlineRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListBloodlineData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListBloodlineData, undefined>;
  operationName: string;
}
export const listBloodlineRef: ListBloodlineRef;

export function listBloodline(options?: ExecuteQueryOptions): QueryPromise<ListBloodlineData, undefined>;
export function listBloodline(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListBloodlineData, undefined>;

interface CreateEntityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEntityVariables): MutationRef<CreateEntityData, CreateEntityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEntityVariables): MutationRef<CreateEntityData, CreateEntityVariables>;
  operationName: string;
}
export const createEntityRef: CreateEntityRef;

export function createEntity(vars: CreateEntityVariables): MutationPromise<CreateEntityData, CreateEntityVariables>;
export function createEntity(dc: DataConnect, vars: CreateEntityVariables): MutationPromise<CreateEntityData, CreateEntityVariables>;

interface CreateLinkRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateLinkVariables): MutationRef<CreateLinkData, CreateLinkVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateLinkVariables): MutationRef<CreateLinkData, CreateLinkVariables>;
  operationName: string;
}
export const createLinkRef: CreateLinkRef;

export function createLink(vars: CreateLinkVariables): MutationPromise<CreateLinkData, CreateLinkVariables>;
export function createLink(dc: DataConnect, vars: CreateLinkVariables): MutationPromise<CreateLinkData, CreateLinkVariables>;

