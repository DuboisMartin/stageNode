#Ce script pack l'application et copie les modules dans les bon répertoires.

electron-packager . --overwrite  --arch=x64 --electron-version=1.8.6 --build-from-source
cp -r ~/node_modules/* ~/Documents/Test/app-electron/Utilitaire-linux-x64/resources/app/node_modules/
cp -r ~/Documents/Test/app-electron/node_modules/* ~/Documents/Test/app-electron/Utilitaire-linux-x64/resources/app/node_modules/

#Packager pour la version windows.
electron-packager . app --platform win32 --arch x64 --out dist/ --electron-version=1.8.6