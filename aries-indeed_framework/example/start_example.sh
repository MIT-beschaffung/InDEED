#!/bin/bash -xe

rm -rf ~/.indy_client/wallet

sleep 3

#TUEV PLANT BNA EVU GETH_PLANT
gnome-terminal --geometry=52x27+480+550 --hide-menubar --title="GETH PLANT" -- /bin/sh -c "geth  --goerli --syncmode \"light\"  --cache 1 --port 30306 --datadir ~/.ethereum/plant --rpc --rpcapi eth,web3,personal --rpcport 8545 --bootnodes \"enode://011f758e6552d105183b1761c5e2dea0111bc20fd5f6422bc7f91e0fabbec9a6595caf6239b37feb773dddd3f87240d99d859431891e4a642cf2a0a9e6cbb98a@51.141.78.53:30303\""
gnome-terminal --geometry=52x27+0+550 --hide-menubar --title="ACAPY TUEV" -- /bin/sh -c '../../aries-cloudagent/bin/aca-py start --genesis-file  ~/.indy_client/pool_transactions_genesis --inbound-transport http_custodial 0.0.0.0 8000 --outbound-transport http --admin 0.0.0.0 8001 --endpoint http://0.0.0.0:8000 --label DEV-Agent --wallet-name TUEV --wallet-key 123456 --seed 000000000000000000000000AnchorG1 --admin-api-key eNLsWFkAZP2kd3MxR65kM3WXx7aOoXZ44nGfuCxy --log-level INFO --plugin aries_cloudagent.wallet_handler --auto-accept-requests --auto-accept-invites --auto-accept-requests --auto-ping-connection --auto-respond-messages --auto-respond-credential-offer --auto-respond-credential-proposal --auto-respond-credential-offer --auto-respond-credential-request --auto-store-credential --auto-respond-presentation-proposal --auto-respond-presentation-request --auto-verify-presentation --webhook-url http://0.0.0.0:8100 --wallet-type indy --wallet-local-did'
gnome-terminal --geometry=52x27+480+550 --hide-menubar --title="ACAPY PLANT" -- /bin/sh -c '../../aries-cloudagent/bin/aca-py start --genesis-file ~/.indy_client/pool_transactions_genesis --inbound-transport http_custodial 0.0.0.0 8005 --outbound-transport http --admin 0.0.0.0 8006 --endpoint http://0.0.0.0:8005 --label DEV-Agent --wallet-key 123456  --wallet-name PLANT --seed 000000000000000000000000AnchorP1 --admin-api-key eNLsWFkAZP2kd3MxR65kM3WXx7aOoXZ44nGfuCxy --log-level INFO --plugin aries_cloudagent.wallet_handler --auto-accept-requests --auto-accept-invites --auto-accept-requests --auto-ping-connection --auto-respond-messages --auto-respond-credential-offer --auto-respond-credential-proposal --auto-respond-credential-offer --auto-respond-credential-request --auto-store-credential --auto-respond-presentation-proposal --auto-respond-presentation-request --auto-verify-presentation --webhook-url http://0.0.0.0:8101 --wallet-type indy --wallet-local-did'
gnome-terminal --geometry=52x27+960+550  --hide-menubar --title="ACAPY BNA" -- /bin/sh -c '../../aries-cloudagent/bin/aca-py start --genesis-file  ~/.indy_client/pool_transactions_genesis --inbound-transport http_custodial 0.0.0.0 8010 --outbound-transport http --admin 0.0.0.0 8011 --endpoint http://0.0.0.0:8010 --label DEV-Agent --wallet-type indy  --wallet-key 123456  --wallet-name BNA --seed 000000000000000000000000Steward3 --admin-api-key eNLsWFkAZP2kd3MxR65kM3WXx7aOoXZ44nGfuCxy --log-level INFO --plugin aries_cloudagent.wallet_handler --auto-accept-requests --auto-accept-invites --auto-accept-requests --auto-ping-connection --auto-respond-messages --auto-respond-credential-offer --auto-respond-credential-proposal --auto-respond-credential-offer --auto-respond-credential-request --auto-store-credential --auto-respond-presentation-proposal --auto-respond-presentation-request --auto-verify-presentation --webhook-url http://0.0.0.0:8102'
gnome-terminal --geometry=52x27+1440+550 --hide-menubar --title="ACAPY EVU" -- /bin/sh -c '../../aries-cloudagent/bin/aca-py start --genesis-file  ~/.indy_client/pool_transactions_genesis --inbound-transport http_custodial 0.0.0.0 8015 --outbound-transport http --admin 0.0.0.0 8016 --endpoint http://0.0.0.0:8015 --label DEV-Agent --wallet-name EVU --wallet-key 123456    --seed 000000000000000000000000AnchorE1 --admin-api-key eNLsWFkAZP2kd3MxR65kM3WXx7aOoXZ44nGfuCxy --log-level INFO --plugin aries_cloudagent.wallet_handler --auto-accept-requests --auto-accept-invites --auto-accept-requests --auto-ping-connection --auto-respond-messages --auto-respond-credential-offer --auto-respond-credential-proposal --auto-respond-credential-offer --auto-respond-credential-request --auto-store-credential --auto-respond-presentation-proposal --auto-respond-presentation-request --auto-verify-presentation --webhook-url http://0.0.0.0:8103 --wallet-type indy --wallet-local-did'

sleep 8
tsc ./*.ts

gnome-terminal --geometry=52x27+960+0 --hide-menubar --title="PROCESS BNA" -- /bin/sh -c 'node bna'
sleep 1
gnome-terminal --geometry=52x27+0+0 --hide-menubar --title="PROCESS TUEV" -- /bin/sh -c 'node tuev'
gnome-terminal --geometry=52x27+1440+0 --hide-menubar  --title="PROCESS EVU" -- /bin/sh -c 'node evu'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="PROCESS PLANT" -- /bin/sh -c 'node plant'



