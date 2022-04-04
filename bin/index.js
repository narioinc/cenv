#!/usr/bin/env node

/*const yargs = require("yargs")(process.argv.slice(2));
var hostile = require('hostile')
const chalk = require("chalk");
const boxen = require("boxen");
var cmd = require('node-cmd');
const fs = require('fs');
const os = require('os');
const child_process = require('child_process');
var AWS = require('aws-sdk')
*/

import yargs from "yargs";
import hostile from 'hostile'
import chalk from "chalk";
import boxen from "boxen";
import cmd from 'node-cmd';
import fs from 'fs';
import os from 'os';
import child_process from 'child_process';
import AWS from 'aws-sdk'
import ora from 'ora';
import lodash from 'lodash';
import request from 'sync-request';
import validate from './schema/validator.js';
import { initWithCenv } from './config/config.js'


//*****************************
// GLOBALS
//*****************************
let cenvConfig
let configData
let hostOS;
let spinner;


//********************************
// .cenv FILE CONFIG section 
// ********************************

var loadHttpConfig = (url) => {
    spinner.start();
    var cloudConfig;
    var res
    try {
        res = request('GET', url)
    } catch (err) {
        spinner.stopAndPersist({ symbol: '✖', text: `Loading file from ${url}` });
        process.exit();
    }
    if (res && res.statusCode == 200) {
        try {
            cloudConfig = JSON.parse(res.body);
        } catch (err) {
            const message = `.cenv file couldn't be processed as valid JSON, please check the file and try again`;
            console.log(boxen(chalk.red(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'red' }));
            spinner.stopAndPersist({ symbol: '✖', text: `Loading file from ${url}` });
            process.exit();
        }
        spinner.stopAndPersist({ symbol: '✔', text: `Loading file from ${url}` });
        return cloudConfig;
    } else {
        const message = `.cenv file could not be downloaded from the given URL`;
        console.log(boxen(chalk.red(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'red' }));
        spinner.stopAndPersist({ symbol: '✖', text: `Loading file from ${url}` });
        process.exit();
    }
}

var loadConfig = (path) => {
    spinner.start("Loading config file");
    if (path && path.toString().startsWith("http")) {
        cenvConfig = loadHttpConfig(path)
    } else {
        var fileLocation = path ? path : ".cenv";
        try {
            configData = fs.readFileSync(fileLocation);
        } catch (err) {
            console.log(err);
            const message = `.cenv file not found in current path`;
            console.log(boxen(chalk.red(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'red' }));
            spinner.stopAndPersist({ symbol: '✖', text: `Loading file from ${path ? path : "project root"}` });
            process.exit();
        }

        if (configData && configData.length > 0) {
            cenvConfig = JSON.parse(configData);
            spinner.stopAndPersist({ symbol: '✔', text: `Loading file from ${path ? path : "project root"}` });
        } else {
            const message = `.cenv file couldn't be processed....exiting`;
            console.log(boxen(chalk.red(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'red' }));
            spinner.stopAndPersist({ symbol: '✖', text: `Loading file from ${path ? path : "project root"}` });
            process.exit();
        }
    }
}

var validateSchema = () => {
    const valid = validate(cenvConfig);
    //console.log("validated schema and got :: " + valid);
    return valid;
}


//***********************************
//UTILS section
//***********************************

var getAllEnvs = () => {
    var envs = []
    try {
        for (const [key, value] of Object.entries(cenvConfig)) {
            envs.push(key);
        }
    } catch (err) {
        console.log(err);
    }

    return envs;
}

var getProject = () => {
    var dirs = process.cwd().split('\\');
    return dirs[dirs.length - 1];
}

var getOS = () => {
    const hostOS = os.platform;
    spinner.stopAndPersist({ symbol: '✔', text: `Detected OS as: ${hostOS}` });
    return hostOS;
}

var isCurrentUserRoot = () => {
    var isElevated = false
    if (process.platform !== 'win32') {
        return process.getuid == 0;
    }

    try {
        child_process.execFileSync("net", ["session"], { "stdio": "ignore" });
        isElevated = true;
    }
    catch (e) {
        isElevated = false;
    }

    return isElevated;
}

//***********************************
// HOSTS section
//***********************************

var resetHosts = () => {
    var lines
    var hosts = []

    for (const [key, value] of Object.entries(cenvConfig)) {
        hosts.push(cenvConfig[key].host);
    }
    try {
        lines = hostile.get(false)
    } catch (err) {
        return error(err)
    }
    lines.forEach(function (item) {
        if (hosts.includes(item[1])) {
            try {
                hostile.remove(item[0], item[1])
            } catch (err) {
                return error('Error: ' + err.message + '. Are you running as root?')
            }
        }
    })
}

var changeHosts = (url) => {
    spinner.start();
    if (url) {
        hostile.set('127.0.0.1', url, function (err) {
            if (err) {
                console.error(err)
            } else {
                spinner.stopAndPersist({ symbol: '✔', text: "Hosts changed successfully!" });
            }
        })

    }
}

