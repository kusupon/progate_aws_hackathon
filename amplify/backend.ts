import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource.js';
import { text } from './text/resource.js';
// import * as cdk from 'aws-cdk-lib';

defineBackend({
  auth,
  data,
  storage,
  text
});

// const tableName = backend.data.resources.tables["Document"].tableName;
// new cdk.CfnOutput(backend.stack, "DocumentTableName", {
//   value: tableName,
//   description: "The Document DynamoDB table name",
//   exportName: "DocumentTableName-dev-branch",
// });

