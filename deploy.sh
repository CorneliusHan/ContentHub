#!/bin/bash

PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

#====================================================
#	Author: David Guo
#	Description: Galavatron Deployment Script
#	Version: 2.0
#	email: davidguo1998@hotmail.com
#====================================================

if [ ! -f /etc/lsb-release ];then
    if ! grep -Eqi "ubuntu" /etc/issue;then
        echo "[${red}Info${plain}] This script can only be run on Ubuntu!"
        exit 1
    fi
fi

red='\033[0;31m'
green='\033[0;32m'
yellow='\033[0;33m'
plain='\033[0m'

db_user=0
db_pass=0
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

pull_changes() {
    echo -e "[${green}Info${plain}] Pulling changes from git"
    # git checkout master
    git pull
}

stop_frontend() {
    sudo systemctl status galclient.service > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "[${green}Info${plain}] Stopping client service"
        sudo systemctl stop galclient.service
    else
        echo -e "[${green}Info${plain}] Client service already stopped"
    fi
}

stop_backend() {
    sudo systemctl status galserver.service > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "[${green}Info${plain}] Stopping server service"
        sudo systemctl stop galserver.service
    else
        echo -e "[${green}Info${plain}] Server service already stopped"
    fi
    sudo systemctl status mysql.service > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "[${green}Info${plain}] Stopping MySQL service"
        sudo systemctl stop mysql.service
    else
        echo -e "[${green}Info${plain}] MySQL service already stopped"
    fi
}

start_frontend() {
    echo -e "[${green}Info${plain}] Restarting client service"
    sudo systemctl start galclient.service
}

start_backend() {
    echo -e "[${green}Info${plain}] Restarting MySQL service"
    sudo systemctl start mysql.service
    echo -e "[${green}Info${plain}] Restarting server service"
    sudo systemctl start galserver.service
}

update_frontend_packages() {
    echo -e "[${green}Info${plain}] Frontend: checking for new npm packages"
    cd ${DIR}/client && npm install
    cd ${DIR}
}

update_backend_packages() {
    echo -e "[${green}Info${plain}] Backend: checking for new npm packages"
    cd ${DIR}/server && npm install
    cd ${DIR}
}

get_db_info() {
    echo -e "[${yellow}Info${plain}] Please enter MySQL username: "
    read -r db_user
    echo -e "[${yellow}Info${plain}] Please enter MySQL password: "
    read -r db_pass
    cat >_tmp.cnf << EOF
[client]
user = $db_user
password = $db_pass
EOF
}

restore_db() {
    echo -e "[${green}Info${plain}] Dropping database"
    mysql --defaults-file=_tmp.cnf -e "drop database content_aggregator"
    echo -e "[${green}Info${plain}] Creating database"
    mysql --defaults-file=_tmp.cnf -e "source ${DIR}/server/db_create.sql"
    echo -e "[${green}Info${plain}] Loading database"
    mysql --defaults-file=_tmp.cnf -e "use content_aggregator; source ${DIR}/server/db_test.sql;"
    rm _tmp.cnf
}

reset_database() {
    echo -e "[${yellow}Info${plain}] Reload database using scripts [Y/N]?"
    read -r choice
    case $choice in
    [yY][eE][sS] | [yY])
        echo -e "[${green}Info${plain}] Starting backend installation"
        get_db_info
        restore_db
        ;;
    *)
        echo -e "[${yellow}Info${plain}] Database unchanged."
        ;;
    esac
}

build() {
    echo -e "[${green}Info${plain}] Building client"
    cd ${DIR}/client && REACT_APP_SERVER_HOST=http://galvatron.dream.sh \
                        REACT_APP_SERVER_PORT=9000 \
                        REACT_APP_GOOGLE_CLIENT_ID=759112139334-t6lh1tbfg8gm8p5p0bd1e21pr25n0vp2.apps.googleusercontent.com \
                        npm run build
    cd ${DIR}
}

update_galvatron() {
    echo -e "\t"
    echo -e "\t"
    echo -e "[${green}Info${plain}] Updating..."

    cd ${DIR}
    stop_frontend
    stop_backend
    pull_changes
    update_frontend_packages
    update_backend_packages
    build
    start_frontend
    start_backend
    reset_database
}

frontend_galvatron() {
    echo -e "\t"
    echo -e "\t"
    echo -e "[${green}Info${plain}] Updating frontend..."

    cd ${DIR}
    stop_frontend
    pull_changes
    update_frontend_packages
    build
    start_frontend
}

backend_galvatron() {
    echo -e "\t"
    echo -e "\t"
    echo -e "[${green}Info${plain}] Updating backend..."

    cd ${DIR}
    stop_backend
    pull_changes
    update_backend_packages
    start_backend
    reset_database
}

