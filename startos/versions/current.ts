import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.2:0',
  releaseNotes: {
    en_US:
      'Initial release for StartOS. Runs the rrcd hub with two additions: it remembers who has connected, so you can pick people when setting permissions, and it can limit rooms to the ones you create. It can also share the Reticulum connections of Nomad Network and MeshChat on the same server.',
    es_ES:
      'Primera versión para StartOS. Ejecuta el hub rrcd con dos añadidos: recuerda quién se ha conectado, para que puedas elegir a las personas al asignar permisos, y puede limitar las salas a las que tú creas. También puede compartir las conexiones Reticulum de Nomad Network y MeshChat en el mismo servidor.',
    de_DE:
      'Erste Version für StartOS. Betreibt den rrcd-Hub mit zwei Ergänzungen: Er merkt sich, wer sich verbunden hat, sodass du Personen beim Vergeben von Berechtigungen auswählen kannst, und er kann Räume auf die von dir erstellten beschränken. Außerdem kann er die Reticulum-Verbindungen von Nomad Network und MeshChat auf demselben Server mitnutzen.',
    pl_PL:
      'Pierwsze wydanie dla StartOS. Uruchamia hub rrcd z dwoma dodatkami: zapamiętuje, kto się połączył, dzięki czemu możesz wybierać osoby przy nadawaniu uprawnień, oraz może ograniczyć pokoje do tych, które utworzysz. Może też współdzielić połączenia Reticulum usług Nomad Network i MeshChat na tym samym serwerze.',
    fr_FR:
      "Première version pour StartOS. Exécute le hub rrcd avec deux ajouts : il retient qui s'est connecté, pour que vous puissiez choisir les personnes en attribuant des permissions, et il peut limiter les salons à ceux que vous créez. Il peut aussi partager les connexions Reticulum de Nomad Network et MeshChat sur le même serveur.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