var removeHosts = (url) => {
    if (url) {
        var lines
        try {
            lines = hostile.get(false)
        } catch (err) {
            return error(err)
        }
        lines.forEach(function (item) {
            if (item[1] === url) {
                try {
                    hostile.remove(item[0], url)
                } catch (err) {
                    return error('Error: ' + err.message + '. Are you running as root?')
                }
            }
        })
    }
}

//***********************************
// ENV VARS section
//***********************************

var setEnvVars = (env) => {
    spinner.start();
    var envVars = cenvConfig[env].envVars.plain;

    for (const [key, value] of Object.entries(envVars)) {
        var command
        if (hostOS == 'linux') {
            command = `export ${key}=${value}`
        }
        else if (hostOS == 'win32') {
            command = `setx ${key} \"${value}\"`
        }
        cmd.runSync(command);
    }
    spinner.stopAndPersist({ symbol: '✔', text: "Environment variables changed successfully!" });
}

var setSecretsEnvVars = (env) => {
    spinner.start();
    var client = new AWS.SecretsManager({ region: cenvConfig[env].cloud.region });
    var cloudSecrets = cenvConfig[env].envVars.secrets;
    if (!cloudSecrets) {
        spinner.stopAndPersist({ symbol: chalk.red('✖'), text: "There were no secrets added for this environment, skipping" });
        return;
    }
    cloudSecrets.forEach((secret) => {
        //console.log(secret);
        client.getSecretValue({ SecretId: secret }, function (err, data) {
            if (err) {
                spinner.stopAndPersist({ symbol: '✖', text: "There was an issue processing your secrets, check configuration and try again." })
                return;
            } else {
                var secretsString = data.SecretString;
                var cloudSecrets = JSON.parse(secretsString);
                for (const [key, value] of Object.entries(cloudSecrets)) {
                    var command
                    if (hostOS == 'linux') {
                        command = `export ${key}=${value}`
                    }
                    else if (hostOS == 'win32') {
                        command = `setx ${key} \"${value}\"`
                    }
                    cmd.runSync(command);
                }
                spinner.stopAndPersist({ symbol: '✔', text: "Secrets mounted to environment variables successfully!" })
            }

        })
    })
}

var setActiveEnv = (environment) => {
    var command = "";

    if (hostOS == 'linux') {
        command = `export ACTIVE_ENV=${environment}`
    }
    else if (hostOS == 'win32') {
        command = `setx ACTIVE_ENV \"${environment}\"`
    }
    cmd.runSync(command);
}

var getActiveEnv = () => {
    return process.env.ACTIVE_ENV;
}


//***********************************
// Activate environment section
//***********************************

var setEnv = function (environment) {
    hostOS = getOS();
    if (environment) {
        const message = `Activating ${options.env} environment for project ${getProject()}`;
        spinner.stopAndPersist({ symbol: '✔', text: message }).start();

        const host = cenvConfig[environment].host;
        resetHosts();
        if (getAllEnvs().includes(environment)) {
            changeHosts(host)
        } else {
            throw new Error(`Please use valid env types: ${getAllEnvs()}`)
        }
        setEnvVars(environment);
        if (options.s) {
            setSecretsEnvVars(environment);
        }
        setActiveEnv(environment);
    }
}

var showEnv = (getEnv) => {

    if (getEnv) {
        var activeEnv = getActiveEnv();
        if (activeEnv && activeEnv.length > 0) {
            const message = `Current active environment is :: ${getActiveEnv()}`;
            console.log(boxen(chalk.green(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'green' }));
        } else {
            const message = `No active environment has been set. Please use the --env command to set an active environment`;
            console.log(boxen(chalk.green(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'green' }));
        }
    }
}


spinner = ora();
const options = yargs
    .usage("Usage: --env <commands> <options>")
    .command('init', 'Initialize the current project for use with cenv',
        (yargs) => {
            return yargs;
        },
        (argv) => {
            initWithCenv();
            process.exit();
        })
    .option("env", { alias: "environment", describe: `The environment to activate as per your .cenv config file`, type: "string", demandOption: false })
    .option("g", { alias: "get-environment", describe: `Show the current active environment`, type: "boolean", demandOption: false })
    .option("s", { alias: "secrets", describe: `Load secrets as well into environment variables`, type: "boolean", demandOption: false })
    .option("c", { alias: "config", describe: `Load config from a custom disk location or URL. If not specified, read the .cenv file from the current directory`, type: "string", demandOption: false })
    .check((argv, options) => {
        if (Object.keys(argv).length == 2 && argv._.length == 0) {
            yargs.showHelp();
            process.exit();
        }

        if(argv._.includes("init")){
            return true;
        }
        
        if (!isCurrentUserRoot()) {
            console.log(boxen(chalk.red("Dragons ahead, need ROOT !!!")));
            process.exit();
        }
        
        loadConfig(argv.c);
        if (!validateSchema()) {
            console.log(boxen(chalk.red("Schema of the .cenv is invalid, please check documentation or the provided cenv_sample file inside schema folder")));
            process.exit();
        }
        const envs = getAllEnvs();

        if (argv.env) {
            if (envs.includes(argv.env)) {
                return true;
            } else {
                throw new Error(`Please use valid env types: ${getAllEnvs()}`)
            }
        }
        return true;
    })
    .argv;

setEnv(options.env)
showEnv(options.g);
