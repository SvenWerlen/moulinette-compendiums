Hooks.once("init", async function () {
  console.log("Moulinette Compendiums | Init")

})

Hooks.once("ready", async function () {
  if (game.user.isGM) {
    const moduleClass = (await import("./modules/moulinette-compendiums.js")).MoulinetteCompendiums
    game.moulinette.forge.push({
      id: "compendiums",
      icon: "fas fa-atlas",
      name: game.i18n.localize("mtte.compendiums"),
      description: game.i18n.localize("mtte.compendiumsDescription"),
      instance: new moduleClass(),
      actions: [
        {id: "index", icon: "fas fa-cogs" ,name: game.i18n.localize("mtte.index"), help: game.i18n.localize("mtte.indexToolTip") },
        {id: "howto", icon: "fas fa-question-circle" ,name: game.i18n.localize("mtte.howto"), help: game.i18n.localize("mtte.howtoToolTip") }
      ]
    })

    console.log("Moulinette Compendiums | Module loaded")
  }
});

Hooks.on("getCompendiumDirectoryFolderContext", (html, options) => {
  options.push({
    name: game.i18n.localize("mtte.export"),
    icon: '<i class="fas fa-cloud-upload-alt"></i>',
    callback: async function(li) {
      //const folder = game.folders.get($(li).closest("li").data("folderId"))
      //new MoulinetteExport(folder).render(true)
    },
    condition: li => {
      return true;
    },
  });
  options.push({
    name: game.i18n.localize("mtte.localexport"),
    icon: '<i class="fas fa-upload"></i>',
    callback: async function(li) {
      //const folder = game.folders.get($(li).closest("li").data("folderId"))
      //new MoulinetteLocalExport(null, folder).render(true)
    },
    condition: li => {
      return true;
    },
  });
});
