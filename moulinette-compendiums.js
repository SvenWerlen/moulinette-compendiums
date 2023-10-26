import { MoulinetteCompendiumsDefaults } from "./moulinette-compendiums-defaults.js";

Hooks.once("init", async function () {
  console.log("Moulinette Compendiums | Init")

  game.settings.register("moulinette-compendiums", "enable4players", {
    name: game.i18n.localize("mtte.configCompendiums4players"), 
    hint: game.i18n.localize("mtte.configCompendiums4playersHint"), 
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
})

Hooks.once("ready", async function () {
  // default options
  game.moulinette.compendiums = {
    meta: MoulinetteCompendiumsDefaults.getDefaultMetaData(),
    previews: MoulinetteCompendiumsDefaults.getDefaultPreviews()
  }

  if(game.user.isGM || game.settings.get("moulinette-compendiums", "enable4players")) {
    const moduleClass = (await import("./modules/moulinette-compendiums.js")).MoulinetteCompendiums
    game.moulinette.forge.push({
      id: "compendiums",
      icon: "fas fa-atlas",
      name: game.i18n.localize("mtte.compendiums"),
      description: game.i18n.localize("mtte.compendiumsDescription"),
      instance: new moduleClass(),
      actions: [
        //{id: "index", icon: "fas fa-cogs" ,name: game.i18n.localize("mtte.index"), help: game.i18n.localize("mtte.indexToolTip") },
        //{id: "howto", icon: "fas fa-question-circle" ,name: game.i18n.localize("mtte.howto"), help: game.i18n.localize("mtte.howtoToolTip") }
      ]
    })

    console.log("Moulinette Compendiums | Module loaded")
  }
});

/*
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
});*/

Hooks.on("renderSidebarTab", (app, html) => {
  
  // only available for GM and players if enabled
  if(!game.user.isGM && !game.settings.get("moulinette-compendiums", "enable4players")) {
    return
  }
  
  if (app.id == 'compendium') {
    const btn = $(
        `<div class="header-actions action-buttons flexrow">
            <button id="mtteCompendiumsOpen">
              <i class="fas fa-atlas"></i> Moulinette Compendiums
            </button>
        </div>`
    );
    html.find(".directory-footer").append(btn);
    btn.on("click",async event => {
      // possible tabs: "gameicons", "imagesearch", "prefabs", "scenes", "sounds", "tiles" 
      const tab = "compendiums" 
      const forgeClass = game.moulinette.modules.find(m => m.id == "forge").class
      new forgeClass(tab).render(true)
    });
  }
});
