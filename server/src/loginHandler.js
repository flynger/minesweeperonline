module.exports = (server) => {
    const jsonfile = require("../node_modules/jsonfile");
    const accounts = jsonfile.readFileSync("./data/accounts.json");
    var { io } = server; // tells you what properties of server are imported
    console.log(`accounts: ${JSON.stringify(accounts)}`);

    var loginHandler = {
        registerAccount: (socket, data) => {
            if (accounts[data.username.toLowerCase()]) {
                socket.emit("usernameExists");
            } else {
                accounts[data.username.toLowerCase()] = data.password;
                socket.emit("accountCreated");
            }
        },
        loginAccount: (socket, data) => {
            if (accounts[data.username.toLowerCase()] && accounts[data.username.toLowerCase()].password === data.password) {
                socket.emit("loginSuccess");
            } else {
                socket.emit("loginFail");
            }
        },
        saveAccountData: () => {
            return jsonfile.writeFileSync("./data/accounts.json", accounts);
        }
    }

    return server.loginHandler = loginHandler;
}