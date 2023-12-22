#rm -rf ~/.indy_client/wallet

#sh ./start_agents.sh

sleep 1
cd web_app
#gnome-terminal --geometry=52x27+960+0 --hide-menubar --title="FRONTEND BNA" -- /bin/sh -c 'PORT=3000  npm run start'
#gnome-terminal --geometry=52x27+0+0 --hide-menubar --title="FRONTEND TUEV" -- /bin/sh -c 'PORT=3001  npm run start'
#gnome-terminal --geometry=52x27+1440+0 --hide-menubar  --title="FRONTEND EVU" -- /bin/sh -c 'PORT=3002 npm run start'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="FRONTEND PLANT" -- /bin/sh -c 'PORT=3003  npm run start'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="FRONTEND GARANTIEGEBER" -- /bin/sh -c 'PORT=3004  npm run start'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="FRONTEND OWNER" -- /bin/sh -c 'PORT=3005  npm run start'

sleep 1
cd ..
#tsc ./*.ts
#npm run build
sleep 1
#gnome-terminal --geometry=52x27+960+0 --hide-menubar --title="BACKEND BNA" -- /bin/sh -c 'npm run dev start_backend_for_react BNA'
#gnome-terminal --geometry=52x27+0+0 --hide-menubar --title="BACKEND TUEV" -- /bin/sh -c 'node ./start_backend_for_react TUEV'
#gnome-terminal --geometry=52x27+1440+0 --hide-menubar  --title="BACKEND EVU" -- /bin/sh -c 'node ./start_backend_for_react EVU'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="BACKEND PLANT" -- /bin/sh -c 'npm run dev start_backend_for_react PLANT'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="BACKEND GARANTIEGEBER" -- /bin/sh -c 'npm run dev start_backend_for_react GARANTIEGEBER'
gnome-terminal --geometry=52x27+480+0  --hide-menubar --title="BACKEND OWNER" -- /bin/sh -c 'npm run dev start_backend_for_react OWNER'
