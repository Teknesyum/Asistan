!macro customInstall
  CreateShortCut "$DESKTOP\Asistan Görevlendirme.lnk" "$INSTDIR\Asistan.exe" "--arac gorevlendirme" "$INSTDIR\resources\simge\gorevlendirme.ico" 0
  CreateShortCut "$DESKTOP\Asistan Nöbet.lnk" "$INSTDIR\Asistan.exe" "--arac nobet" "$INSTDIR\resources\simge\nobet.ico" 0
  CreateShortCut "$SMPROGRAMS\Asistan Görevlendirme.lnk" "$INSTDIR\Asistan.exe" "--arac gorevlendirme" "$INSTDIR\resources\simge\gorevlendirme.ico" 0
  CreateShortCut "$SMPROGRAMS\Asistan Nöbet.lnk" "$INSTDIR\Asistan.exe" "--arac nobet" "$INSTDIR\resources\simge\nobet.ico" 0
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    Delete "$DESKTOP\Asistan Görevlendirme.lnk"
    Delete "$DESKTOP\Asistan Nöbet.lnk"
    Delete "$SMPROGRAMS\Asistan Görevlendirme.lnk"
    Delete "$SMPROGRAMS\Asistan Nöbet.lnk"
  ${endIf}
!macroend
