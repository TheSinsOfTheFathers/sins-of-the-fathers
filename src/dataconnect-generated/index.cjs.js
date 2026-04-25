const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

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
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEntityRef(dcInstance, inputVars));
}
;

const createLinkRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateLink', inputVars);
}
createLinkRef.operationName = 'CreateLink';
exports.createLinkRef = createLinkRef;

exports.createLink = function createLink(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createLinkRef(dcInstance, inputVars));
}
;

const listBloodlineRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBloodline');
}
listBloodlineRef.operationName = 'ListBloodline';
exports.listBloodlineRef = listBloodlineRef;

exports.listBloodline = function listBloodline(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listBloodlineRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
