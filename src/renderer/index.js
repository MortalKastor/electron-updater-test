import { ipcRenderer } from "electron";
import { version as electronUpdaterVersion } from "../../node_modules/electron-updater/package.json";

const content = document.createElement("div");
const { versions, platform } = process;

content.innerHTML = `
  <h1><span id="app-name"></span> v<span id="app-version"></span></h1>
  <div>platform: <code>${platform}</code></div>
  <div>electron version: <code>${versions.electron}</code></div>
  <div>node version: <code>${versions.node}</code></div>
  <div>electron-updater version: <code>${electronUpdaterVersion}</code></div>
  <div><button id="quit-and-install-btn">Quit and install</button></div>
  <div id="messages" style="margin-top: 20px;"></div>
`;

document.getElementById("app").append(content);

const appendMessage = text => {
  const container = document.getElementById("messages");
  const message = document.createElement("div");

  message.innerText = text;
  container.appendChild(message);
};

document.getElementById("quit-and-install-btn").onclick = () => {
  appendMessage("quit and install button clicked");

  ipcRenderer.send("quit-and-install");
};

ipcRenderer.on("appInfo", (e, info) => {
  console.log(info);
  const { name, version } = info;

  document.getElementById("app-name").innerText = name;
  document.getElementById("app-version").innerText = version;
});

ipcRenderer.on("message", (e, text) => appendMessage(text));
