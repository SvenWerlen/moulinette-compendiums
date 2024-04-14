import { MoulinetteCompendiumsCloudUtil } from "./modules/moulinette-compendiums-util-cloud.js";
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
        {id: "index", icon: "fas fa-cogs" ,name: game.i18n.localize("mtte.indexComp"), help: game.i18n.localize("mtte.indexCompToolTip") },
      ]
    })

    console.log("Moulinette Compendiums | Module loaded")
  }

  const isLibwrapperAvailable = typeof libWrapper === "function"; // See: https://github.com/ruipin/fvtt-lib-wrapper

  // replace default FVTT implementation for Items
  if (isLibwrapperAvailable) {
    libWrapper.register("moulinette-compendiums", "Item.implementation.fromDropData", async (wrapped, ...args) => {
      await MoulinetteCompendiumsCloudUtil.handleDragAndDrop(args[0])
      return wrapped(...args);
    }, "WRAPPER");
  } else {
    Item.implementation.fromDropDataOrig = Item.implementation.fromDropData
    Item.implementation.fromDropData = async function(data, options={}) {
      await MoulinetteCompendiumsCloudUtil.handleDragAndDrop(data)
      return await Item.implementation.fromDropDataOrig(data, options)
    }
  }

  // replace default FVTT implementation for Macros
  if (isLibwrapperAvailable) {
    libWrapper.register("moulinette-compendiums", "Macro.implementation.fromDropData", async (wrapped, ...args) => {
      await MoulinetteCompendiumsCloudUtil.handleDragAndDrop(args[0])
      return wrapped(...args);
    }, "WRAPPER");
  } else {
    Macro.implementation.fromDropDataOrig = Macro.implementation.fromDropData
    Macro.implementation.fromDropData = async function(data, options={}) {
      await MoulinetteCompendiumsCloudUtil.handleDragAndDrop(data)
      return await Macro.implementation.fromDropDataOrig(data, options)
    }
  }

  // replace default FVTT implementation for JournalEntry
  if (isLibwrapperAvailable) {
    libWrapper.register("moulinette-compendiums", "JournalEntry.implementation.fromDropData", async (wrapped, ...args) => {
      await MoulinetteCompendiumsCloudUtil.handleDragAndDrop(args[0])
      return wrapped(...args);
    }, "WRAPPER");
  } else {
    JournalEntry.implementation.fromDropDataOrig = JournalEntry.implementation.fromDropData
    JournalEntry.implementation.fromDropData = async function(data, options={}) {
      await MoulinetteCompendiumsCloudUtil.handleDragAndDrop(data)
      return await JournalEntry.implementation.fromDropDataOrig(data, options)
    }
  }
});


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
