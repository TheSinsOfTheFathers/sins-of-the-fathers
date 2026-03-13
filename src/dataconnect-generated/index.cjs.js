const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'sins-of-the-fathers',
  location: 'europe-west1'
};
exports.connectorConfig = connectorConfig;

const createEntityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEntity', inputVars);
}
createEntityRef.operationName = 'CreateEntity';
exports.createEntityRef = createEntityRef;

exports.createEntity = function createEntity(dcOrVars, vars) {
  return executeMutation(createEntityRef(dcOrVars, vars));
};

const createLinkRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLink', inputVars);
}
createLinkRef.operationName = 'CreateLink';
exports.createLinkRef = createLinkRef;

exports.createLink = function createLink(dcOrVars, vars) {
  return executeMutation(createLinkRef(dcOrVars, vars));
};

const listBloodlineRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBloodline');
}
listBloodlineRef.operationName = 'ListBloodline';
exports.listBloodlineRef = listBloodlineRef;

exports.listBloodline = function listBloodline(dc) {
  return executeQuery(listBloodlineRef(dc));
};