database_galvatron() {
    echo -e "\t"
    echo -e "\t"
    echo -e "[${green}Info${plain}] Restoring database..."
    reset_database
}

set_backend_env_var() {
    echo -e "[${yellow}Info${plain}] Gathering MySQL account credentials... "
    echo -e "       If MySQL is not installed, please use the same credentials during MySQL installation."
    echo -e "[${yellow}Info${plain}] Please enter MySQL username: "
    read -r db_user
    echo -e "[${yellow}Info${plain}] Please enter MySQL password: "
    read -r db_pass
}

install_node() {
    if [ -f /usr/bin/node ];then
        echo -e "[${yellow}Info${plain}] Node already installed."
    else
        curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
        sudo apt-get install -y nodejs 
    fi
}

install_mysql() {
    if [ -f /usr/bin/mysql ];then
        echo -e "[${yellow}Info${plain}] MySQL already installed."
    else
        wget -c https://dev.mysql.com/get/mysql-apt-config_0.8.15-1_all.deb
        sudo dpkg -i mysql-apt-config_0.8.15-1_all.deb
        sudo apt-get update
        sudo apt-get install mysql-server
        rm -f mysql-apt-config_0.8.15-1_all.deb
    fi
}

install_serve() {
    if [ -f /usr/bin/serve ];then
        echo -e "[${yellow}Info${plain}] Serve already installed."
    else
        npm i -g serve
    fi
}

backend_service_conf() {
    cat >/lib/systemd/system/galserver.service << EOF
[Unit]
Description=Galvatron Server Service
#Requires=After=mysql.service # Requires the mysql service to run first

[Service]
ExecStart=/usr/bin/node ./bin/www
WorkingDirectory=$DIR/server/
Restart=always
# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=galvatron_server
# Database env vars
Environment=DB_USERNAME=$db_user
Environment=DB_PASSWORD=$db_pass
Environment=DB_HOST=localhost
Environment=DB_NAME=content_aggregator
# Mail env vars
Environment=MAIL_DOMAIN=mail.dream.sh
Environment=MAIL_APIKEY=50d14166d3e5981ff47d7e745784db53-ee13fadb-834aa273
Environment=MAIL_WEEKLY_ALIAS=weekly@mail.dream.sh
Environment=MAIL_DAILY_ALIAS=daily@mail.dream.sh
# JWT env vars
Environment=JWT_SECRET=dev-secret

[Install]
WantedBy=multi-user.target
EOF
    systemctl disable galserver.service
    systemctl enable /lib/systemd/system/galserver.service
}

frontend_service_conf() {
    cat >/lib/systemd/system/galclient.service << EOF
[Unit]
Description=Galvatron Client Service

[Service]
ExecStart=/usr/bin/serve -s $DIR/client/build -l 3000
WorkingDirectory=$DIR/client/
Restart=always
# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=galvatron-client

[Install]
WantedBy=multi-user.target
EOF
    systemctl disable galclient.service
    systemctl enable /lib/systemd/system/galclient.service
}

install_galvatron() {
    [ `whoami` != "root" ] && echo -e "[${red}Info${plain}] The install script must be run as root." && exit 1
    echo -e "\t"
    echo -e "\t"
    echo -e "[${green}Info${plain}] Setting up production environment..."
    echo -e "[${yellow}Info${plain}] Install backend [Y/N]?"
    read -r choice
    case $choice in
    [yY][eE][sS] | [yY])
        echo -e "[${green}Info${plain}] Starting backend installation"
        set_backend_env_var
        install_node
        install_mysql
        backend_service_conf
        ;;
    *)
        echo -e "[${yellow}Info${plain}] Skipping backend installation"
        ;;
    esac
    
    echo -e "[${yellow}Info${plain}] Install frontend [Y/N]?"
    read -r choice
    case $choice in
    [yY][eE][sS] | [yY])
        echo -e "[${green}Info${plain}] Starting frontend installation"
        install_node
        install_serve
        frontend_service_conf
        ;;
    *)
        echo -e "[${yellow}Info${plain}] Skipping frontend installation"
        ;;
    esac
    echo -e "[${green}Info${plain}] Installation completed, please rerun the script using the update option to deploy."
}

log_galvatron() {
    journalctl --unit=galserver.service -n 500 --no-pager
}

# Initialization step
action=$1
case "${action}" in
    update|frontend|backend|database|install|log)
        ${action}_galvatron
        ;;
    *)
        echo "Arguments error! [${action}]"
        echo "Usage: $(basename $0) [update|frontend|backend|database|install|log]"
        ;;
esac
