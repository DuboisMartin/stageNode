#Change de place les fichiers générers pour ne pas les inclures dans le dépot git.

rm -r ~/Documents/dist
rm -r ~/Documents/installers
rm -r ~/Documents/Utilitaire-linux-x64

mv -f ./dist ~/Documents/
mv -f ./installers ~/Documents/
mv -f ./Utilitaire-linux-x64 ~/Documents/
