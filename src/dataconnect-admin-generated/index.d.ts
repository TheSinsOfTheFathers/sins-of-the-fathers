import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'ListBloodline' Query. Allow users to execute without passing in DataConnect. */
export function listBloodline(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListBloodlineData>>;
/** Generated Node Admin SDK operation action function for the 'ListBloodline' Query. Allow users to pass in custom DataConnect instances. */
export function listBloodline(options?: OperationOptions): Promise<ExecuteOperationResponse<ListBloodlineData>>;

/** Generated Node Admin SDK operation action function for the 'CreateEntity' Mutation. Allow users to execute without passing in DataConnect. */
export function createEntity(dc: DataConnect, vars: CreateEntityVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateEntityData>>;
/** Generated Node Admin SDK operation action function for the 'CreateEntity' Mutation. Allow users to pass in custom DataConnect instances. */
export function createEntity(vars: CreateEntityVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateEntityData>>;

/** Generated Node Admin SDK operation action function for the 'CreateLink' Mutation. Allow users to execute without passing in DataConnect. */
export function createLink(dc: DataConnect, vars: CreateLinkVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateLinkData>>;
/** Generated Node Admin SDK operation action function for the 'CreateLink' Mutation. Allow users to pass in custom DataConnect instances. */
export function createLink(vars: CreateLinkVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateLinkData>>;

