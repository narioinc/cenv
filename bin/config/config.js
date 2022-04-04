import fs from "fs";
import ora from 'ora';

var content = {
    "DEV": {
        "cloud":{
            "provider": "aws",
            "region": "us-east-2" 
        },
        "host": "dev_hostname.com",
        "envVars": {
            "plain": {
                "var1": "dev_value",
                "var2": "dev_value"
            },
            "secrets":[
                "secret_arn if using AWS"
            ]
        }
    }
    ,
    "LOCAL": {
        "cloud":{
            "provider": "aws",
            "region": "us-east-2" 
        },
        "host": "localhost",
        "envVars": {
            "plain": {
                "var1": "local_value",
                "var2": "local_value"
            },
            "secrets":[
                "secret_arn if using AWS"
            ]
        }
    }
}

function initWithCenv() {
    var configSpinner = ora("Initializing project for cenv").start();
    if(fs.existsSync(".cenv")){
        configSpinner.stopAndPersist({ symbol: '✖', text: "file already exists" })
    }else{
        try {
            fs.writeFileSync('.cenv', JSON.stringify(content, null, 4))
            configSpinner.stopAndPersist({ symbol: '✔', text: ".cenv file created successfully, please edit the file before activating the environments" })
          } catch (err) {
            configSpinner.stopAndPersist({ symbol: '✖', text: ".cenv could not be created, please try again." })
          }
    }
}

export { initWithCenv };