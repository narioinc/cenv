# cenv
A Nodejs based CLI utility to "change environment" (and hence the name cenv) details on the fly for any project

The purpose of this utility is to allow users to set environment details like environment variables, hosts files edits to ensure that developers can activate an environment quickly on their desktop for local development.

# How to use the CLI tool

## Pre-requisites
* nodejs installed at an LTS version preferably 16.13.0 or above
* AWS CLI installed with configuration done in case you want to use the aws secrets feature
* Ability to run a command as root in Linux or administrator in Windows

## Install cenv
cenv can be installed using the following command from the root of this project
* `npm install -g .`

## Create a .cenv file in your project root
* Irrespective of your project type and language used, just create a .cenv file at the root of your project
* Optionally, you can now use the `cenv init` command to create a .cenv stub file and get things kick-started quicker. 
* Use the sample cenv file provided in this repo for reference (provided in the 'schema' folder) . Its pretty much self explanatory. Take a copy and rename it to .cenv and place it at the root of your project.
* Once created, just execute the command `cenv --env <environment_name>`. environment_name is what you give as immediate child attributes in the root of the .cenv JSON document. the sample cenv file shows how to create DEV, QA, STAGING etc
* for example `$> cenv --env DEV` can be executed to activate your dev environment 

## Run the program
* Run `$> cenv` or `$> cenv --help` for bringing up help menu
* Run `$> cenv -g` to get the current active environment
* Run `$> cenv --env <environment name as in .cenv file>` to enable a particular env and its details 
* Run `$> cenv --env <environment name as in .cenv file> -s` to additionally load secrets as well from the config file. currently support AWS Secrets ARN ONLY.
* Run `$> cenv -c <path to file or URL>` to load a local file from path or a online file using a URL (https and http both are supported). Its recommended to use HTTPS !! 
* Run `$> cenv init` to initialize the current directory with a stub .cenv file to get things started. Please do make the necessary changes before using the .cenv file

## Full command description

```
Usage: --env <commands> <options>

Commands:
    init  Initialize the current project for use with cenv

Options:
  --help                 Show help                                     [boolean]
  --version              Show version number                           [boolean]
  --env, --environment   The environment to activate as per your .cenv config
                         file                                           [string]
  -g, --get-environment  Show the current active environment           [boolean]
  -s, --secrets          Load secrets as well into environment variables
                                                                       [boolean]
  -c, --config           Load config from a custom disk location or URL. If not
                         specified, read the .cenv file from the current
                         directory                                      [string]

```


# BEWARE, DRAGONS AHEAD.... !! This tool needs ROOT 
cenv edits the hosts file in your OS to add an entry for 127.0.0.1 with the host DNS you specify in .cenv file
This operation needs root. Please run this command under an elevated shell session in your OS. There are check in place to prevent this tool running under non-root/non-admin users

# Supported OS
For now cenv support 
* Linux - Ubuntu 18.04+, Debian 8+
* Windows 10 and above

# UPDATES:

## v1.3.0
* Added schema validations
* Added new `init` command to initialize a project with a sample .cenv file which users can edit.

## v1.2.0
* Added ability to load config from custom path using the -c or --config option
* `$> cenv --env DEV -c "http:localhost:8080\cenv.json` will load a file called cenv.json from your local server. 
* Just provide a file URL to a file hosted on a server or a file path which is local for the -c command. If nothing is provided, it will search the current directory for .cenv file by default
* progress indicator and messages updated for better tracking of the tool's overall progress

## v1.1.0
* Support for AWS secrets to be mounted onto the local system as env vars.
* use the -s or --secret option to load the secrets mentioned in the cenv file. By default they will NOT be loaded
* .cenv sample file updated to show how to add aws secrets to a environment. the new cloud section allows for setting your cloud provider (for now AWS) and region

## v1.0.0
* Initial tool allows setting plaintext env vars to your local machine
* also updates your hosts file entry to the DNS you specified for 127.0.0.1 address
* cenv requires root to run

# TODO LIST

* Massive rewrite to make I/O calls async. This tool was created quickly for projects but if it is useful enough, better to make the code maintainable and "pluggable"
* Introduce a pluggable architecture to add new workflows for environment setup. Like tomorrow, users can add their own logic before an after a workflows, environment lifecyle methods that can be overridden (before config load, after config load, before env activation, after env activation etc )
* strict HTTPS only for URLs
* check config file for content safety and adhering to the template definition 
* security audit as this tool needs root permissions. 