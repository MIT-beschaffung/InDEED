# INDEED SSI APP

Diese Ordnerstruktur beinhaltet mehrere ausführbare Skripte:

* tsc && node indeed: Ein automatischer Ablauf des Prozesses, der komplett über die File indeed.ts koordiniert werd.
* sh ./example/start_example.sh: Ein automatischer Ablauf des Prozesses, der dezentral koordiniert wird und somit auch von verschiedenen Geräten aus ausführbar ist.
* sh ./start_react_example.sh: Aufbauen von verschiedenen Frontends, wodurch der User selbst den Ablauf koordinieren kann. Dezentral möglich 

##Setup
Am Anfang zu tun:
npm install
cd web_app
npm install 
cd ../../aries-cloudagent
python3 -m pip install .

Falls Fehler im Index file: 
nvm install (node version manager)
Update to latest node version
http://localhost:3000/?node=TUEV


## Wichtige Dateien allgemein

### indeedAriesClient
Dieser Client managed alle wichtigen Funktionen, die für die einzelnen Prozesse benötigt werden. Dazu zählen indeedWebhookhandler, indeedEthereumClient. Zudem erbt die Klasse von ariesClient.
indeedAriescliennt ist somit immer der Client, der vom Benutzer angesprochen werden sollte.

###ariesClient
Dieser Client beinhaltet alle Befehle, die dem Agent über HTTP Post und Get Requests gesendet werden können.

### indeedWebhookHandler
Der indeedWebhookhandler hört auf die Webhooks, die vom Agent gesendet werden  und übergibt diese dann dem indeedAriesCLient, der sie weiterverarbeitet.
Mit Webhooks kann der Agent dem Nutzer Informationen zusenden. (Bsp Message angekommen)


## Config Files
config.json: Besonders wichtig für die indeed.ts File. Information muss meistens nicht geändert werden. Debug Level fidnet sich hier
./expample/config_example: Besonders wichtig für den dezentralen Example Ablauf, die Nodes müssen ihre gegenseitigen Endpoints kennen
./web_app/node_config: Wichtig für die React App + Frontend. Auch hier müssen die Nodes sich gegenseitig kennen.

## Agents
Neben den eigtl SKripts können die Agents auch seperat mit sh ./start_agents gestartet werden.

##React
Die Reactapp ist unterteilt in mehrere Kompontenten. Je nachdem, welche Node die Reactapp öffnet, unterscheiden sich die Inhalte, die angezeigt werden. 
Die einzelnen Komponenten bilden jeweils einen Prozessschritt ab. 
Die Kommunikation mit dem Backend funktioniert über socket.io: Dazu hostet die File backend_for_react einen eigenen Server.
Diese File erstellt zudem eine Instanz von indeedAriesClient, um mit dem Agent kommunizieren zu können. 
Im Frontend wird die Library Material UI eingebunden.
In der File start_react_example kann nachgelesen werden, was zum Aufestellen des Forntends alles nötig ist.
Im Browser wird durch Übergabe des "node"-URL-Parameter klargemacht, um welche Node es sich handelt.
Ohne diesen Zusatz öffnen die Websiten nicht richtig
es existieren
? node =  TUEV | BNA | EVU | PLANT

Der Ablauf ist wie folgt:
- Registrierung am Ledger
- DID -> Public
- Evtl Connections
- Credential Issue
- Credential Presentation
- Messaging


## Example (Der Name ist bisschen zu allgemein :D)
Grundlegende außer SSI Kommunikationen zwischen den Nodes werden durch communicationBesideAriesHadnler über HTTP ab gebildet.

WaitTillFunktionen warten auf bestimmmte Webhooks, die vom Agent gesendet werden. 
Bsp Connection established, Message received...

Have fun.