#!/bin/bash

# Install Chromium manually on Heroku
apt-get update
apt-get install -y chromium

# Start the app
npm start
