# cenv
A Nodejs based CLI utility to change environment details on the fly for any project

The purpose of this utility is to allow users to set environment details like environment variables, hosts files edits to ensure that developers can activate an environment quickly on their desktop for local development.

# How to use the CLI tool

## Install cenv
cenv can be installed using the following command from the root of this project
* `npm install -g .`

## Create a .cenv file in your project roo
* Irrespective of your project type and language used, just create a .cenv file at the root of your project
* Use the sample cenv file provided in this repo for reference. Its pretty much self explanatory. Take a copy and rename it to .cenv and place it at the root of your project
* Once created, just execute the command `cenv --env <envrionment_name>`. environment_name is what you give as immedieate child attributes in the root of the .cenv JSON document. the sample cenv file shows how to create DEV, QA, STAGING etc
* for example `$> cenv --env DEV` can be exeucted to activate your dev environment 


# BEWARE !! This tool needs ROOT 
The tool tried to edits the hosts file in yoru OS to add an entry for 127.0.0.1 with the host DNS you specifiy in cenv
This operation needs root. Please run this command under an elevated shell session in your OS

# Supported OS
For now cenv support 
* Linux - Ubuntu 18.04+, Debian 8+
* Windows 10 and above