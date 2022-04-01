#!/usr/bin/env node

const yargs = require("yargs");
var hostile = require('hostile')
const chalk = require("chalk");
const boxen = require("boxen");
var cmd = require('node-cmd');
const fs = require('fs');
const os = require('os');
const { Console, dir } = require("console");
const { env } = require("process");

let cenvConfig
let configData

try {
    configData = fs.readFileSync('.cenv');
}catch(err){
    const message = `.cenv file not found in current path`;
    console.log(boxen(chalk.red(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'red' }));
    process.exit();
}

if(configData && configData.length > 0)
{
   cenvConfig  = JSON.parse(configData);
}else{
    const message = `.cenv file couldn't be processed....exiting`;
    console.log(boxen(chalk.red(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'red' }));
    process.exit();
}


//***********************************
//UTILS section
//***********************************

getAllEnvs = () => {
    var envs = []

    for (const [key, value] of Object.entries(cenvConfig)) {
        envs.push(key);
    }

    return envs;
}

getProject = () => {
    var dirs = process.cwd().split('\\');
    return dirs[dirs.length - 1];
}

getOS = () => {
    const hostOS = os.platform;
    console.log(`Detected OS as: ${hostOS}`);
    return hostOS;
}

const hostOS = getOS()

//***********************************
// HOSTS section
//***********************************

resetHosts = () => {
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

changeHosts = (url) => {
    if (url) {
        hostile.set('127.0.0.1', url, function (err) {
            if (err) {
                console.error(err)
            } else {
                console.log('hosts changed successfully!')
            }
        })

    }
}

removeHosts = (url) => {
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

setEnvVars = (env) => {
    var envVars = cenvConfig[env].envVars;

    for (const [key, value] of Object.entries(envVars)) {
        var command
        if (hostOS == 'linux') {
            command = `export ${key}=${value}`
        }
        else if (hostOS == 'win32') {
            command = `setx ${key} \"${value}\"`
        }
    }
    cmd.runSync(command);
    console.log('environment variables changed successfully!')
}

setActiveEnv = (environment) => {
    var command = "";

    if (hostOS == 'linux') {
        command = `export ACTIVE_ENV=${environment}`
    }
    else if (hostOS == 'win32') {
        command = `setx ACTIVE_ENV \"${environment}\"`
    }
    cmd.runSync(command);
}

getActiveEnv = () => {
    return process.env.ACTIVE_ENV;
}


//***********************************
// Activate environment section
//***********************************

var setEnv = function (environment) {
    if (environment) {
        const message = `Activating ${options.env} environment for project ${getProject()}`;
        console.log(boxen(chalk.green(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'green' }));

        const host = cenvConfig[environment].host;
        resetHosts();
        if (getAllEnvs().includes(environment)) {
            changeHosts(host)
        } else {
            throw new Error(`Please use valid env types: ${getAllEnvs()}`)
        }
        setEnvVars(environment);
        setActiveEnv(environment);
    }

}

showEnv = (getEnv) => {
    if (getEnv) {
        const message = `Current active environment is :: ${getActiveEnv()}`;
        console.log(boxen(chalk.green(message), { textAlignment: "center", title: "cenv", titleAlignment: 'center', padding: 1, borderColor: 'green' }));
    }
}


const options = yargs
    .usage("Usage: --env <environment> <flags>")
    .option("env", { alias: "environment", describe: `The environment to activate. Choices are ${getAllEnvs()}`, type: "string", demandOption: false })
    .option("g", { alias: "get-environment", describe: `Show the current active environment`, type: "boolean", demandOption: false })
    .check((argv, options) => {
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
