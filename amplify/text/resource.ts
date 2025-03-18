import { defineFunction } from "@aws-amplify/backend";
    
export const text = defineFunction({
  name: "text",
  entry: "./handler.ts"
});