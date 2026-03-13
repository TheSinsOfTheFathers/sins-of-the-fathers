import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'sins-of-the-fathers',
  location: 'europe-west1'
};

export const createEntityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEntity', inputVars);
}
createEntityRef.operationName = 'CreateEntity';

export function createEntity(dcOrVars, vars) {
  return executeMutation(createEntityRef(dcOrVars, vars));
}

export const createLinkRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLink', inputVars);
}
createLinkRef.operationName = 'CreateLink';

export function createLink(dcOrVars, vars) {
  return executeMutation(createLinkRef(dcOrVars, vars));
}

export const listBloodlineRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBloodline');
}
listBloodlineRef.operationName = 'ListBloodline';

export function listBloodline(dc) {
  return executeQuery(listBloodlineRef(dc));
}

