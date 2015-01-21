#!/bin/bash

if [ "`vagrant status | grep running | tail -1`" ]; then
  echo "Vagrant box already running in this environment, bailing out..."
  exit 1
fi

echo "Checking for local vagrant box"
if ! [ "`vagrant box list | grep ubuntu-14.04-amd64`" ]; then
  if [ -s /vagrant/ubuntu-14.04-amd64.box ]; then
    vagrant box add ubuntu-14.04-amd64 /vagrant/ubuntu-14.04-amd64.box
  else
    vagrant box add ubuntu-14.04-amd64 https://github.com/kraksoft/vagrant-box-ubuntu/releases/download/14.04/ubuntu-14.04-amd64.box
  fi
fi

if ! [ "`vagrant plugin list | grep vagrant-vbguest`" ]; then
  vagrant plugin install vagrant-vbguest
fi

vagrant up || {
  echo "fixing errors..."
  vagrant ssh -c "if [ -d /opt/VBoxGuestAdditions-4.3.10 ]; then sudo ln -s /opt/VBoxGuestAdditions-4.3.10/lib/VBoxGuestAdditions /usr/lib/VBoxGuestAdditions; fi"
  vagrant reload
}

echo "Vagrant box ready to run."

