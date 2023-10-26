/**
 * Moulinette Compendium utils
 */
export class MoulinetteCompendiumsUtil {

  static ASSET_ICON = {
    Actor:        "fas fa-user",
    Item:         "fas fa-suitcase",
    JournalEntry: "fas fa-book-open",
    RollTable:    "fas fa-th-list",
    Scene:        "fas fa-map",
    Macro:        "fas fa-code",
    Adventure:    "fa-solid fa-treasure-chest",
    Card:         "fa-solid fa-cards",
    Playlist:     "fas fa-music",
  }

  static capitalizeFirstLetter(string) {
    if(!string) return ""
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Returns a thumbnail for this entry (from compendium)
   */
  static getThumbnail(entry, type) {
    if(type == "Scene") {
      return entry.thumb
    }
    return entry.img
  }

  /**
   * Returns some additional information
   */
  static getAdditionalInfo(entry, type) {
    const infos = { text1: null, text2: null, icons: [], system: "" }
    
    try {

      if(type == "RollTable") {
        if(entry.collections && entry.collections.results) {
          const resultsCount = entry.collections.results.size
          infos.text1 = `${resultsCount} ${game.i18n.localize(resultsCount > 1 ? "mtte.results" : "mtte.result")}`
          infos.icons.push({ img: "fa-solid fa-dice-d20", label: game.i18n.localize("roll"), action: "roll"})
        }
      }

      else if(type == "Cards") {
        console.log(entry)
      }
      
      else if(type == "Playlist") {
        console.log(entry)
      }

      else {
        console.log(`Moulinette Compendiums | Unsupported type ${type}`)
      }

      if(entry.system && entry.system.modelProvider) {
        infos.system = entry.system.modelProvider.id
      }
    } catch (error) {
      console.error("Moulinette Compendiums | Exception thrown while indexing an asset.", entry, error);
    }

    return infos
  }

  /**
   * Extract value from object
   */
  static getValueFromObject(object, path) {
    // remove initial "." if any
    if(path.startsWith(".")) {
      path = path.substring(1)
    }
    // dummy use case
    if(!path || path.length == 0) {
      return object
    }
    // regular expression for match .*[key==value].*
    const regex = /\[[^\=]+\=\=[^\]]+\]/g; 
    const match = regex.exec(path);
    if(match) {
      // retrieve list
      const listPath = path.substring(0, match.index)
      const list = foundry.utils.getProperty(object, listPath)
      if(list) {
        // find matching element in list
        const keyVal = match[0].substring(1,match[0].length-1).split("==")
        const found = list.find(el => el[keyVal[0]] == keyVal[1])
        if(found) {
          // find value
          return MoulinetteCompendiumsUtil.getValueFromObject(found, path.substring(match.index + match[0].length))
        }
      }
    }
    // count
    else if(path.startsWith("#")) {
      const value = foundry.utils.getProperty(object, path.substring(1))
      return value ? value.size : 0
    }
    else {
      return foundry.utils.getProperty(object, path)
    }
    return null
  }

  /**
   * Generate asset entry based on mapping
   * Converts into a new object including /meta
   */
  static generateMetaFromLocal(entry, type) {
    let metaEntry = {}
    try {
      let mappings = {}
      // check if matching preview available for system
      if(game.system.id in game.moulinette.compendiums.meta) {
        const meta = game.moulinette.compendiums.meta[game.system.id]
        // check if matching preview available for specific type
        if(type in meta) {
          mappings = meta[type]
        }
      }
      // check if generic preview available
      if("*" in game.moulinette.compendiums.meta) {
        const meta = game.moulinette.compendiums.meta["*"]
        // check if matching preview available for specific type
        if(type in meta) {
          mappings = meta[type]
        }
      }
      // extract values from mappings
      for(const m of Object.keys(mappings)) {
        const path = mappings[m]
        metaEntry[m] = MoulinetteCompendiumsUtil.getValueFromObject(entry, path)
      }
      
    } catch (error) {
      console.error("Moulinette Compendiums | Exception thrown while preparing meta for asset.", entry, error);
    }

    return metaEntry
  }

  /**
   * Returns additional information (default implementation from Moulinette)
   * - Support dnd5e
   */
  static getAdditionalInfoFromMeta(entry) {
    const infos = { text1: null, text2: null, icons: [] }
    try {
      let preview = null

      // check if matching preview available for system
      if(game.system.id in game.moulinette.compendiums.previews && entry.system == game.system.id) {
        preview = game.moulinette.compendiums.previews[game.system.id]

        // check if matching preview available for specific type
        if(entry.type in preview) {
          return preview[entry.type](entry.meta)
        }
      }
      
      // check if generic preview available
      if("*" in game.moulinette.compendiums.previews) {
        preview = game.moulinette.compendiums.previews["*"]

        // check if matching preview available for specific type
        if(entry.type in preview) {
          return preview[entry.type](entry.meta)
        }
      }
      
    } catch (error) {
      console.error("Moulinette Compendiums | Exception thrown while previewing an asset.", entry, error);
    }

    return infos
  }

  /**
   * Execute action on clicked entry
   */
  static executeAction(entry, type) {
    if(entry && type == "RollTable") {
      entry.draw();
    }
  }


}