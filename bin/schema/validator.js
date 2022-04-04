import Ajv from "ajv"
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

//*************************
// CENV schema
//*************************

const schema = {
  type: "object",
  patternProperties: {
    "^[a-zA-Z0-9]*$": {
      type: "object",
      properties: {
        cloud: {
          type: "object",
          properties: {
            provider: {
              type: "string"
            },
            region : {
              type: "string"
            }
          },
          additionalProperties: false
        },
        host: {
          type : "string"
        },
        envVars: {
           type: "object",
           properties: {
             plain: {
               type: "object"
             },
             secrets: {
               "type": "array"
             }
           },
           additionalProperties: false 
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
}

const validate = ajv.compile(schema)

export default validate;

//const valid = validate(data)
//if (!valid) console.log(validate.errors)